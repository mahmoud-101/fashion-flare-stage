import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES: Record<string, number> = {
  pro: 400_00,    // 400 EGP in piasters
  agency: 800_00, // 800 EGP in piasters
};

const PLAN_NAMES_AR: Record<string, string> = {
  pro: "خطة Moda AI الاحترافية",
  agency: "خطة Moda AI للمؤسسات",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paymobApiKey = Deno.env.get("PAYMOB_API_KEY");
    const paymobIntegrationId = Deno.env.get("PAYMOB_INTEGRATION_ID");
    const paymobIframeId = Deno.env.get("PAYMOB_IFRAME_ID");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { plan, fullName, phone, email } = body as {
      plan: string;
      fullName?: string;
      phone?: string;
      email?: string;
    };

    if (!plan || !PLAN_PRICES[plan]) {
      return new Response(JSON.stringify({ error: "خطة غير صالحة" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountCents = PLAN_PRICES[plan];

    // --- Fallback mode: PayMob keys not configured ---
    if (!paymobApiKey || !paymobIntegrationId || !paymobIframeId) {
      // Create pending order in DB for manual tracking
      const { data: order } = await supabase.from("payment_orders").insert({
        user_id: user.id,
        plan,
        amount: amountCents / 100,
        status: "pending",
        payment_method: "manual",
      }).select().single();

      return new Response(JSON.stringify({
        mode: "manual",
        orderId: order?.id,
        message: "PayMob غير مفعّل. استخدم الدفع اليدوي.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- Step 1: Get PayMob auth token ---
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: paymobApiKey }),
    });
    const authData = await authRes.json();
    const authToken: string = authData.token;

    if (!authToken) {
      throw new Error("فشل في الاتصال بـ PayMob — تحقق من API Key");
    }

    // --- Step 2: Create order ---
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: "EGP",
        items: [{
          name: PLAN_NAMES_AR[plan],
          amount_cents: amountCents,
          description: `اشتراك شهري - ${PLAN_NAMES_AR[plan]}`,
          quantity: 1,
        }],
      }),
    });
    const orderData = await orderRes.json();
    const paymobOrderId: string = String(orderData.id);

    // --- Step 3: Create payment key ---
    const billingData = {
      apartment: "NA", email: email || user.email || "N/A",
      floor: "NA", first_name: (fullName || "").split(" ")[0] || "عميل",
      street: "NA", building: "NA",
      phone_number: phone || "+201000000000",
      shipping_method: "NA", postal_code: "NA",
      city: "Cairo", country: "EG",
      last_name: (fullName || "").split(" ").slice(1).join(" ") || "كريم",
      state: "NA",
    };

    const keyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: billingData,
        currency: "EGP",
        integration_id: parseInt(paymobIntegrationId),
      }),
    });
    const keyData = await keyRes.json();
    const paymentKey: string = keyData.token;

    // --- Save order to DB ---
    const { data: dbOrder } = await supabase.from("payment_orders").insert({
      user_id: user.id,
      plan,
      amount: amountCents / 100,
      paymob_order_id: paymobOrderId,
      status: "pending",
    }).select().single();

    return new Response(JSON.stringify({
      mode: "paymob",
      paymentKey,
      iframeId: paymobIframeId,
      iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${paymobIframeId}?payment_token=${paymentKey}`,
      orderId: dbOrder?.id,
      paymobOrderId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("create-paymob-order error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

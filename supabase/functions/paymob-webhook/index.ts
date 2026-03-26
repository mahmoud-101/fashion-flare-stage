import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Concatenate specific fields in PayMob's required order for HMAC
function buildHmacString(obj: Record<string, unknown>): string {
  const fields = [
    "amount_cents", "created_at", "currency", "error_occured",
    "has_parent_transaction", "id", "integration_id", "is_3d_secure",
    "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
    "is_voided", "order", "owner", "pending",
    "source_data_pan", "source_data_sub_type", "source_data_type",
    "success",
  ];
  return fields.map((f) => String(obj[f] ?? "")).join("");
}

function verifyHmac(data: Record<string, unknown>, secret: string, receivedHmac: string): boolean {
  const str = buildHmacString(data);
  const computed = createHmac("sha512", secret).update(str).digest("hex");
  return computed === receivedHmac;
}

const PLAN_MONTHS: Record<string, number> = { pro: 1, agency: 1 };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hmacSecret = Deno.env.get("PAYMOB_HMAC_SECRET") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // PayMob sends either query-string callback or JSON body
    const url = new URL(req.url);
    const hmacFromQuery = url.searchParams.get("hmac");

    let body: Record<string, unknown> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      // Form/query string webhook
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((v, k) => { body[k] = v; });
    }

    // The actual transaction data is nested under "obj" in PayMob's payload
    const txnObj = (body.obj as Record<string, unknown>) || body;
    const hmacToVerify = hmacFromQuery || (body.hmac as string) || "";

    // Verify HMAC (skip if secret not configured)
    if (hmacSecret && hmacToVerify) {
      const valid = verifyHmac(txnObj, hmacSecret, hmacToVerify);
      if (!valid) {
        console.error("HMAC verification failed");
        return new Response(JSON.stringify({ error: "Invalid HMAC" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const paymobOrderId = String((txnObj.order as Record<string,unknown>)?.id || txnObj.order || "");
    const txnId = String(txnObj.id || "");
    const success = txnObj.success === true || txnObj.success === "true";
    const amountCents = Number(txnObj.amount_cents || 0);
    const paymentMethod = String((txnObj.source_data as Record<string,unknown>)?.type || txnObj.source_data_type || "card");

    // Find our payment order by paymob_order_id
    const { data: order, error: orderErr } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("paymob_order_id", paymobOrderId)
      .maybeSingle();

    if (orderErr || !order) {
      console.error("Order not found for paymob_order_id:", paymobOrderId);
      // Still return 200 to PayMob to prevent retries
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status === "paid") {
      // Already processed — idempotent
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (success) {
      // Mark order as paid
      await supabase.from("payment_orders").update({
        status: "paid",
        paymob_txn_id: txnId,
        payment_method: paymentMethod,
        amount: amountCents / 100,
      }).eq("id", order.id);

      // Deactivate any existing active subscription for this user
      await supabase.from("subscriptions").update({
        status: "expired",
      }).eq("user_id", order.user_id).eq("status", "active");

      // Create new active subscription (30 days)
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase.from("subscriptions").insert({
        user_id: order.user_id,
        plan: order.plan,
        status: "active",
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_reference: txnId,
        amount: amountCents / 100,
        paymob_order_id: paymobOrderId,
      });

      // Create in-app notification
      await supabase.from("notifications").insert({
        user_id: order.user_id,
        type: "subscription_activated",
        title: `🎉 خطة ${order.plan === "pro" ? "الاحترافية" : "المؤسسات"} فعّالة!`,
        message: `تم تفعيل اشتراكك بنجاح. اسمتع بكل المميزات حتى ${expiresAt.toLocaleDateString("ar-EG")}.`,
        action_url: "/dashboard",
        is_read: false,
      });

      console.log(`✅ Subscription activated for user ${order.user_id}, plan: ${order.plan}`);
    } else {
      // Payment failed
      await supabase.from("payment_orders").update({
        status: "failed",
        paymob_txn_id: txnId,
      }).eq("id", order.id);

      console.log(`❌ Payment failed for order ${order.id}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("paymob-webhook error:", err);
    // Always return 200 to PayMob to prevent infinite retries
    return new Response(JSON.stringify({ received: true, error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

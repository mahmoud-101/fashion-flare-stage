import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get latest active subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Auto-expire subscriptions past their end date
    if (subscription && subscription.expires_at) {
      const expiresAt = new Date(subscription.expires_at);
      if (expiresAt < new Date()) {
        await supabase.from("subscriptions").update({ status: "expired" })
          .eq("id", subscription.id);

        // Notify user
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "subscription_expired",
          title: "⚠️ انتهى اشتراكك",
          message: "اشتراكك الاحترافي انتهى. جدّده الآن للاستمرار في الإنتاج بلا حدود!",
          action_url: "/dashboard/billing",
          is_read: false,
        });

        return new Response(JSON.stringify({
          plan: "free",
          status: "expired",
          subscription: null,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Check for upcoming expiry (3 days warning)
    if (subscription?.expires_at) {
      const expiresAt = new Date(subscription.expires_at);
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      if (expiresAt <= threeDaysFromNow) {
        // Check if warning already sent today
        const today = new Date().toISOString().split("T")[0];
        const { data: existingWarning } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("type", "subscription_expiry_warning")
          .gte("created_at", today)
          .limit(1)
          .maybeSingle();

        if (!existingWarning) {
          const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
          await supabase.from("notifications").insert({
            user_id: user.id,
            type: "subscription_expiry_warning",
            title: `⏰ اشتراكك ينتهي بعد ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}`,
            message: "جدّد اشتراكك الآن لتبقى تنتج محتوى بلا حدود!",
            action_url: "/dashboard/billing",
            is_read: false,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      plan: subscription?.plan || "free",
      status: subscription?.status || "free",
      subscription,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("check-subscription error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

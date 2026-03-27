import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Moda AI <noreply@modaai.com>";

type EmailType = "welcome" | "subscription_activated" | "expiry_warning" | "weekly_summary";

function buildWelcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: `مرحباً ${name}! حسابك جاهز في Moda AI 🎉`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>body{font-family:'Segoe UI',Arial,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;direction:rtl}.container{max-width:600px;margin:0 auto;padding:40px 20px}.card{background:#1a1a1a;border:1px solid rgba(214,175,54,0.3);border-radius:16px;padding:40px}.logo{text-align:center;margin-bottom:32px;font-size:28px;font-weight:900;color:#d6af36}.btn{display:inline-block;background:linear-gradient(135deg,#d6af36,#f0d060);color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px}.tip{background:rgba(214,175,54,0.08);border:1px solid rgba(214,175,54,0.2);border-radius:10px;padding:16px;margin:20px 0}h1{color:#fff;font-size:24px;margin:0 0 16px}p{color:#a3a3a3;line-height:1.7}ul{color:#a3a3a3;line-height:2;padding-right:20px}li{margin-bottom:4px}</style></head>
<body><div class="container"><div class="card">
<div class="logo">✨ Moda AI</div>
<h1>مرحباً ${name}! 👋</h1>
<p>حسابك في Moda AI جاهز وينتظرك. أنت الآن تملك أداة ذكاء اصطناعي متخصصة في محتوى الفاشون العربي.</p>
<div class="tip">
  <strong style="color:#d6af36">🚀 ابدأ في 3 خطوات سريعة:</strong>
  <ul>
    <li>أكمل إعداد بيانات البراند بتاعك</li>
    <li>جرّب كاتب المحتوى بـ AI وولّد أول كابشن</li>
    <li>جدول أول بوست على منصتك المفضلة</li>
  </ul>
</div>
<p>لديك <strong style="color:#d6af36">3 توليدات مجانية يومياً</strong> للبداية. رقّي لـ Pro واحصل على 50 توليداً يومياً.</p>
<p style="text-align:center;margin:32px 0"><a href="https://fashion-flare.lovable.app/dashboard" class="btn">انطلق للداشبورد ←</a></p>
<p style="text-align:center;font-size:12px;color:#666">Moda AI — محتوى فاشون عربي بالذكاء الاصطناعي</p>
</div></div></body></html>`,
  };
}

function buildSubscriptionEmail(name: string, plan: string): { subject: string; html: string } {
  return {
    subject: `اشتراكك الاحترافي فعّال الآن! 🚀`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>body{font-family:'Segoe UI',Arial,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;direction:rtl}.container{max-width:600px;margin:0 auto;padding:40px 20px}.card{background:#1a1a1a;border:1px solid rgba(214,175,54,0.3);border-radius:16px;padding:40px}.logo{text-align:center;margin-bottom:32px;font-size:28px;font-weight:900;color:#d6af36}.btn{display:inline-block;background:linear-gradient(135deg,#d6af36,#f0d060);color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px}.feature{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;color:#a3a3a3}h1{color:#fff;font-size:24px;margin:0 0 16px}p{color:#a3a3a3;line-height:1.7}</style></head>
<body><div class="container"><div class="card">
<div class="logo">✨ Moda AI</div>
<h1>مبروك ${name}! اشتراكك ${plan === "agency" ? "المؤسسي" : "الاحترافي"} فعّال 🎉</h1>
<p>أنت الآن تملك قدرات AI كاملة لتنمية براندك الفاشون.</p>
<p><strong style="color:#d6af36">ما صار متاحاً لك الآن:</strong></p>
<div class="feature"><span>⚡</span><span>${plan === "agency" ? "توليد غير محدود" : "50 توليد يومياً"} — كابشنات، إعلانات، ريلز</span></div>
<div class="feature"><span>📸</span><span>${plan === "agency" ? "صور غير محدودة" : "30 صورة يومياً"} في استوديو الصور</span></div>
<div class="feature"><span>🔗</span><span>ربط متجرك على Salla وShopify وZid</span></div>
<div class="feature"><span>📅</span><span>جدولة المحتوى على كل المنصات</span></div>
<div class="feature"><span>📊</span><span>تحليلات الأداء التفصيلية</span></div>
${plan === "agency" ? '<div class="feature"><span>👤</span><span>مدير حساب مخصص + دعم مباشر</span></div>' : ""}
<p style="text-align:center;margin:32px 0"><a href="https://fashion-flare.lovable.app/dashboard" class="btn">استكشف مميزاتك الجديدة ←</a></p>
</div></div></body></html>`,
  };
}

function buildExpiryEmail(name: string, daysLeft: number): { subject: string; html: string } {
  return {
    subject: `اشتراكك ينتهي خلال ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"} ⚠️`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>body{font-family:'Segoe UI',Arial,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;direction:rtl}.container{max-width:600px;margin:0 auto;padding:40px 20px}.card{background:#1a1a1a;border:1px solid rgba(245,158,11,0.4);border-radius:16px;padding:40px}.logo{text-align:center;margin-bottom:32px;font-size:28px;font-weight:900;color:#d6af36}.btn{display:inline-block;background:linear-gradient(135deg,#f59e0b,#fcd34d);color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px}h1{color:#fcd34d;font-size:24px;margin:0 0 16px}p{color:#a3a3a3;line-height:1.7}</style></head>
<body><div class="container"><div class="card">
<div class="logo">✨ Moda AI</div>
<h1>⚠️ اشتراكك ينتهي قريباً</h1>
<p>مرحباً ${name}! اشتراكك في Moda AI ينتهي خلال <strong style="color:#fcd34d">${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}</strong>.</p>
<p>بعد انتهاء الاشتراك ستنتقل تلقائياً للخطة المجانية (3 توليدات يومياً فقط).</p>
<p>جدّد الآن للاستمرار بكل مميزاتك الاحترافية دون انقطاع.</p>
<p style="text-align:center;margin:32px 0"><a href="https://fashion-flare.lovable.app/dashboard/billing" class="btn">جدّد اشتراكي الآن ←</a></p>
</div></div></body></html>`,
  };
}

function buildWeeklySummaryEmail(
  name: string,
  count: number,
  tip: string
): { subject: string; html: string } {
  return {
    subject: `ملخص أسبوعك على Moda AI 📊`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>body{font-family:'Segoe UI',Arial,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;direction:rtl}.container{max-width:600px;margin:0 auto;padding:40px 20px}.card{background:#1a1a1a;border:1px solid rgba(214,175,54,0.3);border-radius:16px;padding:40px}.logo{text-align:center;margin-bottom:32px;font-size:28px;font-weight:900;color:#d6af36}.btn{display:inline-block;background:linear-gradient(135deg,#d6af36,#f0d060);color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px}.stat{background:rgba(214,175,54,0.08);border:1px solid rgba(214,175,54,0.2);border-radius:10px;padding:20px;text-align:center;margin:16px 0}.tip-box{background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:16px;margin:20px 0}h1{color:#fff;font-size:24px;margin:0 0 16px}p{color:#a3a3a3;line-height:1.7}</style></head>
<body><div class="container"><div class="card">
<div class="logo">✨ Moda AI</div>
<h1>ملخص أسبوعك 📊</h1>
<p>مرحباً ${name}! هذا ما أنجزته الأسبوع الماضي على Moda AI:</p>
<div class="stat">
  <div style="font-size:48px;font-weight:900;color:#d6af36">${count}</div>
  <div style="color:#a3a3a3;margin-top:8px">قطعة محتوى مُولَّدة هذا الأسبوع</div>
</div>
<div class="tip-box">
  <strong style="color:#818cf8">💡 نصيحة الأسبوع:</strong>
  <p style="margin:8px 0 0">${tip}</p>
</div>
<p style="text-align:center;margin:32px 0"><a href="https://fashion-flare.lovable.app/dashboard" class="btn">استمر في الإنتاج ←</a></p>
</div></div></body></html>`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      type,
      email,
      name,
      plan,
      daysLeft,
      weeklyCount,
      weeklyTip,
    }: {
      type: EmailType;
      email: string;
      name: string;
      plan?: string;
      daysLeft?: number;
      weeklyCount?: number;
      weeklyTip?: string;
    } = body;

    if (!type || !email || !name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, email, name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailContent: { subject: string; html: string };

    switch (type) {
      case "welcome":
        emailContent = buildWelcomeEmail(name);
        break;
      case "subscription_activated":
        emailContent = buildSubscriptionEmail(name, plan || "pro");
        break;
      case "expiry_warning":
        emailContent = buildExpiryEmail(name, daysLeft || 3);
        break;
      case "weekly_summary":
        emailContent = buildWeeklySummaryEmail(
          name,
          weeklyCount || 0,
          weeklyTip || "جرّب قوالب المناسبات هذا الأسبوع لمضاعفة تفاعل جمهورك!"
        );
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Unknown email type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Resend error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: err }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-email error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

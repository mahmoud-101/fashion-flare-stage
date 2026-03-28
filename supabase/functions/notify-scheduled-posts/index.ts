// ============================================================
// supabase/functions/notify-scheduled-posts/index.ts
// يُشغَّل كل 5 دقائق عبر pg_cron
// يقرأ المنشورات المجدولة التي حان وقتها ويرسل إيميل تذكير
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // ─── Strict service-role auth ─────────────────────────────
  // Only allow requests bearing the exact service role key.
  // pg_cron passes it via vault; external callers must present it explicitly.
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!bearerToken || bearerToken !== SUPABASE_SERVICE_KEY) {
    console.error("Unauthorized call to notify-scheduled-posts — token mismatch");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. جلب المنشورات التي حان وقتها ولم يُرسَل إشعارها بعد
  const now = new Date().toISOString();
  const { data: posts, error: fetchError } = await supabase
    .from("scheduled_posts")
    .select(`
      id,
      caption,
      image_url,
      platform,
      scheduled_at,
      user_id,
      user_email
    `)
    .eq("status", "pending")
    .lte("scheduled_at", now);

  if (fetchError) {
    console.error("خطأ في جلب المنشورات:", fetchError);
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!posts || posts.length === 0) {
    console.log("لا توجد منشورات مجدولة حالياً");
    return new Response(JSON.stringify({ processed: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`📬 معالجة ${posts.length} منشور(ات) مجدولة`);

  const results: { id: string; status: string; error?: string }[] = [];

  for (const post of posts) {
    try {
      const platformName = getPlatformName(post.platform);
      const scheduledTime = new Date(post.scheduled_at).toLocaleString("ar-EG", {
        timeZone: "Africa/Cairo",
        dateStyle: "full",
        timeStyle: "short",
      });

      const emailHtml = buildEmailHtml({
        caption: post.caption,
        imageUrl: post.image_url,
        platform: platformName,
        scheduledTime,
      });

      // 2. إرسال الإيميل عبر send-email function
      const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: post.user_email,
          subject: `⏰ وقت النشر على ${platformName}!`,
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        const err = await emailResponse.text();
        console.error(`فشل إرسال إيميل للمنشور ${post.id}:`, err);
        results.push({ id: post.id, status: "email_failed", error: err });
        continue;
      }

      // 3. تحديث الحالة إلى notified (نحدد فقط المنشورات بحالة pending لتجنب التحديث المزدوج)
      const { error: updateError } = await supabase
        .from("scheduled_posts")
        .update({
          status: "notified",
          notified_at: new Date().toISOString(),
        })
        .eq("id", post.id)
        .eq("status", "pending");

      if (updateError) {
        console.error(`خطأ في تحديث حالة المنشور ${post.id}:`, updateError);
        results.push({ id: post.id, status: "update_failed", error: updateError.message });
      } else {
        console.log(`✅ تم إرسال إشعار المنشور ${post.id} إلى ${post.user_email}`);
        results.push({ id: post.id, status: "notified" });
      }
    } catch (err) {
      console.error(`خطأ غير متوقع للمنشور ${post.id}:`, err);
      results.push({ id: post.id, status: "error", error: String(err) });
    }
  }

  return new Response(
    JSON.stringify({ processed: posts.length, results }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    twitter: "Twitter/X",
    facebook: "Facebook",
    snapchat: "Snapchat",
  };
  return names[platform?.toLowerCase()] ?? platform ?? "منصة التواصل";
}

function buildEmailHtml({
  caption,
  imageUrl,
  platform,
  scheduledTime,
}: {
  caption: string;
  imageUrl?: string | null;
  platform: string;
  scheduledTime: string;
}): string {
  const imageSection = imageUrl
    ? `<img src="${imageUrl}" alt="صورة المنشور" style="max-width:100%;border-radius:12px;margin:16px 0;" />`
    : "";

  // Escape for HTML — no JavaScript in email (stripped by email clients)
  const escapedCaption = caption
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // Encode for mailto: URI — used for the "انسخ النص" button link
  const captionMailtoBody = encodeURIComponent(caption);

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>وقت النشر!</title>
</head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#ec4899);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;">⏰ وقت النشر!</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:16px;">
                حان موعد نشرك على <strong>${platform}</strong>
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="color:#4b5563;font-size:15px;margin:0 0 16px;">
                📅 الموعد المحدد: <strong style="color:#7c3aed;">${scheduledTime}</strong>
              </p>
              ${imageSection}
              <!-- Caption Box — pre-formatted for easy selection and manual copy -->
              <p style="color:#374151;font-size:14px;font-weight:600;margin:20px 0 8px;">
                📋 نص المنشور:
              </p>
              <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-right:4px solid #7c3aed;border-radius:8px;padding:20px;margin:0 0 24px;">
                <pre style="color:#1f2937;font-size:15px;line-height:1.8;margin:0;white-space:pre-wrap;font-family:inherit;">${escapedCaption}</pre>
              </div>
              <!-- Email-safe "انسخ النص" button — table-based, no JS, works in all email clients -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:50px;padding:0;">
                          <a
                            href="mailto:?subject=%D8%A7%D9%86%D8%B3%D8%AE+%D9%86%D8%B5+%D9%85%D9%86%D8%B4%D9%88%D8%B1%D9%83&body=${captionMailtoBody}"
                            style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;font-family:'Segoe UI',Arial,sans-serif;"
                          >
                            📋 انسخ النص
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Tip -->
              <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin-bottom:20px;text-align:center;">
                <p style="color:#92400e;font-size:13px;margin:0;">
                  💡 اضغط الزر أعلاه لفتح نسخة من النص، أو حدده يدوياً من المربع وانسخه
                </p>
              </div>
              <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
                افتح تطبيق ${platform} والصق النص للنشر الآن
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                Fashion Flare — منصة إدارة محتوى الموضة
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

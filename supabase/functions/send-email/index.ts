// ============================================================
// supabase/functions/send-email/index.ts
// إرسال إيميل عبر Resend API
// مقيّد للاستخدام الداخلي فقط (service role)
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { errorResponse, successResponse } from "../_shared/cors.ts";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

serve(async (req) => {
  // ─── Service-role authorization only ─────────────────────────
  // This function is internal — only callable with the exact service role key.
  // Regular Supabase anon/authenticated JWTs are explicitly rejected.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!bearerToken || bearerToken !== serviceKey) {
    console.error("Unauthorized call to send-email — token mismatch");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY غير مضبوط");
    return errorResponse("Server misconfigured: missing email API key", 500);
  }

  let payload: EmailPayload;
  try {
    payload = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { to, subject, html, from = "Fashion Flare <noreply@fashionflare.app>" } = payload;

  if (!to || !subject || !html) {
    return errorResponse("يرجى تقديم: to, subject, html", 400);
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Resend API error:", err);
      return errorResponse("فشل إرسال الإيميل", 500);
    }

    const data = await response.json();
    console.log(`✅ تم إرسال إيميل إلى ${to} — id: ${data.id}`);
    return successResponse({ sent: true, id: data.id });
  } catch (err) {
    console.error("خطأ غير متوقع في send-email:", err);
    return errorResponse("حدث خطأ غير متوقع أثناء إرسال الإيميل", 500);
  }
});

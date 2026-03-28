import { handleCors, errorResponse, successResponse, getUserFromJWT } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { getUserPlan, logUsage } from "../_shared/subscription.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const user = await getUserFromJWT(req, SUPABASE_URL, SUPABASE_ANON_KEY);
  if (!user) return errorResponse("Unauthorized", 401);

  const plan = await getUserPlan(user.id, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, user.email);
  const rateResult = await checkRateLimit(user.id, "text", plan, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!rateResult.allowed) return rateLimitResponse(rateResult);

  const body = await req.json();
  const { ad_text, platform, target_audience, image_url } = body;

  if (!ad_text) return errorResponse("ad_text is required", 400);

  const systemPrompt =
    "أنت خبير في تقييم الإعلانات الرقمية. قيّم الإعلان وأعط نتيجة من 100 مع تفصيل النقاط باللغة العربية بصيغة JSON.";
  const userContent = [
    {
      type: "text",
      text: `
        نص الإعلان: ${ad_text}
        المنصة: ${platform ?? "عام"}
        الجمهور المستهدف: ${target_audience ?? "غير محدد"}
        
        قيّم الإعلان وأعد JSON بهذا الشكل: { "score": 85, "breakdown": { "clarity": 90, "engagement": 80, "cta": 85, "relevance": 90 }, "strengths": [...], "improvements": [...] }
      `,
    },
  ] as unknown[];

  if (image_url) {
    userContent.push({ type: "image_url", image_url: { url: image_url } });
  }

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" },
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    console.error("OpenAI error", err);
    return errorResponse("Ad scoring failed", 502);
  }

  const data = await openaiRes.json();
  const tokens = data.usage?.total_tokens ?? 0;
  let scoreData: unknown;
  try {
    scoreData = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
  } catch {
    scoreData = { raw: data.choices?.[0]?.message?.content };
  }

  await logUsage(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    user_id: user.id,
    action: "score-ad",
    tokens,
  });

  return successResponse({ result: scoreData, usage: data.usage });
});

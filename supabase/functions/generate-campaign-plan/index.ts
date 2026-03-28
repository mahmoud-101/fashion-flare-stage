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
  const { product, target_audience, budget, goals, duration } = body;

  if (!product) return errorResponse("product is required", 400);

  const systemPrompt =
    "أنت خبير تسويق رقمي. قم بإنشاء خطة حملة تسويقية شاملة وعملية باللغة العربية.";
  const userPrompt = `
    المنتج: ${product}
    الجمهور المستهدف: ${target_audience ?? "غير محدد"}
    الميزانية: ${budget ?? "غير محددة"}
    الأهداف: ${goals ?? "غير محددة"}
    المدة: ${duration ?? "غير محددة"}
    
    قم بإنشاء خطة حملة تسويقية تفصيلية تشمل: الاستراتيجية، القنوات، المحتوى، الجدول الزمني، مؤشرات الأداء.
  `;

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
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    console.error("OpenAI error", err);
    return errorResponse("Campaign plan generation failed", 502);
  }

  const data = await openaiRes.json();
  const tokens = data.usage?.total_tokens ?? 0;

  await logUsage(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    user_id: user.id,
    action: "generate-campaign-plan",
    tokens,
  });

  return successResponse({ plan: data.choices?.[0]?.message?.content, usage: data.usage });
});

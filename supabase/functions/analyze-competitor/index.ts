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
  const { competitor_name, industry, your_brand } = body;

  if (!competitor_name) return errorResponse("competitor_name is required", 400);

  const systemPrompt =
    "أنت محلل تسويقي خبير. قدم تحليلاً شاملاً للمنافسين باللغة العربية مع توصيات عملية.";
  const userPrompt = `
    المنافس: ${competitor_name}
    القطاع: ${industry ?? "غير محدد"}
    علامتك التجارية: ${your_brand ?? "غير محددة"}
    
    قدم تحليلاً شاملاً يشمل: نقاط القوة والضعف، الفرص والتهديدات، استراتيجية المحتوى، نصائح للتفوق.
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
    return errorResponse("Competitor analysis failed", 502);
  }

  const data = await openaiRes.json();
  const tokens = data.usage?.total_tokens ?? 0;

  await logUsage(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    user_id: user.id,
    action: "analyze-competitor",
    tokens,
  });

  return successResponse({ analysis: data.choices?.[0]?.message?.content, usage: data.usage });
});

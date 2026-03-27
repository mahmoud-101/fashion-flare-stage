import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "مفتاح OpenAI غير مضبوط" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { content, imageUrl, contentType } = await req.json() as {
      content?: string;
      imageUrl?: string;
      contentType?: string;
    };

    if (!content && !imageUrl) {
      return new Response(JSON.stringify({ error: "لا يوجد محتوى للتقييم" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `أنت محلل إعلانات رقمية خبير في سوق الموضة العربي.
قيّم الإعلان بموضوعية وأعد JSON فقط.`;

    const typeNote = contentType ? `نوع المحتوى: ${contentType}` : "";

    const userPrompt = `قيّم هذا الإعلان${typeNote ? ` (${typeNote})` : ""}:
${content ? `\nالنص:\n"${content.slice(0, 800)}"` : ""}

أعد JSON بهذا الشكل:
{
  "hook": 18,
  "cta": 20,
  "visual": 17,
  "arabic": 22,
  "suggestions": [
    "اقتراح تحسين 1 بالعربية",
    "اقتراح 2",
    "اقتراح 3"
  ]
}

معايير التقييم (كل واحدة من 25):
- hook: قوة الجملة الأولى وجذب الانتباه
- cta: وضوح الدعوة للتصرف ومدى إلحاحها
- visual: جاذبية الوصف البصري والإيموجي
- arabic: ملاءمة اللغة للجمهور العربي والصحة اللغوية

suggestions: 3 اقتراحات تحسين قابلة للتطبيق فوراً`;

    const messages: Array<{ role: string; content: unknown }> = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages,
        max_tokens: 600,
        temperature: 0.5,
      }),
    });

    if (!response.ok) throw new Error("فشل التقييم");

    const result = await response.json() as { choices: Array<{ message: { content: string } }> };
    const resultContent = result.choices?.[0]?.message?.content;
    if (!resultContent) throw new Error("لم تصل بيانات");

    const scored = JSON.parse(resultContent);

    return new Response(JSON.stringify({
      hook: Math.min(25, Math.max(0, scored.hook || 15)),
      cta: Math.min(25, Math.max(0, scored.cta || 15)),
      visual: Math.min(25, Math.max(0, scored.visual || 15)),
      arabic: Math.min(25, Math.max(0, scored.arabic || 15)),
      suggestions: Array.isArray(scored.suggestions) ? scored.suggestions.slice(0, 5) : [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

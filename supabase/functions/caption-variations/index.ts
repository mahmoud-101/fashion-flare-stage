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

    const { caption, dialect } = await req.json() as {
      caption: string;
      dialect?: string;
    };

    if (!caption?.trim()) {
      return new Response(JSON.stringify({ error: "يرجى تقديم الكابشن الأصلي" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dialectNote = dialect ? `اكتب باللهجة ${dialect}` : "اكتب بالعربية المناسبة";

    const systemPrompt = `أنت خبير كتابة محتوى سوشيال ميديا متخصص في الموضة العربية.
${dialectNote}. أعد JSON فقط.`;

    const userPrompt = `الكابشن الأصلي:
"${caption.slice(0, 600)}"

ولّد 5 نسخ بأساليب مختلفة. أعد JSON:
{
  "variations": [
    {
      "style": "😍",
      "label": "عاطفي",
      "caption": "نسخة عاطفية وشخصية بالعربية مع إيموجي وهاشتاجات"
    },
    {
      "style": "⚡",
      "label": "إلحاح",
      "caption": "نسخة تعتمد على الإلحاح والندرة والعروض المحدودة"
    },
    {
      "style": "🌟",
      "label": "قصة",
      "caption": "نسخة بأسلوب السرد والقصة الشخصية"
    },
    {
      "style": "💎",
      "label": "فاخر",
      "caption": "نسخة راقية تعكس الجودة والفخامة"
    },
    {
      "style": "🔥",
      "label": "ترند",
      "caption": "نسخة بأسلوب ترندي وشبابي لـ TikTok وReels"
    }
  ]
}

كل نسخة يجب أن:
- تحافظ على الرسالة الأساسية للمنتج
- تختلف في الأسلوب والنبرة بوضوح
- تشمل إيموجي وهاشتاجات مناسبة
- تكون جاهزة للنشر مباشرة`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.85,
      }),
    });

    if (!response.ok) throw new Error("فشل توليد النسخ");

    const result = await response.json() as { choices: Array<{ message: { content: string } }> };
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("لم تصل بيانات");

    const parsed = JSON.parse(content);
    if (!parsed.variations || !Array.isArray(parsed.variations)) throw new Error("تنسيق غير صحيح");

    return new Response(JSON.stringify({ variations: parsed.variations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

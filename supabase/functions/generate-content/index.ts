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

    const body = await req.json() as {
      type?: string;
      prompt?: string;
      product?: string;
      contentType?: string;
      extra?: string;
      dialect?: string;
      platform?: string;
    };

    const { type, prompt, product, contentType, extra, dialect, platform } = body;

    if (type === "hashtags") {
      return await handleHashtags({ prompt: prompt || "", dialect, platform });
    }
    return await handleGeneralContent({ product, contentType, extra, dialect, platform });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleHashtags(params: { prompt: string; dialect?: string; platform?: string }) {
  const { prompt, platform } = params;

  const systemPrompt = `أنت خبير سوشيال ميديا متخصص في الموضة العربية.
مهمتك توليد هاشتاجات متنوعة ومفيدة بتنسيق JSON فقط.`;

  const userPrompt = `${prompt}

ولّد هاشتاجات متنوعة ومنظمة في مجموعات. أعد JSON بهذا الشكل:
{
  "groups": [
    {
      "label": "عام الموضة",
      "color": "purple",
      "tags": ["#فاشون", "#موضة", "#ستايل", "#أزياء", "#فشن"]
    },
    {
      "label": "منصة ${platform || "إنستقرام"}",
      "color": "pink",
      "tags": ["#instafashion", "#ootd", "#fashionista"]
    },
    {
      "label": "المنتج والبراند",
      "color": "gold",
      "tags": ["#عباية", "#فستان", "#كوليكشن_جديد"]
    },
    {
      "label": "ترند وشراء",
      "color": "blue",
      "tags": ["#تسوق_اون_لاين", "#عروض", "#توصيل_سريع"]
    }
  ]
}

تأكد من:
- 5-8 هاشتاجات في كل مجموعة
- مزيج من العربية والإنجليزية
- هاشتاجات ذات صلة فعلية بالمنتج الموصوف
- استخدام هاشتاجات شائعة وهاشتاجات متخصصة`;

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
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error("فشل توليد الهاشتاجات");

  const result = await response.json() as { choices: Array<{ message: { content: string } }> };
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("لم تصل بيانات");

  return new Response(JSON.stringify({
    content: content,
    result: content,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGeneralContent(params: {
  product?: string;
  contentType?: string;
  extra?: string;
  dialect?: string;
  platform?: string;
}) {
  const { product, contentType, extra, dialect, platform } = params;

  const systemPrompt = `أنت خبير تسويق رقمي متخصص في إنشاء إعلانات فعّالة للأسواق العربية.
اكتب باللهجة العربية المناسبة للجمهور المستهدف.
أعد JSON فقط.`;

  const userPrompt = `المنتج: ${product || "منتج فاشون"}
النوع: ${contentType || "إعلان"}
المنصة: ${platform || "Instagram"}
اللهجة: ${dialect || "مصري"}

${extra || "ولّد نسخاً إعلانية متنوعة وجذابة"}

أعد JSON بهذا الشكل:
{
  "output": "[JSON_ARRAY_STRING]"
}

حيث JSON_ARRAY_STRING هو مصفوفة JSON بصيغة نص (string) تحتوي على الكائنات المطلوبة كما طُلب في التعليمات.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: extra || userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.85,
    }),
  });

  if (!response.ok) throw new Error("فشل توليد المحتوى");

  const result = await response.json() as { choices: Array<{ message: { content: string } }> };
  const rawContent = result.choices?.[0]?.message?.content || "";

  return new Response(JSON.stringify({
    output: rawContent,
    content: rawContent,
    result: rawContent,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

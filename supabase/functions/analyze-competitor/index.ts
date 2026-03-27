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

    const { adImage, adText, competitorName } = await req.json() as {
      adImage?: { base64: string; mimeType: string };
      adText?: string;
      competitorName?: string;
    };

    if (!adImage && !adText?.trim()) {
      return new Response(JSON.stringify({ error: "يرجى تقديم صورة إعلان أو نصه" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `أنت محلل إعلانات رقمية خبير في سوق الموضة العربي.
مهمتك تحليل إعلانات المنافسين وتقديم رؤى قابلة للتطبيق.
أعد JSON فقط بدون أي نص إضافي.`;

    const analysisInstruction = `حلل هذا الإعلان${competitorName ? ` لـ "${competitorName}"` : ""}${adText ? `\n\nنص الإعلان:\n"${adText}"` : ""}

أعد JSON بهذا الشكل بالضبط:
{
  "overallScore": 72,
  "scores": {
    "hook": 18,
    "visualDesign": 16,
    "copywriting": 20,
    "cta": 18
  },
  "strengths": ["نقطة قوة 1 بالعربية", "نقطة قوة 2", "نقطة قوة 3"],
  "weaknesses": ["نقطة ضعف 1 بالعربية", "نقطة ضعف 2"],
  "opportunities": ["فرصة تحسين 1 بالعربية", "فرصة 2", "فرصة 3"],
  "suggestedHeadlines": ["عنوان مقترح 1 بالعربية", "عنوان 2", "عنوان 3"],
  "colorPalette": ["#FF6B6B", "#4ECDC4", "#45B7D1"],
  "targetAudience": "الجمهور المستهدف بالعربية",
  "adType": "نوع الإعلان (مثال: إعلان منتج مباشر)",
  "improvedVersion": "نص إعلان محسّن كامل بالعربية يستفيد من نقاط القوة ويعالج الضعف"
}

ملاحظات:
- overallScore = مجموع الـ 4 scores (كل واحدة من 25)
- كل score من 0 إلى 25
- colorPalette: استخرج الألوان من الصورة أو اقترح ألواناً مناسبة
- suggestedHeadlines: 3 عناوين بديلة أقوى
- improvedVersion: نص إعلان كامل محسّن`;

    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: analysisInstruction }
    ];

    if (adImage?.base64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${adImage.mimeType};base64,${adImage.base64}` },
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: adImage?.base64 ? "gpt-4o" : "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: adImage?.base64 ? userContent : analysisInstruction },
        ],
        max_tokens: 2000,
        temperature: 0.6,
      }),
    });

    if (!response.ok) throw new Error("فشل التحليل");

    const result = await response.json() as { choices: Array<{ message: { content: string } }> };
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("لم تصل بيانات");

    const analysis = JSON.parse(content);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

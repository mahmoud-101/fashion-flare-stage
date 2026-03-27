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

    const { storyVision, subjectImages, aspectRatio } = await req.json() as {
      storyVision: string;
      subjectImages?: Array<{ base64: string; mimeType: string; name: string }>;
      aspectRatio?: string;
    };

    if (!storyVision?.trim()) {
      return new Response(JSON.stringify({ error: "يرجى كتابة رؤية القصة" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ratio = aspectRatio || "9:16";
    const ratioNote = ratio === "9:16" ? "Portrait Reels/TikTok format (9:16)" : "Landscape format (16:9)";

    let subjectDesc = "";
    if (subjectImages?.[0]?.base64) {
      try {
        const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: "Describe the main fashion subject in this image in 1-2 sentences for use in a video storyboard." },
                { type: "image_url", image_url: { url: `data:${subjectImages[0].mimeType};base64,${subjectImages[0].base64}`, detail: "low" } },
              ],
            }],
            max_tokens: 80,
          }),
        });
        if (visionResponse.ok) {
          const vr = await visionResponse.json() as { choices: Array<{ message: { content: string } }> };
          subjectDesc = vr.choices?.[0]?.message?.content || "";
        }
      } catch { /* continue */ }
    }

    const systemPrompt = `أنت مخرج إبداعي متخصص في إنتاج محتوى الفيديو للموضة العربية.
مهمتك توليد storyboard احترافي لريلز أو فيديو تيك توك.
أعد JSON فقط.`;

    const userPrompt = `رؤية القصة: "${storyVision}"
${subjectDesc ? `المنتج/الموضوع: ${subjectDesc}` : ""}
نسبة العرض: ${ratioNote}

ولّد storyboard بـ 5-6 مشاهد. أعد JSON بهذا الشكل:
{
  "scenes": [
    {
      "sequence": 1,
      "cameraAngle": "Close-up macro shot",
      "description": "وصف المشهد بالعربية",
      "visualPrompt": "Detailed English prompt for image generation: professional fashion photo, specific camera angle, lighting, composition",
      "duration": 3,
      "audioNote": "ملاحظة الصوت أو النص المنطوق بالعربية"
    }
  ]
}

تعليمات:
- duration: بالثواني (2-5 لكل مشهد)
- visualPrompt: وصف تفصيلي بالإنجليزية للصورة المناسبة للمشهد
- cameraAngle: بالإنجليزية (Close-up, Wide shot, Medium shot, etc.)
- description: وصف ما يحدث في المشهد بالعربية
- audioNote: ما يُقال أو يُسمع في هذا المشهد
- ابدأ بـ hook قوي وانتهِ بـ CTA واضح`;

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
        max_tokens: 2000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) throw new Error("فشل توليد الـ Storyboard");

    const result = await response.json() as { choices: Array<{ message: { content: string } }> };
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("لم تصل بيانات");

    const parsed = JSON.parse(content);
    if (!parsed.scenes || !Array.isArray(parsed.scenes)) throw new Error("تنسيق غير صحيح");

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

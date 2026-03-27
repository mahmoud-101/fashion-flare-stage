import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface ProductImage {
  base64: string;
  mimeType: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "مفتاح OpenAI غير مضبوط — تواصل مع الدعم" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, targetMarket, dialect, productImage } = await req.json() as {
      prompt: string;
      targetMarket?: string;
      dialect?: string;
      productImage?: ProductImage | null;
    };

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "يرجى كتابة وصف المنتج" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dialectNote = dialect ? `اكتب باللهجة ${dialect}.` : "";
    const marketNote = targetMarket ? `الجمهور المستهدف: ${targetMarket}.` : "";

    const systemPrompt = `أنت خبير تسويق رقمي متخصص في الموضة العربية والفاشون. مهمتك توليد خطة محتوى تسويقي احترافي لمنتجات الأزياء.
${dialectNote} ${marketNote}
أعد JSON فقط بدون أي نص إضافي.`;

    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: "text",
        text: `بناءً على هذا الوصف للمنتج:
"${prompt.slice(0, 1500)}"

ولّد خطة محتوى تتضمن 4 أفكار مختلفة. أعد JSON بهذا الشكل بالضبط:
{
  "ideas": [
    {
      "id": "idea-1",
      "tov": "نبرة المحتوى (مثال: عاطفي، ترفيهي، مباشر، ملهم)",
      "caption": "الكابشن الكامل بالعربية مع إيموجي وهاشتاجات (3-5 جمل)",
      "scenario": "وصف المشهد البصري المقترح للصورة أو الفيديو بالإنجليزية (للاستخدام في توليد الصورة)",
      "schedule": "توقيت النشر المقترح (مثال: الجمعة 7 مساءً)"
    }
  ]
}

تنوّع في النبرات: عاطفي، ترفيهي، تعليمي، مباشر للبيع.`,
      }
    ];

    if (productImage?.base64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${productImage.mimeType};base64,${productImage.base64}` },
      });
      userContent[0].text = userContent[0].text!.replace(
        'بناءً على هذا الوصف للمنتج:',
        'بناءً على صورة وهذا الوصف للمنتج:'
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: productImage?.base64 ? "gpt-4o" : "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: productImage?.base64 ? userContent : userContent[0].text },
        ],
        max_tokens: 2000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      throw new Error("خطأ من خادم AI");
    }

    const result = await response.json() as { choices: Array<{ message: { content: string } }> };
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("لم تصل بيانات من AI");

    const parsed = JSON.parse(content);
    if (!parsed.ideas || !Array.isArray(parsed.ideas)) throw new Error("تنسيق غير صحيح");

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

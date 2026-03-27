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

    const { images, action } = await req.json() as {
      images?: Array<{ base64: string; mimeType: string; name?: string }>;
      action?: string;
    };

    if (!images?.length || !images[0]?.base64) {
      return new Response(JSON.stringify({ error: "يرجى رفع صورة لتحليل الستايل" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isStyleAnalysis = action === "style";

    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: "text",
        text: isStyleAnalysis
          ? `Analyze this fashion image and provide a detailed style description for use in generating similar fashion product images.

Describe:
1. Visual style and aesthetic (e.g., minimalist, luxury, editorial, lifestyle)
2. Lighting style (e.g., soft studio, natural, dramatic)
3. Color palette and mood
4. Composition and camera angle
5. Background and setting

Format your response as a single paragraph in English that can be used directly as a DALL-E image generation style prompt (max 150 words). Start with the main style keyword.`
          : `Describe the key visual elements of this fashion image in 2-3 sentences for use in content generation.`,
      }
    ];

    for (let i = 0; i < Math.min(images.length, 3); i++) {
      const img = images[i];
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${img.mimeType};base64,${img.base64}`,
          detail: "low",
        },
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional fashion photographer and art director. Provide concise, technical descriptions suitable for AI image generation.",
          },
          { role: "user", content: userContent },
        ],
        max_tokens: 250,
        temperature: 0.4,
      }),
    });

    if (!response.ok) throw new Error("فشل تحليل الصورة");

    const result = await response.json() as { choices: Array<{ message: { content: string } }> };
    const description = result.choices?.[0]?.message?.content;
    if (!description) throw new Error("لم تصل بيانات");

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

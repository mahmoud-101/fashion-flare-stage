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
      return new Response(JSON.stringify({ error: "مفتاح OpenAI غير مضبوط" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { productImages, scenario, mood, customPrompt } = await req.json() as {
      productImages?: ProductImage[];
      scenario?: string;
      mood?: string;
      customPrompt?: string;
    };

    const basePrompt = customPrompt || scenario || "Professional fashion product photograph";
    const moodClause = mood ? `, ${mood} mood` : "";

    let finalPrompt = `${basePrompt}${moodClause}. High-end commercial fashion photography, editorial quality, perfect lighting, 4K resolution. No watermarks, no text overlays.`;
    finalPrompt = finalPrompt.slice(0, 900);

    let imageDescription = "Product image";
    if (productImages?.[0]?.base64) {
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
              {
                type: "text",
                text: "Describe this fashion product in 1 sentence for an image generation prompt. Be specific about colors, materials, and style.",
              },
              {
                type: "image_url",
                image_url: { url: `data:${productImages[0].mimeType};base64,${productImages[0].base64}`, detail: "low" },
              },
            ],
          }],
          max_tokens: 120,
        }),
      });
      if (visionResponse.ok) {
        const vr = await visionResponse.json() as { choices: Array<{ message: { content: string } }> };
        imageDescription = vr.choices?.[0]?.message?.content || imageDescription;
        finalPrompt = `${imageDescription}. ${finalPrompt}`;
        finalPrompt = finalPrompt.slice(0, 900);
      }
    }

    const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      }),
    });

    if (!dalleResponse.ok) {
      const err = await dalleResponse.text();
      console.error("DALL-E error:", err);
      throw new Error("فشل توليد الصورة");
    }

    const dalleResult = await dalleResponse.json() as {
      data: Array<{ url: string; revised_prompt?: string }>;
    };

    const imageUrl = dalleResult.data?.[0]?.url;
    const revisedPrompt = dalleResult.data?.[0]?.revised_prompt;

    if (!imageUrl) throw new Error("لم يتم إرجاع رابط الصورة");

    return new Response(JSON.stringify({
      imageUrl,
      resultImage: imageUrl,
      revisedPrompt: revisedPrompt || finalPrompt,
      description: imageDescription,
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

import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const STYLE_PROMPTS: Record<string, string> = {
  "realistic": "photorealistic fashion photography, professional lighting, high resolution, editorial magazine quality",
  "fashion-editorial": "high-end fashion editorial photograph, dramatic lighting, luxury aesthetic, Vogue magazine style",
  "watercolor": "elegant watercolor fashion illustration, soft color washes, artistic brush strokes, fashion sketch style",
  "digital-art": "digital fashion art, vibrant colors, sharp lines, contemporary fashion illustration, modern artistic style",
  "flat-design": "flat design fashion illustration, clean lines, geometric shapes, minimal style, modern graphic design",
};

function dataUrlToBase64(dataUrl: string): { base64: string; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) return { mimeType: match[1], base64: match[2] };
  return { mimeType: "image/jpeg", base64: dataUrl };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "مفتاح OpenAI غير مضبوط" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sketch, prompt, style } = await req.json() as {
      sketch?: string;
      prompt: string;
      style?: string;
    };

    if (!sketch && !prompt?.trim()) {
      return new Response(JSON.stringify({ error: "ارسم سكتش أو اكتب وصفاً للتصميم" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stylePrompt = STYLE_PROMPTS[style || "fashion-editorial"] || STYLE_PROMPTS["fashion-editorial"];
    let sketchDescription = "";

    if (sketch) {
      const { base64, mimeType } = dataUrlToBase64(sketch);

      const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: `This is a fashion design sketch. Analyze it and describe the clothing design shown:
1. Garment type (dress, top, pants, coat, etc.)
2. Silhouette and shape
3. Neckline and collar style
4. Sleeve type and length
5. Length and cut
6. Visible design details (pleats, ruffles, buttons, etc.)
7. Estimated style (casual, formal, evening, streetwear, etc.)

Provide a concise but complete fashion design description in English.`,
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
              },
            ],
          }],
          max_tokens: 300,
        }),
      });

      if (visionResponse.ok) {
        const vr = await visionResponse.json() as { choices: Array<{ message: { content: string } }> };
        sketchDescription = vr.choices?.[0]?.message?.content || "";
      }
    }

    const arabicPromptTranslation = prompt
      ? ` User description: "${prompt}"`
      : "";

    const finalPrompt = sketch
      ? `Fashion design brought to life from sketch: ${sketchDescription}.${arabicPromptTranslation} Style: ${stylePrompt}. Clean white background, perfect presentation of the garment, full view showing complete design. No model needed, just the garment on a simple mannequin or flat lay if appropriate. High quality fashion illustration or photograph.`
      : `Fashion design creation: ${prompt}. ${stylePrompt}. Clean white or neutral background, professional garment presentation, full view of the complete design. High quality, detailed fashion image showing the clothing item clearly.`;

    const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: finalPrompt.slice(0, 950),
        n: 1,
        size: "1024x1792",
        quality: "hd",
        response_format: "b64_json",
      }),
    });

    if (!dalleResponse.ok) {
      const errText = await dalleResponse.text();
      console.error("DALL-E error:", errText);
      throw new Error("فشل توليد الصورة");
    }

    const dalleResult = await dalleResponse.json() as {
      data: Array<{ b64_json: string }>;
    };

    const b64 = dalleResult.data?.[0]?.b64_json;
    if (!b64) throw new Error("لم تصل الصورة");

    return new Response(JSON.stringify({
      resultImage: `data:image/png;base64,${b64}`,
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

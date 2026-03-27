import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

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

    const { image, scale } = await req.json() as {
      image: string;
      scale?: number;
    };

    if (!image) {
      return new Response(JSON.stringify({ error: "يرجى رفع صورة" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { base64, mimeType } = dataUrlToBase64(image);
    const targetScale = Math.min(scale || 2, 4);

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
              text: `You are analyzing a fashion/product image to recreate it at ${targetScale}x higher resolution with enhanced detail.

Describe this image with extreme precision for image regeneration:
1. Subject: What is shown (product type, clothing item, model, etc.)
2. Colors: Exact colors and patterns (be very specific)
3. Materials & textures: Fabric type, surface finish, sheen, texture details
4. Lighting: Light source direction, shadows, highlights, mood
5. Composition: Framing, background, angle, perspective
6. Specific details: Any logos, embellishments, stitching, design elements visible
7. Image quality issues to fix: blurriness, noise, low contrast

Provide a comprehensive regeneration prompt that will produce the same image but at ${targetScale}x higher quality with sharp details.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
            },
          ],
        }],
        max_tokens: 500,
      }),
    });

    if (!visionResponse.ok) throw new Error("فشل تحليل الصورة");

    const visionResult = await visionResponse.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const imageDescription = visionResult.choices?.[0]?.message?.content || "";

    const sizeMap: Record<number, "1024x1024" | "1024x1792" | "1792x1024"> = {
      2: "1024x1024",
      3: "1024x1792",
      4: "1792x1024",
    };
    const dalleSize = sizeMap[targetScale] || "1024x1024";

    const prompt = `Ultra high resolution, hyper-detailed, ${targetScale}x upscaled recreation: ${imageDescription}

Maximum sharpness and clarity. Fine detail enhancement. Perfect focus throughout. Professional commercial photography quality. Photorealistic rendering with enhanced texture detail. No artifacts, no noise, crystal clear image quality. Preserve exact composition and colors from the original.`;

    const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt.slice(0, 950),
        n: 1,
        size: dalleSize,
        quality: "hd",
        response_format: "b64_json",
      }),
    });

    if (!dalleResponse.ok) {
      const errText = await dalleResponse.text();
      console.error("DALL-E error:", errText);
      throw new Error("فشل تحسين الصورة");
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

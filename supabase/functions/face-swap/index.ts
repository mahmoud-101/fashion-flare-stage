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
      return new Response(JSON.stringify({ error: "مفتاح OpenAI غير مضبوط — تواصل مع الدعم" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sourceImage, targetImage } = await req.json() as {
      sourceImage: string;
      targetImage: string;
    };

    if (!sourceImage || !targetImage) {
      return new Response(JSON.stringify({ error: "يرجى رفع الصورتين" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const source = dataUrlToBase64(sourceImage);
    const target = dataUrlToBase64(targetImage);

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
              text: `You are analyzing two fashion images to create a face swap composition.

Image 1 (Source face): This is the face/person whose facial features to use.
Image 2 (Target): This is the outfit/setting scene.

Describe in detail:
1. The facial features of the person in Image 1 (skin tone, face shape, hair color and style, eye color, makeup style)
2. The outfit/clothing in Image 2 (garment type, color, style, material appearance)
3. The background/setting in Image 2

Be very specific and detailed. This description will be used to generate a realistic fashion image.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${source.mimeType};base64,${source.base64}`, detail: "high" },
            },
            {
              type: "image_url",
              image_url: { url: `data:${target.mimeType};base64,${target.base64}`, detail: "high" },
            },
          ],
        }],
        max_tokens: 400,
      }),
    });

    if (!visionResponse.ok) throw new Error("فشل تحليل الصور");

    const visionResult = await visionResponse.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const description = visionResult.choices?.[0]?.message?.content || "";

    const prompt = `Professional fashion photography: ${description}

Create a realistic, high-quality fashion photograph showing the person from Image 1 wearing the exact outfit from Image 2. Maintain the facial features, skin tone, and characteristics of the person from Image 1. Show the complete outfit from Image 2 on this person. Professional studio lighting, editorial quality, fashion magazine style. No text, no watermarks.`;

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
        size: "1024x1024",
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

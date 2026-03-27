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

    const { personImage, garmentImage } = await req.json() as {
      personImage: string;
      garmentImage: string;
    };

    if (!personImage || !garmentImage) {
      return new Response(JSON.stringify({ error: "يرجى رفع صورة الشخص والملابس" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const person = dataUrlToBase64(personImage);
    const garment = dataUrlToBase64(garmentImage);

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
              text: `Analyze these two fashion images for a virtual try-on composition.

Image 1 (Person): The person who will try on the clothing.
Image 2 (Garment): The clothing item to try on.

Describe in precise detail:
1. The person in Image 1: body type, height impression, skin tone, hair (color, length, style), face features, current pose/stance
2. The garment in Image 2: exact clothing type, color(s), fabric appearance, design details (neckline, sleeves, length, patterns, embellishments), style (casual/formal/sporty)
3. Suggested natural pose for the try-on result

Be very specific - this will be used to generate a photorealistic virtual try-on image.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${person.mimeType};base64,${person.base64}`, detail: "high" },
            },
            {
              type: "image_url",
              image_url: { url: `data:${garment.mimeType};base64,${garment.base64}`, detail: "high" },
            },
          ],
        }],
        max_tokens: 450,
      }),
    });

    if (!visionResponse.ok) throw new Error("فشل تحليل الصور");

    const visionResult = await visionResponse.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const description = visionResult.choices?.[0]?.message?.content || "";

    const prompt = `Professional fashion virtual try-on photograph: ${description}

Show the exact same person from Image 1 wearing the exact garment from Image 2. The garment should fit naturally on the person's body. Maintain all physical characteristics of the person. Clean neutral background. Professional fashion photography lighting. Full body or three-quarter view showing the complete outfit. High resolution, editorial quality fashion photograph. No text, no watermarks.`;

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

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

    const { visualPrompt, cameraAngle, subjectImages, aspectRatio } = await req.json() as {
      visualPrompt: string;
      cameraAngle?: string;
      subjectImages?: Array<{ base64: string; mimeType: string; name: string }>;
      aspectRatio?: string;
    };

    if (!visualPrompt?.trim()) {
      return new Response(JSON.stringify({ error: "يرجى تقديم وصف المشهد" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ratio = aspectRatio || "9:16";
    const dalleSize = ratio === "9:16" ? "1024x1792" : "1792x1024";

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
                { type: "text", text: "Describe the fashion subject in 10 words max for DALL-E prompt." },
                { type: "image_url", image_url: { url: `data:${subjectImages[0].mimeType};base64,${subjectImages[0].base64}`, detail: "low" } },
              ],
            }],
            max_tokens: 40,
          }),
        });
        if (visionResponse.ok) {
          const vr = await visionResponse.json() as { choices: Array<{ message: { content: string } }> };
          subjectDesc = vr.choices?.[0]?.message?.content || "";
        }
      } catch { /* continue */ }
    }

    let prompt = visualPrompt;
    if (cameraAngle) prompt = `${cameraAngle}: ${prompt}`;
    if (subjectDesc) prompt = `${subjectDesc}. ${prompt}`;
    prompt += ". Professional fashion photography, high quality, editorial style, no text.";
    prompt = prompt.slice(0, 900);

    const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: dalleSize,
        quality: "standard",
        response_format: "b64_json",
      }),
    });

    if (!dalleResponse.ok) {
      const err = await dalleResponse.text();
      console.error("DALL-E error:", err);
      throw new Error("فشل توليد صورة المشهد");
    }

    const dalleResult = await dalleResponse.json() as {
      data: Array<{ b64_json: string; revised_prompt?: string }>;
    };

    const b64 = dalleResult.data?.[0]?.b64_json;
    if (!b64) throw new Error("لم تصل الصورة");

    return new Response(JSON.stringify({
      image: {
        base64: b64,
        mimeType: "image/png",
        name: `scene-${Date.now()}.png`,
      },
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

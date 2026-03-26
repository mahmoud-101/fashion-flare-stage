import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_CAPTIONS: Record<string, Record<string, string[]>> = {
  instagram: {
    default: [
      `✨ {product} وصل أخيراً!\n\nاللي كنتي تنتظريه طول الوقت جاء — تصميم راقي، جودة ما تقدرين ترفضيها.\n\n🛍️ اطلبي الآن قبل نفاد المخزون\n⚡ شحن سريع لكل مكان\n\n{hashtags}`,
      `{product} — لأنك تستاهلين الأفضل 🌟\n\n{desc}\n\nاضغطي اللينك في البايو للطلب 👆\n\n{hashtags}`,
      `💫 تشكيلتنا الجديدة من {product} الآن متاحة!\n\n{desc}\n\n✅ جودة ممتازة\n✅ أسعار منافسة\n✅ شحن سريع\n\n{hashtags}`,
    ],
  },
  tiktok: {
    default: [
      `{product} 🔥 فيديو لازم تشوفيه!\n\n{desc}\n\nكوّدي في البايو\n\n{hashtags}`,
      `لو بتدوري على {product} — لقيتيه هنا 👇\n\n{desc}\n\n🎵 شاركيه مع صحبتك\n\n{hashtags}`,
      `الحقي العرض قبل ما يخلص ⏰\n\n{product} بسعر خاص!\n{desc}\n\n{hashtags}`,
    ],
  },
  facebook: {
    default: [
      `🆕 {product} — وصل جديدنا!\n\n{desc}\n\nللاستفسار والطلب: راسلينا مباشرة ✉️\n\n{hashtags}`,
      `عرض خاص على {product}!\n\n{desc}\n\n🔥 محدود — لا تفوّتيه\n📦 شحن لكل مكان\n\n{hashtags}`,
      `{product} — تصميم عصري يجمع بين الأناقة والراحة 💎\n\n{desc}\n\nسجّلي طلبك الآن في التعليقات أو راسلينا\n\n{hashtags}`,
    ],
  },
};

function generateHashtags(product: string, platform: string): string {
  const base = ["#فاشون", "#موضة", "#ستايل", "#أزياء"];
  const platformTags: Record<string, string[]> = {
    instagram: ["#instafashion", "#fashionista", "#ootd"],
    tiktok: ["#fyp", "#foryou", "#trending"],
    facebook: ["#تسوق", "#عروض", "#أزياء_نسائية"],
  };
  const tags = [...base, ...(platformTags[platform] || [])];
  return tags.slice(0, 5).join(" ");
}

function generateCaptions(product: string, description: string, platform: string): string[] {
  const plat = platform.toLowerCase();
  const templates = PLATFORM_CAPTIONS[plat]?.default || PLATFORM_CAPTIONS.instagram.default;
  const hashtags = generateHashtags(product, plat);
  const desc = description || `منتج فاشون راقي بتصميم عصري يناسب كل المناسبات`;

  return templates.map((template) =>
    template
      .replace(/{product}/g, product)
      .replace(/{desc}/g, desc)
      .replace(/{hashtags}/g, hashtags)
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("public_demo_requests")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", `${today}T00:00:00Z`);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({
          error: "RATE_LIMIT",
          message: "وصلت للحد اليومي. سجّل مجاناً للحصول على 3 توليدات يومياً!",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { product, description, platform } = body;

    if (!product || typeof product !== "string" || product.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "INVALID_INPUT", message: "اسم المنتج مطلوب" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("public_demo_requests").insert({
      ip_address: ip,
      product: product.trim().slice(0, 200),
      platform: platform || "instagram",
    });

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    let captions: string[] = [];

    if (openaiKey) {
      try {
        const platformName = platform === "tiktok" ? "تيك توك" : platform === "facebook" ? "فيسبوك" : "إنستجرام";
        const prompt = `أنت خبير تسويق محتوى عربي متخصص في الفاشون والأزياء.\n\nاكتب 3 كابشنات تسويقية احترافية باللغة العربية (مصري عامي) لـ:\nالمنتج: ${product}\n${description ? `الوصف: ${description}` : ""}\nالمنصة: ${platformName}\n\nالشروط:\n- كل كابشن مختلف في الأسلوب والهدف\n- استخدم إيموجيز مناسبة\n- أضف هاشتاجات عربية في النهاية\n- اجعلها جذابة وتحفّز على الشراء\n\nأرجع JSON بهذا الشكل:\n{"captions": ["كابشن 1", "كابشن 2", "كابشن 3"]}`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1000,
            response_format: { type: "json_object" },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const parsed = JSON.parse(data.choices[0].message.content);
          if (parsed.captions && Array.isArray(parsed.captions)) {
            captions = parsed.captions;
          }
        }
      } catch {
      }
    }

    if (captions.length === 0) {
      captions = generateCaptions(product.trim(), description?.trim() || "", platform || "instagram");
    }

    return new Response(
      JSON.stringify({ captions, generated: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "UNKNOWN", message: "حصل خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

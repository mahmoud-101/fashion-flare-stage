import { useState } from "react";
import { Search, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export type Template = {
  id: string;
  nameAr: string;
  category: string;
  occasion: string;
  platform: "instagram" | "tiktok" | "facebook" | "twitter";
  type: "caption" | "story" | "ad" | "reel_script";
  content: string;
};

const templates: Template[] = [
  // رمضان
  { id: "r1", nameAr: "عرض رمضان كريم", category: "عروض", occasion: "رمضان", platform: "instagram", type: "caption", content: "🌙 رمضان كريم!\nخصم {discount}% على كل القطع الجديدة\nالعرض محدود — لا تفوّتها 🔥\n\n#رمضان #تخفيضات #فاشون #{brand}" },
  { id: "r2", nameAr: "ستوري إفطار أنيق", category: "ستوري", occasion: "رمضان", platform: "instagram", type: "story", content: "✨ إطلالة الإفطار لازم تكون مميزة\nاكتشف تشكيلتنا الجديدة\n🛒 اسحب لفوق" },
  { id: "r3", nameAr: "ريلز رمضان", category: "ريلز", occasion: "رمضان", platform: "tiktok", type: "reel_script", content: "🎬 مشهد 1: منتج يظهر بإضاءة رمضانية دافئة\n🎬 مشهد 2: عارضة بإطلالة رمضانية أنيقة\n🎬 مشهد 3: عرض السعر مع خصم رمضان\n🎵 موسيقى: هادئة شرقية" },
  { id: "r4", nameAr: "إعلان سحور ستايل", category: "إعلان", occasion: "رمضان", platform: "facebook", type: "ad", content: "🌙 سحور بأناقة!\nتشكيلة رمضان وصلت 🎉\nقطع مريحة وأنيقة تناسب سهراتك\n\n✅ توصيل سريع\n✅ استبدال مجاني\n\n🛒 تسوّق الآن" },
  
  // العيد
  { id: "e1", nameAr: "عرض العيد", category: "عروض", occasion: "العيد", platform: "instagram", type: "caption", content: "🎉 كل عام وأنتم بخير!\nإطلالة العيد جاهزة؟ 👗\nخصم {discount}% على كل المجموعة\n\n#عيد_سعيد #فاشون #ستايل #{brand}" },
  { id: "e2", nameAr: "ستوري إطلالة العيد", category: "ستوري", occasion: "العيد", platform: "instagram", type: "story", content: "🌸 إطلالة العيد من {brand}\nتشكيلة حصرية — كمية محدودة\n⬆️ اسحب لفوق للتسوق" },
  { id: "e3", nameAr: "إعلان عيد الفطر", category: "إعلان", occasion: "العيد", platform: "facebook", type: "ad", content: "عيد سعيد 🎊\nجهّز إطلالتك مع {brand}\n\n🎁 هدية مجانية مع كل طلب فوق 300 ر.س\n📦 توصيل خلال 24 ساعة\n\nتسوّق الآن 👇" },
  
  // بلاك فرايدي
  { id: "b1", nameAr: "بلاك فرايدي بوست", category: "عروض", occasion: "بلاك فرايدي", platform: "instagram", type: "caption", content: "🖤 BLACK FRIDAY\nأقوى عروض السنة وصلت! 🔥\nخصومات تصل لـ {discount}%\n\nالعرض لمدة محدودة ⏰\n\n#بلاك_فرايدي #تخفيضات #{brand}" },
  { id: "b2", nameAr: "إعلان بلاك فرايدي", category: "إعلان", occasion: "بلاك فرايدي", platform: "facebook", type: "ad", content: "🖤 بلاك فرايدي = أكبر خصم في السنة\n\n⚡ خصم {discount}% على كل شيء\n🚚 شحن مجاني\n🔄 استرجاع مجاني\n\nالعرض ينتهي قريباً — تسوّق الآن!" },
  { id: "b3", nameAr: "ريلز بلاك فرايدي", category: "ريلز", occasion: "بلاك فرايدي", platform: "tiktok", type: "reel_script", content: "🎬 مشهد 1: شاشة سوداء + نص 'BLACK FRIDAY'\n🎬 مشهد 2: منتجات تظهر بسرعة واحد تلو الآخر\n🎬 مشهد 3: السعر قبل وبعد الخصم\n🎬 مشهد 4: CTA — 'تسوّق الآن قبل ما تخلص'\n🎵 موسيقى: إيقاع سريع حماسي" },
  
  // يومي
  { id: "d1", nameAr: "وصل حديثاً", category: "يومي", occasion: "يومي", platform: "instagram", type: "caption", content: "✨ وصل حديثاً!\nقطعة لازم تكون في دولابك 👗\n\nالسعر: {price} ر.س\n📦 توصيل لكل المدن\n\n#جديد #فاشون #ستايل #{brand}" },
  { id: "d2", nameAr: "نصيحة ستايل", category: "يومي", occasion: "يومي", platform: "instagram", type: "caption", content: "💡 نصيحة ستايل اليوم:\n{tip}\n\nأنتِ إيه رأيك؟ شاركينا في الكومنتات 👇\n\n#نصائح_ستايل #فاشون #{brand}" },
  { id: "d3", nameAr: "سؤال تفاعلي", category: "يومي", occasion: "يومي", platform: "instagram", type: "story", content: "🤔 أيهما تفضلين؟\n\nA) القطعة البيضاء\nB) القطعة السوداء\n\nصوّتي في الستوري! 🗳️" },
  { id: "d4", nameAr: "بوست شهادة عميل", category: "يومي", occasion: "يومي", platform: "instagram", type: "caption", content: "❤️ رأي عميلتنا {name}:\n\"{review}\"\n\nشكراً لثقتك الغالية! 🙏\n\n#آراء_العملاء #ثقة #{brand}" },
  { id: "d5", nameAr: "ريلز يومي - تنسيق", category: "ريلز", occasion: "يومي", platform: "tiktok", type: "reel_script", content: "🎬 مشهد 1: قطعة واحدة على هانجر\n🎬 مشهد 2: 3 طرق تنسيق مختلفة\n🎬 مشهد 3: أفضل تنسيق مع السعر\n🎵 موسيقى: ترند اليوم" },
  { id: "d6", nameAr: "إعلان يومي", category: "إعلان", occasion: "يومي", platform: "facebook", type: "ad", content: "👗 أناقتك تبدأ من هنا\n\nتشكيلة {brand} الجديدة متوفرة الآن\n\n✅ أقمشة عالية الجودة\n✅ تصاميم عصرية\n✅ أسعار مناسبة\n\n🛒 تسوّقي الآن واستمتعي بشحن مجاني" },
  
  // اليوم الوطني
  { id: "n1", nameAr: "اليوم الوطني السعودي", category: "عروض", occasion: "اليوم الوطني", platform: "instagram", type: "caption", content: "🇸🇦 عروض اليوم الوطني!\nخصم 93% على قطع مختارة 💚\n\nلأن أناقتك جزء من فخرنا 🌟\n\n#اليوم_الوطني #هي_لنا_دار #{brand}" },
  { id: "n2", nameAr: "ريلز اليوم الوطني", category: "ريلز", occasion: "اليوم الوطني", platform: "tiktok", type: "reel_script", content: "🎬 مشهد 1: ألوان العلم السعودي + منتجات\n🎬 مشهد 2: إطلالات بالأخضر والأبيض\n🎬 مشهد 3: عرض خاص باليوم الوطني\n🎵 موسيقى: وطنية حماسية" },
  
  // الصيف
  { id: "s1", nameAr: "تشكيلة الصيف", category: "عروض", occasion: "الصيف", platform: "instagram", type: "caption", content: "☀️ تشكيلة الصيف وصلت!\nألوان مشرقة وأقمشة خفيفة 🌴\n\nجاهزة للبحر؟ 🏖️\n\n#صيف #فاشون #ستايل_صيفي #{brand}" },
  { id: "s2", nameAr: "إعلان صيفي", category: "إعلان", occasion: "الصيف", platform: "facebook", type: "ad", content: "🌞 صيفك أحلى مع {brand}\n\nقطع صيفية مريحة وأنيقة\n🏖️ تناسب البحر والسفر والسهرات\n\n✅ خصم 30% على أول طلب\n📦 توصيل مجاني\n\nتسوّقي الآن!" },
];

const occasions = ["الكل", "رمضان", "العيد", "بلاك فرايدي", "يومي", "اليوم الوطني", "الصيف"];
const types = ["الكل", "caption", "story", "ad", "reel_script"];
const typeLabels: Record<string, string> = { caption: "كابشن", story: "ستوري", ad: "إعلان", reel_script: "ريلز" };

interface TemplatesLibraryProps {
  onSelect?: (template: Template) => void;
}

export function TemplatesLibrary({ onSelect }: TemplatesLibraryProps) {
  const [search, setSearch] = useState("");
  const [occasion, setOccasion] = useState("الكل");
  const [type, setType] = useState("الكل");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = templates.filter((t) => {
    if (occasion !== "الكل" && t.occasion !== occasion) return false;
    if (type !== "الكل" && t.type !== type) return false;
    if (search && !t.nameAr.includes(search) && !t.content.includes(search)) return false;
    return true;
  });

  const handleCopy = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    toast({ title: "تم النسخ ✅", description: "القالب تم نسخه للحافظة" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="ابحث في القوالب..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 bg-surface-2 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Occasion filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {occasions.map((o) => (
          <button
            key={o}
            onClick={() => setOccasion(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              occasion === o
                ? "btn-gold"
                : "glass-card border border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {o}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              type === t
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "الكل" ? "الكل" : typeLabels[t] || t}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="text-xs text-muted-foreground">{filtered.length} قالب</div>

      <div className="grid sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="glass-card border border-border/40 rounded-xl p-4 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-foreground">{template.nameAr}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {template.occasion}
                  </span>
                  <span className="text-[10px] bg-surface-2 text-muted-foreground px-2 py-0.5 rounded-full">
                    {typeLabels[template.type]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{template.platform}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleCopy(template)}
                  className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  title="نسخ"
                >
                  {copiedId === template.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {onSelect && (
                  <button
                    onClick={() => onSelect(template)}
                    className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary hover:bg-primary/25 transition-colors"
                    title="استخدم"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mt-2 max-h-24 overflow-hidden">
              {template.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

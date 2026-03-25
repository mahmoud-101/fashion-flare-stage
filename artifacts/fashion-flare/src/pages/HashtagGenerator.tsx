import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Hash, Copy, Check, RefreshCw, Sparkles, Tag, AlertTriangle, BookmarkPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePageTitle } from "@/components/AccessibilityHelpers";
import { useCanGenerate } from "@/hooks/useCanGenerate";
import { UpgradeModal } from "@/components/UpgradeModal";
import { callEdgeFunction } from "@/lib/callEdgeFunction";

const PRODUCT_TYPES = [
  "فساتين", "عبايات", "بلايز", "بناطيل", "جاكيتات", "حقائب", "أحذية", "إكسسوارات",
  "ملابس كاجوال", "ملابس رسمية", "ملابس رياضية", "ملابس أطفال",
];

const DIALECTS = [
  { id: "egyptian", label: "مصري 🇪🇬" },
  { id: "saudi", label: "سعودي 🇸🇦" },
  { id: "emirati", label: "إماراتي 🇦🇪" },
  { id: "gulf", label: "خليجي عام" },
  { id: "formal", label: "فصحى" },
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "snapchat", label: "Snapchat" },
  { id: "all", label: "كل المنصات" },
];

interface HashtagGroup {
  label: string;
  tags: string[];
  color: string;
}

const HashtagGenerator = () => {
  usePageTitle("مولّد الهاشتاجات");
  const { user } = useAuth();
  const { checkAndProceed, showUpgradeModal, setShowUpgradeModal, limitType, currentUsed, currentLimit } = useCanGenerate();

  const [brandName, setBrandName] = useState("");
  const [productType, setProductType] = useState("");
  const [dialect, setDialect] = useState("egyptian");
  const [platform, setPlatform] = useState("instagram");
  const [customKeyword, setCustomKeyword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [groups, setGroups] = useState<HashtagGroup[]>([]);
  const [copiedGroup, setCopiedGroup] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);

  const handleGenerate = () => {
    if (!productType && !customKeyword) {
      toast.error("اختار نوع المنتج أو اكتب كيوورد");
      return;
    }

    checkAndProceed("content_generation", async () => {
    setIsGenerating(true);
    setGroups([]);

    try {
      const prompt = `أنت خبير سوشيال ميديا متخصص في الموضة والفاشون العربي.

اكتب هاشتاجات متخصصة ومتنوعة لـ:
- البراند: ${brandName || "براند فاشون"}
- المنتج: ${productType || customKeyword}
- اللهجة/السوق: ${dialect}
- المنصة: ${platform}

اعمل 5 مجموعات من الهاشتاجات:
1. هاشتاجات المنتج المباشرة (10 هاشتاجات)
2. هاشتاجات الفاشون العربي العامة (8 هاشتاجات)  
3. هاشتاجات السوق المستهدف (${dialect}) (8 هاشتاجات)
4. هاشتاجات ترند حالي (6 هاشتاجات)
5. هاشتاجات البراند الشخصية (5 هاشتاجات)

الشروط:
- كل الهاشتاجات تبدأ بـ #
- مزيج من العربي والإنجليزي
- متنوعة بين شائعة ومتخصصة
- مناسبة للمنصة المختارة

الرد يكون JSON بهذا الشكل بالضبط (بدون أي نص إضافي):
{"groups":[{"label":"هاشتاجات المنتج","tags":["#tag1","#tag2"],"color":"blue"},{"label":"هاشتاجات الفاشون العربي","tags":["#tag1"],"color":"gold"},{"label":"هاشتاجات السوق","tags":["#tag1"],"color":"green"},{"label":"هاشتاجات الترند","tags":["#tag1"],"color":"purple"},{"label":"هاشتاجات البراند","tags":["#tag1"],"color":"red"}]}`;

      const data = await callEdgeFunction("generate-content", {
        prompt,
        userId: user?.id,
        type: "hashtags",
      });

      let result = (data as Record<string, unknown>)?.content || (data as Record<string, unknown>)?.result || "";
      if (typeof result === "object") result = JSON.stringify(result);

      const jsonMatch = (result as string).match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.groups) {
          setGroups(parsed.groups);
        } else {
          throw new Error("تنسيق غير صحيح");
        }
      } else {
        throw new Error("لم تعود هاشتاجات من الذكاء الاصطناعي");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "فشل التوليد";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
    });
  };

  const buildFallback = (product: string, brand: string, dial: string): HashtagGroup[] => {
    const p = product.replace(/\s/g, "");
    const b = (brand || "فاشون").replace(/\s/g, "");
    const markets: Record<string, string[]> = {
      egyptian: ["#مصر", "#القاهرة", "#موضة_مصر", "#فاشون_مصري", "#ستايل_مصري", "#شوبينج_مصر", "#اونلاين_مصر", "#تسوق_مصر"],
      saudi: ["#السعودية", "#الرياض", "#موضة_السعودية", "#فاشون_خليجي", "#ستايل_خليجي", "#جدة", "#تسوق_السعودية", "#شوبينج_سعودي"],
      emirati: ["#الامارات", "#دبي", "#موضة_الامارات", "#فاشون_اماراتي", "#دبي_شوبينج", "#ابوظبي", "#ستايل_اماراتي", "#تسوق_الامارات"],
      gulf: ["#الخليج", "#موضة_خليجية", "#فاشون_خليجي", "#ستايل_خليجي", "#تسوق_خليجي", "#خليجيات", "#موضة_عربية", "#فاشون_عربي"],
      formal: ["#الموضة_العربية", "#الأزياء", "#أناقة", "#موضة", "#ستايل", "#فاشون_عربي", "#تسوق", "#أزياء_عربية"],
    };

    return [
      {
        label: "هاشتاجات المنتج",
        tags: [`#${p}`, `#${p}_اونلاين`, `#${p}_احترافي`, `#تصميم_${p}`, `#${p}_جديد`, `#${p}_راقي`, `#${p}_موضه`, `#افضل_${p}`, `#${p}_عصري`, `#${p}_كوليكشن`],
        color: "blue",
      },
      {
        label: "هاشتاجات الفاشون العربي",
        tags: ["#فاشون_عربي", "#موضة_عربية", "#ستايل_عربي", "#اناقة", "#فاشون", "#موضه", "#لوك", "#اوت_فيت", "#fashion_arabic", "#arabfashion"],
        color: "gold",
      },
      {
        label: "هاشتاجات السوق",
        tags: markets[dial] || markets.egyptian,
        color: "green",
      },
      {
        label: "هاشتاجات الترند",
        tags: ["#ترند", "#viral", "#trending", "#new_collection", "#كوليكشن_جديد", "#summer2025"],
        color: "purple",
      },
      {
        label: "هاشتاجات البراند",
        tags: [`#${b}`, `#${b}_store`, `#${b}_fashion`, `#${b}_official`, `#شوبي_${b}`],
        color: "red",
      },
    ];
  };

  const copyGroup = (group: HashtagGroup) => {
    navigator.clipboard.writeText(group.tags.join(" "));
    setCopiedGroup(group.label);
    toast.success("تم النسخ!");
    setTimeout(() => setCopiedGroup(null), 2000);
  };

  const copyAll = () => {
    const all = groups.flatMap((g) => g.tags).join(" ");
    navigator.clipboard.writeText(all);
    setCopiedAll(true);
    toast.success(`تم نسخ ${groups.flatMap((g) => g.tags).length} هاشتاج!`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSaveToLibrary = async () => {
    if (!user || groups.length === 0) return;
    const allTags = groups.flatMap((g) => g.tags).join(" ");
    const label = brandName || productType || customKeyword || "هاشتاجات";
    const { error } = await supabase.from("saved_content").insert({
      user_id: user.id,
      title: `هاشتاجات ${label}`,
      content: allTags,
      content_type: "hashtags",
      platform,
      status: "draft",
    });
    if (error) { toast.error("حصل خطأ أثناء الحفظ"); return; }
    setSavedToLibrary(true);
    toast.success("تم الحفظ في مكتبتك! 📚");
    setTimeout(() => setSavedToLibrary(false), 3000);
  };

  const colorMap: Record<string, string> = {
    blue: "border-blue-400/30 bg-blue-400/5 text-blue-400",
    gold: "border-primary/30 bg-primary/5 text-primary",
    green: "border-green-400/30 bg-green-400/5 text-green-400",
    purple: "border-purple-400/30 bg-purple-400/5 text-purple-400",
    red: "border-rose-400/30 bg-rose-400/5 text-rose-400",
  };

  const tagColorMap: Record<string, string> = {
    blue: "bg-blue-400/10 text-blue-300 border-blue-400/20",
    gold: "bg-primary/10 text-primary border-primary/20",
    green: "bg-green-400/10 text-green-300 border-green-400/20",
    purple: "bg-purple-400/10 text-purple-300 border-purple-400/20",
    red: "bg-rose-400/10 text-rose-300 border-rose-400/20",
  };

  const totalTags = groups.flatMap((g) => g.tags).length;

  return (
    <DashboardLayout title="مولّد الهاشتاجات" subtitle="هاشتاجات متخصصة في الفاشون العربي بالذكاء الاصطناعي">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl btn-gold flex items-center justify-center">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">مولّد الهاشتاجات</h1>
            <p className="text-sm text-muted-foreground">هاشتاجات متخصصة في الفاشون العربي — مصنفة وجاهزة للنسخ</p>
          </div>
        </div>

        <div className="glass-card gold-border rounded-2xl p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">اسم البراند (اختياري)</label>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="مثال: Zara Egypt"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary/60 transition-colors"
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">كيوورد مخصص (اختياري)</label>
              <input
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder="مثال: صيف 2025"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary/60 transition-colors"
                dir="rtl"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-foreground mb-3 block">نوع المنتج</label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_TYPES.map((p) => (
                <button
                  key={p}
                  onClick={() => setProductType(productType === p ? "" : p)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                    productType === p
                      ? "btn-gold border-transparent"
                      : "glass-card gold-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-foreground mb-3 block">اللهجة / السوق</label>
              <div className="flex flex-wrap gap-2">
                {DIALECTS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDialect(d.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                      dialect === d.id
                        ? "btn-gold border-transparent"
                        : "glass-card gold-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-foreground mb-3 block">المنصة</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                      platform === p.id
                        ? "btn-gold border-transparent"
                        : "glass-card gold-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!productType && !customKeyword)}
            className="btn-gold w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                جاري توليد الهاشتاجات...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                ولّد الهاشتاجات
              </>
            )}
          </button>
        </div>

        {groups.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">{totalTags} هاشتاج في {groups.length} مجموعات</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToLibrary}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    savedToLibrary ? "bg-green-500/20 border-green-500/40 text-green-400" : "glass-card gold-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {savedToLibrary ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                  {savedToLibrary ? "تم الحفظ!" : "حفظ"}
                </button>
                <button
                  onClick={copyAll}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    copiedAll ? "btn-gold border-transparent" : "glass-card gold-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedAll ? "تم النسخ!" : "نسخ الكل"}
                </button>
              </div>
            </div>

            {groups.map((group) => (
              <div
                key={group.label}
                className={`glass-card rounded-2xl p-5 border ${colorMap[group.color] || colorMap.gold}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    <span className="font-bold text-sm">{group.label}</span>
                    <span className="text-xs opacity-70">({group.tags.length})</span>
                  </div>
                  <button
                    onClick={() => copyGroup(group)}
                    className="flex items-center gap-1.5 text-xs font-medium opacity-70 hover:opacity-100 transition-opacity"
                  >
                    {copiedGroup === group.label ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedGroup === group.label ? "تم!" : "نسخ"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        navigator.clipboard.writeText(tag);
                        toast.success("تم نسخ الهاشتاج!");
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all hover:scale-105 ${
                        tagColorMap[group.color] || tagColorMap.gold
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="glass-card rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                💡 <strong className="text-foreground">نصيحة:</strong> استخدم 5-10 هاشتاجات لكل بوست على Instagram، و3-5 على TikTok. راوح بين المجموعات للوصول لجمهور أوسع.
              </p>
            </div>
          </div>
        )}
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        limitType={limitType}
        currentUsed={currentUsed}
        currentLimit={currentLimit}
      />
    </DashboardLayout>
  );
};

export default HashtagGenerator;

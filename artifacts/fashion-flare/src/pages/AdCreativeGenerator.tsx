import { useState, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Upload, Wand2, Download, Sparkles, X, Image as ImageIcon, Loader2,
  Copy, Layers, Palette, Type, Zap, Crown, Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { callEdgeFunction } from "@/lib/callEdgeFunction";
import { useAuth } from "@/contexts/AuthContext";
import { useCanGenerate } from "@/hooks/useCanGenerate";
import { UpgradeModal } from "@/components/UpgradeModal";
import AdScoreCard from "@/components/studio/AdScoreCard";

interface ProductImage {
  base64: string;
  mimeType: string;
  preview: string;
}

interface AdCreative {
  imageUrl: string;
  score: number;
}

const STYLES = [
  { value: "modern", label: "حديث", icon: Zap, color: "from-blue-500 to-cyan-500" },
  { value: "luxury", label: "فاخر", icon: Crown, color: "from-amber-500 to-yellow-600" },
  { value: "minimal", label: "مينيمال", icon: Layers, color: "from-gray-400 to-gray-600" },
  { value: "bold", label: "جريء", icon: Star, color: "from-red-500 to-pink-500" },
  { value: "playful", label: "مرح", icon: Sparkles, color: "from-purple-500 to-pink-400" },
  { value: "dark", label: "داكن", icon: Palette, color: "from-gray-700 to-gray-900" },
] as const;

const SIZES = [
  { value: "1080x1080", label: "فيد انستقرام", ratio: "1:1" },
  { value: "1080x1920", label: "ستوري / ريلز", ratio: "9:16" },
  { value: "1200x628", label: "فيسبوك / لنكدإن", ratio: "1.91:1" },
  { value: "1080x1350", label: "بورتريه انستقرام", ratio: "4:5" },
];

const AdCreativeGenerator = () => {
  const { user } = useAuth();
  const { checkAndProceed, showUpgradeModal, setShowUpgradeModal, limitType, currentUsed, currentLimit } = useCanGenerate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productImage, setProductImage] = useState<ProductImage | null>(null);
  const [headline, setHeadline] = useState("");
  const [cta, setCta] = useState("تسوّق الآن");
  const [price, setPrice] = useState("");
  const [style, setStyle] = useState("modern");
  const [size, setSize] = useState("1080x1080");
  const [variations, setVariations] = useState(2);
  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("يرجى رفع صورة");
    if (file.size > 10 * 1024 * 1024) return toast.error("الحد الأقصى 10MB");
    const base64 = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(file);
    });
    setProductImage({
      base64: base64.split(",")[1],
      mimeType: file.type,
      preview: base64,
    });
    setCreatives([]);
  }, []);

  const handleGenerate = async () => {
    if (!productImage) return toast.error("ارفع صورة المنتج أولاً");

    checkAndProceed("image_generation", async () => {
      setIsGenerating(true);
      setCreatives([]);
      try {
        // Fetch brand info
        let brandName = "";
        let brandColor = "";
        if (user) {
          const { data: brand } = await supabase
            .from("brands")
            .select("name, primary_color")
            .eq("user_id", user.id)
            .maybeSingle();
          if (brand) {
            brandName = brand.name;
            brandColor = brand.primary_color || "";
          }
        }

        const data = await callEdgeFunction("generate-ad-creative", {
          productImage: { base64: productImage.base64, mimeType: productImage.mimeType },
          headline: headline || undefined,
          cta: cta || undefined,
          price: price || undefined,
          brandName: brandName || undefined,
          brandColor: brandColor || undefined,
          style,
          size,
          variations,
        });

        const creatives = (data as Record<string, unknown>).creatives as AdCreative[] || [];
        setCreatives(creatives);
        toast.success(`✨ تم توليد ${creatives.length} إعلانات!`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "فشل التوليد");
      } finally {
        setIsGenerating(false);
      }
    });
  };

  const handleDownload = (url: string, idx: number) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `moda-ad-creative-${idx + 1}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("تم تحميل الإعلان");
  };

  return (
    <DashboardLayout title="مولّد الإعلانات" subtitle="ولّد إعلانات احترافية بالذكاء الاصطناعي في ثواني">
      <div className="max-w-7xl space-y-6">

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Panel — Controls */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload */}
            <div className="glass-card gold-border rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" /> صورة المنتج
              </h3>
              {productImage ? (
                <div className="relative group">
                  <img src={productImage.preview} alt="Product" className="w-full h-48 object-contain rounded-xl bg-surface-2" />
                  <button
                    onClick={() => { setProductImage(null); setCreatives([]); }}
                    className="absolute top-2 left-2 bg-black/60 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"}`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  <Upload className="w-8 h-8 text-primary/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">اسحب صورة المنتج أو اضغط للرفع</p>
                </div>
              )}
            </div>

            {/* Text inputs */}
            <div className="glass-card border border-border/30 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" /> نصوص الإعلان
              </h3>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">العنوان الرئيسي</label>
                <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="مثال: أناقة بلا حدود" className="w-full bg-surface-2 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">السعر</label>
                  <input value={price} onChange={e => setPrice(e.target.value)} placeholder="199 ر.س" className="w-full bg-surface-2 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">زرار CTA</label>
                  <input value={cta} onChange={e => setCta(e.target.value)} placeholder="تسوّق الآن" className="w-full bg-surface-2 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                </div>
              </div>
            </div>

            {/* Style */}
            <div className="glass-card border border-border/30 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> أسلوب التصميم
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {STYLES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${style === s.value ? "border-primary bg-primary/10" : "border-border/30 hover:border-primary/30"}`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size + Variations */}
            <div className="glass-card border border-border/30 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground">المقاس والنسخ</h3>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">مقاس الإعلان</label>
                <div className="grid grid-cols-2 gap-2">
                  {SIZES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setSize(s.value)}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${size === s.value ? "border-primary bg-primary/10 text-primary" : "border-border/30 text-muted-foreground hover:border-primary/30"}`}
                    >
                      {s.label} <span className="text-muted-foreground">({s.ratio})</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">عدد النسخ: {variations}</label>
                <input type="range" min={1} max={4} value={variations} onChange={e => setVariations(Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" />
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !productImage}
              className="w-full btn-gold py-4 rounded-2xl text-base font-black flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> جاري التوليد...</>
              ) : (
                <><Wand2 className="w-5 h-5" /> ولّد {variations} إعلان{variations > 1 ? "ات" : ""}</>
              )}
            </button>
          </div>

          {/* Right Panel — Results */}
          <div className="lg:col-span-3">
            {creatives.length === 0 && !isGenerating ? (
              <div className="glass-card border border-border/30 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">مولّد الإعلانات بالذكاء الاصطناعي</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  ارفع صورة منتجك، أدخل النصوص، واختر الأسلوب — الـ AI هيولد إعلانات احترافية جاهزة للنشر
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {["نص عربي RTL", "تصميم احترافي", "CTA واضح", "ألوان البراند", "مقاسات متعددة"].map(tag => (
                    <span key={tag} className="bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {isGenerating && (
                  <div className="glass-card border border-primary/30 rounded-2xl p-8 text-center animate-pulse">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                    <p className="text-sm font-bold text-foreground">الـ AI بيصمم إعلاناتك...</p>
                    <p className="text-xs text-muted-foreground mt-1">بيحلل المنتج وبيولد تصميمات احترافية</p>
                  </div>
                )}

                <div className={`grid ${creatives.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-4`}>
                  {creatives.map((creative, idx) => (
                    <div key={idx} className="glass-card border border-border/30 rounded-2xl overflow-hidden group">
                      <div className="relative">
                        <img src={creative.imageUrl} alt={`Ad Creative ${idx + 1}`} className="w-full object-contain bg-surface-2" />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${creative.score >= 85 ? "bg-green-500/90 text-white" : creative.score >= 70 ? "bg-yellow-500/90 text-black" : "bg-red-500/90 text-white"}`}>
                            {creative.score}/100
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDownload(creative.imageUrl, idx)} className="flex-1 bg-primary text-primary-foreground py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                            <Download className="w-3.5 h-3.5" /> تحميل
                          </button>
                          <button onClick={() => { navigator.clipboard.writeText(creative.imageUrl); toast.success("تم نسخ الرابط"); }} className="bg-black/60 text-white p-2 rounded-xl">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">نسخة {idx + 1}</span>
                          <span className="text-xs text-muted-foreground">{size}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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

export default AdCreativeGenerator;

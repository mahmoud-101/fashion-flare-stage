import { useState, useRef, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Upload, Wand2, Download, RefreshCw, X, Check, Image as ImageIcon,
  Sparkles, Sun, Moon, Leaf, Waves, Flame, Zap, Camera, Palette, Type,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/callEdgeFunction";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingAnnouncer, usePageTitle } from "@/components/AccessibilityHelpers";
import { FASHION_AD_TEMPLATES } from "@/data/fashionAdTemplates";
import TextOverlayPanel from "@/components/studio/TextOverlayPanel";
import MultiSizeExport from "@/components/studio/MultiSizeExport";
import BackgroundRemoval from "@/components/studio/BackgroundRemoval";
import AdScoreCard from "@/components/studio/AdScoreCard";
import BatchVariations from "@/components/studio/BatchVariations";
import { useCanGenerate } from "@/hooks/useCanGenerate";
import { UpgradeModal } from "@/components/UpgradeModal";

// ── Auto Scenarios ──
const AUTO_SCENARIOS = [
  "Professional Hero Front View — clean studio shot, dramatic lighting, elegant background",
  "Lifestyle — a person using/wearing the product naturally in a real environment",
  "Aesthetic Flat Lay — top-down shot with complementary accessories and textures",
];

// ── Mood Presets ──
const MOODS = [
  { label: "أصلي", value: "", icon: Camera },
  { label: "أبيض مينيمال", value: "Clean, minimalist white studio aesthetic", icon: Sun },
  { label: "فاخر داكن", value: "Dramatic dark luxury with gold accents", icon: Moon },
  { label: "باستيل ناعم", value: "Soft playful pastel colors", icon: Sparkles },
  { label: "أخضر طبيعي", value: "Organic fresh natural green aesthetic", icon: Leaf },
  { label: "أزرق محيط", value: "Deep serene ocean blue tones", icon: Waves },
  { label: "ذهبي دافئ", value: "Warm, golden hour luxury lighting", icon: Flame },
  { label: "نيون سايبر", value: "Vibrant neon cyberpunk style", icon: Zap },
];

interface ProductImage {
  base64: string;
  mimeType: string;
  name: string;
  preview: string;
}

interface CampaignResult {
  scenario: string;
  image: string | null;
  description: string | null;
  isLoading: boolean;
  error: string | null;
}

interface BrandKit {
  name: string;
  primary_color: string | null;
  logo_url: string | null;
  tone: string | null;
  font: string | null;
}

const ImageStudio = () => {
  const { user } = useAuth();
  const { checkAndProceed, showUpgradeModal, setShowUpgradeModal, limitType, currentUsed, currentLimit } = useCanGenerate();
  const [mode, setMode] = useState<"auto" | "custom">("auto");
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [selectedMood, setSelectedMood] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customIdeas, setCustomIdeas] = useState(["", "", ""]);
  const [results, setResults] = useState<CampaignResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [autoBrand, setAutoBrand] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch brand kit
  useEffect(() => {
    if (!user) return;
    supabase
      .from("brands")
      .select("name, primary_color, logo_url, tone, font")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setBrandKit(data as BrandKit);
      });
  }, [user]);

  // Background removal handler
  const handleBgRemoval = (idx: number, newBase64: string, newPreview: string) => {
    setProductImages(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], base64: newBase64, preview: newPreview };
      return next;
    });
  };

  // ── Upload ──
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArr.length === 0) return toast.error("يرجى رفع صور فقط");

    const processed: ProductImage[] = [];
    for (const file of fileArr) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} أكبر من 10MB`); continue; }
      const base64 = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(file);
      });
      processed.push({
        base64: base64.split(",")[1],
        mimeType: file.type,
        name: file.name,
        preview: base64,
      });
    }
    setProductImages(prev => [...prev, ...processed]);
    setResults([]);
  }, []);

  const removeImage = (idx: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== idx));
    setResults([]);
  };

  // Build brand-enhanced prompt
  const buildPrompt = (scenario: string) => {
    let enhanced = scenario;
    if (autoBrand && brandKit) {
      if (brandKit.name) enhanced += ` — Brand: ${brandKit.name}`;
      if (brandKit.primary_color) enhanced += `, brand color: ${brandKit.primary_color}`;
      if (brandKit.tone) enhanced += `, tone: ${brandKit.tone}`;
    }
    return enhanced;
  };

  // ── Generate ──
  const handleGenerate = async () => {
    if (productImages.length === 0) return toast.error("ارفع صورة منتج واحدة على الأقل");

    const scenarios = mode === "auto"
      ? AUTO_SCENARIOS
      : customIdeas.filter(i => i.trim());

    if (scenarios.length === 0) return toast.error("اكتب فكرة واحدة على الأقل");

    checkAndProceed("image_generation", async () => {
      setIsGenerating(true);
      setResults(scenarios.map(s => ({ scenario: s, image: null, description: null, isLoading: true, error: null })));

    const images = productImages.map(p => ({ base64: p.base64, mimeType: p.mimeType }));
    const moodValue = mode === "auto" ? selectedMood : "";

    const promises = scenarios.map(async (scenario, idx) => {
      try {
        const data = await callEdgeFunction("generate-campaign-images", {
          productImages: images, scenario: buildPrompt(scenario), mood: moodValue, customPrompt,
        });
        const d = data as Record<string, unknown>;
        const img = d?.imageUrl || d?.resultImage || null;

        setResults(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], image: img as string | null, description: d.description as string || null, isLoading: false };
          return next;
        });
      } catch (err: unknown) {
        setResults(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], isLoading: false, error: err instanceof Error ? err.message : "حدث خطأ" };
          return next;
        });
      }
    });

    await Promise.all(promises);
    setIsGenerating(false);
    toast.success("✨ تم توليد الحملة!");
    }); // end checkAndProceed
  };

  const handleDownload = (image: string, label: string) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = `moda-campaign-${label.replace(/\s+/g, "-")}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("تم تحميل الصورة");
  };

  const regenerateSingle = async (idx: number) => {
    const scenario = results[idx]?.scenario;
    if (!scenario) return;

    setResults(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], isLoading: true, error: null };
      return next;
    });

    try {
      const images = productImages.map(p => ({ base64: p.base64, mimeType: p.mimeType }));
      const data = await callEdgeFunction("generate-campaign-images", {
        productImages: images, scenario: buildPrompt(scenario), mood: selectedMood, customPrompt,
      });
      const d = data as Record<string, unknown>;
      const img = d?.imageUrl || d?.resultImage;

      setResults(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], image: img as string, description: d.description as string, isLoading: false };
        return next;
      });
    } catch (err: unknown) {
      setResults(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], isLoading: false, error: err instanceof Error ? err.message : "حدث خطأ" };
        return next;
      });
    }
  };

  // Draw brand logo watermark on image
  const addLogoWatermark = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!autoBrand || !brandKit?.logo_url) return resolve(imageSrc);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.onload = () => {
          const logoSize = Math.min(img.width, img.height) * 0.12;
          const x = img.width - logoSize - 20;
          const y = img.height - logoSize - 20;
          ctx.globalAlpha = 0.5;
          ctx.drawImage(logo, x, y, logoSize, logoSize);
          ctx.globalAlpha = 1;
          resolve(canvas.toDataURL("image/png"));
        };
        logo.onerror = () => resolve(imageSrc);
        logo.src = brandKit.logo_url!;
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  const handleDownloadWithBrand = async (image: string, label: string) => {
    const finalImage = await addLogoWatermark(image);
    handleDownload(finalImage, label);
  };

  return (
    <DashboardLayout title="استوديو الحملات" subtitle="وّلد صور احترافية لحملاتك بالذكاء الاصطناعي">
      <div className="max-w-6xl space-y-6">

        {/* Mode Toggle + Brand Kit Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex justify-center flex-1">
            <div className="bg-surface-2 p-1 rounded-xl border border-border/50 flex gap-1">
              <button
                onClick={() => setMode("auto")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  mode === "auto" ? "btn-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                سيناريوهات تلقائية
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  mode === "custom" ? "btn-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                أفكار مخصصة
              </button>
            </div>
          </div>

          {/* Brand Kit Toggle */}
          {brandKit && (
            <button
              onClick={() => setAutoBrand(!autoBrand)}
              className="flex items-center gap-2 px-3 py-2 glass-card border border-border/30 rounded-xl text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
              title="تطبيق البراند Kit تلقائياً"
            >
              {autoBrand ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
              Brand Kit {autoBrand ? "✅" : "⬜"}
            </button>
          )}
        </div>

        {/* Brand Kit info */}
        {autoBrand && brandKit && (
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 text-xs text-primary">
            {brandKit.logo_url && <img src={brandKit.logo_url} alt="Logo" className="w-6 h-6 rounded-md object-cover" />}
            <span className="font-bold">{brandKit.name}</span>
            {brandKit.primary_color && (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full border border-primary/30" style={{ backgroundColor: brandKit.primary_color }} />
                {brandKit.primary_color}
              </span>
            )}
            <span className="text-muted-foreground">• البراند Kit مفعّل — اللوجو والألوان هيتطبقوا تلقائياً</span>
          </div>
        )}

        {/* Control Panel */}
        <div className="glass-card gold-border rounded-2xl p-6">
          <div className="grid lg:grid-cols-12 gap-6">

            {/* Left: Product Upload */}
            <div className="lg:col-span-4">
              <label className="text-xs font-bold text-foreground mb-3 block">صور المنتج</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all min-h-32 flex flex-col items-center justify-center gap-2 ${
                  dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                }`}
              >
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
                <Upload className="w-6 h-6 text-primary/50" />
                <p className="text-xs text-muted-foreground">اسحب وأسقط أو اضغط للرفع</p>
              </div>

              {productImages.length > 0 && (
                <div className="space-y-2 mt-3">
                  <div className="flex flex-wrap gap-2">
                    {productImages.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border/50 group">
                        <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {productImages.map((img, i) => (
                    <BackgroundRemoval
                      key={`bg-${i}`}
                      imageBase64={img.base64}
                      mimeType={img.mimeType}
                      preview={img.preview}
                      onResult={(b64, prev) => handleBgRemoval(i, b64, prev)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right: Controls */}
            <div className="lg:col-span-8 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {mode === "auto" ? "استوديو حملات السوشيال ميديا" : "استوديو الأفكار المخصصة"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mode === "auto"
                      ? "الـ AI هيولد 3 صور مختلفة لحملتك: Hero + Lifestyle + Flat Lay"
                      : "اكتب 3 أفكار وهيولد صورة لكل فكرة"}
                  </p>
                </div>
              </div>

              {/* Ad Templates */}
              <div className="bg-surface-2 p-4 rounded-xl border border-border/30">
                <label className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> قوالب إعلانات جاهزة (100)
                </label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const t = FASHION_AD_TEMPLATES.find((x) => x.id === id);
                    if (!t) return;
                    setMode("custom");
                    setCustomIdeas([t.scenario, "", ""]);
                    setCustomPrompt(t.styling || "");
                    if (t.mood) setSelectedMood(t.mood);
                    toast.success("تم تطبيق القالب ✅");
                  }}
                  className="w-full bg-transparent border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60 transition-colors"
                >
                  <option value="">اختر قالب…</option>
                  {Array.from(new Set(FASHION_AD_TEMPLATES.map((t) => t.category))).map((cat) => (
                    <optgroup key={cat} label={cat}>
                      {FASHION_AD_TEMPLATES.filter((t) => t.category === cat).map((t) => (
                        <option key={t.id} value={t.id}>{t.name_ar}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  اختر قالب وسيتم تعبئة الفكرة والأسلوب تلقائياً لتوليد أسرع.
                </p>
              </div>

              {/* Style prompt */}
              <div className="bg-surface-2 p-4 rounded-xl border border-border/30">
                <label className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> أسلوب التصميم (اختياري)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  placeholder="مثال: سطح رخام مع إضاءة ناعمة... أو خلفية طبيعية مع ظلال هندسية"
                  className="w-full bg-transparent border-none p-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[50px]"
                />
              </div>

              {mode === "auto" ? (
                <div>
                  <label className="text-xs font-bold text-foreground mb-3 block">الحالة المزاجية</label>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map(m => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.label}
                          onClick={() => setSelectedMood(m.value)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                            selectedMood === m.value
                              ? "btn-gold"
                              : "glass-card border border-border/30 text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map(idx => (
                    <div key={idx}>
                      <label className="text-xs font-bold text-foreground mb-2 block">فكرة {idx + 1}</label>
                      <textarea
                        value={customIdeas[idx]}
                        onChange={e => {
                          const next = [...customIdeas];
                          next[idx] = e.target.value;
                          setCustomIdeas(next);
                        }}
                        placeholder={`مثال: "المنتج مع يد أنيقة على طاولة مرايا"`}
                        className="w-full bg-surface-2 border border-border/30 rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none min-h-[70px]"
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={productImages.length === 0 || isGenerating}
                className="w-full btn-gold py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> جاري التوليد...</>
                ) : (
                  <><Wand2 className="w-5 h-5" /> {mode === "auto" ? "ولّد 3 صور للحملة" : "ولّد الأفكار"}</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Batch Variations */}
        {productImages.length > 0 && (
          <BatchVariations productImages={productImages.map(p => ({ base64: p.base64, mimeType: p.mimeType }))} />
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((result, idx) => (
              <div key={idx} className="glass-card gold-border rounded-2xl overflow-hidden flex flex-col group">
                {/* Image area */}
                <div className="relative aspect-[3/4] bg-surface-2 flex items-center justify-center">
                  {result.isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                        <Wand2 className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground animate-pulse">جاري التوليد...</span>
                    </div>
                  ) : result.image ? (
                    <div className="w-full h-full relative">
                      <img src={result.image} alt={`Campaign ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownloadWithBrand(result.image!, `scene-${idx + 1}`)}
                          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                          title="تحميل"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setOverlayImage(result.image!)}
                          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                          title="إضافة نص"
                        >
                          <Type className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => regenerateSingle(idx)}
                          className="w-10 h-10 rounded-full bg-secondary text-foreground border border-border flex items-center justify-center"
                          title="إعادة توليد"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : result.error ? (
                    <div className="flex flex-col items-center gap-3 p-4 text-center">
                      <div className="text-xs text-destructive">{result.error}</div>
                      <button onClick={() => regenerateSingle(idx)} className="text-xs text-primary hover:underline">
                        حاول مرة أخرى
                      </button>
                    </div>
                  ) : result.description ? (
                    <div className="p-4 text-center">
                      <p className="text-xs text-muted-foreground leading-relaxed">{result.description}</p>
                      <button onClick={() => regenerateSingle(idx)} className="mt-3 text-xs text-primary hover:underline">
                        إعادة المحاولة
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}

                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-white/80 border border-white/10">
                    مشهد {idx + 1}
                  </div>
                </div>

                {/* Info + Ad Score + Multi-size Export */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{result.scenario}</p>
                  {result.image && (
                    <>
                      <AdScoreCard imageUrl={result.image} contentType="صورة حملة فاشون" />
                      <MultiSizeExport imageSrc={result.image} label={`scene-${idx + 1}`} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !isGenerating && (
          <div className="glass-card rounded-2xl border border-border/30 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-primary/40" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">ارفع صورة منتج وابدأ</h3>
            <p className="text-xs text-muted-foreground">
              الـ AI هيولد 3 صور campaign احترافية لحملة السوشيال ميديا
            </p>
          </div>
        )}
      </div>

      {/* Text Overlay Modal */}
      {overlayImage && (
        <TextOverlayPanel imageSrc={overlayImage} onClose={() => setOverlayImage(null)} />
      )}
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

export default ImageStudio;

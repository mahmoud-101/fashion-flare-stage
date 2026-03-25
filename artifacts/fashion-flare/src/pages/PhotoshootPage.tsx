import { useState, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Upload, Wand2, Download, RefreshCw, X, Sparkles, Camera, Sun, Moon,
  Zap, Eye, Layers, ChevronDown, ChevronUp, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { callEdgeFunction } from "@/lib/callEdgeFunction";
import { FASHION_AD_TEMPLATES, type FashionAdTemplate } from "@/data/fashionAdTemplates";

// ── Types ──
interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
  preview: string;
}

interface ShotResult {
  label: string;
  image: string | null;
  isLoading: boolean;
  error: string | null;
}

// ── Shot Styles ──
const SHOT_STYLES = [
  { label: "Hero أمامي", prompt: "Professional front-facing hero shot, premium studio lighting, clean background, strong subject focus." },
  { label: "45° ديناميك", prompt: "Dynamic 45-degree angle shot, editorial fashion photography, depth and dimension." },
  { label: "Flat Lay", prompt: "Top-down flat lay, marble/fabric surface, complementary accessories, editorial layout." },
  { label: "لايف ستايل", prompt: "Natural lifestyle shot, person wearing/using the product in a real elegant environment." },
  { label: "ماكرو تفاصيل", prompt: "Extreme close-up macro detail, texture and craftsmanship highlight, shallow DOF." },
  { label: "Unboxing", prompt: "Premium unboxing moment, tissue paper, brand packaging, product partially revealed." },
];

// ── Backgrounds ──
const BACKGROUNDS = [
  { label: "ستوديو أبيض", value: "Pure white studio, soft shadows" },
  { label: "رخام فاخر", value: "Luxury marble surface, subtle reflections" },
  { label: "طبيعي أخضر", value: "Fresh greenery, natural soft light" },
  { label: "ذهبي دافئ", value: "Golden hour warm lighting, amber tones" },
  { label: "نيون عصري", value: "Modern neon accent lighting, dark studio" },
  { label: "باستيل ناعم", value: "Soft pastel gradient background" },
];

const PhotoshootPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productImages, setProductImages] = useState<ImageFile[]>([]);
  const [selectedShots, setSelectedShots] = useState<number[]>([0, 1, 2]);
  const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0].value);
  const [selectedTemplate, setSelectedTemplate] = useState<FashionAdTemplate | null>(null);
  const [results, setResults] = useState<ShotResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ── Upload ──
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArr.length === 0) return toast.error("يرجى رفع صور فقط");

    const processed: ImageFile[] = [];
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

  const toggleShot = (idx: number) => {
    setSelectedShots(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // ── Generate ──
  const handleGenerate = async () => {
    if (productImages.length === 0) return toast.error("ارفع صورة منتج واحدة على الأقل");
    if (selectedShots.length === 0) return toast.error("اختر نوع لقطة واحد على الأقل");

    setIsGenerating(true);
    const shots = selectedShots.map(i => SHOT_STYLES[i]);
    setResults(shots.map(s => ({ label: s.label, image: null, isLoading: true, error: null })));

    const images = productImages.map(p => ({ base64: p.base64, mimeType: p.mimeType }));

    const promises = shots.map(async (shot, idx) => {
      try {
        const scenario = selectedTemplate
          ? `${selectedTemplate.scenario}. Camera: ${shot.prompt}. Background: ${selectedBg}.`
          : `${shot.prompt} Background: ${selectedBg}.`;

        const data = await callEdgeFunction("generate-campaign-images", {
          productImages: images,
          scenario,
          mood: selectedTemplate?.mood || "",
          customPrompt: selectedTemplate?.styling || "",
        });

        const img = (data as Record<string, unknown>)?.imageUrl || (data as Record<string, unknown>)?.resultImage || null;
        setResults(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], image: img, isLoading: false };
          return next;
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "حدث خطأ";
        setResults(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], isLoading: false, error: msg };
          return next;
        });
      }
    });

    await Promise.all(promises);
    setIsGenerating(false);
    toast.success("✨ تم توليد جلسة التصوير!");
  };

  const handleDownload = (image: string, label: string) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = `moda-photoshoot-${label.replace(/\s+/g, "-")}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("تم تحميل الصورة");
  };

  const regenerateSingle = async (idx: number) => {
    const shot = SHOT_STYLES[selectedShots[idx]];
    if (!shot) return;

    setResults(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], isLoading: true, error: null };
      return next;
    });

    try {
      const images = productImages.map(p => ({ base64: p.base64, mimeType: p.mimeType }));
      const scenario = selectedTemplate
        ? `${selectedTemplate.scenario}. Camera: ${shot.prompt}. Background: ${selectedBg}.`
        : `${shot.prompt} Background: ${selectedBg}.`;

      const data = await callEdgeFunction("generate-campaign-images", {
        productImages: images, scenario, mood: selectedTemplate?.mood || "", customPrompt: selectedTemplate?.styling || "",
      });

      const img = (data as Record<string, unknown>)?.imageUrl || (data as Record<string, unknown>)?.resultImage || null;
      setResults(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], image: img, isLoading: false };
        return next;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ";
      setResults(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], isLoading: false, error: msg };
        return next;
      });
    }
  };

  return (
    <DashboardLayout title="استوديو التصوير" subtitle="جلسة تصوير احترافية بالذكاء الاصطناعي — ارفع المنتج واختر الأنماط">
      <div className="max-w-7xl space-y-6">

        {/* Control Panel */}
        <div className="glass-card gold-border rounded-2xl p-6">
          <div className="grid lg:grid-cols-12 gap-6">

            {/* Upload */}
            <div className="lg:col-span-3">
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
                <div className="flex flex-wrap gap-2 mt-3">
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
              )}
            </div>

            {/* Controls */}
            <div className="lg:col-span-9 space-y-5">

              {/* Template picker */}
              <div>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-2 text-xs font-bold text-primary mb-2"
                >
                  <Sparkles className="w-4 h-4" />
                  قوالب إعلانات جاهزة (100)
                  {showTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showTemplates && (
                  <div className="bg-surface-2 rounded-xl border border-border/30 p-4 space-y-3 animate-in slide-in-from-top-2">
                    <select
                      value={selectedTemplate?.id || ""}
                      onChange={(e) => {
                        const t = FASHION_AD_TEMPLATES.find(x => x.id === e.target.value) || null;
                        setSelectedTemplate(t);
                        if (t) toast.success(`تم اختيار: ${t.name_ar}`);
                      }}
                      className="w-full bg-transparent border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60"
                    >
                      <option value="">بدون قالب</option>
                      {Array.from(new Set(FASHION_AD_TEMPLATES.map(t => t.category))).map(cat => (
                        <optgroup key={cat} label={cat}>
                          {FASHION_AD_TEMPLATES.filter(t => t.category === cat).map(t => (
                            <option key={t.id} value={t.id}>{t.name_ar}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {selectedTemplate && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                        <p className="text-[11px] text-primary/80 leading-relaxed">{selectedTemplate.scenario}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shot types */}
              <div>
                <label className="text-xs font-bold text-foreground mb-3 block">أنواع اللقطات</label>
                <div className="flex flex-wrap gap-2">
                  {SHOT_STYLES.map((shot, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleShot(idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                        selectedShots.includes(idx)
                          ? "btn-gold"
                          : "glass-card border border-border/30 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {shot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Backgrounds */}
              <div>
                <label className="text-xs font-bold text-foreground mb-3 block">الخلفية</label>
                <div className="flex flex-wrap gap-2">
                  {BACKGROUNDS.map(bg => (
                    <button
                      key={bg.value}
                      onClick={() => setSelectedBg(bg.value)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                        selectedBg === bg.value
                          ? "btn-gold"
                          : "glass-card border border-border/30 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate */}
              <button
                onClick={handleGenerate}
                disabled={productImages.length === 0 || isGenerating}
                className="w-full btn-gold py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> جاري التصوير...</>
                ) : (
                  <><Camera className="w-5 h-5" /> ابدأ جلسة التصوير ({selectedShots.length} لقطات)</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((result, idx) => (
              <div key={idx} className="glass-card gold-border rounded-2xl overflow-hidden flex flex-col group">
                <div className="relative aspect-[3/4] bg-surface-2 flex items-center justify-center">
                  {result.isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                        <Camera className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground animate-pulse">جاري التصوير...</span>
                    </div>
                  ) : result.image ? (
                    <div className="w-full h-full relative">
                      <img src={result.image} alt={result.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button onClick={() => handleDownload(result.image!, result.label)} className="w-11 h-11 rounded-full btn-gold flex items-center justify-center">
                          <Download className="w-5 h-5" />
                        </button>
                        <button onClick={() => regenerateSingle(idx)} className="w-11 h-11 rounded-full bg-surface glass-card border border-border/50 flex items-center justify-center text-foreground">
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : result.error ? (
                    <div className="flex flex-col items-center gap-3 p-4 text-center">
                      <div className="text-xs text-destructive">{result.error}</div>
                      <button onClick={() => regenerateSingle(idx)} className="text-xs text-primary hover:underline">حاول مرة أخرى</button>
                    </div>
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-white/80 border border-white/10">
                    {result.label}
                  </div>
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
            <h3 className="text-sm font-bold text-foreground mb-1">استوديو التصوير الاحترافي</h3>
            <p className="text-xs text-muted-foreground">
              ارفع صورة منتج واختر أنماط اللقطات والخلفية — والـ AI هيصوّر لك جلسة كاملة
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PhotoshootPage;

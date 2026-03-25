import { useState, useRef, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Upload, Wand2, Download, RefreshCw, X, Sparkles,
  Camera, Sun, Palette, Eye, Layers, History, Edit3,
  Lightbulb, RotateCcw, ChevronDown, ChevronUp, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { callEdgeFunction } from "@/lib/callEdgeFunction";
import { FASHION_AD_TEMPLATES } from "@/data/fashionAdTemplates";

// ── Types ──
interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

interface HistoryEntry {
  image: string;
  prompt: string;
  timestamp: number;
}

// ── Lighting & Camera Options ──
const LIGHTING_STYLES = [
  { label: "ستوديو ناعم", value: "Soft professional studio lighting" },
  { label: "ساعة ذهبية", value: "Warm golden hour natural lighting" },
  { label: "درامي جانبي", value: "Dramatic side lighting with deep shadows" },
  { label: "ضوء طبيعي", value: "Clean natural daylight, airy" },
  { label: "نيون ملون", value: "Vibrant neon colored accent lighting" },
];

const CAMERA_PERSPECTIVES = [
  { label: "أمامي", value: "Front-facing straight-on angle" },
  { label: "45° مائل", value: "45 degree angle, dynamic perspective" },
  { label: "من فوق", value: "Overhead top-down flat lay" },
  { label: "منخفض", value: "Low angle hero shot" },
  { label: "قريب ماكرو", value: "Close-up macro detail shot" },
];

const VISION_MODES = [
  { id: "fusion", label: "دمج الستايل", desc: "دمج المنتج مع ستايل الصورة المرجعية", icon: Layers },
  { id: "placement", label: "وضع في المشهد", desc: "وضع المنتج في بيئة الصورة المرجعية", icon: Eye },
];

const RIM_COLORS = [
  { label: "أبيض", value: "white" },
  { label: "ذهبي", value: "golden" },
  { label: "وردي", value: "pink" },
  { label: "أزرق", value: "blue" },
  { label: "أخضر", value: "emerald" },
];

const CreatorStudio = () => {
  const productInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);

  // ── State ──
  const [productImages, setProductImages] = useState<ImageFile[]>([]);
  const [styleImages, setStyleImages] = useState<ImageFile[]>([]);
  const [styleDescription, setStyleDescription] = useState<string | null>(null);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [isAutoPrompt, setIsAutoPrompt] = useState(true);
  const [lightingStyle, setLightingStyle] = useState(LIGHTING_STYLES[0].value);
  const [cameraPerspective, setCameraPerspective] = useState(CAMERA_PERSPECTIVES[0].value);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [showEditInput, setShowEditInput] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── File Upload ──
  const handleUpload = useCallback(async (files: FileList | null, target: "product" | "style") => {
    if (!files || files.length === 0) return;
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
      processed.push({ base64: base64.split(",")[1], mimeType: file.type, name: file.name });
    }

    if (target === "product") {
      setProductImages(prev => [...prev, ...processed]);
    } else {
      setStyleImages(prev => [...prev, ...processed]);
      setStyleDescription(null);
    }
  }, []);

  // ── Auto-analyze style reference ──
  useEffect(() => {
    if (styleImages.length === 0) { setStyleDescription(null); return; }
    if (styleDescription || isAnalyzingStyle) return;

    const analyze = async () => {
      setIsAnalyzingStyle(true);
      try {
        const data = await callEdgeFunction("analyze-style", { images: styleImages, action: "style" });
        setStyleDescription((data as Record<string, unknown>).description as string || null);
      } catch (err: unknown) {
        toast.error("فشل تحليل صورة الستايل");
      } finally {
        setIsAnalyzingStyle(false);
      }
    };
    analyze();
  }, [styleImages, styleDescription, isAnalyzingStyle]);

  // ── Auto-generate prompt ──
  useEffect(() => {
    if (!isAutoPrompt) return;
    if (productImages.length === 0 && styleImages.length === 0) return;

    let newPrompt = `Professional high-end commercial photograph`;
    if (productImages.length > 0) newPrompt += ` of the subject from the provided image`;

    newPrompt += `.

Setting: Place the subject in a sophisticated professional environment.

Key requirements:
- Lighting: ${lightingStyle} with professional studio quality.
- Perspective: ${cameraPerspective}.
- Mood: High-end, clean, and professional.
- Content Protection: STRICTLY PRESERVE all original text, labels, and branding. NO EXTRA generated text. 8k resolution, sharp focus, hyper-realistic.`;

    if (styleImages.length > 0) {
      if (isAnalyzingStyle) newPrompt += `\n- Visual Inspiration: Analyzing reference style...`;
      else if (styleDescription) newPrompt += `\n- Background/Style Essence: ${styleDescription}. Create a similar professional atmosphere.`;
      else newPrompt += `\n- Background/Style Essence: Resembling the provided style reference.`;
    }

    setPrompt(newPrompt);
  }, [isAutoPrompt, productImages, styleImages, lightingStyle, cameraPerspective, styleDescription, isAnalyzingStyle]);

  // ── Quick Modes ──
  const applyStockBase = () => {
    setIsAutoPrompt(false);
    setPrompt(`Stock photo of the product, pure white background, professional commercial photography, high-end studio lighting, sophisticated white rim lighting accents, 8k resolution, sharp focus, hyper-realistic. STRICTLY PRESERVE original branding. NO EXTRA generated text.`);
  };

  const applyVisionMode = (mode: "fusion" | "placement") => {
    setIsAutoPrompt(false);
    const textConstraint = "STRICTLY PRESERVE all original text, labels, and branding. NO EXTRA generated text.";
    if (mode === "fusion") {
      setPrompt(`Professional Style Fusion: Take the subject from the main image and seamlessly re-render it using the visual style, lighting, and mood of the reference image. ${styleDescription ? `Reference context: ${styleDescription}.` : ""} High-end commercial quality, 8k resolution, photorealistic. ${textConstraint}`);
    } else {
      setPrompt(`Professional Scene Placement: Extract the subject from the main image and place it into the exact environment and background of the reference image. ${styleDescription ? `Reference context: ${styleDescription}.` : ""} Match lighting, shadows, and perspective perfectly. ${textConstraint}`);
    }
  };

  const applyRimColor = (color: string) => {
    if (prompt.includes("rim lighting")) {
      setPrompt(prev => prev.replace(/(\w+)\s+rim lighting/, `${color} rim lighting`));
    } else {
      setPrompt(prev => `${prev} with ${color} rim lighting accents.`);
    }
    setIsAutoPrompt(false);
  };

  // ── Generate ──
  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error("يرجى كتابة الوصف أولاً");
    if (productImages.length === 0 && styleImages.length === 0) return toast.error("ارفع صورة واحدة على الأقل");

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const allImages = [...productImages, ...styleImages].map(i => ({ base64: i.base64, mimeType: i.mimeType }));
      
      const data = await callEdgeFunction("generate-campaign-images", {
        productImages: allImages, scenario: prompt, mood: "", customPrompt: "",
      });
      const d = data as Record<string, unknown>;
      const img = d?.imageUrl || d?.resultImage;
      if (img) {
        setGeneratedImage(img as string);
        setHistory(prev => [{ image: img as string, prompt, timestamp: Date.now() }, ...prev].slice(0, 20));
        toast.success("✨ تم توليد الصورة!");
      } else if (d?.description) {
        setError(d.description as string);
      } else {
        throw new Error("لم يتم توليد صورة، حاول مرة أخرى");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Edit ──
  const handleEdit = async () => {
    if (!generatedImage || !editPrompt.trim()) return;
    setIsEditing(true);
    setError(null);

    try {
      let imageBase64 = generatedImage;
      let mimeType = "image/png";
      if (generatedImage.startsWith("data:")) {
        const match = generatedImage.match(/^data:([^;]+);base64,(.+)$/);
        if (match) { mimeType = match[1]; imageBase64 = match[2]; }
      }

      const allImages = [{ base64: imageBase64, mimeType }];
      const editData = await callEdgeFunction("generate-campaign-images", {
        productImages: allImages, scenario: editPrompt, mood: "", customPrompt: "",
      });
      const img = (editData as Record<string, unknown>)?.imageUrl || (editData as Record<string, unknown>)?.resultImage;
      if (img) {
        setGeneratedImage(img);
        setHistory(prev => [{ image: img, prompt: `Edit: ${editPrompt}`, timestamp: Date.now() }, ...prev].slice(0, 20));
        setEditPrompt("");
        setShowEditInput(false);
        toast.success("✨ تم تعديل الصورة!");
      } else {
        throw new Error("فشل تعديل الصورة");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "فشل التعديل";
      toast.error(message);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `moda-creator-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("تم تحميل الصورة");
  };

  return (
    <DashboardLayout title="استوديو المصمم" subtitle="صمّم صور منتجاتك بالذكاء الاصطناعي — ارفع المنتج + الستايل وخلّي الـ AI يبدع">
      <div className="max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ════ LEFT: Controls ════ */}
          <div className="space-y-5">

            {/* Image Upload Areas */}
            <div className="grid grid-cols-2 gap-4">
              {/* Product Image */}
              <div className="glass-card gold-border rounded-2xl p-4 flex flex-col items-center gap-3">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">صورة المنتج</h3>
                <div
                  onClick={() => productInputRef.current?.click()}
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-surface-2/50 overflow-hidden"
                >
                  {productImages.length > 0 ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={`data:${productImages[0].mimeType};base64,${productImages[0].base64}`}
                        alt="Product"
                        className="w-full h-full object-cover"
                      />
                      {productImages.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          +{productImages.length - 1}
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setProductImages([]); }}
                        className="absolute top-2 left-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground">ارفع صورة المنتج</span>
                    </>
                  )}
                </div>
                <input ref={productInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files, "product")} />
              </div>

              {/* Style Reference */}
              <div className="glass-card gold-border rounded-2xl p-4 flex flex-col items-center gap-3">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">صورة مرجعية (ستايل)</h3>
                <div
                  onClick={() => styleInputRef.current?.click()}
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-surface-2/50 overflow-hidden"
                >
                  {styleImages.length > 0 ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={`data:${styleImages[0].mimeType};base64,${styleImages[0].base64}`}
                        alt="Style"
                        className="w-full h-full object-cover"
                      />
                      {isAnalyzingStyle && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setStyleImages([]); setStyleDescription(null); }}
                        className="absolute top-2 left-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Palette className="w-6 h-6 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground">ارفع صورة ستايل</span>
                    </>
                  )}
                </div>
                <input ref={styleInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files, "style")} />
                {styleDescription && !isAnalyzingStyle && (
                  <div className="w-full bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-primary/80 line-clamp-2">{styleDescription}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vision Modes (when style image present) */}
            {styleImages.length > 0 && productImages.length > 0 && (
              <div className="glass-card rounded-xl p-4 border border-border/30 space-y-3">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> أوضاع الـ AI
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VISION_MODES.map(mode => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => applyVisionMode(mode.id as "fusion" | "placement")}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl glass-card border border-border/30 hover:border-primary/40 transition-all text-center"
                      >
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-foreground">{mode.label}</span>
                        <span className="text-[9px] text-muted-foreground leading-tight">{mode.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={applyStockBase}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-card border border-border/30 hover:border-primary/30 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-primary" /> صورة ستوك بيضاء
              </button>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-card border border-border/30 hover:border-primary/30 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
              >
                <Sun className="w-3.5 h-3.5 text-primary" /> إضاءة وزاوية
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Advanced: Lighting & Camera */}
            {showAdvanced && (
              <div className="glass-card rounded-xl p-4 border border-border/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">الإضاءة</label>
                  <div className="flex flex-wrap gap-2">
                    {LIGHTING_STYLES.map(l => (
                      <button key={l.value} onClick={() => setLightingStyle(l.value)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${lightingStyle === l.value ? "btn-gold" : "glass-card border border-border/30 text-muted-foreground hover:border-primary/30"}`}
                      >{l.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">زاوية الكاميرا</label>
                  <div className="flex flex-wrap gap-2">
                    {CAMERA_PERSPECTIVES.map(c => (
                      <button key={c.value} onClick={() => setCameraPerspective(c.value)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${cameraPerspective === c.value ? "btn-gold" : "glass-card border border-border/30 text-muted-foreground hover:border-primary/30"}`}
                      >{c.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">لون الـ Rim Light</label>
                  <div className="flex flex-wrap gap-2">
                    {RIM_COLORS.map(c => (
                      <button key={c.value} onClick={() => applyRimColor(c.value)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold glass-card border border-border/30 text-muted-foreground hover:border-primary/30 transition-all"
                      >{c.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Ad Templates */}
            <div className="glass-card rounded-xl p-4 border border-border/30">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> قوالب إعلانات جاهزة (100)
              </label>
              <select
                defaultValue=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  const t = FASHION_AD_TEMPLATES.find((x) => x.id === id);
                  if (!t) return;
                  setIsAutoPrompt(false);
                  setPrompt(t.prompt);
                  toast.success("تم تطبيق القالب ✅");
                }}
                className="w-full bg-surface-2 border border-border/30 rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="">اختر قالب…</option>
                {Array.from(new Set(FASHION_AD_TEMPLATES.map((t) => t.category))).map((cat) => (
                  <optgroup key={cat} label={cat}>
                    {FASHION_AD_TEMPLATES.filter((t) => t.category === cat).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name_ar}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                اختيار قالب يملأ الـ Prompt بالكامل (أفضل للسرعة).
              </p>
            </div>

            {/* Prompt Editor */}
            <div className="glass-card gold-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> الوصف (Prompt)
                </label>
                <button
                  onClick={() => setIsAutoPrompt(!isAutoPrompt)}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${isAutoPrompt ? "bg-primary/15 text-primary border border-primary/25" : "glass-card border border-border/30 text-muted-foreground"}`}
                >
                  {isAutoPrompt ? "تلقائي ✓" : "يدوي"}
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={e => { setPrompt(e.target.value); setIsAutoPrompt(false); }}
                placeholder="اكتب وصف الصورة اللي عايزها... أو خلّي الـ AI يكتب تلقائي"
                className="w-full bg-surface-2 border border-border/30 rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors min-h-[120px] resize-none leading-relaxed"
                dir="auto"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (!prompt.trim())}
              className="w-full btn-gold py-4 rounded-xl text-base font-black flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> جاري التصميم...</>
              ) : (
                <><Wand2 className="w-5 h-5" /> صمّم بالذكاء الاصطناعي</>
              )}
            </button>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl text-xs font-bold text-center">
                {error}
              </div>
            )}
          </div>

          {/* ════ RIGHT: Result & History ════ */}
          <div className="space-y-5">

            {/* Result Display */}
            <div className="glass-card gold-border rounded-2xl p-6 min-h-[400px] flex flex-col items-center justify-center">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                    <Wand2 className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground animate-pulse">جاري التصميم بالذكاء الاصطناعي...</span>
                </div>
              ) : generatedImage ? (
                <div className="w-full space-y-4">
                  <div className="relative group rounded-xl overflow-hidden">
                    <img src={generatedImage} alt="Generated" className="w-full rounded-xl" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={handleDownload} className="p-3 btn-gold rounded-full">
                        <Download className="w-5 h-5" />
                      </button>
                      <button onClick={handleGenerate} className="p-3 bg-surface glass-card border border-border/50 rounded-full text-foreground">
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      <button onClick={() => setShowEditInput(!showEditInput)} className="p-3 bg-surface glass-card border border-border/50 rounded-full text-foreground">
                        <Edit3 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit */}
                  {showEditInput && (
                    <div className="flex gap-2 animate-in slide-in-from-top-2">
                      <input
                        value={editPrompt}
                        onChange={e => setEditPrompt(e.target.value)}
                        placeholder="عدّل الصورة... مثلاً: غيّر الخلفية لأبيض"
                        className="flex-1 bg-surface-2 border border-border/50 rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                        dir="auto"
                        onKeyDown={e => e.key === "Enter" && handleEdit()}
                      />
                      <button
                        onClick={handleEdit}
                        disabled={isEditing || !editPrompt.trim()}
                        className="px-4 py-2.5 btn-gold rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isEditing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
                        عدّل
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-primary/50" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-1">استوديو المصمم</h3>
                    <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                      ارفع صورة المنتج + صورة ستايل مرجعية
                      <br />والـ AI هيصمّم لك صورة احترافية
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* History Panel */}
            {history.length > 0 && (
              <div className="glass-card rounded-xl border border-border/30 overflow-hidden">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2/50 transition-colors"
                >
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-primary" /> السجل ({history.length})
                  </span>
                  {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {showHistory && (
                  <div className="p-3 border-t border-border/30 grid grid-cols-4 gap-2 max-h-48 overflow-auto">
                    {history.map((entry, idx) => (
                      <button
                        key={idx}
                        onClick={() => setGeneratedImage(entry.image)}
                        className="rounded-lg overflow-hidden border border-border/30 hover:border-primary/50 transition-all aspect-square"
                      >
                        <img src={entry.image} alt={`History ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatorStudio;

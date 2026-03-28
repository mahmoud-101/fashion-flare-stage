import { useState, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Upload, Wand2, Download, RefreshCw, X, Type, Sparkles,
  Edit3, Palette, Image as ImageIcon, Eraser, Layers, Sun,
} from "lucide-react";
import { toast } from "sonner";
import { FASHION_AD_TEMPLATES } from "@/data/fashionAdTemplates";
import { callEdgeFunction } from "@/lib/callEdgeFunction";

interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
  preview: string;
}

// ── Edit operations ──
const EDIT_OPERATIONS = [
  { id: "bg_remove", label: "إزالة الخلفية", icon: Eraser, prompt: "Remove the background completely, make it transparent/white, keep the product perfectly intact." },
  { id: "bg_change", label: "تغيير الخلفية", icon: Palette, prompt: "Change background to: " },
  { id: "enhance", label: "تحسين الجودة", icon: Sun, prompt: "Enhance image quality to 8K, sharpen details, improve lighting, increase contrast slightly, make colors more vibrant while keeping it natural." },
  { id: "recolor", label: "تغيير الألوان", icon: Palette, prompt: "Change the product color to: " },
  { id: "add_text", label: "إضافة نص", icon: Type, prompt: "Add elegant premium text overlay: " },
  { id: "style_transfer", label: "تغيير الأسلوب", icon: Layers, prompt: "Transform the image style to: " },
  { id: "custom", label: "تعديل حر", icon: Edit3, prompt: "" },
];

const BG_PRESETS = [
  "Pure white studio",
  "Luxury marble surface",
  "Soft gradient pastel pink",
  "Dark moody studio with gold accents",
  "Natural greenery garden",
  "Modern concrete minimalist",
];

const COLOR_PRESETS = ["أسود", "أبيض", "بيج", "وردي", "أحمر", "أزرق نيفي", "أخضر زيتي", "ذهبي"];

const STYLE_PRESETS = [
  "Watercolor painting",
  "Oil painting classic",
  "Pop art Andy Warhol",
  "Retro vintage 70s",
  "Cyberpunk neon",
  "Sketch pencil drawing",
];

const EditStudioPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceImage, setSourceImage] = useState<ImageFile | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selectedOp, setSelectedOp] = useState(EDIT_OPERATIONS[0].id);
  const [customInput, setCustomInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const file = Array.from(files).find(f => f.type.startsWith("image/"));
    if (!file) return toast.error("يرجى رفع صورة فقط");
    if (file.size > 10 * 1024 * 1024) return toast.error("الصورة أكبر من 10MB");

    const base64 = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(file);
    });

    setSourceImage({
      base64: base64.split(",")[1],
      mimeType: file.type,
      name: file.name,
      preview: base64,
    });
    setResultImage(null);
    setError(null);
  }, []);

  const handleEdit = async () => {
    const imgToEdit = resultImage || (sourceImage ? `data:${sourceImage.mimeType};base64,${sourceImage.base64}` : null);
    if (!imgToEdit) return toast.error("ارفع صورة أولاً");

    const op = EDIT_OPERATIONS.find(o => o.id === selectedOp);
    if (!op) return;

    let editPrompt = op.prompt;
    if (["bg_change", "recolor", "add_text", "style_transfer", "custom"].includes(selectedOp)) {
      if (!customInput.trim()) return toast.error("يرجى كتابة التفاصيل");
      editPrompt = op.id === "custom" ? customInput : `${op.prompt}${customInput}`;
    }

    editPrompt += " STRICTLY PRESERVE all original branding. NO EXTRA generated text or watermarks unless asked.";

    setIsProcessing(true);
    setError(null);

    try {
      let imageBase64 = imgToEdit;
      let mimeType = "image/png";
      if (imgToEdit.startsWith("data:")) {
        const match = imgToEdit.match(/^data:([^;]+);base64,(.+)$/);
        if (match) { mimeType = match[1]; imageBase64 = match[2]; }
      }

      const data = await callEdgeFunction<{ imageUrl?: string; resultImage?: string; description?: string }>("generate-campaign-images", {
        productImages: [{ base64: imageBase64, mimeType }],
        scenario: editPrompt,
        mood: "",
        customPrompt: "",
      }, { includeBrand: false });

      const img = data?.imageUrl || data?.resultImage;
      if (img) {
        setResultImage(img);
        setHistory(prev => [img, ...prev].slice(0, 20));
        toast.success("✨ تم التعديل!");
      } else if (data?.description) {
        setError(data.description);
      } else {
        throw new Error("فشل التعديل، حاول مرة أخرى");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    const img = resultImage || (sourceImage ? sourceImage.preview : null);
    if (!img) return;
    const a = document.createElement("a");
    a.href = img;
    a.download = `moda-edit-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("تم تحميل الصورة");
  };

  const applyTemplate = (t: typeof FASHION_AD_TEMPLATES[0]) => {
    setSelectedOp("custom");
    setCustomInput(t.prompt);
    toast.success(`تم تطبيق: ${t.name_ar}`);
  };

  const currentOp = EDIT_OPERATIONS.find(o => o.id === selectedOp)!;
  const needsInput = ["bg_change", "recolor", "add_text", "style_transfer", "custom"].includes(selectedOp);

  return (
    <DashboardLayout title="استوديو التعديل" subtitle="عدّل صورك بالذكاء الاصطناعي — إزالة خلفية، نص، ألوان، وأكتر">
      <div className="max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ════ LEFT: Controls ════ */}
          <div className="space-y-5">

            {/* Image Upload */}
            <div className="glass-card gold-border rounded-2xl p-4">
              <label className="text-xs font-bold text-foreground mb-3 block">الصورة الأصلية</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-square rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center overflow-hidden ${
                  dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                }`}
              >
                {sourceImage ? (
                  <div className="relative w-full h-full group">
                    <img src={sourceImage.preview} alt="Source" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setSourceImage(null); setResultImage(null); }}
                      className="absolute top-2 left-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground">ارفع صورة للتعديل</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
            </div>

            {/* Operations */}
            <div className="glass-card rounded-xl p-4 border border-border/30">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 block">نوع التعديل</label>
              <div className="grid grid-cols-4 gap-2">
                {EDIT_OPERATIONS.map(op => {
                  const Icon = op.icon;
                  return (
                    <button
                      key={op.id}
                      onClick={() => { setSelectedOp(op.id); setCustomInput(""); }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all text-center ${
                        selectedOp === op.id
                          ? "btn-gold"
                          : "glass-card border border-border/30 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-bold leading-tight">{op.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input area (contextual) */}
            {needsInput && (
              <div className="glass-card rounded-xl p-4 border border-border/30 space-y-3 animate-in slide-in-from-top-2">
                {selectedOp === "bg_change" && (
                  <div className="flex flex-wrap gap-2">
                    {BG_PRESETS.map(bg => (
                      <button key={bg} onClick={() => setCustomInput(bg)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${customInput === bg ? "btn-gold" : "glass-card border border-border/30 text-muted-foreground hover:border-primary/30"}`}
                      >{bg}</button>
                    ))}
                  </div>
                )}
                {selectedOp === "recolor" && (
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map(c => (
                      <button key={c} onClick={() => setCustomInput(c)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${customInput === c ? "btn-gold" : "glass-card border border-border/30 text-muted-foreground hover:border-primary/30"}`}
                      >{c}</button>
                    ))}
                  </div>
                )}
                {selectedOp === "style_transfer" && (
                  <div className="flex flex-wrap gap-2">
                    {STYLE_PRESETS.map(s => (
                      <button key={s} onClick={() => setCustomInput(s)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${customInput === s ? "btn-gold" : "glass-card border border-border/30 text-muted-foreground hover:border-primary/30"}`}
                      >{s}</button>
                    ))}
                  </div>
                )}
                <textarea
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder={
                    selectedOp === "add_text" ? "اكتب النص اللي عايز تضيفه..." :
                    selectedOp === "custom" ? "اوصف التعديل اللي عايزه..." :
                    "اكتب التفاصيل..."
                  }
                  className="w-full bg-surface-2 border border-border/30 rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none min-h-[80px]"
                  dir="auto"
                />
              </div>
            )}

            {/* Templates */}
            <div className="glass-card rounded-xl p-4 border border-border/30">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> قوالب إعلانات (100)
              </label>
              <select
                defaultValue=""
                onChange={e => {
                  const t = FASHION_AD_TEMPLATES.find(x => x.id === e.target.value);
                  if (t) applyTemplate(t);
                }}
                className="w-full bg-surface-2 border border-border/30 rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value="">اختر قالب…</option>
                {Array.from(new Set(FASHION_AD_TEMPLATES.map(t => t.category))).map(cat => (
                  <optgroup key={cat} label={cat}>
                    {FASHION_AD_TEMPLATES.filter(t => t.category === cat).map(t => (
                      <option key={t.id} value={t.id}>{t.name_ar}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Generate */}
            <button
              onClick={handleEdit}
              disabled={!sourceImage || isProcessing}
              className="w-full btn-gold py-4 rounded-xl text-base font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> جاري التعديل...</>
              ) : (
                <><Wand2 className="w-5 h-5" /> {currentOp.label}</>
              )}
            </button>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl text-xs font-bold text-center">
                {error}
              </div>
            )}
          </div>

          {/* ════ RIGHT: Result ════ */}
          <div className="space-y-5">
            <div className="glass-card gold-border rounded-2xl p-6 min-h-[400px] flex flex-col items-center justify-center">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                    <Wand2 className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground animate-pulse">جاري التعديل بالذكاء الاصطناعي...</span>
                </div>
              ) : resultImage ? (
                <div className="w-full space-y-4">
                  <div className="relative group rounded-xl overflow-hidden">
                    <img src={resultImage} alt="Result" className="w-full rounded-xl" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={handleDownload} className="p-3 btn-gold rounded-full"><Download className="w-5 h-5" /></button>
                      <button onClick={handleEdit} className="p-3 bg-surface glass-card border border-border/50 rounded-full text-foreground"><RefreshCw className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Edit3 className="w-10 h-10 text-primary/50" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-1">استوديو التعديل</h3>
                    <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                      ارفع صورة واختر نوع التعديل
                      <br />والـ AI هيعدّل لك في ثواني
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="glass-card rounded-xl border border-border/30 p-3">
                <label className="text-xs font-bold text-foreground mb-2 block">السجل</label>
                <div className="grid grid-cols-5 gap-2 max-h-32 overflow-auto">
                  {history.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setResultImage(img)}
                      className="rounded-lg overflow-hidden border border-border/30 hover:border-primary/50 transition-all aspect-square"
                    >
                      <img src={img} alt={`History ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditStudioPage;

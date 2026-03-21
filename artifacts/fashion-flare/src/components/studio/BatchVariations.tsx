import { useState } from "react";
import { Grid3X3, Download, Loader2, CheckSquare, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JSZip from "jszip";

const BACKGROUNDS = [
  { id: "white", label: "أبيض ناعم", mood: "Clean minimalist pure white studio background, soft lighting" },
  { id: "black", label: "أسود فاخر", mood: "Dramatic black luxury background with subtle rim light" },
  { id: "gold", label: "ذهبي", mood: "Elegant golden shimmer background, warm luxury lighting" },
  { id: "pink", label: "وردي باستيل", mood: "Soft pastel pink background, dreamy feminine aesthetic" },
  { id: "beige", label: "بيج كريمي", mood: "Warm creamy beige studio background, neutral tones" },
  { id: "blue", label: "أزرق سمائي", mood: "Serene sky blue gradient background, fresh and airy" },
  { id: "olive", label: "أخضر زيتوني", mood: "Rich olive green background, natural earthy sophisticated" },
  { id: "purple", label: "بنفسجي", mood: "Deep purple luxurious background with soft gradient" },
  { id: "gray", label: "رمادي عصري", mood: "Modern slate gray background, contemporary clean feel" },
  { id: "wood", label: "طبيعي خشبي", mood: "Natural wood surface background, warm organic rustic" },
];

interface BatchVariationsProps {
  productImages: { base64: string; mimeType: string }[];
}

interface VariationResult {
  id: string;
  label: string;
  image: string | null;
  isLoading: boolean;
  error: string | null;
  selected: boolean;
}

const BatchVariations = ({ productImages }: BatchVariationsProps) => {
  const [results, setResults] = useState<VariationResult[]>([]);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = async () => {
    if (productImages.length === 0) return toast.error("ارفع صورة منتج أولاً");
    setGenerating(true);

    const initial: VariationResult[] = BACKGROUNDS.map(bg => ({
      id: bg.id, label: bg.label, image: null, isLoading: true, error: null, selected: false,
    }));
    setResults(initial);

    const images = productImages.map(p => ({ base64: p.base64, mimeType: p.mimeType }));

    const promises = BACKGROUNDS.map(async (bg, idx) => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-campaign-images", {
          body: {
            productImages: images,
            scenario: `Product hero shot on ${bg.mood}`,
            mood: bg.mood,
            customPrompt: "Professional e-commerce product photography, 8K quality",
          },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        const img = data?.imageUrl || data?.resultImage || null;
        setResults(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], image: img, isLoading: false };
          return next;
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "خطأ";
        setResults(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], isLoading: false, error: msg };
          return next;
        });
      }
    });

    await Promise.all(promises);
    setGenerating(false);
    toast.success("✨ تم توليد 10 نسخ!");
  };

  const toggleSelect = (idx: number) => {
    setResults(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], selected: !next[idx].selected };
      return next;
    });
  };

  const downloadSelected = async () => {
    const selected = results.filter(r => r.selected && r.image);
    if (selected.length === 0) return toast.error("اختر صورة واحدة على الأقل");
    setDownloading(true);

    try {
      const zip = new JSZip();
      for (const item of selected) {
        const res = await fetch(item.image!);
        const blob = await res.blob();
        zip.file(`moda-${item.id}-${Date.now()}.png`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moda-variations-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تحميل الصور المختارة");
    } catch {
      toast.error("فشل التحميل");
    } finally {
      setDownloading(false);
    }
  };

  const selectedCount = results.filter(r => r.selected).length;

  if (results.length === 0) {
    return (
      <button
        onClick={handleGenerate}
        disabled={productImages.length === 0 || generating}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 glass-card border border-border/30 rounded-xl text-sm font-bold text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
      >
        <Grid3X3 className="w-4 h-4 text-primary" />
        ولّد 10 نسخ بخلفيات مختلفة
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-primary" /> 10 نسخ بخلفيات مختلفة
        </h3>
        {selectedCount > 0 && (
          <button
            onClick={downloadSelected}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 btn-gold rounded-lg text-xs font-bold disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            تحميل المحدد ({selectedCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {results.map((r, idx) => (
          <div
            key={r.id}
            className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
              r.selected ? "border-primary shadow-lg" : "border-border/30 hover:border-border/60"
            }`}
            onClick={() => r.image && toggleSelect(idx)}
          >
            <div className="aspect-square bg-surface-2 flex items-center justify-center">
              {r.isLoading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : r.image ? (
                <img src={r.image} alt={r.label} className="w-full h-full object-cover" />
              ) : r.error ? (
                <span className="text-[10px] text-destructive text-center p-1">{r.error}</span>
              ) : null}
            </div>
            <div className="p-1.5 text-center">
              <span className="text-[10px] font-medium text-muted-foreground">{r.label}</span>
            </div>
            {r.image && (
              <div className="absolute top-1.5 right-1.5">
                {r.selected ? (
                  <CheckSquare className="w-4 h-4 text-primary" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground/50" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchVariations;

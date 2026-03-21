import { useState } from "react";
import { Sparkles, Copy, Save, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Variation {
  style: string;
  label: string;
  caption: string;
}

interface CaptionVariationsProps {
  caption: string;
  dialect?: string;
}

const CaptionVariations = ({ caption, dialect }: CaptionVariationsProps) => {
  const { user } = useAuth();
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const generate = async () => {
    if (!caption.trim()) return toast.error("لا يوجد كابشن للتحويل");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("caption-variations", {
        body: { caption, dialect },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setVariations(data.variations || []);
      toast.success("✨ تم توليد 5 نسخ!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل التوليد");
    } finally {
      setLoading(false);
    }
  };

  const copyCaption = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    toast.success("تم النسخ");
  };

  const saveCaption = async (variation: Variation) => {
    if (!user) return toast.error("سجل دخول أولاً");
    try {
      await supabase.from("saved_content").insert({
        user_id: user.id,
        title: `${variation.style} - ${variation.label}`,
        content: variation.caption,
        platform: "instagram",
        content_type: "caption-variation",
        status: "draft",
      });
      toast.success("تم الحفظ في المكتبة ✅");
    } catch {
      toast.error("فشل الحفظ");
    }
  };

  if (variations.length === 0) {
    return (
      <button
        onClick={generate}
        disabled={loading || !caption.trim()}
        className="flex items-center gap-2 px-4 py-2 glass-card border border-border/30 rounded-xl text-xs font-bold text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
        ولّد 5 نسخ بأساليب مختلفة
      </button>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> 5 نسخ بأساليب مختلفة
      </h4>
      {variations.map((v, idx) => (
        <div key={idx} className="glass-card border border-border/30 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">{v.style} {v.label}</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => copyCaption(v.caption, idx)}
                className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                title="نسخ"
              >
                {copiedIdx === idx ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
              </button>
              <button
                onClick={() => saveCaption(v)}
                className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                title="حفظ"
              >
                <Save className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{v.caption}</p>
        </div>
      ))}
      <button
        onClick={generate}
        disabled={loading}
        className="text-xs text-primary hover:underline disabled:opacity-50"
      >
        {loading ? "جاري التوليد..." : "إعادة التوليد"}
      </button>
    </div>
  );
};

export default CaptionVariations;

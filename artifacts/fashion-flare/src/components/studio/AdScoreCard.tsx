import { useState } from "react";
import { BarChart3, Loader2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdScore {
  hook: number;
  cta: number;
  visual: number;
  arabic: number;
  suggestions: string[];
}

interface AdScoreCardProps {
  content?: string;
  imageUrl?: string;
  contentType?: string;
}

const AdScoreCard = ({ content, imageUrl, contentType }: AdScoreCardProps) => {
  const [score, setScore] = useState<AdScore | null>(null);
  const [loading, setLoading] = useState(false);

  const total = score ? score.hook + score.cta + score.visual + score.arabic : 0;
  const color = total >= 80 ? "text-green-500" : total >= 60 ? "text-yellow-500" : "text-red-500";
  const bgColor = total >= 80 ? "bg-green-500/10 border-green-500/30" : total >= 60 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30";

  const handleScore = async () => {
    if (!content && !imageUrl) return toast.error("لا يوجد محتوى للتقييم");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("score-ad", {
        body: { content, imageUrl, contentType },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setScore(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل التقييم");
    } finally {
      setLoading(false);
    }
  };

  const categories = score ? [
    { label: "قوة الـ Hook", value: score.hook, max: 25 },
    { label: "وضوح الـ CTA", value: score.cta, max: 25 },
    { label: "جاذبية بصرية", value: score.visual, max: 25 },
    { label: "ملاءمة عربية", value: score.arabic, max: 25 },
  ] : [];

  return (
    <div className="glass-card border border-border/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
          تقييم الإعلان
        </h4>
        <button
          onClick={handleScore}
          disabled={loading}
          className="text-xs font-medium text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
          {loading ? "جاري التقييم..." : score ? "إعادة التقييم" : "قيّم الآن"}
        </button>
      </div>

      {score && (
        <>
          {/* Total Score */}
          <div className={`rounded-lg p-3 border ${bgColor} text-center`}>
            <span className={`text-3xl font-black ${color}`}>{total}</span>
            <span className="text-xs text-muted-foreground block">/100</span>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            {categories.map((cat) => {
              const pct = (cat.value / cat.max) * 100;
              const barColor = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500";
              return (
                <div key={cat.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{cat.label}</span>
                    <span className="font-bold text-foreground">{cat.value}/{cat.max}</span>
                  </div>
                  <div className="w-full h-1.5 bg-border/30 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suggestions */}
          {score.suggestions.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border/30">
              <span className="text-xs font-bold text-primary">💡 اقتراحات التحسين:</span>
              {score.suggestions.map((s, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">• {s}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdScoreCard;

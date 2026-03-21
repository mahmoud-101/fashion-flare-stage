import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Sparkles, TrendingUp, Download, Loader2, BarChart3, CheckCircle, Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCanGenerate } from "@/hooks/useCanGenerate";
import { UpgradeModal } from "@/components/UpgradeModal";

interface TestVariant {
  id: string;
  headline: string;
  caption: string;
  cta: string;
  predictedCTR: number;
  predictedConversion: number;
  score: number;
  reasoning: string;
}

const ABTesting = () => {
  const { checkAndProceed, showUpgradeModal, setShowUpgradeModal, limitType, currentUsed, currentLimit } = useCanGenerate();
  const [product, setProduct] = useState("");
  const [originalAd, setOriginalAd] = useState("");
  const [variants, setVariants] = useState<TestVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const generateVariants = async () => {
    if (!product.trim()) return toast.error("اكتب اسم المنتج");
    
    checkAndProceed("content_generation", async () => {
      setLoading(true);
      setVariants([]);
      setWinner(null);

      try {
        const { data, error } = await supabase.functions.invoke("generate-content", {
          body: {
            platform: "ad",
            product: product,
            contentType: "إعلان مدفوع",
            extra: `Generate 4 A/B test variations for this product ad.
${originalAd ? `Original ad text: "${originalAd}"` : ""}

Return ONLY a JSON array of 4 objects with these fields:
- "id": unique string (A, B, C, D)
- "headline": Arabic headline (max 8 words)
- "caption": Arabic ad caption (2-3 sentences)
- "cta": CTA button text in Arabic
- "predictedCTR": predicted click-through rate as percentage number (e.g. 3.2)
- "predictedConversion": predicted conversion rate as percentage (e.g. 1.8)
- "score": overall performance score 0-100
- "reasoning": why this variant might perform well (in Arabic, 1 sentence)

Make each variant test a different angle:
A = Emotional/Story-driven
B = Urgency/Scarcity
C = Social Proof/Authority
D = Value/Benefit-focused

Return only valid JSON array.`,
            dialect: "egyptian",
          },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        let output = data.output || "";
        output = output.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        
        const match = output.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]) as TestVariant[];
          setVariants(parsed);
          const best = parsed.reduce((a, b) => a.score > b.score ? a : b);
          setWinner(best.id);
          toast.success("✨ تم توليد 4 نسخ للاختبار!");
        } else {
          throw new Error("فشل تحليل النتائج");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "فشل التوليد");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <DashboardLayout title="A/B اختبار الإعلانات" subtitle="ولّد نسخ مختلفة وقارن الأداء المتوقع قبل ما تصرف ميزانية">
      <div className="max-w-5xl space-y-6">

        {/* Input */}
        <div className="glass-card gold-border rounded-2xl p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">المنتج / الخدمة *</label>
              <input value={product} onChange={e => setProduct(e.target.value)} placeholder="مثال: فستان سهرة ساتان أسود" className="w-full bg-surface-2 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">إعلانك الحالي (اختياري)</label>
              <input value={originalAd} onChange={e => setOriginalAd(e.target.value)} placeholder="الصق نص إعلانك الحالي لتحسينه" className="w-full bg-surface-2 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>
          </div>
          <button onClick={generateVariants} disabled={loading || !product.trim()} className="btn-gold px-8 py-3 rounded-xl text-sm font-black flex items-center gap-2 disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري التوليد...</> : <><Sparkles className="w-4 h-4" /> ولّد 4 نسخ A/B</>}
          </button>
        </div>

        {/* Results Grid */}
        {variants.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {variants.map((v) => {
              const isWinner = v.id === winner;
              return (
                <div key={v.id} className={`glass-card rounded-2xl p-5 space-y-3 border-2 transition-all ${isWinner ? "border-primary bg-primary/5" : "border-border/30"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${isWinner ? "bg-primary text-primary-foreground" : "bg-surface-2 text-foreground"}`}>
                        {v.id}
                      </span>
                      {isWinner && (
                        <span className="flex items-center gap-1 text-xs font-bold text-primary">
                          <Trophy className="w-3.5 h-3.5" /> الأفضل أداءً
                        </span>
                      )}
                    </div>
                    <span className={`text-lg font-black ${v.score >= 80 ? "text-green-500" : v.score >= 60 ? "text-yellow-500" : "text-red-500"}`}>
                      {v.score}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-1">{v.headline}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{v.caption}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold">{v.cta}</span>
                  </div>

                  {/* Predictions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                    <div className="text-center">
                      <p className="text-lg font-black text-foreground">{v.predictedCTR}%</p>
                      <p className="text-[10px] text-muted-foreground">CTR متوقع</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-foreground">{v.predictedConversion}%</p>
                      <p className="text-[10px] text-muted-foreground">Conversion متوقع</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground italic">💡 {v.reasoning}</p>

                  <button
                    onClick={() => { navigator.clipboard.writeText(`${v.headline}\n\n${v.caption}\n\n${v.cta}`); toast.success("تم نسخ الإعلان"); }}
                    className="w-full text-xs text-primary font-medium hover:underline text-center py-1"
                  >
                    نسخ النص الكامل
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {variants.length > 0 && (
          <div className="glass-card border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">توصية Moda AI</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ابدأ بالنسخة <span className="font-bold text-primary">{winner}</span> كإعلان رئيسي ثم اختبرها ضد النسخة الثانية بميزانية صغيرة. بعد 48 ساعة أوقف الأضعف وضاعف ميزانية الأقوى.
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

export default ABTesting;

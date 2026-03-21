import { useState, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Upload, Search, TrendingUp, Target, Eye, Lightbulb, Loader2, X, Wand2,
  AlertTriangle, CheckCircle, ArrowUpRight, Palette as PaletteIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCanGenerate } from "@/hooks/useCanGenerate";
import { UpgradeModal } from "@/components/UpgradeModal";

interface CompetitorAnalysis {
  overallScore: number;
  scores: { hook: number; visualDesign: number; copywriting: number; cta: number };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  suggestedHeadlines: string[];
  colorPalette: string[];
  targetAudience: string;
  adType: string;
  improvedVersion: string;
}

interface AdImage {
  base64: string;
  mimeType: string;
  preview: string;
}

const CompetitorSpy = () => {
  const { checkAndProceed, showUpgradeModal, setShowUpgradeModal, limitType, currentUsed, currentLimit } = useCanGenerate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adImage, setAdImage] = useState<AdImage | null>(null);
  const [adText, setAdText] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("الحد 10MB");
    const base64 = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(file);
    });
    setAdImage({ base64: base64.split(",")[1], mimeType: file.type, preview: base64 });
    setAnalysis(null);
  }, []);

  const analyze = async () => {
    if (!adImage && !adText.trim()) return toast.error("ارفع صورة إعلان أو اكتب النص");
    
    checkAndProceed("content_generation", async () => {
      setLoading(true);
      setAnalysis(null);
      try {
        const { data, error } = await supabase.functions.invoke("analyze-competitor", {
          body: {
            adImage: adImage ? { base64: adImage.base64, mimeType: adImage.mimeType } : undefined,
            adText: adText || undefined,
            competitorName: competitorName || undefined,
          },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        setAnalysis(data.analysis);
        toast.success("✨ تم تحليل الإعلان!");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "فشل التحليل");
      } finally {
        setLoading(false);
      }
    });
  };

  const scoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    return pct >= 80 ? "text-green-500" : pct >= 60 ? "text-yellow-500" : "text-red-500";
  };

  const scoreBg = (score: number, max: number) => {
    const pct = (score / max) * 100;
    return pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500";
  };

  return (
    <DashboardLayout title="تجسس على المنافسين" subtitle="حلل إعلانات منافسيك واعرف إيه اللي شغال وإيه اللي لأ">
      <div className="max-w-6xl space-y-6">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card gold-border rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> إعلان المنافس
              </h3>

              {adImage ? (
                <div className="relative group">
                  <img src={adImage.preview} alt="Competitor Ad" className="w-full h-56 object-contain rounded-xl bg-surface-2" />
                  <button onClick={() => { setAdImage(null); setAnalysis(null); }} className="absolute top-2 left-2 bg-black/60 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <p className="text-xs text-muted-foreground">ارفع صورة إعلان المنافس (Screenshot)</p>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">اسم المنافس (اختياري)</label>
                <input value={competitorName} onChange={e => setCompetitorName(e.target.value)} placeholder="مثال: زارا، شي إن" className="w-full bg-surface-2 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">نص الإعلان (اختياري)</label>
                <textarea value={adText} onChange={e => setAdText(e.target.value)} rows={3} placeholder="الصق نص الإعلان هنا..." className="w-full bg-surface-2 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
              </div>

              <button onClick={analyze} disabled={loading || (!adImage && !adText.trim())} className="w-full btn-gold py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري التحليل...</> : <><Search className="w-4 h-4" /> حلل الإعلان</>}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3">
            {!analysis && !loading ? (
              <div className="glass-card border border-border/30 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">محلل إعلانات المنافسين</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  ارفع screenshot لإعلان منافسك — الـ AI هيحلل نقاط القوة والضعف ويقترح إعلان أفضل
                </p>
              </div>
            ) : loading ? (
              <div className="glass-card border border-primary/30 rounded-2xl p-12 text-center animate-pulse">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">الـ AI بيحلل إعلان المنافس...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                {/* Overall Score */}
                <div className={`glass-card border rounded-2xl p-6 text-center ${analysis.overallScore >= 70 ? "border-green-500/30 bg-green-500/5" : analysis.overallScore >= 50 ? "border-yellow-500/30 bg-yellow-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                  <span className={`text-5xl font-black ${scoreColor(analysis.overallScore, 100)}`}>{analysis.overallScore}</span>
                  <span className="text-lg text-muted-foreground">/100</span>
                  <p className="text-sm text-muted-foreground mt-1">النتيجة الإجمالية لإعلان المنافس</p>
                  <div className="flex justify-center gap-3 mt-3">
                    <span className="bg-surface-2 px-3 py-1 rounded-lg text-xs font-medium text-foreground">{analysis.adType}</span>
                    <span className="bg-surface-2 px-3 py-1 rounded-lg text-xs font-medium text-muted-foreground">{analysis.targetAudience}</span>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "قوة الـ Hook", value: analysis.scores.hook, max: 25 },
                    { label: "التصميم البصري", value: analysis.scores.visualDesign, max: 25 },
                    { label: "جودة النص", value: analysis.scores.copywriting, max: 25 },
                    { label: "وضوح CTA", value: analysis.scores.cta, max: 25 },
                  ].map(s => (
                    <div key={s.label} className="glass-card border border-border/30 rounded-xl p-3">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-muted-foreground">{s.label}</span>
                        <span className={`font-bold ${scoreColor(s.value, s.max)}`}>{s.value}/{s.max}</span>
                      </div>
                      <div className="w-full h-2 bg-border/30 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBg(s.value, s.max)} transition-all`} style={{ width: `${(s.value / s.max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass-card border border-green-500/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-green-500 flex items-center gap-1.5 mb-2"><CheckCircle className="w-3.5 h-3.5" /> نقاط القوة</h4>
                    {analysis.strengths.map((s, i) => <p key={i} className="text-xs text-muted-foreground leading-relaxed mb-1">✅ {s}</p>)}
                  </div>
                  <div className="glass-card border border-red-500/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-red-500 flex items-center gap-1.5 mb-2"><AlertTriangle className="w-3.5 h-3.5" /> نقاط الضعف</h4>
                    {analysis.weaknesses.map((s, i) => <p key={i} className="text-xs text-muted-foreground leading-relaxed mb-1">❌ {s}</p>)}
                  </div>
                </div>

                {/* Opportunities */}
                <div className="glass-card border border-primary/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 mb-2"><Lightbulb className="w-3.5 h-3.5" /> فرص التحسين</h4>
                  {analysis.opportunities.map((s, i) => <p key={i} className="text-xs text-muted-foreground leading-relaxed mb-1">💡 {s}</p>)}
                </div>

                {/* Suggested Headlines */}
                <div className="glass-card border border-border/30 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2"><TrendingUp className="w-3.5 h-3.5 text-primary" /> عناوين مقترحة أقوى</h4>
                  <div className="space-y-2">
                    {analysis.suggestedHeadlines.map((h, i) => (
                      <div key={i} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2">
                        <span className="text-xs text-foreground font-medium">{h}</span>
                        <button onClick={() => { navigator.clipboard.writeText(h); toast.success("تم النسخ"); }} className="text-xs text-primary hover:underline">نسخ</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color Palette */}
                {analysis.colorPalette?.length > 0 && (
                  <div className="glass-card border border-border/30 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2"><PaletteIcon className="w-3.5 h-3.5 text-primary" /> ألوان الإعلان</h4>
                    <div className="flex gap-2">
                      {analysis.colorPalette.map((color, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-xl border border-border/30" style={{ backgroundColor: color }} />
                          <span className="text-[10px] text-muted-foreground">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generate Better Version */}
                <button
                  onClick={() => {
                    // Navigate to ad creative generator with the improved prompt
                    toast.success("تم نسخ البرومبت — استخدمه في مولّد الإعلانات");
                    navigator.clipboard.writeText(analysis.improvedVersion);
                  }}
                  className="w-full btn-gold py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-4 h-4" /> ولّد إعلان أفضل من ده <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}
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

export default CompetitorSpy;

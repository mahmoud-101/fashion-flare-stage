import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Wand2, Copy, RefreshCw, Download, Check, Save, Calendar, 
  Upload, X, Globe, MessageSquare, FileText, ImageIcon, Sparkles
} from "lucide-react";
import AdScoreCard from "@/components/studio/AdScoreCard";
import CaptionVariations from "@/components/studio/CaptionVariations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingAnnouncer, usePageTitle } from "@/components/AccessibilityHelpers";
import { useCanGenerate } from "@/hooks/useCanGenerate";
import { UpgradeModal } from "@/components/UpgradeModal";
import type { EdgeFunctionError } from "@/hooks/useEdgeFunction";

interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

interface PlanIdea {
  id: string;
  tov: string;
  caption: string;
  scenario: string;
  schedule: string;
  image: ImageFile | null;
  isLoadingImage: boolean;
  imageError: string | null;
}

const TARGET_MARKETS = [
  { id: "egypt", label: "مصر 🇪🇬" },
  { id: "saudi", label: "السعودية 🇸🇦" },
  { id: "uae", label: "الإمارات 🇦🇪" },
  { id: "gulf", label: "الخليج" },
  { id: "global", label: "عالمي 🌍" },
];

const DIALECTS = [
  { id: "egyptian", label: "مصري 🇪🇬" },
  { id: "saudi", label: "سعودي 🇸🇦" },
  { id: "emirati", label: "إماراتي 🇦🇪" },
  { id: "formal", label: "فصحى" },
  { id: "english", label: "English" },
];

const AIWriter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checkAndProceed, showUpgradeModal, setShowUpgradeModal, limitType, currentUsed, currentLimit } = useCanGenerate();

  const [prompt, setPrompt] = useState("");
  const [targetMarket, setTargetMarket] = useState("egypt");
  const [dialect, setDialect] = useState("egyptian");
  const [productImages, setProductImages] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [ideas, setIdeas] = useState<PlanIdea[]>([]);
  const [error, setError] = useState<EdgeFunctionError | null>(null);

  usePageTitle("مخطط الحملات الذكي");
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);

    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          if (file.size > 10 * 1024 * 1024) {
            toast.error(`${file.name} أكبر من 10MB`);
            return null;
          }
          return new Promise<ImageFile>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(",")[1];
              resolve({ base64, mimeType: file.type, name: file.name });
            };
            reader.readAsDataURL(file);
          });
        })
      );
      const valid = uploaded.filter((f): f is ImageFile => f !== null);
      setProductImages((prev) => [...prev, ...valid]);
    } catch {
      setError({ code: 'UNKNOWN', message: 'فشل رفع الصور', isRetryable: false });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const onCreatePlan = async () => {
    if (!prompt.trim()) {
      setError({ code: 'INVALID_INPUT', message: 'يرجى كتابة وصف الحملة', isRetryable: false });
      return;
    }

    checkAndProceed("content_generation", async () => {
      setIsGeneratingPlan(true);
      setError(null);
      setIdeas([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-campaign-plan", {
        body: {
          prompt: prompt.slice(0, 2000),
          targetMarket: TARGET_MARKETS.find((m) => m.id === targetMarket)?.label || targetMarket,
          dialect: DIALECTS.find((d) => d.id === dialect)?.label || dialect,
          productImage: productImages[0] || null,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.ideas || !Array.isArray(data.ideas)) throw new Error("فشل توليد الخطة");

      const planIdeas: PlanIdea[] = data.ideas.map((idea: Record<string, string>, idx: number) => ({
        id: idea.id || `idea-${idx}`,
        tov: idea.tov || "",
        caption: idea.caption || "",
        scenario: idea.scenario || "",
        schedule: idea.schedule || "",
        image: null,
        isLoadingImage: false,
        imageError: null,
      }));

      setIdeas(planIdeas);
      toast.success("🎯 تم توليد خطة الحملة — 9 بوستات!");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "حدث خطأ أثناء التوليد";
      const isRetryable = !errMsg.includes('يرجى');
      setError({ code: 'UNKNOWN', message: errMsg, isRetryable });
      toast.error(errMsg);
    } finally {
      setIsGeneratingPlan(false);
    }
    }); // end checkAndProceed
  };

  const onGenerateIdeaImage = async (ideaId: string) => {
    const idx = ideas.findIndex((i) => i.id === ideaId);
    if (idx === -1) return;

    setIdeas((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], isLoadingImage: true, imageError: null };
      return next;
    });

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-campaign-images", {
        body: {
          productImage: productImages[0] || null,
          scenarios: [ideas[idx].scenario],
          mood: "Minimal White",
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const imageResult = data?.results?.[0];
      if (!imageResult?.image) throw new Error("فشل توليد الصورة");

      setIdeas((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], image: imageResult.image, isLoadingImage: false };
        return next;
      });
      toast.success("✨ تم توليد صورة البوست");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "فشل توليد الصورة";
      setIdeas((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], isLoadingImage: false, imageError: errMsg };
        return next;
      });
      toast.error(errMsg);
    }
  };

  const updateIdea = (id: string, field: keyof PlanIdea, value: string) => {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const handleDownload = (image: ImageFile, label: string) => {
    const link = document.createElement("a");
    link.href = `data:${image.mimeType};base64,${image.base64}`;
    link.download = `moda-campaign-${label}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Load Tajawal font (base64 would be ideal, but we use built-in for now with RTL workaround)
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // Helper for RTL text (reverse for jsPDF)
    const rtlText = (text: string) => text.split("").reverse().join("");

    // Header
    doc.setFontSize(22);
    doc.setTextColor(201, 169, 110); // Gold
    doc.text("Moda.ai", pageWidth - margin, y, { align: "right" });
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageWidth, 297, "F"); // Dark background

    // Re-draw header on dark bg
    y = 20;
    doc.setTextColor(201, 169, 110);
    doc.setFontSize(20);
    doc.text("Moda.ai - Campaign Plan", pageWidth - margin, y, { align: "right" });
    y += 12;

    // Meta info
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    const marketLabel = TARGET_MARKETS.find((m) => m.id === targetMarket)?.label || targetMarket;
    const dialectLabel = DIALECTS.find((d) => d.id === dialect)?.label || dialect;
    doc.text(`Market: ${marketLabel} | Dialect: ${dialectLabel}`, pageWidth - margin, y, { align: "right" });
    y += 8;
    doc.text(`Date: ${new Date().toLocaleDateString("ar-EG")}`, pageWidth - margin, y, { align: "right" });
    y += 12;

    // Divider
    doc.setDrawColor(201, 169, 110);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Ideas
    ideas.forEach((idea, idx) => {
      if (y > 260) {
        doc.addPage();
        doc.setFillColor(15, 15, 15);
        doc.rect(0, 0, pageWidth, 297, "F");
        y = 20;
      }

      // Post number + TOV
      doc.setFontSize(12);
      doc.setTextColor(201, 169, 110);
      doc.text(`#${idx + 1} — ${idea.tov}`, pageWidth - margin, y, { align: "right" });
      y += 7;

      // Caption (split into lines)
      doc.setFontSize(9);
      doc.setTextColor(220, 220, 220);
      const lines = doc.splitTextToSize(idea.caption, contentWidth);
      lines.forEach((line: string) => {
        if (y > 275) {
          doc.addPage();
          doc.setFillColor(15, 15, 15);
          doc.rect(0, 0, pageWidth, 297, "F");
          y = 20;
        }
        doc.text(line, pageWidth - margin, y, { align: "right" });
        y += 5;
      });

      // Schedule
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(`Schedule: ${idea.schedule}`, pageWidth - margin, y, { align: "right" });
      y += 10;

      // Divider
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Generated by Moda.ai", pageWidth / 2, 290, { align: "center" });

    doc.save(`moda-campaign-plan-${Date.now()}.pdf`);
    toast.success("تم تصدير الـ PDF بنجاح");
  };

  const saveAllToLibrary = async () => {
    if (!user || ideas.length === 0) return;
    setSaving(true);

    try {
      const inserts = ideas.map((idea) => ({
        user_id: user.id,
        title: idea.tov || prompt.slice(0, 50),
        content: idea.caption,
        platform: "instagram",
        content_type: "campaign-post",
        dialect: DIALECTS.find((d) => d.id === dialect)?.label || dialect,
        product_name: prompt,
        status: "draft",
      }));

      const { error: insertError } = await supabase.from("saved_content").insert(inserts);
      if (insertError) throw insertError;

      toast.success("✅ تم حفظ الحملة في المكتبة");
      navigate("/dashboard/library");
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="مخطط الحملات الذكي" subtitle="خطط حملة كاملة 9 بوستات بالذكاء الاصطناعي">
      <div className="max-w-7xl space-y-6">
        {/* Input Panel */}
        <div className="glass-card gold-border rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Product Images */}
            <div className="lg:w-1/3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                صور المنتج (اختياري)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 bg-surface-2/50"
              >
                {productImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 p-3 w-full h-full">
                    {productImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={`data:${img.mimeType};base64,${img.base64}`}
                          alt={img.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(idx);
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">ارفع صور المنتج</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>

            {/* Campaign Settings */}
            <div className="lg:w-2/3 space-y-5">
              {/* Campaign Vision */}
              <div>
                <label className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> رؤية الحملة
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="مثال: إطلاق كولكشن صيفي جديد — فساتين كتان بألوان الباستيل — الجمهور المستهدف: بنات الجامعة والموظفات..."
                  className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors min-h-[100px] resize-none"
                />
              </div>

              {/* Market & Dialect */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-4 border border-border/30">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" /> السوق المستهدف
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_MARKETS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setTargetMarket(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          targetMarket === m.id
                            ? "btn-gold"
                            : "glass-card border border-border/30 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-xl p-4 border border-border/30">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> لهجة المحتوى
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DIALECTS.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDialect(d.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          dialect === d.id
                            ? "btn-gold"
                            : "glass-card border border-border/30 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={onCreatePlan}
                disabled={isGeneratingPlan || !prompt.trim()}
                className="w-full btn-gold py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPlan ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    جاري بناء الخطة...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    أنشئ خطة 9 بوستات
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading Announcer */}
        <LoadingAnnouncer isLoading={isGeneratingPlan} message="جاري بناء خطة الحملة..." />

        {/* Error */}
        {error && (
          <ErrorCard error={error} onRetry={error.isRetryable ? onCreatePlan : undefined} compact />
        )}

        {/* Actions Bar */}
        {ideas.length > 0 && (
          <div className="flex items-center justify-between glass-card gold-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground">
              <span className="text-primary font-bold">{ideas.length}</span> بوست في الخطة
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 glass-card border border-border/50 rounded-lg text-sm font-medium hover:border-primary/40 transition-colors"
              >
                <FileText className="w-4 h-4" />
                تصدير PDF
              </button>
              <button
                onClick={saveAllToLibrary}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 btn-gold rounded-lg text-sm font-bold disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                حفظ الكل في المكتبة
              </button>
            </div>
          </div>
        )}

        {/* Ideas Grid */}
        {ideas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea, idx) => (
              <div
                key={idea.id}
                className="glass-card gold-border rounded-2xl overflow-hidden flex flex-col group hover:border-primary/50 transition-all"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Image Area */}
                <div className="aspect-[3/4] bg-surface-2 relative overflow-hidden flex items-center justify-center">
                  {idea.isLoadingImage ? (
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground">جاري توليد الصورة...</span>
                    </div>
                  ) : idea.image ? (
                    <div className="w-full h-full relative group/img">
                      <img
                        src={`data:${idea.image.mimeType};base64,${idea.image.base64}`}
                        alt={`Post ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleDownload(idea.image!, `post-${idx + 1}`)}
                          className="p-3 bg-primary text-primary-foreground rounded-full hover:scale-110 transition-transform"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onGenerateIdeaImage(idea.id)}
                          className="p-3 bg-white/20 text-white rounded-full hover:scale-110 transition-transform border border-white/30"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-primary/50" />
                      </div>
                      <button
                        onClick={() => onGenerateIdeaImage(idea.id)}
                        className="px-4 py-2 btn-gold rounded-full text-xs font-bold"
                      >
                        توليد الصورة
                      </button>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary border border-primary/30">
                    POST {String(idx + 1).padStart(2, "0")}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 flex-1">
                  <div>
                    <label className="text-xs font-bold text-primary uppercase tracking-wider mb-1 block">Hook</label>
                    <input
                      value={idea.tov}
                      onChange={(e) => updateIdea(idea.id, "tov", e.target.value)}
                      className="w-full bg-surface-2 rounded-lg px-3 py-2 text-sm font-bold text-foreground border border-border/30 focus:border-primary/50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Caption
                    </label>
                    <textarea
                      value={idea.caption}
                      onChange={(e) => updateIdea(idea.id, "caption", e.target.value)}
                      className="w-full bg-surface-2 rounded-lg px-3 py-2 text-sm text-foreground border border-border/30 focus:border-primary/50 focus:outline-none resize-none h-24"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {idea.schedule}
                    </span>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(idea.caption);
                        toast.success("تم نسخ الكابشن");
                      }}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> نسخ
                    </button>
                  </div>

                  {/* Ad Score */}
                  <AdScoreCard content={idea.caption} contentType="كابشن حملة فاشون" />

                  {/* Caption Variations */}
                  <CaptionVariations
                    caption={idea.caption}
                    dialect={DIALECTS.find((d) => d.id === dialect)?.label}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {ideas.length === 0 && !isGeneratingPlan && (
          <div className="glass-card gold-border rounded-2xl p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wand2 className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">مخطط الحملات الذكي</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              اكتب رؤية حملتك والسوق المستهدف
              <br />
              وخلّي الذكاء الاصطناعي يبني لك خطة كاملة 9 بوستات
            </p>
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

export default AIWriter;

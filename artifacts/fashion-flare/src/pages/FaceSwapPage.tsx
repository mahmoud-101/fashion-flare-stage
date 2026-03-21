import DashboardLayout from "@/components/DashboardLayout";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, ArrowLeftRight, Download, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FaceSwapPage = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sourceRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (type: "source" | "target") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (type === "source") setSourceImage(dataUrl);
      else setTargetImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSwap = async () => {
    if (!sourceImage || !targetImage) {
      toast.error("ارفع الصورتين أولاً");
      return;
    }
    setLoading(true);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke("face-swap", {
        body: { sourceImage, targetImage },
      });
      if (error) throw error;
      if (data?.resultImage) {
        setResultImage(data.resultImage);
        toast.success("تم تبديل الوجه بنجاح!");
      } else {
        throw new Error("لم يتم إنشاء صورة");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "حدث خطأ أثناء تبديل الوجه");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = `face-swap-${Date.now()}.png`;
    a.click();
  };

  return (
    <DashboardLayout title="تبديل الوجوه" subtitle="Face Swap بالذكاء الاصطناعي">
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground mb-2">تبديل الوجوه <span className="text-gradient-gold">Face Swap</span></h1>
          <p className="text-muted-foreground">بدّل وجه الموديل في صور منتجاتك — مثالي لعرض المنتج على موديلات مختلفة</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Source Face */}
          <Card className="glass-card gold-border">
            <CardHeader><CardTitle className="text-base">الوجه الجديد (المصدر)</CardTitle></CardHeader>
            <CardContent>
              <input ref={sourceRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect("source")} />
              {sourceImage ? (
                <div className="relative group cursor-pointer" onClick={() => sourceRef.current?.click()}>
                  <img src={sourceImage} alt="Source" className="w-full h-64 object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">تغيير الصورة</span>
                  </div>
                </div>
              ) : (
                <button onClick={() => sourceRef.current?.click()} className="w-full h-64 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">ارفع صورة الوجه الجديد</span>
                </button>
              )}
            </CardContent>
          </Card>

          {/* Target Image */}
          <Card className="glass-card gold-border">
            <CardHeader><CardTitle className="text-base">الصورة الأصلية (الهدف)</CardTitle></CardHeader>
            <CardContent>
              <input ref={targetRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect("target")} />
              {targetImage ? (
                <div className="relative group cursor-pointer" onClick={() => targetRef.current?.click()}>
                  <img src={targetImage} alt="Target" className="w-full h-64 object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">تغيير الصورة</span>
                  </div>
                </div>
              ) : (
                <button onClick={() => targetRef.current?.click()} className="w-full h-64 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">ارفع صورة المنتج/الموديل</span>
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mb-8">
          <Button onClick={handleSwap} disabled={loading || !sourceImage || !targetImage} className="btn-gold px-8 py-3 rounded-xl text-sm font-bold gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
            {loading ? "جاري التبديل..." : "بدّل الوجه الآن"}
          </Button>
        </div>

        {resultImage && (
          <Card className="glass-card gold-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">النتيجة</CardTitle>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" /> تحميل
              </Button>
            </CardHeader>
            <CardContent>
              <img src={resultImage} alt="Result" className="w-full max-h-[500px] object-contain rounded-xl" />
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 rounded-xl p-4">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>تعمل هذه الأداة بالذكاء الاصطناعي لتبديل الوجوه بشكل طبيعي. للحصول على أفضل نتائج، استخدم صور واضحة بإضاءة جيدة مع وجه مواجه للكاميرا.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FaceSwapPage;

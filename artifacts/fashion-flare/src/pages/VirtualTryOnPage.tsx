import DashboardLayout from "@/components/DashboardLayout";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Shirt, Download, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VirtualTryOnPage = () => {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const personRef = useRef<HTMLInputElement>(null);
  const garmentRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (type: "person" | "garment") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (type === "person") setPersonImage(dataUrl);
      else setGarmentImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleTryOn = async () => {
    if (!personImage || !garmentImage) {
      toast.error("ارفع الصورتين أولاً");
      return;
    }
    setLoading(true);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke("virtual-try-on", {
        body: { personImage, garmentImage },
      });
      if (error) throw error;
      if (data?.resultImage) {
        setResultImage(data.resultImage);
        toast.success("تم تجربة المنتج بنجاح!");
      } else {
        throw new Error("لم يتم إنشاء صورة");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "حدث خطأ أثناء التجربة");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = `virtual-tryon-${Date.now()}.png`;
    a.click();
  };

  return (
    <DashboardLayout title="تجربة افتراضية" subtitle="Virtual Try-On">
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground mb-2">تجربة افتراضية <span className="text-gradient-gold">Virtual Try-On</span></h1>
          <p className="text-muted-foreground">عملاءك يشوفوا شكل المنتج عليهم قبل الشراء — زوّد مبيعاتك وقلّل المرتجعات</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Person Image */}
          <Card className="glass-card gold-border">
            <CardHeader><CardTitle className="text-base">صورة الشخص</CardTitle></CardHeader>
            <CardContent>
              <input ref={personRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect("person")} />
              {personImage ? (
                <div className="relative group cursor-pointer" onClick={() => personRef.current?.click()}>
                  <img src={personImage} alt="Person" className="w-full h-72 object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">تغيير الصورة</span>
                  </div>
                </div>
              ) : (
                <button onClick={() => personRef.current?.click()} className="w-full h-72 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">ارفع صورة الشخص (وقفة كاملة)</span>
                  <span className="text-xs text-muted-foreground/60">يفضّل صورة واضحة بخلفية بسيطة</span>
                </button>
              )}
            </CardContent>
          </Card>

          {/* Garment Image */}
          <Card className="glass-card gold-border">
            <CardHeader><CardTitle className="text-base">صورة المنتج (الملبس)</CardTitle></CardHeader>
            <CardContent>
              <input ref={garmentRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect("garment")} />
              {garmentImage ? (
                <div className="relative group cursor-pointer" onClick={() => garmentRef.current?.click()}>
                  <img src={garmentImage} alt="Garment" className="w-full h-72 object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">تغيير الصورة</span>
                  </div>
                </div>
              ) : (
                <button onClick={() => garmentRef.current?.click()} className="w-full h-72 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors">
                  <Shirt className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">ارفع صورة المنتج</span>
                  <span className="text-xs text-muted-foreground/60">فستان، تيشيرت، عباية، إلخ</span>
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mb-8">
          <Button onClick={handleTryOn} disabled={loading || !personImage || !garmentImage} className="btn-gold px-8 py-3 rounded-xl text-sm font-bold gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shirt className="w-4 h-4" />}
            {loading ? "جاري التجربة..." : "جرّب المنتج الآن"}
          </Button>
        </div>

        {resultImage && (
          <Card className="glass-card gold-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">النتيجة — شكل المنتج على الشخص</CardTitle>
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
          <p>التجربة الافتراضية تعمل بأفضل شكل مع صور واضحة للشخص (وقفة أمامية كاملة) وصور منتج بخلفية بيضاء أو شفافة.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VirtualTryOnPage;

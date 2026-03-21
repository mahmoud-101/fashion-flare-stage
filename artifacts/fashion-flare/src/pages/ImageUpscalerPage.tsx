import DashboardLayout from "@/components/DashboardLayout";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, ZoomIn, Download, Loader2, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ImageUpscalerPage = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState("2");
  const [originalSize, setOriginalSize] = useState<{ w: number; h: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setOriginalImage(dataUrl);
      setResultImage(null);
      const img = new window.Image();
      img.onload = () => setOriginalSize({ w: img.width, h: img.height });
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleUpscale = async () => {
    if (!originalImage) {
      toast.error("ارفع صورة أولاً");
      return;
    }
    setLoading(true);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke("upscale-image", {
        body: { image: originalImage, scale: parseInt(scale) },
      });
      if (error) throw error;
      if (data?.resultImage) {
        setResultImage(data.resultImage);
        toast.success(`تم تكبير الصورة ${scale}x بنجاح!`);
      } else {
        throw new Error("لم يتم إنشاء صورة");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "حدث خطأ أثناء تكبير الصورة");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = `upscaled-${scale}x-${Date.now()}.png`;
    a.click();
  };

  const newSize = originalSize ? { w: originalSize.w * parseInt(scale), h: originalSize.h * parseInt(scale) } : null;

  return (
    <DashboardLayout title="تكبير الصور" subtitle="AI Upscaler">
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground mb-2">تكبير الصور <span className="text-gradient-gold">AI Upscaler</span></h1>
          <p className="text-muted-foreground">كبّر صور منتجاتك لدقة عالية تصل لـ 4K — مثالي للطباعة والإعلانات الكبيرة</p>
        </div>

        <Card className="glass-card gold-border mb-6">
          <CardContent className="pt-6">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            {originalImage ? (
              <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                <img src={originalImage} alt="Original" className="w-full max-h-[400px] object-contain rounded-xl" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm">تغيير الصورة</span>
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="w-full h-64 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors">
                <Upload className="w-10 h-10 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">ارفع الصورة اللي عايز تكبّرها</span>
                <span className="text-xs text-muted-foreground/60">PNG, JPG, WEBP — حتى 10MB</span>
              </button>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mb-8">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">مقياس التكبير:</span>
            <Select value={scale} onValueChange={setScale}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2x</SelectItem>
                <SelectItem value="3">3x</SelectItem>
                <SelectItem value="4">4x (4K)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {originalSize && (
            <div className="text-xs text-muted-foreground bg-surface-2 px-3 py-1.5 rounded-lg">
              {originalSize.w}×{originalSize.h} → <span className="text-primary font-bold">{newSize?.w}×{newSize?.h}</span>
            </div>
          )}

          <Button onClick={handleUpscale} disabled={loading || !originalImage} className="btn-gold px-8 py-3 rounded-xl text-sm font-bold gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ZoomIn className="w-4 h-4" />}
            {loading ? "جاري التكبير..." : `كبّر ${scale}x`}
          </Button>
        </div>

        {resultImage && (
          <Card className="glass-card gold-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">الصورة المكبّرة ({scale}x)</CardTitle>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" /> تحميل HD
              </Button>
            </CardHeader>
            <CardContent>
              <img src={resultImage} alt="Upscaled" className="w-full max-h-[500px] object-contain rounded-xl" />
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 rounded-xl p-4">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>يستخدم الذكاء الاصطناعي لإضافة تفاصيل جديدة أثناء التكبير — مش مجرد تكبير بيكسلات. النتيجة صورة حادة وواضحة بدقة عالية.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ImageUpscalerPage;

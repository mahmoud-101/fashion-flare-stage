import DashboardLayout from "@/components/DashboardLayout";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Wand2, Download, Loader2, Info, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const styles = [
  { value: "realistic", label: "واقعي" },
  { value: "fashion-editorial", label: "فاشون تحريري" },
  { value: "watercolor", label: "ألوان مائية" },
  { value: "digital-art", label: "فن رقمي" },
  { value: "flat-design", label: "تصميم مسطح" },
];

const SketchToImagePage = () => {
  const [sketchImage, setSketchImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("fashion-editorial");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [useCanvas, setUseCanvas] = useState(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 512;
    canvas.height = 512;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setUseCanvas(true);
    setSketchImage(null);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 512);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSketchImage(ev.target?.result as string);
      setUseCanvas(false);
    };
    reader.readAsDataURL(file);
  };

  const getSketchData = (): string | null => {
    if (useCanvas && canvasRef.current) return canvasRef.current.toDataURL("image/png");
    return sketchImage;
  };

  const handleGenerate = async () => {
    const sketch = getSketchData();
    if (!sketch) {
      toast.error("ارسم سكتش أو ارفع صورة أولاً");
      return;
    }
    if (!prompt.trim()) {
      toast.error("اكتب وصف للتصميم اللي عايزه");
      return;
    }
    setLoading(true);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke("sketch-to-image", {
        body: { sketch, prompt: prompt.trim(), style },
      });
      if (error) throw error;
      if (data?.resultImage) {
        setResultImage(data.resultImage);
        toast.success("تم تحويل السكتش لصورة احترافية!");
      } else {
        throw new Error("لم يتم إنشاء صورة");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "حدث خطأ أثناء التحويل");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = `sketch-to-image-${Date.now()}.png`;
    a.click();
  };

  return (
    <DashboardLayout title="سكتش لصورة" subtitle="Sketch to Image">
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground mb-2">من سكتش لصورة <span className="text-gradient-gold">Sketch to Image</span></h1>
          <p className="text-muted-foreground">ارسم فكرة التصميم بشكل بسيط وحوّلها لصورة احترافية — مثالي لتصميم الملابس والإكسسوارات</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Sketch Input */}
          <Card className="glass-card gold-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">السكتش</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={initCanvas}>ارسم</Button>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>ارفع صورة</Button>
              </div>
            </CardHeader>
            <CardContent>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              {useCanvas ? (
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="w-full aspect-square rounded-xl border border-border/50 cursor-crosshair touch-none"
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
                  />
                  <Button variant="ghost" size="sm" onClick={clearCanvas} className="absolute top-2 left-2 gap-1 text-xs">
                    <Trash2 className="w-3 h-3" /> مسح
                  </Button>
                </div>
              ) : sketchImage ? (
                <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                  <img src={sketchImage} alt="Sketch" className="w-full aspect-square object-contain rounded-xl bg-white" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">تغيير الصورة</span>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-square border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-3">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">اضغط "ارسم" أو "ارفع صورة"</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <div className="flex flex-col gap-4">
            <Card className="glass-card gold-border flex-1">
              <CardHeader><CardTitle className="text-base">وصف التصميم</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="مثال: فستان سهرة أسود طويل بأكمام طويلة من الدانتيل، أنيق وعصري..."
                  className="min-h-[120px] resize-none"
                  dir="rtl"
                />
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">أسلوب الصورة</label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {styles.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleGenerate} disabled={loading} className="btn-gold py-3 rounded-xl text-sm font-bold gap-2 w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {loading ? "جاري التحويل..." : "حوّل السكتش لصورة"}
            </Button>
          </div>
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
          <p>كل ما يكون السكتش والوصف أوضح، كل ما النتيجة تكون أحسن. جرّب تضيف تفاصيل زي اللون والخامة والطول.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SketchToImagePage;

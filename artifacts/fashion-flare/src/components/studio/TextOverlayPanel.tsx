import { useState, useRef, useCallback } from "react";
import { Type, Download, Plus } from "lucide-react";
import { toast } from "sonner";

interface TextOverlayPanelProps {
  imageSrc: string;
  onClose: () => void;
}

type Position = "top" | "center" | "bottom";
type TextColor = "white" | "gold" | "black";
type FontSize = "small" | "medium" | "large";

const POSITION_OPTIONS: { label: string; value: Position }[] = [
  { label: "أعلى", value: "top" },
  { label: "وسط", value: "center" },
  { label: "أسفل", value: "bottom" },
];

const COLOR_OPTIONS: { label: string; value: TextColor; hex: string }[] = [
  { label: "أبيض", value: "white", hex: "#FFFFFF" },
  { label: "ذهبي", value: "gold", hex: "#D4A843" },
  { label: "أسود", value: "black", hex: "#1A1A1A" },
];

const SIZE_OPTIONS: { label: string; value: FontSize; px: number }[] = [
  { label: "صغير", value: "small", px: 32 },
  { label: "متوسط", value: "medium", px: 52 },
  { label: "كبير", value: "large", px: 72 },
];

const TextOverlayPanel = ({ imageSrc, onClose }: TextOverlayPanelProps) => {
  const [headline, setHeadline] = useState("");
  const [price, setPrice] = useState("");
  const [cta, setCta] = useState("");
  const [position, setPosition] = useState<Position>("bottom");
  const [textColor, setTextColor] = useState<TextColor>("white");
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderToCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const img = new Image();
    img.crossOrigin = "anonymous";

    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const color = COLOR_OPTIONS.find((c) => c.value === textColor)?.hex || "#FFFFFF";
        const size = SIZE_OPTIONS.find((s) => s.value === fontSize)?.px || 52;
        const scale = Math.max(canvas.width / 1080, 1);
        const scaledSize = Math.round(size * scale);

        ctx.textAlign = "center";
        ctx.fillStyle = color;
        ctx.direction = "rtl";

        const cx = canvas.width / 2;
        let baseY: number;
        if (position === "top") baseY = canvas.height * 0.15;
        else if (position === "center") baseY = canvas.height * 0.45;
        else baseY = canvas.height * 0.72;

        // Semi-transparent backdrop
        const lines = [headline, price, cta].filter(Boolean);
        if (lines.length > 0) {
          const blockH = lines.length * (scaledSize * 1.5) + scaledSize;
          const blockY = baseY - scaledSize * 0.8;
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.beginPath();
          const r = 20 * scale;
          const bx = cx - canvas.width * 0.4;
          const bw = canvas.width * 0.8;
          ctx.roundRect(bx, blockY, bw, blockH, r);
          ctx.fill();
        }

        ctx.fillStyle = color;
        let y = baseY;

        if (headline) {
          ctx.font = `bold ${scaledSize}px "Segoe UI", Tahoma, Arial, sans-serif`;
          ctx.fillText(headline, cx, y);
          y += scaledSize * 1.5;
        }
        if (price) {
          ctx.font = `bold ${Math.round(scaledSize * 0.85)}px "Segoe UI", Tahoma, Arial, sans-serif`;
          ctx.fillText(price, cx, y);
          y += scaledSize * 1.5;
        }
        if (cta) {
          // CTA pill
          const ctaSize = Math.round(scaledSize * 0.7);
          ctx.font = `bold ${ctaSize}px "Segoe UI", Tahoma, Arial, sans-serif`;
          const tw = ctx.measureText(cta).width;
          const pillW = tw + ctaSize * 2;
          const pillH = ctaSize * 2;
          const pillX = cx - pillW / 2;
          const pillY = y - ctaSize * 0.8;

          // Pill background: always high-contrast
          const pillBg = textColor === "black" ? "#1A1A1A" : textColor === "gold" ? "#D4A843" : "#FFFFFF";
          const pillText = textColor === "black" ? "#FFFFFF" : "#1A1A1A";

          ctx.fillStyle = pillBg;
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
          ctx.fill();

          ctx.fillStyle = pillText;
          ctx.fillText(cta, cx, y + ctaSize * 0.3);
        }

        resolve(canvas);
      };
      img.onerror = () => resolve(null);
      img.src = imageSrc;
    });
  }, [imageSrc, headline, price, cta, position, textColor, fontSize]);

  const handlePreview = async () => {
    if (!headline && !price && !cta) return toast.error("اكتب نص واحد على الأقل");
    const canvas = await renderToCanvas();
    if (canvas) {
      setPreviewUrl(canvas.toDataURL("image/png"));
      toast.success("تم إضافة النص!");
    }
  };

  const handleDownload = async () => {
    const src = previewUrl || imageSrc;
    const canvas = previewUrl ? null : await renderToCanvas();
    const url = canvas ? canvas.toDataURL("image/png") : src;

    const a = document.createElement("a");
    a.href = url;
    a.download = `moda-overlay-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("تم تحميل الصورة النهائية");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-auto flex flex-col lg:flex-row">
        {/* Preview */}
        <div className="flex-1 p-4 flex items-center justify-center bg-muted/30 min-h-[300px]">
          <img
            src={previewUrl || imageSrc}
            alt="Preview"
            className="max-w-full max-h-[70vh] rounded-xl object-contain"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="w-full lg:w-80 p-5 space-y-4 border-t lg:border-t-0 lg:border-r border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" /> طبقة النصوص
            </h3>
            <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">عنوان الإعلان</label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="خصم 50%"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">السعر</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="299 ريال"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">CTA</label>
            <input
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="اطلب الآن"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Position */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">موضع النص</label>
            <div className="flex gap-2">
              {POSITION_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPosition(p.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    position === p.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">لون النص</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setTextColor(c.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    textColor === c.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: c.hex }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">حجم الخط</label>
            <div className="flex gap-2">
              {SIZE_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setFontSize(s.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    fontSize === s.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handlePreview}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> أضف النص للصورة
          </button>
          <button
            onClick={handleDownload}
            className="w-full bg-secondary text-foreground py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-border"
          >
            <Download className="w-4 h-4" /> تحميل الصورة النهائية
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextOverlayPanel;

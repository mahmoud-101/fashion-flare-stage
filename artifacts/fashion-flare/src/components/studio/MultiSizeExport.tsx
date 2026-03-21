import { useState } from "react";
import { Download, Package, Check } from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";

interface MultiSizeExportProps {
  imageSrc: string;
  label?: string;
}

const SIZES = [
  { name: "Story (1080×1920)", w: 1080, h: 1920, file: "story" },
  { name: "Feed Square (1080×1080)", w: 1080, h: 1080, file: "feed-square" },
  { name: "Feed Portrait (1080×1350)", w: 1080, h: 1350, file: "feed-portrait" },
  { name: "Banner (1200×628)", w: 1200, h: 628, file: "banner" },
  { name: "WhatsApp (800×800)", w: 800, h: 800, file: "whatsapp" },
];

const resizeImage = (src: string, w: number, h: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Cover-fit: scale & center-crop
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      const dx = (w - sw) / 2;
      const dy = (h - sh) / 2;
      ctx.drawImage(img, dx, dy, sw, sh);

      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas blob failed"))), "image/png");
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });

const MultiSizeExport = ({ imageSrc, label = "campaign" }: MultiSizeExportProps) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    toast.info("جاري تجهيز المقاسات...");

    try {
      const zip = new JSZip();
      const folder = zip.folder("moda-export")!;

      await Promise.all(
        SIZES.map(async (s) => {
          const blob = await resizeImage(imageSrc, s.w, s.h);
          folder.file(`${label}-${s.file}-${s.w}x${s.h}.png`, blob);
        })
      );

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moda-${label}-all-sizes.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("تم تحميل كل المقاسات كـ ZIP!");
    } catch {
      toast.error("فشل التصدير، حاول مرة أخرى");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground border border-border hover:border-primary/40 transition-all disabled:opacity-50"
    >
      {exporting ? (
        <>
          <Package className="w-3.5 h-3.5 animate-pulse" /> جاري التصدير...
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5" /> تصدير بكل المقاسات
        </>
      )}
    </button>
  );
};

export default MultiSizeExport;

import { useState } from "react";
import { Scissors, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface BackgroundRemovalProps {
  imageBase64: string;
  mimeType: string;
  preview: string;
  onResult: (newBase64: string, newPreview: string) => void;
}

const BackgroundRemoval = ({ imageBase64, mimeType, preview, onResult }: BackgroundRemovalProps) => {
  const [removing, setRemoving] = useState(false);
  const [resultPreview, setResultPreview] = useState<string | null>(null);

  const handleRemove = async () => {
    setRemoving(true);
    toast.info("جاري إزالة الخلفية... قد يستغرق بضع ثوانٍ");

    try {
      const { removeBackground } = await import("@imgly/background-removal");

      // Convert base64 to blob
      const byteChars = atob(imageBase64);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: mimeType });

      const resultBlob = await removeBackground(blob);

      // Convert result back to base64
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const b64 = dataUrl.split(",")[1];
        setResultPreview(dataUrl);
        onResult(b64, dataUrl);
        toast.success("تم إزالة الخلفية بنجاح!");
      };
      reader.readAsDataURL(resultBlob);
    } catch {
      toast.error("فشلت إزالة الخلفية، حاول مرة أخرى");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleRemove}
        disabled={removing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground border border-border hover:border-primary/40 transition-all disabled:opacity-50"
      >
        <Scissors className="w-3.5 h-3.5" />
        {removing ? "جاري الإزالة..." : "إزالة الخلفية"}
      </button>

      {resultPreview && (
        <div className="flex items-center gap-2">
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
            <img src={preview} alt="قبل" className="w-full h-full object-cover" />
          </div>
          <ArrowRight className="w-4 h-4 text-primary shrink-0" />
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-primary/50 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZGRkIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNkZGQiLz48L3N2Zz4=')]">
            <img src={resultPreview} alt="بعد" className="w-full h-full object-cover" />
          </div>
          <span className="text-[10px] text-primary font-bold">✓ تمت الإزالة</span>
        </div>
      )}
    </div>
  );
};

export default BackgroundRemoval;

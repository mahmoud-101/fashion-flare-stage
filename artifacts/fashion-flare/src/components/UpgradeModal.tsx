import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Image, Video, Check, X } from "lucide-react";
import { Link } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType?: "content" | "image" | "reel";
  currentUsed?: number;
  currentLimit?: number;
}

const limitLabels: Record<string, { label: string; icon: React.ElementType }> = {
  content: { label: "توليدات المحتوى", icon: Zap },
  image: { label: "توليدات الصور", icon: Image },
  reel: { label: "توليدات الريلز", icon: Video },
};

const proFeatures = [
  "50 محتوى يومياً بدل 5",
  "30 صورة يومياً بدل 3",
  "10 ريلز يومياً بدل 1",
  "ربط متجرك (Salla/Shopify)",
  "جدولة المحتوى التلقائية",
  "تصدير دفعي للصور",
  "بدون علامة مائية",
];

export function UpgradeModal({ 
  open, 
  onOpenChange, 
  limitType = "content",
  currentUsed = 5,
  currentLimit = 5 
}: UpgradeModalProps) {
  const { label, icon: Icon } = limitLabels[limitType] || limitLabels.content;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card border-primary/30">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            وصلت لحد خطتك المجانية! 🚀
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            استخدمت <span className="text-primary font-bold">{currentUsed}/{currentLimit}</span> من {label} اليوم
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="glass-card rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">الخطة الاحترافية</span>
              <span className="mr-auto text-lg font-black text-gradient-gold">199 ر.س/شهر</span>
            </div>
            <ul className="space-y-2">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 ml-2" />
              لاحقاً
            </Button>
            <Button asChild className="flex-1 btn-gold border-0">
              <Link to="/dashboard/billing">
                <Crown className="w-4 h-4 ml-2" />
                ترقية الآن
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            الحدود بتتجدد كل 24 ساعة • ألغِ أي وقت
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

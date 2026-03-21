import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Store, Pen, Image, ArrowLeft, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
  {
    icon: Sparkles,
    title: "مرحباً بك في Moda AI! 👋",
    description: "منصتك الذكية لإنشاء محتوى فاشون احترافي بالـ AI",
    action: null,
  },
  {
    icon: Store,
    title: "ابدأ بإعداد البراند",
    description: "حدد هوية براندك عشان الـ AI يكتب ويصمم بأسلوبك",
    action: { label: "إعداد البراند", url: "/dashboard/brand" },
  },
  {
    icon: Pen,
    title: "جرّب كاتب المحتوى",
    description: "اكتب كابشنات وإعلانات احترافية في ثواني",
    action: { label: "جرّب الآن", url: "/dashboard/writer" },
  },
  {
    icon: Image,
    title: "استكشف استوديو الصور",
    description: "ولّد صور منتجات وحملات بالـ AI",
    action: { label: "استكشف", url: "/dashboard/studio" },
  },
];

const WELCOME_KEY = "moda_welcome_shown";

export function WelcomeModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const shown = localStorage.getItem(WELCOME_KEY);
    const userCreatedAt = new Date(user.created_at || 0);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Show welcome only for new users (created in last 5 minutes) who haven't seen it
    if (!shown && userCreatedAt > fiveMinutesAgo) {
      setOpen(true);
    }
  }, [user]);

  const handleClose = () => {
    localStorage.setItem(WELCOME_KEY, "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleAction = (url: string) => {
    handleClose();
    navigate(url);
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md glass-card border-primary/30">
        <DialogHeader className="text-center">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
            <Icon className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            {step.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep 
                  ? "w-6 bg-primary" 
                  : i < currentStep 
                    ? "bg-primary/50" 
                    : "bg-surface-2"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1"
            >
              السابق
            </Button>
          )}
          
          {step.action ? (
            <>
              <Button
                variant="ghost"
                onClick={handleNext}
                className="flex-1"
              >
                تخطي
              </Button>
              <Button
                onClick={() => handleAction(step.action!.url)}
                className="flex-1 btn-gold border-0"
              >
                {step.action.label}
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 btn-gold border-0"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="w-4 h-4 ml-2" />
                  ابدأ الآن
                </>
              ) : (
                <>
                  التالي
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

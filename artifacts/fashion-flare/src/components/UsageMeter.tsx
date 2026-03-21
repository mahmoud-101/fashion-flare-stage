import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useUserUsage } from "@/hooks/useUserUsage";
import { Zap, Image, Video, Crown, Sparkles } from "lucide-react";

const usageConfig = {
  content_generation: { label: "المحتوى", icon: Zap, color: "text-primary" },
  image_generation: { label: "الصور", icon: Image, color: "text-blue-400" },
  reel_generation: { label: "الريلز", icon: Video, color: "text-purple-400" },
};

export function UsageMeter({ compact = false }: { compact?: boolean }) {
  const { getUsage, planName, isPro, isLoading } = useUserUsage();

  if (isLoading) {
    return (
      <div className="glass-card gold-border rounded-xl p-3 animate-pulse">
        <div className="h-4 bg-surface-2 rounded w-20 mb-2" />
        <div className="h-2 bg-surface-2 rounded w-full" />
      </div>
    );
  }

  const planLabel = planName === "agency" ? "مؤسسات" : planName === "pro" ? "احترافي" : "مجاني";

  if (compact) {
    const contentUsage = getUsage("content_generation");
    return (
      <div className="glass-card gold-border rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-gradient-gold">{planLabel}</span>
          </div>
          {!isPro && (
            <Link to="/dashboard/billing" className="text-xs text-primary hover:underline">
              ترقية
            </Link>
          )}
        </div>
        {!contentUsage.isUnlimited && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">المحتوى</span>
              <span className="text-foreground font-medium">
                {contentUsage.used}/{contentUsage.limit}
              </span>
            </div>
            <Progress 
              value={contentUsage.percentage} 
              className="h-1.5 bg-surface-2"
            />
          </div>
        )}
        {contentUsage.isUnlimited && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <Sparkles className="w-3 h-3" />
            <span>غير محدود</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card gold-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-gradient-gold">{planLabel}</span>
        </div>
        {!isPro && (
          <Link 
            to="/dashboard/billing" 
            className="text-xs btn-gold px-3 py-1 rounded-full font-medium"
          >
            ترقية الآن
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {Object.entries(usageConfig).map(([key, config]) => {
          const usage = getUsage(key);
          const Icon = config.icon;
          
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                  <span className="text-muted-foreground">{config.label}</span>
                </div>
                {usage.isUnlimited ? (
                  <span className="text-green-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    غير محدود
                  </span>
                ) : (
                  <span className="text-foreground font-medium">
                    {usage.used}/{usage.limit}
                  </span>
                )}
              </div>
              {!usage.isUnlimited && (
                <Progress 
                  value={usage.percentage} 
                  className={`h-1.5 bg-surface-2 ${
                    usage.percentage >= 90 ? "[&>div]:bg-destructive" : 
                    usage.percentage >= 70 ? "[&>div]:bg-yellow-500" : ""
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {!isPro && (
        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/30">
          رقّي للخطة الاحترافية لـ 10x أكتر
        </p>
      )}
    </div>
  );
}

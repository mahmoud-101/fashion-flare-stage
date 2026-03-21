import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { CreditCard, Check, Zap, Crown, Building2 } from "lucide-react";
import { usePageTitle } from "@/components/AccessibilityHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UsageMeter } from "@/components/UsageMeter";

const planIcons: Record<string, React.ElementType> = {
  free: Zap,
  pro: Crown,
  agency: Building2,
};

const planFeatures: Record<string, string[]> = {
  free: ["5 محتوى يومياً", "3 صور يومياً", "1 ريلز يومياً", "مكتبة المحتوى"],
  pro: ["50 محتوى يومياً", "30 صورة يومياً", "10 ريلز يومياً", "ربط المتجر", "جدولة المحتوى", "تصدير دفعي", "بدون علامة مائية"],
  agency: ["محتوى غير محدود", "صور غير محدودة", "ريلز غير محدودة", "كل مميزات الاحترافي", "دعم مخصص", "API مباشر"],
};

const BillingPage = () => {
  usePageTitle("الاشتراك والفواتير");
  const { user } = useAuth();

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price_monthly", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const currentPlanName = subscription?.plans?.name || "free";

  return (
    <DashboardLayout title="الاشتراك" subtitle="اختر الخطة المناسبة لبراندك">
      <div className="max-w-5xl space-y-8">
        {/* Usage Overview */}
        <div className="max-w-md">
          <UsageMeter />
        </div>

        {/* Plans Grid */}
        <div className="grid sm:grid-cols-3 gap-5">
          {plansLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 h-80 animate-pulse" />
            ))
          ) : (
            plans?.map((plan) => {
              const Icon = planIcons[plan.name] || Zap;
              const features = planFeatures[plan.name] || [];
              const isCurrent = currentPlanName === plan.name;
              const isPopular = plan.name === "pro";

              return (
                <div
                  key={plan.id}
                  className={`glass-card rounded-2xl p-6 flex flex-col relative ${
                    isPopular ? "gold-border glow-gold" : "border border-border/40"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 btn-gold px-4 py-1 rounded-full text-xs font-bold">
                      الأكثر شيوعاً
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-black text-foreground">{plan.name_ar}</h3>
                  <div className="flex items-baseline gap-1 mt-2 mb-6">
                    <span className="text-3xl font-black text-foreground">{plan.price_monthly}</span>
                    <span className="text-sm text-muted-foreground">ر.س / شهر</span>
                  </div>
                  <ul className="space-y-3 flex-1 mb-6">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                      isCurrent
                        ? "glass-card border border-primary/30 text-primary cursor-default"
                        : "btn-gold"
                    }`}
                    disabled={isCurrent}
                  >
                    {isCurrent ? "خطتك الحالية" : "ترقية الآن"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Billing History */}
        <div className="glass-card gold-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">سجل الفواتير</h3>
          </div>
          <p className="text-sm text-muted-foreground text-center py-8">
            لا يوجد فواتير سابقة — أنت على الخطة المجانية حالياً
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BillingPage;

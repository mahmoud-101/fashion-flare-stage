import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import {
  CreditCard, Check, Zap, Crown, Building2, Smartphone,
  Wallet, Shield, CalendarCheck, RefreshCw, ExternalLink,
  AlertCircle, CheckCircle2, ArrowRight, X, Loader2,
  ChevronDown, ChevronUp, Star,
} from "lucide-react";
import { usePageTitle } from "@/components/AccessibilityHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UsageMeter } from "@/components/UsageMeter";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { callEdgeFunction } from "@/lib/callEdgeFunction";

const WHATSAPP_NUMBER = "201020876934";

const PLANS = [
  {
    name: "free",
    nameAr: "مجاني",
    price: 0,
    priceStr: "مجاناً",
    icon: Zap,
    color: "border-border/60",
    bgColor: "bg-surface-2/30",
    badge: null,
    features: [
      { text: "3 محتوى يومياً", included: true },
      { text: "3 صور يومياً", included: true },
      { text: "مكتبة المحتوى", included: true },
      { text: "قوالب المحتوى", included: true },
      { text: "جدولة المحتوى", included: false },
      { text: "ربط المتاجر", included: false },
      { text: "بلا علامة مائية", included: false },
      { text: "دعم أولوية", included: false },
    ],
  },
  {
    name: "pro",
    nameAr: "الاحترافي",
    price: 400,
    priceStr: "400 ج.م",
    icon: Crown,
    color: "border-primary/60",
    bgColor: "bg-primary/5",
    badge: "الأكثر طلباً 🔥",
    features: [
      { text: "50 محتوى يومياً", included: true },
      { text: "30 صورة يومياً", included: true },
      { text: "مكتبة المحتوى", included: true },
      { text: "قوالب المحتوى", included: true },
      { text: "جدولة المحتوى", included: true },
      { text: "ربط Salla & Shopify & Zid", included: true },
      { text: "بلا علامة مائية", included: true },
      { text: "دعم واتساب أولوية", included: true },
    ],
  },
  {
    name: "agency",
    nameAr: "المؤسسات",
    price: 800,
    priceStr: "800 ج.م",
    icon: Building2,
    color: "border-border/60",
    bgColor: "bg-surface-2/30",
    badge: null,
    features: [
      { text: "محتوى غير محدود", included: true },
      { text: "صور غير محدودة", included: true },
      { text: "كل مميزات الاحترافي", included: true },
      { text: "قوالب المحتوى", included: true },
      { text: "جدولة المحتوى", included: true },
      { text: "ربط المتاجر", included: true },
      { text: "حسابات فرعية (قريباً)", included: true },
      { text: "مدير حساب مخصص", included: true },
    ],
  },
] as const;

type PlanName = "free" | "pro" | "agency";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  amount: number;
  payment_reference: string | null;
}

interface PaymentOrder {
  id: string;
  plan: string;
  amount: number;
  status: string;
  created_at: string;
}

type PaymentFlow = "idle" | "billing-info" | "processing" | "manual" | "success";

const PLAN_NAMES_AR: Record<string, string> = {
  free: "المجاني",
  pro: "الاحترافي",
  agency: "المؤسسات",
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  });

const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};

export default function BillingPage() {
  usePageTitle("الاشتراك والفواتير");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<PlanName | null>(null);
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlow>("idle");
  const [billingName, setBillingName] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [manualMethod, setManualMethod] = useState<"vodafone" | "instapay" | null>(null);
  const [manualRef, setManualRef] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);

  const { data: subscription, isLoading: subLoading } = useQuery<Subscription | null>({
    queryKey: ["active-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as Subscription | null;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const { data: paymentHistory } = useQuery<PaymentOrder[]>({
    queryKey: ["payment-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("payment_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data || []) as PaymentOrder[];
    },
    enabled: !!user,
  });

  const currentPlan = (subscription?.plan as PlanName) || "free";
  const expiresAt = subscription?.expires_at;
  const daysLeft = expiresAt ? daysUntil(expiresAt) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 3;

  const handleSelectPlan = (plan: PlanName) => {
    if (plan === "free") return;
    if (plan === currentPlan && subscription?.status === "active") {
      toast.info("أنت مشترك في هذه الخطة بالفعل — يمكنك تجديدها!");
    }
    setSelectedPlan(plan);
    setPaymentFlow("billing-info");
  };

  const handleInitiatePayment = async () => {
    if (!selectedPlan || !user) return;
    setPaymentFlow("processing");

    try {
      const result = await callEdgeFunction<{
        mode: "paymob" | "manual";
        iframeUrl?: string;
      }>("create-paymob-order", {
        plan: selectedPlan,
        fullName: billingName,
        phone: billingPhone,
        email: user.email,
      }, { includeBrand: false });

      if (result.mode === "paymob" && result.iframeUrl) {
        window.open(result.iframeUrl, "_blank");
        setTimeout(() => setPaymentFlow("manual"), 1200);
      } else {
        setPaymentFlow("manual");
      }
    } catch {
      setPaymentFlow("manual");
    }
  };

  const handleManualSubmit = async () => {
    if (!selectedPlan || !manualRef.trim()) {
      toast.error("أدخل رقم مرجع الدفع");
      return;
    }
    setSubmittingManual(true);
    try {
      await supabase.from("payment_orders").insert({
        user_id: user!.id,
        plan: selectedPlan,
        amount: PLANS.find((p) => p.name === selectedPlan)?.price || 0,
        status: "pending",
        payment_method: manualMethod || "manual",
      });

      const planNameAr = PLAN_NAMES_AR[selectedPlan];
      const price = PLANS.find((p) => p.name === selectedPlan)?.price;
      const message = encodeURIComponent(
        `مرحباً، أريد تفعيل الخطة ${planNameAr} (${price} ج.م)\n` +
        `📧 إيميل الحساب: ${user?.email}\n` +
        `📋 مرجع الدفع: ${manualRef}\n` +
        `طريقة الدفع: ${manualMethod === "vodafone" ? "فودافون كاش" : "إنستاباي"}`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
      setPaymentFlow("success");
    } catch {
      toast.error("حصل خطأ. جرّب تاني.");
    } finally {
      setSubmittingManual(false);
    }
  };

  const resetFlow = () => {
    setPaymentFlow("idle");
    setSelectedPlan(null);
    setBillingName("");
    setBillingPhone("");
    setManualMethod(null);
    setManualRef("");
    queryClient.invalidateQueries({ queryKey: ["active-subscription"] });
  };

  return (
    <DashboardLayout title="الاشتراك والفواتير" subtitle="إدارة خطتك ومدفوعاتك">

      {/* Active Subscription Banner */}
      {!subLoading && subscription && currentPlan !== "free" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card rounded-2xl p-5 mb-6 border-2 ${
            isExpiringSoon ? "border-amber-500/60 bg-amber-500/5" : "border-primary/30 bg-primary/5"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-foreground">
                    خطة {PLAN_NAMES_AR[currentPlan]}
                  </span>
                  <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-medium">
                    نشطة ✓
                  </span>
                </div>
                {expiresAt && (
                  <p className={`text-xs mt-0.5 ${isExpiringSoon ? "text-amber-400 font-medium" : "text-muted-foreground"}`}>
                    {isExpiringSoon
                      ? `⏰ ينتهي بعد ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"} — جدّده الآن!`
                      : `ينتهي في ${formatDate(expiresAt)}`}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => handleSelectPlan(currentPlan)}
              className="btn-gold px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تجديد الاشتراك
            </button>
          </div>
        </motion.div>
      )}

      {/* Usage Meters */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-4">استخدامك اليوم</h2>
        <UsageMeter />
      </div>

      {/* Plans Grid */}
      <div className="mb-8">
        <h2 className="text-base font-black text-foreground mb-1">الخطط المتاحة</h2>
        <p className="text-xs text-muted-foreground mb-5">اشتراك شهري — يجدد تلقائياً — إلغاء في أي وقت</p>

        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.name;
            const isPro = plan.name === "pro";

            return (
              <motion.div
                key={plan.name}
                whileHover={{ scale: plan.name !== "free" ? 1.02 : 1 }}
                className={`relative glass-card ${plan.bgColor} border-2 ${plan.color} rounded-2xl p-5 flex flex-col transition-all ${
                  isPro ? "ring-1 ring-primary/20 shadow-lg shadow-primary/5" : ""
                } ${isCurrentPlan && plan.name !== "free" ? "ring-1 ring-green-500/30" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap z-10">
                    {plan.badge}
                  </div>
                )}
                {isCurrentPlan && plan.name !== "free" && (
                  <div className="absolute -top-3 right-4 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap z-10">
                    خطتك الحالية ✓
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isPro ? "bg-primary/20" : "bg-surface-2"
                  }`}>
                    <Icon className={`w-5 h-5 ${isPro ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground">{plan.nameAr}</div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-black ${isPro ? "text-gradient-gold" : "text-foreground"}`}>
                        {plan.priceStr}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-xs text-muted-foreground">/شهر</span>
                      )}
                    </div>
                  </div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feat, i) => (
                    <li key={i} className={`flex items-center gap-2 text-xs ${feat.included ? "text-foreground" : "text-muted-foreground/40 line-through"}`}>
                      {feat.included ? (
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                      )}
                      {feat.text}
                    </li>
                  ))}
                </ul>

                {plan.name === "free" ? (
                  <div className="py-2.5 text-center text-xs text-muted-foreground font-medium border border-border/40 rounded-xl">
                    {currentPlan === "free" ? "خطتك الحالية" : "المستوى الأساسي"}
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.name as PlanName)}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isPro ? "btn-gold" : "border-2 border-border/60 text-foreground hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {isCurrentPlan ? "تجديد الاشتراك" : "اشترك الآن"}
                    <ArrowRight className="w-3.5 h-3.5 inline mr-1.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      {paymentHistory && paymentHistory.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-5 hover:bg-surface-2/50 transition-colors"
          >
            <span className="text-sm font-bold text-foreground">سجل المدفوعات ({paymentHistory.length})</span>
            {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-border/40">
                  {paymentHistory.map((order) => (
                    <div key={order.id} className="flex items-center justify-between px-5 py-3 border-b border-border/20 last:border-0">
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          خطة {PLAN_NAMES_AR[order.plan] || order.plan}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("ar-EG")}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground">{order.amount} ج.م</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          order.status === "paid"
                            ? "bg-green-500/15 text-green-400"
                            : order.status === "pending"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-red-500/15 text-red-400"
                        }`}>
                          {order.status === "paid" ? "مدفوع" : order.status === "pending" ? "في الانتظار" : "فشل"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
        {[
          { icon: Shield, label: "دفع آمن 100%" },
          { icon: RefreshCw, label: "إلغاء في أي وقت" },
          { icon: CalendarCheck, label: "تفعيل خلال ساعة" },
          { icon: Star, label: "+120 براند ثقة" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="glass-card rounded-xl p-3 flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentFlow !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && resetFlow()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative glass-card-strong border border-primary/20 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <button
                onClick={resetFlow}
                className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <AnimatePresence mode="wait">

                {/* Step 1: Billing Info */}
                {paymentFlow === "billing-info" && selectedPlan && (
                  <motion.div key="billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-black text-foreground">
                        اشتراك {PLAN_NAMES_AR[selectedPlan]}
                      </h3>
                      <p className="text-2xl font-black text-gradient-gold mt-1">
                        {PLANS.find((p) => p.name === selectedPlan)?.price} ج.م
                        <span className="text-sm font-normal text-muted-foreground mr-1">/شهر</span>
                      </p>
                    </div>

                    <div className="space-y-3 mb-5">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">الاسم الكامل</label>
                        <input
                          type="text"
                          value={billingName}
                          onChange={(e) => setBillingName(e.target.value)}
                          placeholder="محمد أحمد"
                          className="w-full glass-card border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none transition-colors"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">رقم الهاتف</label>
                        <input
                          type="tel"
                          value={billingPhone}
                          onChange={(e) => setBillingPhone(e.target.value)}
                          placeholder="01xxxxxxxxx"
                          className="w-full glass-card border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none transition-colors"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface-2/60 rounded-xl px-3 py-2.5 mb-5">
                      <Shield className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>بياناتك مشفّرة وآمنة — لا نحتفظ ببيانات الدفع</span>
                    </div>

                    <button
                      onClick={handleInitiatePayment}
                      disabled={!billingName.trim() || !billingPhone.trim()}
                      className="btn-gold w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="w-4 h-4" />
                      متابعة للدفع
                    </button>
                  </motion.div>
                )}

                {/* Step 2: Processing */}
                {paymentFlow === "processing" && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                    <h3 className="text-base font-bold text-foreground mb-2">جاري تجهيز الدفع...</h3>
                    <p className="text-xs text-muted-foreground">ستُفتح صفحة الدفع الآمنة تلقائياً</p>
                  </motion.div>
                )}

                {/* Step 3: Manual Payment */}
                {paymentFlow === "manual" && selectedPlan && (
                  <motion.div key="manual" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="text-center mb-5">
                      <h3 className="text-base font-black text-foreground mb-1">أكمل الدفع يدوياً</h3>
                      <p className="text-xs text-muted-foreground">
                        حوّل{" "}
                        <strong className="text-primary">
                          {PLANS.find((p) => p.name === selectedPlan)?.price} ج.م
                        </strong>{" "}
                        ثم أرسل رقم المرجع
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        onClick={() => setManualMethod("vodafone")}
                        className={`border-2 rounded-xl p-3.5 text-center transition-all ${
                          manualMethod === "vodafone" ? "border-red-500/60 bg-red-500/10" : "border-border/40 hover:border-border/80"
                        }`}
                      >
                        <Smartphone className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
                        <div className="text-xs font-bold text-foreground">فودافون كاش</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">01020876934</div>
                      </button>
                      <button
                        onClick={() => setManualMethod("instapay")}
                        className={`border-2 rounded-xl p-3.5 text-center transition-all ${
                          manualMethod === "instapay" ? "border-blue-500/60 bg-blue-500/10" : "border-border/40 hover:border-border/80"
                        }`}
                      >
                        <Wallet className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                        <div className="text-xs font-bold text-foreground">إنستاباي</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">mo.mon3m@instapay</div>
                      </button>
                    </div>

                    {manualMethod === "instapay" && (
                      <a
                        href="https://ipn.eg/S/mo.mon3m/instapay/2Sszqo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline mb-4"
                      >
                        <ExternalLink className="w-3 h-3" />
                        افتح رابط إنستاباي المباشر
                      </a>
                    )}

                    <div className="mb-5">
                      <label className="text-xs text-muted-foreground mb-1.5 block">
                        رقم مرجع العملية (Transaction ID)
                      </label>
                      <input
                        type="text"
                        value={manualRef}
                        onChange={(e) => setManualRef(e.target.value)}
                        placeholder="مثال: 123456789"
                        className="w-full glass-card border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <button
                      onClick={handleManualSubmit}
                      disabled={!manualRef.trim() || !manualMethod || submittingManual}
                      className="btn-gold w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingManual ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>أرسل لتفعيل الخطة</>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Step 4: Success */}
                {paymentFlow === "success" && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-2">تم إرسال طلبك! ✅</h3>
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                      تم فتح واتساب مع تفاصيل الدفع. سيتم تفعيل خطتك خلال{" "}
                      <strong className="text-foreground">ساعة واحدة</strong> بعد التحقق.
                    </p>
                    <div className="flex items-start gap-3 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 text-right mb-6">
                      <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-primary/80">
                        لو ما اتفتحش واتساب — راسلنا مباشرة على{" "}
                        <strong>{WHATSAPP_NUMBER}</strong> مع رقم المرجع.
                      </p>
                    </div>
                    <button onClick={resetFlow} className="btn-gold w-full py-3 rounded-xl font-bold">
                      ممتاز، رجوع للداشبورد
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

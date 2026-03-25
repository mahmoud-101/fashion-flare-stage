import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import {
  CreditCard, Check, Zap, Crown, Building2, Smartphone,
  Wallet, MessageCircle, Copy, CheckCircle2, ArrowLeft,
  X, ChevronRight, AlertCircle, Shield, Zap as ZapIcon, Ban, HeadphonesIcon, CalendarCheck, Phone
} from "lucide-react";
import { usePageTitle } from "@/components/AccessibilityHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UsageMeter } from "@/components/UsageMeter";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP_NUMBER = "201020876934";

const PLANS = [
  {
    name: "free", nameAr: "مجاني", price: 0, icon: Zap,
    color: "border-border", btnVariant: "outline",
    features: ["3 محتوى يومياً", "3 صور يومياً", "مكتبة المحتوى"],
  },
  {
    name: "pro", nameAr: "احترافي", price: 400, icon: Crown,
    color: "border-primary/60", btnVariant: "gold",
    features: ["50 محتوى يومياً", "30 صورة يومياً", "ربط متاجر Salla & Shopify & Zid", "جدولة المحتوى", "مولّد الهاشتاجات", "بدون علامة مائية", "دعم واتساب أولوية"],
  },
  {
    name: "agency", nameAr: "مؤسسات", price: 800, icon: Building2,
    color: "border-border", btnVariant: "outline",
    features: ["محتوى غير محدود", "صور غير محدودة", "كل مميزات الاحترافي", "حسابات فرعية", "مدير حساب مخصص"],
  },
];

const PAYMENT_METHODS = [
  {
    id: "vodafone",
    label: "فودافون كاش",
    icon: Smartphone,
    number: "01020876934",
    color: "border-red-500/30 bg-red-500/5",
    iconColor: "text-red-400",
    instructions: [
      "افتح تطبيق فودافون كاش",
      "اختار «تحويل فلوس»",
      "ادخل الرقم المحدد أدناه",
      "ادخل المبلغ وأرسل",
      "احفظ رقم مرجع العملية",
    ],
  },
  {
    id: "instapay",
    label: "إنستاباي",
    icon: Wallet,
    number: "mo.mon3m@instapay",
    link: "https://ipn.eg/S/mo.mon3m/instapay/2Sszqo",
    color: "border-blue-500/30 bg-blue-500/5",
    iconColor: "text-blue-400",
    instructions: [
      "اضغط «افتح رابط الدفع» أدناه",
      "أو افتح تطبيق إنستاباي → «تحويل» → «معرّف»",
      "ادخل المعرّف المحدد أدناه",
      "ادخل المبلغ وأرسل",
      "احفظ رقم مرجع العملية",
    ],
  },
];

type PaymentStep = "plan" | "method" | "instructions" | "confirm" | "success";

interface PaymentState {
  plan: typeof PLANS[number] | null;
  method: typeof PAYMENT_METHODS[number] | null;
  name: string;
  phone: string;
  reference: string;
}

const BillingPage = () => {
  usePageTitle("الاشتراك والفواتير");
  const { user } = useAuth();

  const [showPayment, setShowPayment] = useState(false);
  const [step, setStep] = useState<PaymentStep>("plan");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentState>({
    plan: null, method: null, name: "", phone: "", reference: "",
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const currentPlanName = subscription?.plans?.name || "free";

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    toast.success("تم نسخ الرقم!");
    setTimeout(() => setCopied(false), 2000);
  };

  const resetPayment = () => {
    setShowPayment(false);
    setStep("plan");
    setPayment({ plan: null, method: null, name: "", phone: "", reference: "" });
    setCopied(false);
  };

  const handleSubmitPayment = () => {
    if (!payment.name.trim() || !payment.phone.trim()) {
      toast.error("اكتب اسمك ورقم تليفونك");
      return;
    }
    if (!payment.reference.trim()) {
      toast.error("اكتب رقم مرجع العملية");
      return;
    }

    setSubmitting(true);

    const msg = encodeURIComponent(
      `🎉 طلب اشتراك جديد - Moda AI\n\n` +
      `📦 الخطة: ${payment.plan?.nameAr} (${payment.plan?.price} ج.م/شهر)\n` +
      `💳 طريقة الدفع: ${payment.method?.label}\n` +
      `👤 الاسم: ${payment.name}\n` +
      `📞 رقم الهاتف: ${payment.phone}\n` +
      `🔢 رقم العملية: ${payment.reference}\n` +
      `📧 البريد: ${user?.email || "—"}`
    );

    setTimeout(() => {
      setSubmitting(false);
      setStep("success");
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
    }, 800);
  };

  const stepOrder: PaymentStep[] = ["plan", "method", "instructions", "confirm"];
  const stepIdx = stepOrder.indexOf(step);

  return (
    <DashboardLayout title="الاشتراك" subtitle="اختر الخطة المناسبة لبراندك">
      <div className="max-w-5xl space-y-8">

        {/* Current plan status */}
        <div className="glass-card gold-border rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium mb-1">خطتك الحالية</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl btn-gold flex items-center justify-center">
                {currentPlanName === "pro" ? <Crown className="w-5 h-5" /> :
                 currentPlanName === "agency" ? <Building2 className="w-5 h-5" /> :
                 <Zap className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-black text-xl text-foreground">
                  {currentPlanName === "pro" ? "الاحترافية" : currentPlanName === "agency" ? "المؤسسات" : "المجانية"}
                </div>
                {currentPlanName === "free" ? (
                  <div className="text-xs text-muted-foreground">مجاني دائماً — لا فواتير</div>
                ) : subscription?.current_period_end ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-400">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>تجديد في {new Date(subscription.current_period_end).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                ) : null}
              </div>
            </div>
            {currentPlanName === "free" ? (
              <div className="flex items-start gap-2 bg-primary/8 border border-primary/20 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary/80">
                  الخطة المجانية: 3 محتوى + 3 صور يومياً. الترقية للاحترافية بـ 400 ج.م/شهر تضاعف إمكانياتك 16 ضعف.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-500/8 border border-green-500/20 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <p className="text-xs text-green-300">اشتراكك نشط. استمتع بكامل المميزات بدون حدود يومية.</p>
              </div>
            )}
          </div>
          <div className="md:w-56 w-full">
            <UsageMeter compact />
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Shield, label: "دفع آمن 100%", desc: "مشفّر ومحمي", color: "text-green-400" },
            { icon: ZapIcon, label: "تفعيل خلال ساعة", desc: "بعد تأكيد الدفع", color: "text-primary" },
            { icon: Ban, label: "إلغاء في أي وقت", desc: "بدون رسوم إضافية", color: "text-blue-400" },
            { icon: HeadphonesIcon, label: "دعم واتساب مباشر", desc: "7 أيام في الأسبوع", color: "text-purple-400" },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="glass-card rounded-xl p-4 border border-border/40 flex flex-col items-center text-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-border/30 flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-foreground leading-tight">{label}</div>
              <div className="text-[10px] text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-5">الخطط المتاحة</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = currentPlanName === plan.name;
              const isPopular = plan.name === "pro";

              return (
                <div
                  key={plan.name}
                  className={`glass-card rounded-2xl p-6 flex flex-col relative border ${plan.color} ${isPopular ? "glow-gold" : ""}`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 btn-gold px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                      ⭐ الأوفر
                    </span>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${isPopular ? "btn-gold" : "bg-primary/10"}`}>
                    <Icon className={`w-5 h-5 ${isPopular ? "" : "text-primary"}`} />
                  </div>
                  <div className="font-black text-foreground text-lg mb-1">{plan.nameAr}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-black text-gradient-gold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">ج.م/شهر</span>
                  </div>
                  {plan.price > 0 && (
                    <p className="text-[11px] text-muted-foreground mb-1">
                      ≈ {plan.price === 400 ? "80 ر.س / 110 د.إ" : "160 ر.س / 220 د.إ"}
                    </p>
                  )}
                  {plan.price > 0 && (
                    <p className="text-[11px] text-green-400 font-medium mb-4">
                      💡 {plan.price === 400 ? "يُغني عن كاتب محتوى بـ 3,000+ ج.م" : "يكافئ وكالة بعشرة أضعاف التكلفة"}
                    </p>
                  )}
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={isCurrent || plan.name === "free"}
                    onClick={() => {
                      setPayment(p => ({ ...p, plan }));
                      setStep("method");
                      setShowPayment(true);
                    }}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isCurrent
                        ? "glass-card border border-primary/30 text-primary cursor-default"
                        : plan.name === "free"
                        ? "glass-card border border-border/40 text-muted-foreground cursor-default"
                        : "btn-gold"
                    }`}
                  >
                    {isCurrent ? "✅ خطتك الحالية" : plan.name === "free" ? "مجاني دائماً" : "اشترك الآن"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guarantee */}
        <div className="glass-card rounded-2xl border border-primary/20 bg-primary/4 p-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-16 h-16 rounded-2xl btn-gold flex items-center justify-center shrink-0">
            <Shield className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center sm:text-right">
            <h3 className="font-black text-foreground text-lg mb-1">ضمان رضاكم 100%</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              لو في خلال 7 أيام من الاشتراك مش راضٍ — راسلنا على واتساب وهنرجعلك كامل المبلغ بدون أي أسئلة. ثقتنا في المنتج وفي وقتك.
            </p>
          </div>
          <a
            href="https://wa.me/201020876934?text=أريد استرداد مبلغ الاشتراك"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card gold-border px-5 py-2.5 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
          >
            تواصل معنا
          </a>
        </div>

        {/* How payment works */}
        <div className="glass-card rounded-2xl border border-border/40 p-6">
          <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            كيف يعمل الدفع؟
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { num: "01", title: "ادفع عبر فودافون كاش أو إنستاباي", desc: "حوّل المبلغ على الرقم المخصص" },
              { num: "02", title: "أرسل تأكيد الدفع على واتساب", desc: "اسمك + رقمك + رقم العملية" },
              { num: "03", title: "التفعيل خلال ساعة", desc: "سيتم تفعيل خطتك مباشرة بعد التأكيد" },
            ].map((step) => (
              <div key={step.num} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg btn-gold flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  {step.num}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground mb-0.5">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && resetPayment()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="glass-card gold-border rounded-2xl p-7 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={resetPayment}
                className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Progress bar */}
              {step !== "success" && (
                <div className="flex gap-1.5 mb-7">
                  {["method", "instructions", "confirm"].map((s, i) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        stepOrder.indexOf(step) > i ? "bg-primary" :
                        stepOrder.indexOf(step) === i + 1 ? "bg-primary" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">

                {/* Step: Choose method */}
                {step === "method" && (
                  <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="mb-6">
                      <div className="text-xs text-muted-foreground mb-1">الخطة المختارة</div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-foreground">{payment.plan?.nameAr}</span>
                        <span className="text-primary font-bold">{payment.plan?.price} ج.م/شهر</span>
                      </div>
                    </div>
                    <h3 className="text-base font-black text-foreground mb-4">اختار طريقة الدفع</h3>
                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((m) => {
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            onClick={() => { setPayment(p => ({ ...p, method: m })); setStep("instructions"); }}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-right hover:border-primary/50 ${m.color}`}
                          >
                            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0`}>
                              <Icon className={`w-5 h-5 ${m.iconColor}`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-foreground text-sm">{m.label}</div>
                              <div className="text-xs text-muted-foreground">{m.number}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Step: Instructions */}
                {step === "instructions" && payment.method && (
                  <motion.div key="instructions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="text-base font-black text-foreground mb-5">
                      الدفع عبر {payment.method.label}
                    </h3>
                    <div className={`rounded-xl border p-4 mb-5 ${payment.method.color}`}>
                      <div className="text-xs text-muted-foreground mb-1 font-medium">
                        {payment.method.id === "vodafone" ? "رقم فودافون كاش" : "معرّف إنستاباي"}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-black text-foreground text-lg tracking-wider">
                          {payment.method.number}
                        </span>
                        <button
                          onClick={() => copyNumber(payment.method!.number)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            copied ? "btn-gold" : "glass-card gold-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "تم!" : "نسخ"}
                        </button>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <div className="text-xs text-muted-foreground mb-0.5">المبلغ</div>
                        <div className="font-black text-xl text-primary">{payment.plan?.price} ج.م</div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <div className="text-sm font-bold text-foreground mb-3">خطوات التحويل:</div>
                      <div className="space-y-2">
                        {payment.method.instructions.map((inst, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <span className="text-sm text-muted-foreground">{inst}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* InstaPay direct link */}
                    {payment.method.id === "instapay" && (payment.method as any).link && (
                      <a
                        href={(payment.method as any).link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mb-3 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold glass-card border border-blue-400/40 text-blue-400 hover:border-blue-400/70 hover:bg-blue-500/8 transition-all"
                      >
                        <Wallet className="w-4 h-4" />
                        افتح رابط إنستاباي المباشر
                      </a>
                    )}

                    <button
                      onClick={() => setStep("confirm")}
                      className="btn-gold w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      حوّلت المبلغ ✅
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* Step: Confirm */}
                {step === "confirm" && (
                  <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="text-base font-black text-foreground mb-2">تأكيد الدفع</h3>
                    <p className="text-xs text-muted-foreground mb-5">
                      ملّي البيانات دي وهنفعّل خطتك خلال ساعة.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-foreground mb-1.5 block">الاسم</label>
                        <input
                          value={payment.name}
                          onChange={e => setPayment(p => ({ ...p, name: e.target.value }))}
                          placeholder="اسمك الكامل"
                          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60 transition-colors"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-foreground mb-1.5 block">رقم الهاتف</label>
                        <input
                          value={payment.phone}
                          onChange={e => setPayment(p => ({ ...p, phone: e.target.value }))}
                          placeholder="01XXXXXXXXX"
                          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60 transition-colors"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-foreground mb-1.5 block">رقم مرجع العملية</label>
                        <input
                          value={payment.reference}
                          onChange={e => setPayment(p => ({ ...p, reference: e.target.value }))}
                          placeholder="الرقم اللي ظهر بعد التحويل"
                          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60 transition-colors"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSubmitPayment}
                      disabled={submitting}
                      className="btn-gold w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
                    >
                      {submitting ? (
                        <>جاري الإرسال...</>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4" />
                          أرسل تأكيد على واتساب
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Step: Success */}
                {step === "success" && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-2">تم إرسال طلبك!</h3>
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                      تم فتح واتساب تلقائياً مع تفاصيل الدفع. سيتم تفعيل خطتك خلال <strong className="text-foreground">ساعة واحدة</strong>.
                    </p>
                    <div className="flex items-start gap-3 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 text-right mb-6">
                      <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-primary/80">
                        لو ما اتفتحش واتساب تلقائياً — راسلنا مباشرة على <strong>01020876934</strong> مع بيانات الدفع.
                      </p>
                    </div>
                    <button onClick={resetPayment} className="btn-gold w-full py-3 rounded-xl font-bold">
                      تمام، رجوع
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
};

export default BillingPage;

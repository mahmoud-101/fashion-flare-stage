import { useState, useRef } from "react";
import { Check, Zap, Crown, Building2 } from "lucide-react";
import { motion, useInView } from "framer-motion";

const plans = [
  {
    icon: Zap,
    name: "free",
    nameAr: "مجاني",
    price: "0",
    currency: "ج.م",
    period: "للأبد",
    desc: "ابدأ مجاناً وجرّب الأدوات",
    features: [
      "5 محتوى يومياً",
      "3 صور يومياً",
      "1 ريلز يومياً",
      "مكتبة المحتوى",
      "استوديو الصور الأساسي",
    ],
    popular: false,
    btnClass: "glass-card gold-border hover:border-primary/60",
    color: "border-border",
  },
  {
    icon: Crown,
    name: "pro",
    nameAr: "احترافي",
    price: "400",
    currency: "ج.م",
    period: "شهرياً",
    desc: "للبراندات الجادة في النمو",
    features: [
      "50 محتوى يومياً",
      "30 صورة يومياً",
      "10 ريلز يومياً",
      "ربط متجر Salla",
      "جدولة المحتوى",
      "تصدير بدون علامة مائية",
      "تحليلات الأداء",
      "دعم أولوية",
    ],
    popular: true,
    btnClass: "btn-gold",
    color: "border-primary/60",
  },
  {
    icon: Building2,
    name: "agency",
    nameAr: "مؤسسات",
    price: "800",
    currency: "ج.م",
    period: "شهرياً",
    desc: "للوكالات والمتاجر الكبيرة",
    features: [
      "محتوى غير محدود",
      "صور غير محدودة",
      "ريلز غير محدودة",
      "كل مميزات الاحترافي",
      "دعم مخصص",
    ],
    popular: false,
    btnClass: "glass-card gold-border hover:border-primary/60",
    color: "border-border",
  },
];

const PricingSection = () => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const getPrice = (plan: typeof plans[number]) => {
    if (plan.price === "0") return "0";
    const monthly = parseInt(plan.price);
    return billing === "yearly" ? String(Math.round(monthly * 0.8)) : plan.price;
  };

  return (
    <section ref={ref} id="pricing" className="py-28 relative">
      <div className="absolute inset-0 grid-pattern opacity-15 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass-card gold-border px-4 py-2 rounded-full mb-6">
            <span className="text-sm text-primary">الأسعار</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            <span className="text-foreground">اختار الخطة </span>
            <span className="text-gradient-gold">المناسبة</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            اختر الخطة التي تناسبك. لا رسوم خفية. ألغي في أي وقت.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 glass-card gold-border rounded-xl p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                billing === "monthly" ? "btn-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all relative ${
                billing === "yearly" ? "btn-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              سنوي
              <span className="absolute -top-3 -left-3 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
                وفّر 20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const displayPrice = getPrice(plan);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`glass-card rounded-2xl p-8 border ${plan.color} relative ${plan.popular ? "glow-gold-intense" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="btn-gold px-5 py-1.5 rounded-full text-sm font-bold whitespace-nowrap inline-block"
                    >
                      ⭐ الأكثر طلباً
                    </motion.span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.popular ? "btn-gold" : "bg-primary/15 border border-primary/20"}`}>
                    <Icon className={`w-5 h-5 ${plan.popular ? "" : "text-primary"}`} />
                  </div>
                  <div>
                    <div className="font-black text-foreground">{plan.nameAr}</div>
                    <div className="text-xs text-muted-foreground">{plan.name}</div>
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-4xl font-black text-gradient-gold">{displayPrice}</span>
                  <span className="text-2xl font-bold text-gradient-gold">{plan.currency}</span>
                  <span className="text-muted-foreground text-sm mr-1">
                    / {plan.price === "0" ? plan.period : billing === "yearly" ? "شهرياً — يُدفع سنوياً" : "شهرياً"}
                  </span>
                </div>

                {billing === "yearly" && plan.price !== "0" && (
                  <p className="text-xs text-primary mb-2">
                    ✅ وفّر {Math.round(parseInt(plan.price) * 12 * 0.2)} ج.م سنوياً
                  </p>
                )}

                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

                <motion.a
                  href="/auth"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`${plan.btnClass} w-full py-3 rounded-xl text-center font-bold text-sm block mb-8 transition-all`}
                >
                  {plan.name === "free" ? "ابدأ مجاناً" : plan.name === "pro" ? "اشترك الآن" : "تواصل معنا"}
                </motion.a>

                <ul className="space-y-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="text-center text-muted-foreground text-sm mt-10"
        >
          خطة مجانية دائمة — بدون بيانات بنكية.{" "}
          <a href="/auth" className="text-primary hover:underline font-medium">
            ابدأ بالخطة المجانية
          </a>
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;

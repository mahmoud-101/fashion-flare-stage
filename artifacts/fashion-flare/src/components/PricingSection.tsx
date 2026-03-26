import { useState, useRef } from "react";
import { Check, X, Zap, Crown, Building2, Calculator } from "lucide-react";
import { motion, useInView } from "framer-motion";

const plans = [
  {
    icon: Zap,
    name: "free",
    nameAr: "مجاني",
    price: "0",
    currency: "ج.م",
    period: "للأبد",
    priceNote: null,
    desc: "جرّب المنصة بدون أي التزام",
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
    priceNote: "≈ 80 ر.س / 110 د.إ",
    desc: "للبراندات الجادة في النمو",
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
    priceNote: "≈ 160 ر.س / 220 د.إ",
    desc: "للوكالات والمتاجر الكبيرة",
    popular: false,
    btnClass: "glass-card gold-border hover:border-primary/60",
    color: "border-border",
  },
];

const FEATURE_MATRIX = [
  {
    category: "توليد المحتوى",
    features: [
      { name: "كابشنات يومية", free: "3", pro: "50", agency: "غير محدود" },
      { name: "سكريبتات ريلز", free: "1", pro: "10", agency: "غير محدود" },
      { name: "مولّد الهاشتاجات", free: false, pro: true, agency: true },
      { name: "جدولة المحتوى", free: false, pro: true, agency: true },
    ],
  },
  {
    category: "استوديو الصور",
    features: [
      { name: "صور يومية", free: "3", pro: "30", agency: "غير محدود" },
      { name: "حذف الخلفية", free: true, pro: true, agency: true },
      { name: "إزالة العلامة المائية", free: false, pro: true, agency: true },
    ],
  },
  {
    category: "تكاملات وتقارير",
    features: [
      { name: "ربط Salla & Shopify & Zid", free: false, pro: true, agency: true },
      { name: "تحليلات الأداء", free: false, pro: true, agency: true },
      { name: "حسابات فرعية", free: false, pro: false, agency: true },
      { name: "مدير حساب مخصص", free: false, pro: false, agency: true },
    ],
  },
  {
    category: "الدعم",
    features: [
      { name: "دعم البريد الإلكتروني", free: true, pro: true, agency: true },
      { name: "دعم واتساب أولوية", free: false, pro: true, agency: true },
      { name: "دعم مباشر مخصص", free: false, pro: false, agency: true },
    ],
  },
];

const FeatureValue = ({ value }: { value: string | boolean }) => {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="w-4 h-4 text-primary mx-auto" />
    ) : (
      <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
    );
  }
  return <span className="text-sm font-bold text-foreground">{value}</span>;
};

const PricingSection = () => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [copywriterSalary, setCopywriterSalary] = useState(3000);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const getPrice = (plan: (typeof plans)[number]) => {
    if (plan.price === "0") return "0";
    const monthly = parseInt(plan.price);
    return billing === "yearly" ? String(Math.round(monthly * 0.8)) : plan.price;
  };

  const saving = copywriterSalary - 400;

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
            لا رسوم خفية. ألغي في أي وقت. ابدأ مجاناً.
          </p>

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
              <span className="absolute -top-2.5 -left-1 bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const displayPrice = getPrice(plan);

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`glass-card rounded-3xl p-7 relative border-2 ${plan.color} ${
                  plan.popular ? "shadow-2xl shadow-primary/20" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black text-xs font-black px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                    🔥 الأكثر طلباً
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-lg font-black text-foreground">{plan.nameAr}</span>
                </div>

                <div className="mb-1">
                  <span className="text-5xl font-black text-foreground">{displayPrice}</span>
                  <span className="text-lg text-muted-foreground mr-1">{plan.currency}</span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">{plan.period}</div>
                {plan.priceNote && (
                  <p className="text-xs text-muted-foreground mb-2">{plan.priceNote}</p>
                )}
                {billing === "yearly" && plan.price !== "0" && (
                  <p className="text-xs text-green-400 font-bold mb-2">
                    💰 توفير {Math.round(parseInt(plan.price) * 0.2 * 12)} ج.م سنوياً
                  </p>
                )}

                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

                <motion.a
                  href={
                    plan.name === "free"
                      ? "/auth"
                      : plan.name === "pro"
                      ? "/auth?redirect=/dashboard/billing&plan=pro"
                      : "/auth?redirect=/dashboard/billing&plan=agency"
                  }
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`${plan.btnClass} w-full py-3 rounded-xl text-center font-bold text-sm block transition-all`}
                >
                  {plan.name === "free"
                    ? "ابدأ مجاناً"
                    : plan.name === "pro"
                    ? "اشترك الآن ←"
                    : "تواصل معنا"}
                </motion.a>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="glass-card gold-border rounded-3xl overflow-hidden mb-16"
        >
          <div className="p-5 border-b border-border/30 text-center">
            <h3 className="text-lg font-black text-foreground">مقارنة تفصيلية للخطط</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="p-4 text-sm text-muted-foreground font-medium text-right w-1/2">
                    الميزة
                  </th>
                  <th className="p-4 text-sm font-bold text-center text-foreground">مجاني</th>
                  <th className="p-4 text-sm font-bold text-center text-primary">احترافي ⭐</th>
                  <th className="p-4 text-sm font-bold text-center text-foreground">مؤسسات</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_MATRIX.map((cat) => (
                  <>
                    <tr key={cat.category} className="bg-primary/5">
                      <td
                        colSpan={4}
                        className="px-4 py-2 text-xs font-black text-primary uppercase tracking-wider"
                      >
                        {cat.category}
                      </td>
                    </tr>
                    {cat.features.map((f, fi) => (
                      <tr
                        key={fi}
                        className="border-b border-border/20 hover:bg-primary/5 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-foreground">{f.name}</td>
                        <td className="px-4 py-3 text-center">
                          <FeatureValue value={f.free} />
                        </td>
                        <td className="px-4 py-3 text-center bg-primary/5">
                          <FeatureValue value={f.pro} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <FeatureValue value={f.agency} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="glass-card gold-border rounded-3xl p-8 mb-12 max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">حاسبة التوفير</h3>
              <p className="text-xs text-muted-foreground">مقارنة مع كاتب محتوى بشري</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="text-sm text-muted-foreground mb-2 block">
              راتب كاتب المحتوى الشهري (ج.م)
            </label>
            <input
              type="range"
              min={1000}
              max={10000}
              step={500}
              value={copywriterSalary}
              onChange={(e) => setCopywriterSalary(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1,000</span>
              <span className="font-bold text-foreground">{copywriterSalary.toLocaleString("ar")} ج.م</span>
              <span>10,000</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="glass-card border border-red-500/20 rounded-2xl p-4">
              <div className="text-xs text-muted-foreground mb-1">تكلفة بشري</div>
              <div className="text-xl font-black text-red-400">
                {copywriterSalary.toLocaleString("ar")}
              </div>
              <div className="text-xs text-muted-foreground">ج.م / شهر</div>
            </div>
            <div className="glass-card gold-border rounded-2xl p-4">
              <div className="text-xs text-muted-foreground mb-1">Moda AI Pro</div>
              <div className="text-xl font-black text-primary">400</div>
              <div className="text-xs text-muted-foreground">ج.م / شهر</div>
            </div>
            <div className="glass-card border border-green-500/20 rounded-2xl p-4">
              <div className="text-xs text-muted-foreground mb-1">توفيرك</div>
              <div className="text-xl font-black text-green-400">
                {saving > 0 ? saving.toLocaleString("ar") : "0"}
              </div>
              <div className="text-xs text-muted-foreground">ج.م / شهر</div>
            </div>
          </div>

          {saving > 0 && (
            <motion.p
              key={saving}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center text-sm text-green-400 font-bold mt-4"
            >
              💰 توفيرك السنوي: {(saving * 12).toLocaleString("ar")} ج.م
            </motion.p>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="text-center text-muted-foreground text-sm"
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

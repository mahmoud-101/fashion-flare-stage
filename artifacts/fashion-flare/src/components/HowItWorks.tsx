import { Store, Wand2, Send, ArrowLeft } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    num: "01",
    icon: Store,
    title: "سجّل براندك",
    desc: "أدخل اسم براندك، رفع الهوية البصرية، واختار لهجتك وأسلوبك. الذكاء الاصطناعي هيحفظ شخصية براندك.",
  },
  {
    num: "02",
    icon: Wand2,
    title: "اختار المنتج والنوع",
    desc: "اختار المنتج من متجرك أو ارفع صورته، حدد نوع المحتوى (كابشن، ستوري، إعلان) والمنصة.",
  },
  {
    num: "03",
    icon: Send,
    title: "انشر واتابع النتائج",
    desc: "راجع المحتوى المولّد، عدّل لو احتجت، واجدل النشر أو انشر فوراً على كل منصاتك.",
  },
];

const HowItWorks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="how-it-works" className="py-28 section-gradient relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass-card gold-border px-4 py-2 rounded-full mb-6">
            <span className="text-sm text-primary">طريقة العمل</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            <span className="text-foreground">3 خطوات </span>
            <span className="text-gradient-gold">بس!</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            من اللحظة اللي بتسجل فيها لحد ما المحتوى ينتشر — مش هياخد منك أكتر من 5 دقايق
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-20 right-[16%] left-[16%] h-px">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.5 }}
              className="h-full bg-gradient-to-l from-transparent via-primary/40 to-transparent origin-right"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.2 }}
                  className="text-center relative"
                >
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-20 h-20 rounded-2xl btn-gold flex items-center justify-center shadow-lg"
                    >
                      <Icon className="w-9 h-9" />
                    </motion.div>
                    <span className="absolute -top-3 -left-3 w-7 h-7 rounded-full glass-card-strong gold-border text-xs font-black text-primary flex items-center justify-center">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>

                  {i < steps.length - 1 && (
                    <div className="hidden md:flex absolute left-0 top-8 -translate-x-4 text-primary/30">
                      <ArrowLeft className="w-6 h-6" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Demo preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 1 }}
          className="mt-16 max-w-3xl mx-auto glass-card gold-border rounded-2xl p-6 glow-gold"
        >
          <div className="text-center mb-6">
            <span className="text-primary font-bold">مثال حي — كابشن لمنتج فاشون</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-surface rounded-xl p-4">
              <div className="text-xs text-muted-foreground mb-2">الإدخال</div>
              <div className="text-sm text-foreground space-y-1">
                <div><span className="text-primary">المنتج:</span> بلوزة لينن كاجوال — ألوان متعددة</div>
                <div><span className="text-primary">المنصة:</span> إنستجرام</div>
                <div><span className="text-primary">اللهجة:</span> مصري</div>
                <div><span className="text-primary">النوع:</span> بوست ترويجي</div>
              </div>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <div className="text-xs text-primary mb-2">✨ المحتوى المولّد</div>
              <p className="text-sm text-foreground leading-relaxed">
                الراحة والستايل في بلوزة واحدة 🌿<br />
                اللينن اللي هيبقى صاحبتك الصيف ده —
                خفيف على جسمك وهيخلّيك تبصي فريشة طول اليوم ✨<br />
                <span className="text-primary">#بلوزة #فاشون #ستايل_مصري</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;

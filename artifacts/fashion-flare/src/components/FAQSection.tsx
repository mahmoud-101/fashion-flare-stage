import { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "هل محتاج خبرة تقنية عشان أستخدم Moda AI؟",
    a: "لأ خالص! الواجهة بسيطة جداً وبالعربي. أي حد يعرف يستخدم موبايل هيقدر يشتغل عليها من أول يوم.",
  },
  {
    q: "هل الذكاء الاصطناعي بيكتب بالعامية المصرية فعلاً؟",
    a: "آه! متدرب خصيصاً على المحتوى الفاشون العربي بكل لهجاته — المصري، السعودي، الإماراتي، والفصحى. بتختار أنت اللهجة المناسبة لجمهورك.",
  },
  {
    q: "إيه الفرق بين الخطة المجانية والاحترافية؟",
    a: "الخطة المجانية بتديك 3 محتويات و3 صور يومياً — كافية للتجربة. الاحترافية بـ 400 ج.م بتديك 50 محتوى + 30 صورة + جدولة + ربط المتجر.",
  },
  {
    q: "هل ممكن أجرب قبل ما أدفع؟",
    a: "أكيد! عندنا خطة مجانية دائمة بدون بيانات بنكية. بتجرب الأدوات الأساسية وتشوف بنفسك قبل ما تشترك.",
  },
  {
    q: "هل بياناتي ومنتجاتي آمنة؟",
    a: "100%. بنستخدم أحدث معايير التشفير ولا نشارك بيانات براندك مع أي طرف تالت.",
  },
  {
    q: "هل بيدعم ربط المتاجر الإلكترونية؟",
    a: "آه! دلوقتي بيدعم ربط Salla وShopify وZid. استورد منتجاتك تلقائياً وولّد محتوى لكل منتج بضغطة واحدة.",
  },
  {
    q: "ممكن ألغي الاشتراك في أي وقت؟",
    a: "أكيد. الإلغاء بضغطة زر من الإعدادات وبدون أي رسوم إضافية.",
  },
  {
    q: "هل الذكاء الاصطناعي بيفهم الثقافة العربية؟",
    a: "آه، ده هو الفرق الأساسي. مش بس بيكتب عربي — بيفهم اللهجات والمناسبات العربية وأسلوب التواصل مع الجمهور العربي.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="faq" className="py-28 section-gradient">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass-card gold-border px-4 py-2 rounded-full mb-6">
            <span className="text-sm text-primary">الأسئلة الشائعة</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            <span className="text-foreground">عندك </span>
            <span className="text-gradient-gold">أسئلة؟</span>
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.06 }}
              className={`glass-card rounded-xl border transition-all duration-300 ${openIndex === i ? "gold-border glow-gold" : "border-border/50 hover:border-border"}`}
            >
              <button
                className="w-full flex items-center justify-between p-5 text-right"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-bold text-foreground text-sm">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="mr-3"
                >
                  <ChevronDown className="w-5 h-5 text-primary shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5">
                      <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

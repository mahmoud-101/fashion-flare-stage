import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Copy, RefreshCw, Check } from "lucide-react";
import { motion, useInView } from "framer-motion";

const EXAMPLES = [
  {
    label: "كابشن إعلاني",
    product: "فستان ساهرة — أسود كلاسيك",
    platform: "إنستجرام",
    dialect: "مصري",
    result: `الأناقة مش رفاهية — دي ضرورة ✨

فستانك الأسود اللي كنتي بتدوري عليه كل الوقت وصل أخيراً 🖤
تصميم كلاسيك يناسب كل المناسبات — من العشا الرومانسي للحفلة اللي هتفضلي فيها الأجمل

🛍️ اطلبي دلوقتي قبل ما ينتهي المقاس بتاعك
⚡ شحن سريع لكل مكان

#فستان_ساهرة #فاشون_مصري #أناقة #ستايل`,
  },
  {
    label: "بوست عرض وخصم",
    product: "تشكيلة حقائب جلد — 5 ألوان",
    platform: "تيك توك",
    dialect: "سعودي",
    result: `خصم 30% على كل الحقائب — يومين بس! ⏰🔥

وين الحقيبة اللي تطق معها أي لوك؟
جلد طبيعي 100% + ضمان سنة + شحن مجاني للمملكة 🇸🇦

لون كاميل 🟫 | أبيض 🤍 | أسود 🖤 | بيج 🟤 | بوردو 🍷

👇 اضغطي اللينك في البايو
لا تفوّتينه — المخزون محدود!

#حقائب #فاشون_سعودي #عروض`,
  },
  {
    label: "إعلان لانش منتج",
    product: "عطر نسائي جديد — ريحة أوود",
    platform: "فيسبوك",
    dialect: "خليجي",
    result: `شيء ما غيّر طريقة إحساسك بنفسك... 🌙

عطرنا الجديد مو بس ريحة — هو تجربة كاملة
أوود خشبي + مسك فاخر + لمسة وردية خفيفة

صُنع خصيصاً للمرأة الخليجية اللي تعرف قيمتها ✨
اللي تدخل الغرفة وتفضل ريحتها بعد ما تروح 🤍

طلبات محدودة لكل مدينة — سجّلي إهتمامك الآن

#عطور #فاشون_خليجي #عطر_فاخر`,
  },
];

const TypewriterText = ({ text, isActive }: { text: string; isActive: boolean }) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setDisplayed("");
      setDone(false);
      return;
    }
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 12);
    return () => clearInterval(interval);
  }, [text, isActive]);

  return (
    <span>
      {displayed}
      {!done && <span className="typewriter-cursor" />}
    </span>
  );
};

const LiveDemoSection = () => {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const [typing, setTyping] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const handleSwitch = (i: number) => {
    if (i === active) return;
    setTyping(false);
    setTimeout(() => {
      setActive(i);
      setTyping(true);
    }, 100);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(EXAMPLES[active].result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section ref={ref} className="py-28 section-gradient relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 glass-card gold-border px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">تجربة مباشرة</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            <span className="text-foreground">شوف النتيجة </span>
            <span className="text-gradient-gold">بنفسك</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            أمثلة حقيقية من المنتج — مش تسويق، ده اللي هيولّده الـ AI لبراندك
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          {/* Tabs */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 justify-center flex-wrap">
            {EXAMPLES.map((ex, i) => (
              <motion.button
                key={i}
                onClick={() => handleSwitch(i)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  active === i
                    ? "btn-gold shadow-lg"
                    : "glass-card border border-border/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {ex.label}
              </motion.button>
            ))}
          </div>

          {/* Demo card */}
          <div className="glass-card gold-border rounded-2xl overflow-hidden glow-gold">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Input side */}
              <div className="p-6 border-b md:border-b-0 md:border-l border-border/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-2 h-2 rounded-full bg-primary/60" />
                  <div className="w-2 h-2 rounded-full bg-primary/30" />
                  <span className="text-xs text-muted-foreground mr-2">المدخلات</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "المنتج", value: EXAMPLES[active].product },
                    { label: "المنصة", value: EXAMPLES[active].platform },
                    { label: "اللهجة", value: EXAMPLES[active].dialect },
                    { label: "النوع", value: EXAMPLES[active].label },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-primary font-bold min-w-[60px]">{row.label}:</span>
                      <span className="text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    وقت التوليد: أقل من 8 ثوانٍ
                  </div>
                </div>
              </div>

              {/* Output side */}
              <div className="p-6 bg-primary/[0.03]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs text-primary font-bold">المحتوى المولّد</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 glass-card border border-border/40 rounded-lg hover:border-primary/40 transition-colors"
                      title="نسخ"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    <button
                      onClick={() => handleSwitch(active === 2 ? 0 : active + 1)}
                      className="p-1.5 glass-card border border-border/40 rounded-lg hover:border-primary/40 transition-colors"
                      title="مثال آخر"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-line min-h-[200px]">
                  <TypewriterText text={EXAMPLES[active].result} isActive={typing} />
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="p-4 border-t border-border/30 text-center bg-primary/[0.02]">
              <p className="text-xs text-muted-foreground mb-3">
                ✨ هذا مثال توضيحي — المنتج الفعلي أقوى بكثير لأنه بيتعلم هوية براندك
              </p>
              <motion.a
                href="/auth"
                whileHover={{ scale: 1.04 }}
                className="btn-gold px-6 py-2 rounded-xl text-sm font-bold inline-block"
              >
                جرّب مع براندك ←
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveDemoSection;

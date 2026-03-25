import { useRef } from "react";
import { ArrowLeft, Zap, CheckCircle2, Sparkles } from "lucide-react";
import { motion, useInView } from "framer-motion";

const AnimatedCounter = ({ target, suffix = "" }: { target: string; suffix?: string }) => {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-2xl md:text-3xl font-black text-gradient-gold"
    >
      {target}{suffix}
    </motion.span>
  );
};

const HeroSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0 });

  const brandsLabel = "+120 براند";

  const checkItems = [
    "كابشنات بالعامية المصرية جاهزة للنشر",
    "صور منتجات احترافية بدون تصوير",
    "إعلانات Meta وInstagram في ثواني",
    "تحليل إعلانات منافسيك",
  ];

  return (
    <section ref={ref} className="relative min-h-screen flex items-center pt-16 overflow-hidden hero-gradient noise-bg">
      {/* Animated grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[100px] opacity-20" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[80px] opacity-15" />
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-primary/40"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-2/3 left-1/3 w-1.5 h-1.5 rounded-full bg-primary/30"
        />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Text */}
          <div className="text-center lg:text-right">

            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 glass-card-strong gold-border px-5 py-2.5 rounded-full mb-8"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
              </span>
              <span className="text-sm text-primary font-medium">{brandsLabel} يستخدم Moda AI الآن</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] mb-6"
            >
              <span className="text-foreground">اكتب محتوى فاشونك</span>
              <br />
              <span className="text-gradient-gold glow-text">بالعامية — في ثواني</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-4 max-w-xl mx-auto lg:mx-0"
            >
              بدّل كاتب المحتوى + الفوتوغرافر + مصمم الإعلانات — كل ده بذكاء اصطناعي متخصص في الفاشون العربي.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-xl px-4 py-2 mb-6"
            >
              <span className="text-primary text-sm font-bold">💰</span>
              <span className="text-sm text-primary font-semibold">وفّر 3,000+ ج.م شهرياً مقابل 400 ج.م فقط</span>
            </motion.div>

            {/* Checklist */}
            <div className="flex flex-col gap-3 mb-8 text-right max-w-sm mx-auto lg:mx-0">
              {checkItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <motion.a
                href="/auth"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-gold px-8 py-4 rounded-xl text-lg font-bold flex items-center gap-2 group animate-pulse-gold"
              >
                ابدأ مجاناً — بدون بطاقة
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </motion.a>
              <motion.a
                href="#features"
                whileHover={{ scale: 1.03 }}
                className="glass-card-strong gold-border px-8 py-4 rounded-xl text-lg font-semibold hover:border-primary/60 transition-all"
              >
                شوف الأدوات
              </motion.a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="flex items-center gap-6 mt-12 justify-center lg:justify-start flex-wrap"
            >
              <div className="text-center">
                <AnimatedCounter target="مجاني" />
                <div className="text-xs text-muted-foreground mt-1">للبداية</div>
              </div>
              <div className="w-px h-10 bg-border/60" />
              <div className="text-center">
                <AnimatedCounter target="400" suffix=" جنيه" />
                <div className="text-xs text-muted-foreground mt-1">الخطة الاحترافية</div>
              </div>
              <div className="w-px h-10 bg-border/60" />
              <div className="text-center">
                <AnimatedCounter target="عربي 100%" />
                <div className="text-xs text-muted-foreground mt-1">مصري وخليجي</div>
              </div>
            </motion.div>
          </div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, rotateY: -10 }}
            animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
            transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="glass-card-strong gold-border rounded-2xl p-6 glow-gold-intense">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/50">
                    <div className="w-10 h-10 rounded-xl btn-gold flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">Moda AI Studio</div>
                      <div className="text-xs text-muted-foreground">يولّد لك محتوى في ثواني</div>
                    </div>
                    <div className="mr-auto flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                      <div className="w-3 h-3 rounded-full bg-green-400/60" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {["كابشن ترويجي", "صورة منتج", "إعلان Meta"].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 1 + i * 0.15 }}
                        className="flex items-center gap-3 bg-secondary/80 rounded-xl px-4 py-3"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                        <span className="text-sm text-muted-foreground">{item}</span>
                        <div className="mr-auto flex items-center gap-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={isInView ? { width: "4rem" } : {}}
                            transition={{ delay: 1.2 + i * 0.2, duration: 0.8 }}
                            className="h-2 bg-primary/25 rounded-full"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-border/30">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 1.8 }}
                      className="btn-gold px-4 py-2.5 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      تم التوليد — جاهز للنشر
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-5 -right-5 glass-card-strong gold-border rounded-xl p-3 shadow-2xl"
              >
                <div className="text-xs font-bold text-primary">عامية مصرية</div>
                <div className="text-xs text-muted-foreground">+خليجي +فصحى</div>
              </motion.div>
              <motion.div
                animate={{ y: [0, 8, 0], rotate: [0, -1, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute -bottom-5 -left-5 glass-card-strong gold-border rounded-xl p-3 shadow-2xl"
              >
                <div className="text-xs text-muted-foreground">وفّرت</div>
                <div className="text-lg font-black text-primary">3 ساعات</div>
              </motion.div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                className="absolute top-1/2 -left-8 glass-card-strong gold-border rounded-xl p-2.5 shadow-2xl"
              >
                <div className="text-xs font-bold text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Score: 94%
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;

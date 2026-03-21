import { ArrowLeft, Sparkles } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative glass-card gold-border rounded-3xl p-12 lg:p-20 text-center overflow-hidden glow-gold-intense"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
          <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/10 blur-[100px] pointer-events-none"
          />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 glass-card gold-border px-4 py-2 rounded-full mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">ابدأ مجاناً اليوم</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="text-4xl lg:text-6xl font-black mb-6"
            >
              <span className="text-foreground">براندك يستاهل </span>
              <br />
              <span className="text-gradient-gold glow-text">محتوى أحسن</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground text-lg lg:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
            >
              انضم لأوائل البراندات العربية على Moda AI.
              <br />
              خطة مجانية دائمة — بدون بيانات بنكية.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.a
                href="/auth"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="btn-gold px-10 py-4 rounded-xl text-lg font-bold flex items-center gap-2 group animate-pulse-gold"
              >
                ابدأ مجاناً — بدون بطاقة
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </motion.a>
              <motion.a
                href="#pricing"
                whileHover={{ scale: 1.03 }}
                className="glass-card gold-border px-10 py-4 rounded-xl text-lg font-semibold hover:border-primary/60 transition-all"
              >
                شوف الأسعار
              </motion.a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

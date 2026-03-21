import { Star, Quote, BadgeCheck } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const testimonials = [
  {
    name: "سارة الشرقاوي",
    role: "صاحبة براند Hana Boutique",
    text: "كنت بصرف 3000 جنيه كل شهر على كاتب محتوى وصور. دلوقتي بـ 400 ج.م بعمل محتوى أحسن 10 مرات وبالسرعة دي! المبيعات اتضاعفت في شهرين.",
    stars: 5,
    location: "القاهرة",
  },
  {
    name: "نور الهاشمي",
    role: "مدير تسويق براند Noura",
    text: "الذكاء الاصطناعي بيكتب بالعامية المصرية بشكل رهيب — زي ما واحدة من التيم بتكتب. بنتاسب 90% من المحتوى من غير تعديل.",
    stars: 5,
    location: "الإسكندرية",
  },
  {
    name: "ريم المنصوري",
    role: "مؤسسة Reem Fashion",
    text: "استوديو الصور ده غير كل حاجة بالنسبالي. بحذف الخلفية وبحط خلفيات احترافية من غير ما أدفع تصوير. وفّرت على الأقل 5000 جنيه شهرياً.",
    stars: 5,
    location: "الرياض",
  },
  {
    name: "لمياء سالم",
    role: "Social Media Manager",
    text: "بدل ما كنت بقضي يومين في عمل محتوى الشهر كله، دلوقتي بخلص في ساعتين. وقتي اتحرر للشغل على الاستراتيجية.",
    stars: 5,
    location: "دبي",
  },
];

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-28 section-gradient relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass-card gold-border px-4 py-2 rounded-full mb-6">
            <span className="text-sm text-primary">آراء العملاء</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            <span className="text-foreground">البراندات </span>
            <span className="text-gradient-gold">بتحبنا</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            آراء أوائل المستخدمين — بدون تجميل
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="glass-card gold-border rounded-2xl p-6 relative group"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-500" />

              {/* Verified badge */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-1 bg-primary/15 border border-primary/25 px-2 py-0.5 rounded-full z-10">
                <BadgeCheck className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-primary font-bold">مشترك موثّق</span>
              </div>

              <div className="relative z-10">
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                <p className="text-sm text-foreground leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-primary fill-primary" />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full btn-gold flex items-center justify-center text-sm font-bold shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                    <div className="text-xs text-primary">{t.location}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Platform logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground text-sm mb-8">يعمل مع منصاتك المفضلة</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {["Salla", "Instagram", "TikTok", "Facebook", "Meta Ads", "WhatsApp"].map((platform) => (
              <motion.div
                key={platform}
                whileHover={{ scale: 1.05, borderColor: "hsl(38 65% 58% / 0.5)" }}
                className="glass-card gold-border px-5 py-2.5 rounded-xl transition-all"
              >
                <span className="text-sm font-bold text-muted-foreground">{platform}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

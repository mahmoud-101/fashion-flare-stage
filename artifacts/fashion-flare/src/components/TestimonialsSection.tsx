import { Star, Quote, BadgeCheck } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const testimonials = [
  {
    name: "سارة الشرقاوي",
    brand: "Hana Boutique",
    role: "صاحبة البراند",
    country: "🇪🇬 القاهرة",
    text: "كنت بصرف 3000 جنيه كل شهر على كاتب محتوى وصور. دلوقتي بـ 400 ج.م بعمل محتوى أحسن 10 مرات وبالسرعة دي! المبيعات اتضاعفت في شهرين.",
    stars: 5,
    uses: "AIWriter + ImageStudio",
    gradient: "from-rose-400 to-pink-600",
  },
  {
    name: "نور الهاشمي",
    brand: "Noura Fashion",
    role: "مدير تسويق",
    country: "🇪🇬 الإسكندرية",
    text: "الذكاء الاصطناعي بيكتب بالعامية المصرية بشكل رهيب — زي ما واحدة من التيم بتكتب. بنتبنى 90% من المحتوى من غير تعديل.",
    stars: 5,
    uses: "AIWriter + ReelScript",
    gradient: "from-violet-400 to-purple-600",
  },
  {
    name: "ريم المنصوري",
    brand: "Reem Fashion",
    role: "مؤسسة البراند",
    country: "🇸🇦 الرياض",
    text: "استوديو الصور ده غيّر كل حاجة. بحذف الخلفية وبحط خلفيات احترافية من غير تصوير. وفّرت على الأقل 5000 ريال شهرياً.",
    stars: 5,
    uses: "ImageStudio + AIWriter",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    name: "لمياء سالم",
    brand: "Style by Lamia",
    role: "Social Media Manager",
    country: "🇦🇪 دبي",
    text: "بدل ما كنت بقضي يومين في عمل محتوى الشهر كله، دلوقتي بخلص في ساعتين. وقتي اتحرر للشغل على الاستراتيجية.",
    stars: 5,
    uses: "AIWriter + Scheduler",
    gradient: "from-teal-400 to-cyan-600",
  },
  {
    name: "منى الغامدي",
    brand: "Mona Abaya",
    role: "مالكة متجر Salla",
    country: "🇸🇦 جدة",
    text: "ربط المتجر بـ Salla كان سهل جداً. دلوقتي بولّد محتوى لكل منتج بضغطة واحدة وبشيّر مباشرة. توفير وقت هائل!",
    stars: 5,
    uses: "Salla Integration + ReelScript",
    gradient: "from-emerald-400 to-green-600",
  },
  {
    name: "فاطمة الكويتية",
    brand: "Fatima Closet",
    role: "مؤثرة فاشون",
    country: "🇰🇼 الكويت",
    text: "الهاشتاجات والكابشنات بالكويتي بالظبط زي ما أنا بتكلم. ما توقعت إن الذكاء الاصطناعي يفهم الثقافة الخليجية لهذا المستوى.",
    stars: 5,
    uses: "AIWriter + HashtagGen",
    gradient: "from-blue-400 to-indigo-600",
  },
];

const AvatarCircle = ({
  name,
  gradient,
}: {
  name: string;
  gradient: string;
}) => (
  <div
    className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-base font-black shrink-0 shadow-lg`}
  >
    {name[0]}
  </div>
);

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
            <span className="text-sm text-primary">آراء العملاء الحقيقية</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            <span className="text-foreground">البراندات </span>
            <span className="text-gradient-gold">بتحبنا</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            آراء موثّقة من مشتركين حقيقيين — بدون تجميل
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              onClick={() => setActive(i)}
              className={`glass-card rounded-2xl p-6 relative group cursor-pointer transition-all duration-300 ${
                active === i
                  ? "border border-primary/60 shadow-lg shadow-primary/10"
                  : "gold-border hover:border-primary/40"
              }`}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-500" />

              <div className="absolute top-4 left-4 inline-flex items-center gap-1 bg-primary/15 border border-primary/25 px-2 py-0.5 rounded-full z-10">
                <BadgeCheck className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-primary font-bold">مشترك موثّق</span>
              </div>

              <div className="relative z-10">
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                <p className="text-sm text-foreground leading-relaxed mb-5">"{t.text}"</p>

                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-primary fill-primary" />
                  ))}
                </div>

                <div className="mb-4">
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    يستخدم: {t.uses}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <AvatarCircle name={t.name} gradient={t.gradient} />
                  <div>
                    <div className="text-sm font-bold text-foreground">{t.name}</div>
                    <div className="text-xs text-primary font-semibold">{t.brand}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.role} · {t.country}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mb-12">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`transition-all duration-300 rounded-full ${
                active === i
                  ? "w-6 h-2 bg-primary"
                  : "w-2 h-2 bg-muted-foreground/30 hover:bg-primary/40"
              }`}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-muted-foreground text-sm mb-8">يعمل مع منصاتك المفضلة</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {["Salla", "Shopify", "Zid", "Instagram", "TikTok", "Facebook", "Meta Ads", "WhatsApp"].map(
              (platform) => (
                <motion.div
                  key={platform}
                  whileHover={{ scale: 1.05, borderColor: "hsl(38 65% 58% / 0.5)" }}
                  className="glass-card gold-border px-5 py-2.5 rounded-xl transition-all"
                >
                  <span className="text-sm font-bold text-muted-foreground">{platform}</span>
                </motion.div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

import { Pen, Image, Video, Calendar, BarChart3, ShoppingBag, ArrowLeftRight, Shirt, ZoomIn, PenTool, Globe, Layers } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: Pen,
    title: "كاتب المحتوى الذكي",
    desc: "كابشنات بالعامية المصرية والخليجية لإنستجرام وتيك توك وإعلانات ميتا — متخصص في لغة الفاشون",
    badge: "الأكثر استخداماً",
  },
  {
    icon: Image,
    title: "استوديو الصور",
    desc: "حذف الخلفية، استبدالها بخلفيات احترافية، وإضافة موديلات افتراضية لمنتجاتك بدون تصوير",
    badge: null,
  },
  {
    icon: ArrowLeftRight,
    title: "تبديل الوجوه Face Swap",
    desc: "بدّل وجه الموديل في صور منتجاتك — اعرض نفس المنتج على موديلات مختلفة بضغطة زر",
    badge: "جديد 🔥",
  },
  {
    icon: Shirt,
    title: "تجربة افتراضية Virtual Try-On",
    desc: "عملاءك يشوفوا شكل الهدوم عليهم قبل ما يشتروا — زوّد مبيعاتك وقلّل المرتجعات",
    badge: "جديد 🔥",
  },
  {
    icon: ZoomIn,
    title: "تكبير الصور AI Upscaler",
    desc: "كبّر صور منتجاتك لدقة 4K بالذكاء الاصطناعي — مثالي للطباعة والإعلانات الكبيرة",
    badge: "جديد",
  },
  {
    icon: PenTool,
    title: "سكتش لصورة Sketch to Image",
    desc: "ارسم فكرة التصميم بشكل بسيط وحوّلها لصورة احترافية — مثالي لتصميم الملابس",
    badge: "جديد",
  },
  {
    icon: Video,
    title: "صانع ريلز وتيك توك",
    desc: "فيديوهات قصيرة احترافية من صور منتجاتك مع موسيقى ترندية وتيمبلاتس جاهزة",
    badge: null,
  },
  {
    icon: Layers,
    title: "استوديو التصميم",
    desc: "بنرات، ستوريز، بوستات — تصاميم احترافية بهوية براندك في ثواني مع مئات التيمبلاتس",
    badge: null,
  },
  {
    icon: Calendar,
    title: "المخطط والجدولة",
    desc: "خطط محتوى شهرية بالذكاء الاصطناعي مع جدولة تلقائية لكل منصاتك في وقت واحد",
    badge: null,
  },
  {
    icon: ShoppingBag,
    title: "ربط المتجر",
    desc: "اربط Salla وأنشئ محتوى لكل منتج تلقائياً. دعم منصات أخرى قريباً.",
    badge: null,
  },
  {
    icon: BarChart3,
    title: "التحليلات",
    desc: "تتبع محتواك المولّد حسب المنصة والنوع — مع اقتراحات لتحسين الأداء.",
    badge: null,
  },
  {
    icon: Globe,
    title: "متعدد اللهجات",
    desc: "أنتج المحتوى بالمصري، السعودي، الإماراتي، أو الفصحى — اختار ما يناسب جمهورك",
    badge: null,
  },
];
const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="features" className="py-28 relative">
      {/* Subtle bg */}
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass-card gold-border px-4 py-2 rounded-full mb-6">
            <span className="text-sm text-primary">الأدوات والمميزات</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            <span className="text-foreground">كل اللي </span>
            <span className="text-gradient-gold">براندك محتاجه</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            مش مجرد أداة كتابة — منصة متكاملة لإنتاج كل المحتوى التسويقي لبراندك الفاشون
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="glass-card gold-border rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-500" />
                
                {feat.badge && (
                  <span className="absolute top-4 left-4 text-xs btn-gold px-2.5 py-1 rounded-full font-bold">
                    {feat.badge}
                  </span>
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/25 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

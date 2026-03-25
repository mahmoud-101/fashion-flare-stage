import { Check, X } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const rows = [
  { feature: "متخصص في الفاشون العربي", moda: true, agency: false, others: false },
  { feature: "يفهم اللهجات العربية", moda: true, agency: "أحياناً", others: false },
  { feature: "توليد صور المنتجات", moda: true, agency: true, others: false },
  { feature: "A/B Testing للإعلانات", moda: true, agency: true, others: false },
  { feature: "إعدادات هوية البراند التلقائية", moda: true, agency: "مدفوع إضافي", others: false },
  { feature: "ربط سلة و Shopify و Zid", moda: true, agency: false, others: false },
  { feature: "تقويم جدولة المحتوى", moda: true, agency: false, others: "محدود" },
  { feature: "التكلفة الشهرية", moda: "من 0 ج.م", agency: "5,000+ ج.م", others: "غير متخصص" },
  { feature: "وقت تسليم المحتوى", moda: "ثوانٍ", agency: "أيام", others: "ساعات" },
];

const renderCell = (val: boolean | string) => {
  if (val === true) return <Check className="w-5 h-5 text-primary mx-auto" />;
  if (val === false) return <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />;
  return <span className="text-xs text-muted-foreground">{val}</span>;
};

const CompareSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass-card gold-border px-4 py-2 rounded-full mb-6">
            <span className="text-sm text-primary">مقارنة</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            <span className="text-foreground">ليه </span>
            <span className="text-gradient-gold">Moda AI</span>
            <span className="text-foreground"> ومش غيره؟</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            مقارنة صريحة مع وكالات التسويق والأدوات الأخرى
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-4xl mx-auto glass-card gold-border rounded-2xl overflow-hidden glow-gold"
        >
          {/* Header */}
          <div className="grid grid-cols-4 gap-0 text-center border-b border-border/40 bg-primary/5">
            <div className="p-4 text-sm font-bold text-foreground">المميزة</div>
            <div className="p-4 border-x border-border/30">
              <div className="text-sm font-black text-gradient-gold">Moda AI</div>
              <div className="text-[10px] text-primary">من 0 ج.م/شهر</div>
            </div>
            <div className="p-4 border-l border-border/30">
              <div className="text-sm font-bold text-muted-foreground">وكالة تسويق</div>
              <div className="text-[10px] text-muted-foreground">5,000+ ج.م</div>
            </div>
            <div className="p-4">
              <div className="text-sm font-bold text-muted-foreground">أدوات أخرى</div>
              <div className="text-[10px] text-muted-foreground">غير متخصصة</div>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.05 }}
              className={`grid grid-cols-4 gap-0 text-center items-center ${
                i < rows.length - 1 ? "border-b border-border/20" : ""
              } ${i % 2 === 0 ? "" : "bg-primary/[0.02]"}`}
            >
              <div className="p-3 text-sm text-foreground text-right pr-4">{row.feature}</div>
              <div className="p-3 border-x border-border/20 bg-primary/5">{renderCell(row.moda)}</div>
              <div className="p-3 border-l border-border/20">{renderCell(row.agency)}</div>
              <div className="p-3">{renderCell(row.others)}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-10"
        >
          <motion.a
            href="/auth"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="btn-gold px-8 py-3 rounded-xl text-sm font-bold inline-block"
          >
            ابدأ مجاناً — بدون بطاقة بنكية ←
          </motion.a>
          <p className="text-muted-foreground text-xs mt-3">خطة مجانية دائمة — بدون بيانات بنكية</p>
        </motion.div>
      </div>
    </section>
  );
};

export default CompareSection;

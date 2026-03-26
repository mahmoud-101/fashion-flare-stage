import { useState, useRef, useCallback } from "react";
import { Sparkles, Copy, Check, Loader2, Send, ChevronDown } from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const PLATFORMS = [
  { value: "instagram", label: "إنستجرام", emoji: "📸" },
  { value: "tiktok", label: "تيك توك", emoji: "🎵" },
  { value: "facebook", label: "فيسبوك", emoji: "📘" },
];

const PRODUCT_EXAMPLES = [
  "فستان سهرة أسود",
  "حقيبة جلد كاميل",
  "عباءة خليجية مطرّزة",
  "بدلة رياضية نسائية",
  "عطر نسائي ورديّ",
];

interface CaptionResultProps {
  text: string;
  index: number;
}

const CaptionResult = ({ text, index }: CaptionResultProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.15 }}
      className="glass-card gold-border rounded-2xl p-5 relative group"
    >
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
          #{index + 1}
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 glass-card border border-border/40 rounded-lg hover:border-primary/40 transition-colors opacity-0 group-hover:opacity-100"
          title="نسخ"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line pr-16 pt-1">
        {text}
      </p>
    </motion.div>
  );
};

const LiveDemoSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const [product, setProduct] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [captions, setCaptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [placeholderIndex] = useState(
    () => Math.floor(Math.random() * PRODUCT_EXAMPLES.length)
  );

  const handleGenerate = useCallback(async () => {
    if (!product.trim()) {
      setError("أدخل اسم المنتج أولاً");
      return;
    }
    setLoading(true);
    setError(null);
    setCaptions([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "public-demo-generate",
        {
          body: {
            product: product.trim(),
            description: description.trim(),
            platform,
          },
        }
      );

      if (fnError) throw fnError;
      if (data?.error === "RATE_LIMIT") {
        setError(data.message || "وصلت للحد اليومي. سجّل مجاناً للمزيد!");
        return;
      }
      if (data?.captions && Array.isArray(data.captions)) {
        setCaptions(data.captions);
        setGenerated(true);
      } else {
        throw new Error("لم تُرسل بيانات صحيحة");
      }
    } catch {
      setError("حصل خطأ في التوليد. جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }, [product, description, platform]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
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
            <span className="text-sm text-primary font-medium">جرّب مجاناً بدون تسجيل</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            <span className="text-foreground">اكتب اسم منتجك، </span>
            <span className="text-gradient-gold">شوف السحر</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            توليد حقيقي بالذكاء الاصطناعي — مش نماذج جاهزة
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-card gold-border rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-border/30">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-xs text-muted-foreground mr-auto">Moda AI — توليد محتوى</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                    اسم المنتج *
                  </label>
                  <input
                    type="text"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={PRODUCT_EXAMPLES[placeholderIndex]}
                    maxLength={100}
                    className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-right"
                    dir="rtl"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                    وصف قصير (اختياري)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="مثلاً: جلد طبيعي، 5 ألوان، سعر 250 ج.م"
                    maxLength={200}
                    className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-right"
                    dir="rtl"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                    المنصة
                  </label>
                  <div className="relative">
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60 transition-colors appearance-none text-right cursor-pointer"
                      dir="rtl"
                      disabled={loading}
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.emoji} {p.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 text-right"
                  >
                    {error}
                    {error.includes("سجّل") && (
                      <a href="/auth" className="mr-2 text-primary hover:underline font-bold">
                        سجّل مجاناً ←
                      </a>
                    )}
                  </motion.div>
                )}

                <motion.button
                  onClick={handleGenerate}
                  disabled={loading || !product.trim()}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full btn-gold py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>الذكاء الاصطناعي بيكتب...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>ولّد 3 كابشنات مجاناً</span>
                      <Send className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {captions.length > 0 && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 space-y-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-primary">
                      النتيجة — {captions.length} كابشنات
                    </span>
                  </div>
                  {captions.map((caption, i) => (
                    <CaptionResult key={i} text={caption} index={i} />
                  ))}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 p-5 bg-primary/5 border border-primary/20 rounded-2xl text-center"
                  >
                    <p className="text-sm text-foreground font-bold mb-1">
                      ✨ أعجبتك النتيجة؟
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      سجّل مجاناً واحصل على 3 توليدات يومياً — بدون بيانات بنكية
                    </p>
                    <a
                      href="/auth"
                      className="btn-gold px-8 py-2.5 rounded-xl text-sm font-bold inline-block"
                    >
                      ابدأ مجاناً الآن ←
                    </a>
                  </motion.div>
                </motion.div>
              )}

              {!generated && captions.length === 0 && !loading && (
                <motion.div
                  key="placeholder"
                  className="p-6 text-center"
                >
                  <p className="text-xs text-muted-foreground">
                    💡 أدخل اسم منتجك واضغط ولّد — النتيجة في ثواني
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveDemoSection;

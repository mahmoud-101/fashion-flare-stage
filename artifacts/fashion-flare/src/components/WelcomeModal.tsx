import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowLeft, ArrowRight, Check, Loader2, Copy,
} from "lucide-react";

const ONBOARDING_KEY = "moda_onboarding_done";
const TOTAL_STEPS = 5;

const DIALECTS = [
  { value: "مصري", emoji: "🇪🇬" },
  { value: "سعودي", emoji: "🇸🇦" },
  { value: "إماراتي", emoji: "🇦🇪" },
  { value: "فصحى", emoji: "📖" },
];

const PRODUCT_CATEGORIES = [
  { value: "women", label: "ملابس نسائي", emoji: "👗" },
  { value: "men", label: "ملابس رجالي", emoji: "👔" },
  { value: "kids", label: "ملابس أطفال", emoji: "🧒" },
  { value: "accessories", label: "أكسسوارات", emoji: "👜" },
  { value: "mixed", label: "متنوع", emoji: "🌟" },
];

const PLATFORMS = [
  { value: "instagram", label: "Instagram", emoji: "📸" },
  { value: "tiktok", label: "TikTok", emoji: "🎵" },
  { value: "facebook", label: "Facebook", emoji: "📘" },
  { value: "salla", label: "Salla", emoji: "🛒" },
  { value: "shopify", label: "Shopify", emoji: "🏪" },
  { value: "zid", label: "Zid", emoji: "🛍️" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

function ConfettiPiece({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={style}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{
        y: 300,
        opacity: 0,
        rotate: Math.random() * 360,
        x: (Math.random() - 0.5) * 200,
      }}
      transition={{ duration: 2 + Math.random() * 1, ease: "easeIn" }}
    />
  );
}

function Confetti() {
  const colors = ["#d6af36", "#f0d060", "#4ade80", "#60a5fa", "#f472b6", "#a78bfa"];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 0.5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((p) => (
        <ConfettiPiece
          key={p.id}
          style={{
            backgroundColor: p.color,
            left: p.left,
            top: 0,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function WelcomeModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);
  const [confetti, setConfetti] = useState(false);

  const [brandName, setBrandName] = useState("");
  const [dialect, setDialect] = useState("مصري");
  const [productCategory, setProductCategory] = useState("women");
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]);

  const [demoProduct, setDemoProduct] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoCaptions, setDemoCaptions] = useState<string[]>([]);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(ONBOARDING_KEY + "_" + user.id);
    if (done) { setChecking(false); return; }

    supabase
      .from("brands")
      .select("id, name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setChecking(false);
        if (!data?.name) setOpen(true);
        else localStorage.setItem(ONBOARDING_KEY + "_" + user.id, "1");
      });
  }, [user]);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const generateDemo = async () => {
    if (!demoProduct.trim()) return;
    setDemoLoading(true);
    setDemoError(null);
    setDemoCaptions([]);
    try {
      const { data, error } = await supabase.functions.invoke("public-demo-generate", {
        body: {
          product: demoProduct.trim(),
          description: `براند ${brandName || "فاشون"} — ${dialect}`,
          platform: platforms[0] || "instagram",
        },
      });
      if (error) throw error;
      if (data?.captions) setDemoCaptions(data.captions);
      else setDemoError("لم تُولَّد نتائج، جرّب مرة أخرى");
    } catch {
      setDemoError("حصل خطأ. جرّب مرة أخرى.");
    } finally {
      setDemoLoading(false);
    }
  };

  const finish = async () => {
    if (!user || !brandName.trim()) return;
    setSaving(true);

    const { data: existing } = await supabase
      .from("brands").select("id").eq("user_id", user.id).maybeSingle();

    const payload: Record<string, unknown> = {
      user_id: user.id,
      name: brandName.trim(),
      dialect: dialect + " " + (DIALECTS.find((d) => d.value === dialect)?.emoji || ""),
      platforms,
      product_category: productCategory,
    };

    if (existing?.id) {
      await supabase.from("brands").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("brands").insert(payload);
    }

    if (demoCaptions.length > 0 && user) {
      await supabase.from("saved_content").insert({
        user_id: user.id,
        title: `أول محتوى: ${demoProduct || brandName}`,
        content: demoCaptions[0],
        content_type: "caption",
        platform: platforms[0] || "instagram",
        status: "draft",
        dialect,
        product_name: demoProduct || brandName,
      });
    }

    await supabase.functions.invoke("send-email", {
      body: {
        type: "welcome",
        email: user.email,
        name: brandName.trim(),
      },
    }).catch(() => {});

    localStorage.setItem(ONBOARDING_KEY + "_" + user.id, "1");
    setSaving(false);
    setConfetti(true);
    go(TOTAL_STEPS - 1);
  };

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const close = () => {
    if (user) localStorage.setItem(ONBOARDING_KEY + "_" + user.id, "1");
    setOpen(false);
    navigate("/dashboard");
  };

  if (checking || !open) return null;

  const progressPct = Math.round((step / (TOTAL_STEPS - 1)) * 100);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg p-0 overflow-hidden glass-card border-primary/30 [&>button]:hidden max-h-[90vh] flex flex-col"
        aria-describedby={undefined}
      >
        <div className="px-6 pt-5 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg btn-gold flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-foreground">Moda AI</span>
            </div>
            {step < TOTAL_STEPS - 1 && (
              <span className="text-xs text-muted-foreground">
                خطوة {step + 1} من {TOTAL_STEPS}
              </span>
            )}
          </div>

          <div className="w-full bg-border/40 rounded-full h-1.5">
            <motion.div
              className="h-1.5 rounded-full bg-gradient-to-r from-primary to-yellow-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="px-6 pb-4"
            >
              {/* Step 0: Welcome */}
              {step === 0 && (
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="text-5xl mb-4"
                  >
                    👋
                  </motion.div>
                  <h2 className="text-2xl font-black text-foreground mb-3">
                    أهلاً بيك في Moda AI!
                  </h2>
                  {user?.user_metadata?.full_name && (
                    <p className="text-primary font-bold text-lg mb-2">
                      {user.user_metadata.full_name}
                    </p>
                  )}
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto mb-6">
                    إعداد براندك هياخد أقل من دقيقتين وبعده هتبدأ توليد محتوى فاشون احترافي بالذكاء الاصطناعي
                  </p>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { emoji: "✍️", label: "كابشنات" },
                      { emoji: "📸", label: "صور" },
                      { emoji: "🎬", label: "ريلز" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="glass-card gold-border rounded-xl p-3 text-center"
                      >
                        <div className="text-2xl mb-1">{item.emoji}</div>
                        <div className="text-xs font-bold text-foreground">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Brand Setup */}
              {step === 1 && (
                <div className="py-4 space-y-5">
                  <div className="text-center mb-2">
                    <h2 className="text-xl font-black text-foreground mb-1">إعداد البراند</h2>
                    <p className="text-xs text-muted-foreground">هذي المعلومات هتخلي الـ AI يكتب بأسلوب براندك</p>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                      اسم البراند *
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="مثلاً: Hana Boutique"
                      maxLength={60}
                      className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-right"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">
                      اللهجة المفضلة
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {DIALECTS.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => setDialect(d.value)}
                          className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                            dialect === d.value
                              ? "border-primary/60 bg-primary/10 text-foreground"
                              : "border-border/40 text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {d.emoji} {d.value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">
                      نوع المنتجات
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setProductCategory(cat.value)}
                          className={`p-3 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 ${
                            productCategory === cat.value
                              ? "border-primary/60 bg-primary/10 text-foreground"
                              : "border-border/40 text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <span>{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Platforms */}
              {step === 2 && (
                <div className="py-4 space-y-5">
                  <div className="text-center mb-2">
                    <h2 className="text-xl font-black text-foreground mb-1">على أي منصات تنشر؟</h2>
                    <p className="text-xs text-muted-foreground">اختار كل المنصات اللي بتستخدمها</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map((p) => {
                      const selected = platforms.includes(p.value);
                      return (
                        <button
                          key={p.value}
                          onClick={() => togglePlatform(p.value)}
                          className={`p-4 rounded-xl border text-sm font-bold transition-all flex items-center gap-3 relative ${
                            selected
                              ? "border-primary/60 bg-primary/10 text-foreground"
                              : "border-border/40 text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <span className="text-lg">{p.emoji}</span>
                          <span>{p.label}</span>
                          {selected && (
                            <Check className="w-4 h-4 text-primary absolute top-2 left-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {platforms.length === 0 && (
                    <p className="text-xs text-amber-400 text-center">اختار منصة واحدة على الأقل</p>
                  )}
                </div>
              )}

              {/* Step 3: Wow Moment */}
              {step === 3 && (
                <div className="py-4 space-y-4">
                  <div className="text-center mb-2">
                    <h2 className="text-xl font-black text-foreground mb-1">
                      🎯 وقت السحر!
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      صف منتجاً تريد كتابة محتوى عنه — الـ AI سيكتب له 3 كابشنات الآن
                    </p>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={demoProduct}
                      onChange={(e) => setDemoProduct(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !demoLoading && generateDemo()}
                      placeholder={`مثلاً: فستان أسود بتفصيل الكتف`}
                      maxLength={100}
                      className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-right"
                      dir="rtl"
                    />
                  </div>

                  <button
                    onClick={generateDemo}
                    disabled={demoLoading || !demoProduct.trim()}
                    className="w-full btn-gold py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {demoLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> الـ AI بيكتب...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> ولّد الآن</>
                    )}
                  </button>

                  {demoError && (
                    <p className="text-xs text-red-400 text-center">{demoError}</p>
                  )}

                  {demoCaptions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="text-xs text-primary font-bold text-center">
                        🎉 هذا ما يستطيع Moda AI فعله لك!
                      </p>
                      {demoCaptions.slice(0, 2).map((caption, i) => (
                        <div
                          key={i}
                          className="glass-card gold-border rounded-xl p-3 relative group"
                        >
                          <button
                            onClick={() => handleCopy(caption, i)}
                            className="absolute top-2 left-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copiedIdx === i ? (
                              <Check className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </button>
                          <p className="text-xs text-foreground leading-relaxed whitespace-pre-line pr-2">
                            {caption}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 4: Completion */}
              {step === 4 && (
                <div className="text-center py-6 relative">
                  {confetti && <Confetti />}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="text-5xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-2xl font-black text-foreground mb-3">
                    براندك جاهز!
                  </h2>
                  <div className="space-y-2 mb-6">
                    {[
                      { emoji: "✅", label: `البراند "${brandName}" محفوظ` },
                      { emoji: "✅", label: "أول محتوى مُولَّد وحُفظ" },
                      { emoji: "🚀", label: "جاهز للإنتاج الفعلي!" },
                    ].map((item) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-2 text-sm text-foreground"
                      >
                        <span>{item.emoji}</span>
                        <span>{item.label}</span>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mb-6">
                    ستجد محتواك الأول في مكتبة المحتوى، ويمكنك توليد المزيد من الداشبورد
                  </p>
                  <button
                    onClick={close}
                    className="btn-gold px-8 py-3 rounded-xl font-bold text-sm"
                  >
                    انطلق للداشبورد ←
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {step < TOTAL_STEPS - 1 && (
          <div className="flex gap-3 px-6 py-4 border-t border-border/30 shrink-0">
            {step > 0 && (
              <button
                onClick={() => go(step - 1)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-secondary border border-border/50 text-sm font-bold text-foreground hover:border-primary/40 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                السابق
              </button>
            )}
            <div className="flex-1" />
            {step === 0 && (
              <button
                onClick={() => go(1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-gold text-sm font-bold"
              >
                هيا بنا!
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {step === 1 && (
              <button
                onClick={() => go(2)}
                disabled={!brandName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                التالي
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => go(3)}
                disabled={platforms.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                جرّب الـ AI الآن
                <Sparkles className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={finish}
                disabled={saving || !brandName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                  <><Check className="w-4 h-4" /> اكمل الإعداد</>
                )}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

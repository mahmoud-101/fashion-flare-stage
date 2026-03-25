import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowLeft, ArrowRight, Check, Loader2,
  Store, Pen, Target, Palette,
} from "lucide-react";

const ONBOARDING_KEY = "moda_onboarding_done";

const dialects = [
  { value: "مصري 🇪🇬", label: "مصري", emoji: "🇪🇬" },
  { value: "سعودي 🇸🇦", label: "سعودي", emoji: "🇸🇦" },
  { value: "إماراتي 🇦🇪", label: "إماراتي", emoji: "🇦🇪" },
  { value: "فصحى", label: "فصحى", emoji: "📖" },
];

const tones = [
  { value: "أنيق ومميز", label: "أنيق ومميز", emoji: "✨" },
  { value: "شبابي ومرح", label: "شبابي ومرح", emoji: "🔥" },
  { value: "فاخر وراقي", label: "فاخر وراقي", emoji: "💎" },
  { value: "كاجوال وعفوي", label: "كاجوال وعفوي", emoji: "😎" },
  { value: "احترافي وموثوق", label: "احترافي وموثوق", emoji: "💼" },
];

const audiences = [
  { value: "بنات 18-25", label: "بنات 18-25", emoji: "👩‍🎓" },
  { value: "بنات 25-35", label: "بنات 25-35", emoji: "👩‍💼" },
  { value: "ستات 35-50", label: "ستات 35-50", emoji: "👑" },
  { value: "رجال فاشون", label: "رجال فاشون", emoji: "👔" },
  { value: "الكل", label: "الجميع", emoji: "🌟" },
];

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export function WelcomeModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  const [brandName, setBrandName] = useState("");
  const [dialect, setDialect] = useState("مصري 🇪🇬");
  const [tone, setTone] = useState("أنيق ومميز");
  const [audience, setAudience] = useState("بنات 18-25");

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
        if (!data || !data.name) setOpen(true);
        else localStorage.setItem(ONBOARDING_KEY + "_" + user.id, "1");
      });
  }, [user]);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const finish = async () => {
    if (!user || !brandName.trim()) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      name: brandName.trim(),
      dialect,
      tone,
      target_audience: audience,
    };
    const { data: existing } = await supabase
      .from("brands").select("id").eq("user_id", user.id).maybeSingle();
    if (existing?.id) {
      await supabase.from("brands").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("brands").insert(payload);
    }
    localStorage.setItem(ONBOARDING_KEY + "_" + user.id, "1");
    setSaving(false);
    go(TOTAL_STEPS);
  };

  const close = () => {
    if (user) localStorage.setItem(ONBOARDING_KEY + "_" + user.id, "1");
    setOpen(false);
  };

  if (checking || !open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg p-0 overflow-hidden glass-card border-primary/30 [&>button]:hidden"
        aria-describedby={undefined}
      >
        {/* Top bar */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg btn-gold flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-black text-gradient-gold text-lg">Moda AI</span>
            </div>
            {step < TOTAL_STEPS && (
              <button
                onClick={close}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                تخطي الإعداد
              </button>
            )}
          </div>

          {/* Progress bar */}
          {step < TOTAL_STEPS && (
            <div className="flex gap-1.5 mb-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    i <= step ? "bg-primary" : "bg-surface-2"
                  }`}
                />
              ))}
            </div>
          )}
          {step < TOTAL_STEPS && (
            <p className="text-[11px] text-muted-foreground">
              خطوة {step + 1} من {TOTAL_STEPS}
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="overflow-hidden min-h-[300px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="px-6"
            >
              {/* Step 0 — Welcome */}
              {step === 0 && (
                <div className="text-right">
                  <div className="text-5xl mb-4">👋</div>
                  <h2 className="text-2xl font-black text-foreground mb-2">
                    أهلاً بك في Moda AI!
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    في دقيقتين هنضبط البراند بتاعك عشان الـ AI يكتب ويصمم بأسلوبك أنت — مش أسلوب جاهز.
                  </p>
                  <div className="space-y-3">
                    {[
                      { icon: Store, text: "اسم البراند وهويته" },
                      { icon: Pen, text: "اللهجة والأسلوب المناسبين" },
                      { icon: Target, text: "الفئة اللي بتستهدفها" },
                    ].map(({ icon: Icon, text }, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-foreground">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1 — Brand Name */}
              {step === 1 && (
                <div className="text-right">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-black text-foreground mb-1">اسم البراند</h2>
                  <p className="text-muted-foreground text-sm mb-5">
                    هيظهر في كل المحتوى اللي الـ AI هيولّده ليك
                  </p>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="مثال: Zara Egypt, House of Nour..."
                    autoFocus
                    className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-right"
                  />
                </div>
              )}

              {/* Step 2 — Dialect + Tone */}
              {step === 2 && (
                <div className="text-right">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <Pen className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-black text-foreground mb-1">اللهجة والأسلوب</h2>
                  <p className="text-muted-foreground text-sm mb-4">اختار اللهجة والنبرة اللي تناسب براندك</p>

                  <p className="text-xs font-bold text-muted-foreground mb-2">اللهجة</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {dialects.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDialect(d.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          dialect === d.value
                            ? "btn-gold border-transparent"
                            : "bg-secondary border-border/50 text-foreground hover:border-primary/40"
                        }`}
                      >
                        <span>{d.emoji}</span>
                        {d.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs font-bold text-muted-foreground mb-2">أسلوب المحتوى</p>
                  <div className="grid grid-cols-2 gap-2">
                    {tones.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTone(t.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          tone === t.value
                            ? "btn-gold border-transparent"
                            : "bg-secondary border-border/50 text-foreground hover:border-primary/40"
                        }`}
                      >
                        <span>{t.emoji}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — Audience */}
              {step === 3 && (
                <div className="text-right">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-black text-foreground mb-1">الفئة المستهدفة</h2>
                  <p className="text-muted-foreground text-sm mb-5">مين اللي بيشتري منك؟</p>
                  <div className="grid grid-cols-2 gap-2">
                    {audiences.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => setAudience(a.value)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
                          audience === a.value
                            ? "btn-gold border-transparent"
                            : "bg-secondary border-border/50 text-foreground hover:border-primary/40"
                        }`}
                      >
                        <span className="text-xl">{a.emoji}</span>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4 — Done */}
              {step === TOTAL_STEPS && (
                <div className="text-center py-4">
                  <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-foreground mb-2">
                    البراند جاهز! 🎉
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    <span className="text-primary font-bold">{brandName}</span> — الـ AI دلوقتي عارف يتكلم بأسلوبك
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => { close(); navigate("/dashboard/ad-generator"); }}
                      className="w-full btn-gold py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      ولّد أول إعلان دلوقتي
                    </button>
                    <button
                      onClick={() => { close(); navigate("/dashboard/writer"); }}
                      className="w-full bg-secondary border border-border/50 py-3.5 rounded-xl text-sm font-bold text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <Pen className="w-4 h-4" />
                      اكتب محتوى سوشيال
                    </button>
                    <button
                      onClick={close}
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      اروح الداشبورد
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer buttons */}
        {step < TOTAL_STEPS && (
          <div className="flex gap-3 px-6 py-5 border-t border-border/30">
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
            {step < TOTAL_STEPS - 1 ? (
              <button
                onClick={() => go(step + 1)}
                disabled={step === 1 && !brandName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                التالي
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving || !brandName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                  <><Check className="w-4 h-4" /> ابدأ الآن</>
                )}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

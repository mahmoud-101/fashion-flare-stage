import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Eye, EyeOff, ArrowRight, Mail } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const planParam = searchParams.get("plan");
  const refCode = searchParams.get("ref");
  const { user } = useAuth();

  // Redirect already-logged-in users
  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  // Store referral code before signup
  useEffect(() => {
    if (refCode) {
      localStorage.setItem("moda_ref_code", refCode);
    }
  }, [refCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/auth?mode=reset",
      });
      if (error) setError("حصل خطأ، تحقق من الإيميل وحاول تاني");
      else setSuccess("تم إرسال رابط إعادة تعيين كلمة السر لإيميلك! ✉️");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const storedRef = localStorage.getItem("moda_ref_code") || refCode || undefined;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            ...(storedRef ? { referred_by: storedRef } : {}),
          },
          emailRedirectTo: window.location.origin + "/dashboard",
        },
      });
      if (error) setError(error.message);
      else {
        localStorage.removeItem("moda_ref_code");
        setSuccess("تم إرسال رابط التأكيد لإيميلك! ✉️");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("بيانات خاطئة، حاول تاني");
      else navigate(redirectTo);
    }
    setLoading(false);
  };

  const modeTitle = {
    login: "أهلاً بيك مجدداً 👋",
    signup: "ابدأ مع Moda AI",
    forgot: "إعادة تعيين كلمة السر",
  }[mode];

  const modeSubtitle = {
    login: "سجّل دخولك وكمّل شغل براندك",
    signup: "خطة مجانية — بدون بطاقة بنكية",
    forgot: "هنبعتلك رابط على إيميلك",
  }[mode];

  return (
    <>
      <Helmet>
        <title>
          {mode === "login" ? "تسجيل الدخول" : mode === "signup" ? "إنشاء حساب" : "نسيت كلمة السر"} | Moda AI
        </title>
        <meta
          name="description"
          content="سجّل دخولك أو أنشئ حسابك على Moda AI وابدأ توليد محتوى فاشون احترافي بالذكاء الاصطناعي."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4 gradient-bg">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl btn-gold flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-gradient-gold">Moda AI</span>
            </a>
            <h1 className="text-2xl font-black text-foreground">{modeTitle}</h1>
            <p className="text-muted-foreground text-sm mt-2">{modeSubtitle}</p>
          </div>

          {planParam && mode !== "forgot" && (
            <div className="glass-card gold-border rounded-xl px-4 py-3 mb-4 flex items-center gap-2.5">
              <span className="text-lg">🎯</span>
              <div>
                <p className="text-xs font-bold text-primary">
                  اشتراك {planParam === "pro" ? "احترافي 400 ج.م/شهر" : planParam === "agency" ? "مؤسسات 800 ج.م/شهر" : ""}
                </p>
                <p className="text-[10px] text-muted-foreground">سجّل دخولك وهتنتقل لصفحة الدفع مباشرةً</p>
              </div>
            </div>
          )}

          <div className="glass-card gold-border rounded-2xl p-8 glow-gold">
            {/* Mode tabs — only for login/signup */}
            {mode !== "forgot" && (
              <div className="flex bg-secondary rounded-xl p-1 mb-6">
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      mode === m ? "btn-gold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "login" ? "تسجيل دخول" : "حساب جديد"}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="text-sm font-bold text-foreground mb-1.5 block">الاسم</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="اسمك الكامل"
                    required
                    className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-bold text-foreground mb-1.5 block">الإيميل</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>

              {mode !== "forgot" && (
                <div>
                  <label className="text-sm font-bold text-foreground mb-1.5 block">كلمة السر</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="6 أحرف على الأقل"
                      required
                      minLength={6}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-400">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <span className="animate-pulse">جاري التحميل...</span>
                ) : mode === "forgot" ? (
                  <>
                    <Mail className="w-5 h-5" />
                    إرسال رابط إعادة التعيين
                  </>
                ) : (
                  <>
                    {mode === "login" ? "دخول" : "إنشاء حساب"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Forgot password link */}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                  className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
                >
                  نسيت كلمة السر؟
                </button>
              )}

              {/* Back to login from forgot */}
              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                  className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
                >
                  ← ارجع لتسجيل الدخول
                </button>
              )}
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            بالتسجيل، أنت موافق على{" "}
            <a href="/terms" className="text-primary hover:underline">شروط الاستخدام</a>{" "}
            و
            <a href="/privacy" className="text-primary hover:underline"> سياسة الخصوصية</a>
          </p>
        </div>
      </div>
    </>
  );
};

export default AuthPage;

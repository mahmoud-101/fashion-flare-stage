import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Sparkles, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin + "/dashboard",
        },
      });
      if (error) setError(error.message);
      else setSuccess("تم إرسال رابط التأكيد لإيميلك! ✉️");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("بيانات خاطئة، حاول تاني");
      else navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) {
      setError("حصل مشكلة مع Google Login، جرب الإيميل");
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"} | Moda AI</title>
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
            <h1 className="text-2xl font-black text-foreground">
              {mode === "login" ? "أهلاً بيك مجدداً 👋" : "ابدأ مع Moda AI"}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {mode === "login"
                ? "سجّل دخولك وكمّل شغل براندك"
                : "خطة مجانية — بدون بطاقة بنكية"}
            </p>
          </div>

          <div className="glass-card gold-border rounded-2xl p-8 glow-gold">
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

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 border border-gray-200 rounded-xl py-3 text-sm font-bold hover:bg-gray-50 transition-colors mb-5 disabled:opacity-60"
            >
              {googleLoading ? (
                <span className="animate-pulse text-gray-600">جاري التوجيه...</span>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  متابعة مع Google
                </>
              )}
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground">أو بالإيميل</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

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
                ) : (
                  <>
                    {mode === "login" ? "دخول" : "إنشاء حساب"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
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

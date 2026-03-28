import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Mail, RefreshCw, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

const CheckEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const stateEmail = (location.state as { email?: string })?.email || "";
  const [email, setEmail] = useState(stateEmail);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) {
      if (user?.email) {
        setEmail(user.email);
      } else {
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.email) setEmail(data.user.email);
        }).catch(() => {});
      }
    }
  }, [email, user]);

  const handleResend = async () => {
    if (!email) {
      setError("لا يوجد بريد إلكتروني — يرجى تسجيل الدخول مجدداً");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (resendError) setError("حصل خطأ أثناء إعادة الإرسال، حاول مجدداً");
      else setSuccess("تم إرسال الرابط! تحقق من بريدك الإلكتروني ✉️");
    } catch {
      setError("حصل خطأ غير متوقع، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>تأكيد البريد الإلكتروني | Moda AI</title>
        <meta name="description" content="تحقق من بريدك الإلكتروني لتفعيل حسابك على Moda AI" />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4 gradient-bg" dir="rtl">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl btn-gold flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-gradient-gold">Moda AI</span>
            </a>
          </div>

          <div className="glass-card gold-border rounded-2xl p-8 glow-gold text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Mail className="w-10 h-10 text-primary" />
              </div>
            </div>

            <h1 className="text-2xl font-black text-foreground mb-3">
              تحقق من بريدك الإلكتروني
            </h1>

            <p className="text-muted-foreground text-sm mb-2">
              أرسلنا رابط التأكيد إلى
            </p>
            {email && (
              <p className="text-primary font-bold text-sm mb-4 break-all">{email}</p>
            )}
            <p className="text-muted-foreground text-sm mb-8">
              افتح الرابط في بريدك لتفعيل حسابك والدخول إلى Moda AI
            </p>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-400 mb-4">
                {success}
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={loading || !email}
              className="w-full btn-gold py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60 mb-4"
            >
              {loading ? (
                <span className="animate-pulse">جاري الإرسال...</span>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  أعد إرسال رابط التأكيد
                </>
              )}
            </button>

            <button
              onClick={() => navigate("/auth")}
              className="w-full py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-primary/30 transition-all flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              العودة لتسجيل الدخول
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            لم يصلك الإيميل؟ تحقق من مجلد الـ Spam أو أعد الإرسال
          </p>
        </div>
      </div>
    </>
  );
};

export default CheckEmailPage;

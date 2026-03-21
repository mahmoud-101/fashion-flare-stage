import { useState, useRef } from "react";
import { Sparkles, Mail, Phone, Instagram, Twitter, CheckCircle, Loader2 } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email, source: "footer" });
    
    if (error) {
      if (error.code === "23505") {
        setStatus("success");
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } else {
      setStatus("success");
      setEmail("");
    }
  };

  return (
    <footer ref={ref} className="border-t border-border/50 py-16 relative">
      <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-4 gap-10 mb-12"
        >
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl btn-gold flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <span className="text-xl font-black text-gradient-gold">Moda AI</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
              Moda AI — منصة الذكاء الاصطناعي لإنتاج محتوى الفاشون العربي. كابشنات، صور، وإعلانات في ثواني.
            </p>
            <div className="flex items-center gap-3">
              <motion.a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 glass-card gold-border rounded-xl flex items-center justify-center hover:border-primary/60 transition-colors"
              >
                <Instagram className="w-4 h-4 text-primary" />
              </motion.a>
              <motion.a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 glass-card gold-border rounded-xl flex items-center justify-center hover:border-primary/60 transition-colors"
              >
                <Twitter className="w-4 h-4 text-primary" />
              </motion.a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4">المنصة</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">المميزات</a></li>
              <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">الأسعار</a></li>
              <li><a href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">كيف يعمل</a></li>
              <li><a href="#faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">الأسئلة الشائعة</a></li>
              <li><a href="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">ابدأ مجاناً</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-foreground mb-4">التواصل</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                hello@moda-ai.com
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                +20 100 000 0000
              </li>
            </ul>
            <div className="mt-6">
              <h4 className="font-bold text-foreground mb-3 text-sm">النشرة البريدية</h4>
              {status === "success" ? (
                <div className="flex items-center gap-2 text-primary text-sm">
                  <CheckCircle className="w-4 h-4" />
                  تم الاشتراك بنجاح! ✉️
                </div>
              ) : (
                <form onSubmit={handleNewsletter} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="بريدك الإلكتروني"
                    required
                    className="flex-1 glass-card gold-border rounded-xl px-3 py-2.5 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                  />
                  <motion.button
                    type="submit"
                    disabled={status === "loading"}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-gold px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                  >
                    {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "اشترك"}
                  </motion.button>
                </form>
              )}
              {status === "error" && (
                <p className="text-destructive text-xs mt-2">حدث خطأ، حاول مرة أخرى</p>
              )}
            </div>
          </div>
        </motion.div>

        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Moda AI — جميع الحقوق محفوظة
          </p>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              سياسة الخصوصية
            </a>
            <a href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              شروط الاستخدام
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

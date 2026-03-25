import { useState } from "react";
import { Menu, X, Sparkles, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 30);
  });

  const links = [
    { label: "المميزات", href: "/#features" },
    { label: "كيف يعمل", href: "/#how-it-works" },
    { label: "الأسعار", href: "/#pricing" },
    { label: "الأسئلة الشائعة", href: "/#faq" },
    { label: "من نحن", href: "/about" },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-card-strong border-b border-border/50 shadow-lg shadow-black/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-9 h-9 rounded-xl btn-gold flex items-center justify-center"
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
          <span className="text-xl font-black text-gradient-gold">Moda AI</span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l, i) => (
            <motion.a
              key={l.href}
              href={l.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 relative group"
            >
              {l.label}
              <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-primary rounded-full group-hover:w-full transition-all duration-300" />
            </motion.a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <motion.a
              href="/dashboard"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="btn-gold px-6 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              لوحة التحكم
            </motion.a>
          ) : (
            <>
              <a href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                تسجيل دخول
              </a>
              <motion.a
                href="/auth"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="btn-gold px-6 py-2.5 rounded-xl text-sm font-bold inline-block"
              >
                جرّب مجاناً
              </motion.a>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden glass-card-strong border-t border-border/50 px-4 py-4 flex flex-col gap-4 overflow-hidden"
          >
            {links.map((l, i) => (
              <motion.a
                key={l.href}
                href={l.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="text-foreground py-2 border-b border-border/30"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </motion.a>
            ))}
            {user ? (
              <a href="/dashboard" className="btn-gold px-5 py-3 rounded-xl text-center mt-2 font-bold flex items-center justify-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                لوحة التحكم
              </a>
            ) : (
              <a href="/auth" className="btn-gold px-5 py-3 rounded-xl text-center mt-2 font-bold">
                جرّب مجاناً — مجاني
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb } from "lucide-react";

interface FirstVisitHintProps {
  hintKey: string;
  message: string;
  position?: "top" | "bottom";
}

export function FirstVisitHint({ hintKey, message, position = "top" }: FirstVisitHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(`hint_seen_${hintKey}`);
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [hintKey]);

  const dismiss = () => {
    localStorage.setItem(`hint_seen_${hintKey}`, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -10 : 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === "top" ? -10 : 10, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`fixed z-50 ${position === "top" ? "top-20" : "bottom-20"} right-6 max-w-xs`}
        >
          <div className="glass-card gold-border rounded-2xl p-4 shadow-2xl shadow-primary/10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed">{message}</p>
            </div>
            <button
              onClick={dismiss}
              className="p-1 rounded-lg hover:bg-primary/10 transition-colors shrink-0"
              aria-label="إخفاء التلميح"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

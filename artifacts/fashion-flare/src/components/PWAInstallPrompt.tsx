import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("moda_pwa_dismissed") === "1"
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("moda_pwa_dismissed", "1");
    setDismissed(true);
  };

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm glass-card gold-border rounded-2xl p-4 animate-in slide-in-from-top-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl btn-gold flex items-center justify-center shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-foreground">ثبّت Moda AI</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            ثبّت التطبيق على جهازك للوصول السريع
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleInstall} className="btn-gold px-4 py-1.5 rounded-lg text-xs font-bold">
              تثبيت
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              لاحقاً
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

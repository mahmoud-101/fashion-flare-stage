import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Pen, Image, Calendar, BarChart3, ShoppingBag, Settings, Sparkles, CreditCard, Library, Camera, Edit3, Wand2, Eye, FlaskConical, Gift, LayoutDashboard, HelpCircle, Store } from "lucide-react";

interface SearchItem {
  title: string;
  description: string;
  url: string;
  icon: React.ElementType;
  keywords: string[];
  comingSoon?: boolean;
}

const searchItems: SearchItem[] = [
  { title: "الرئيسية", description: "لوحة التحكم الرئيسية", url: "/dashboard", icon: LayoutDashboard, keywords: ["home", "dashboard", "رئيسية"] },
  { title: "مولّد الإعلانات", description: "إعلانات احترافية بالذكاء الاصطناعي", url: "/dashboard/ad-generator", icon: Wand2, keywords: ["ad", "إعلان", "creative"] },
  { title: "تجسس المنافسين", description: "حلل إعلانات منافسيك", url: "/dashboard/competitor-spy", icon: Eye, keywords: ["competitor", "spy", "منافس", "تحليل"] },
  { title: "مقارنة الإعلانات", description: "ولّد 4 نسخ لإعلانك وقارن الأداء المتوقع", url: "/dashboard/ab-testing", icon: FlaskConical, keywords: ["test", "اختبار", "مقارنة", "ab", "إعلان"] },
  { title: "كاتب المحتوى", description: "كابشن وإعلانات وستوريز", url: "/dashboard/writer", icon: Pen, keywords: ["writer", "كاتب", "محتوى", "caption"] },
  { title: "مكتبة المحتوى", description: "كل المحتوى المحفوظ", url: "/dashboard/library", icon: Library, keywords: ["library", "مكتبة", "محفوظ"] },
  { title: "استوديو المصمم", description: "أدوات التصميم المتقدمة", url: "/dashboard/creator", icon: Sparkles, keywords: ["creator", "مصمم", "تصميم"] },
  { title: "استوديو التصوير", description: "تصوير منتجات AI", url: "/dashboard/photoshoot", icon: Camera, keywords: ["photo", "تصوير", "منتج"] },
  { title: "استوديو التعديل", description: "تعديل وريتاتش بالـ AI", url: "/dashboard/edit-studio", icon: Edit3, keywords: ["edit", "تعديل", "retouch"] },
  { title: "استوديو الصور", description: "حذف خلفية وتأثيرات", url: "/dashboard/studio", icon: Image, keywords: ["image", "صور", "خلفية"] },
  { title: "المخطط والجدولة", description: "جدولة المنشورات", url: "/dashboard/scheduler", icon: Calendar, keywords: ["schedule", "جدولة", "مخطط"] },
  { title: "التحليلات", description: "إحصائيات الاستخدام", url: "/dashboard/analytics", icon: BarChart3, keywords: ["analytics", "تحليلات", "إحصائيات"] },
  { title: "ربط المتجر", description: "Shopify / Salla / Zid", url: "/dashboard/store", icon: ShoppingBag, keywords: ["store", "متجر", "salla", "shopify"] },
  { title: "قوالب جاهزة", description: "قوالب فاشون مصنفة", url: "/dashboard/templates", icon: Library, keywords: ["template", "قالب", "جاهز"] },
  { title: "إعدادات البراند", description: "هوية ونبرة البراند", url: "/dashboard/brand", icon: Store, keywords: ["brand", "براند", "هوية"] },
  { title: "الاشتراك", description: "خطتك الحالية والترقية", url: "/dashboard/billing", icon: CreditCard, keywords: ["billing", "اشتراك", "خطة", "ترقية"] },
  { title: "الإعدادات", description: "إعدادات الحساب", url: "/dashboard/settings", icon: Settings, keywords: ["settings", "إعدادات", "حساب"] },
  { title: "دعوة صديق", description: "اكسب أيام مجانية", url: "/dashboard/referral", icon: Gift, keywords: ["referral", "دعوة", "صديق"] },
  { title: "مركز المساعدة", description: "أسئلة شائعة ودعم", url: "/dashboard/help", icon: HelpCircle, keywords: ["help", "مساعدة", "دعم", "FAQ"] },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
    }
  }, [open]);

  const filtered = query.trim()
    ? searchItems.filter(
        (item) =>
          item.title.includes(query) ||
          item.description.includes(query) ||
          item.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
      )
    : searchItems;

  const handleSelect = (url: string) => {
    navigate(url);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 glass-card gold-border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border/40">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في الأدوات... (Ctrl+K)"
            className="flex-1 bg-transparent py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              مفيش نتائج لـ "{query}"
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.url}
                  onClick={() => !item.comingSoon && handleSelect(item.url)}
                  disabled={item.comingSoon}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                    item.comingSoon ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/10"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.comingSoon ? "bg-border/30" : "bg-primary/15"}`}>
                    <Icon className={`w-4 h-4 ${item.comingSoon ? "text-muted-foreground" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{item.title}</span>
                      {item.comingSoon && (
                        <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold">قريباً</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border/40 flex items-center gap-4 text-xs text-muted-foreground">
          <span>↵ للدخول</span>
          <span>ESC للإغلاق</span>
          <span className="mr-auto">⌘K للبحث</span>
        </div>
      </div>
    </div>
  );
}

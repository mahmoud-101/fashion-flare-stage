import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Pen, Calendar, Library, Grid3X3,
  X, Image, BarChart3, Wand2, Settings, CreditCard,
  Gift, HelpCircle, Store, Eye, Sparkles, Hash, FlaskConical,
  Camera, ZoomIn, Edit3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const mainItems = [
  { title: "الرئيسية", url: "/dashboard", icon: LayoutDashboard },
  { title: "كاتب", url: "/dashboard/writer", icon: Pen },
  { title: "مكتبة", url: "/dashboard/library", icon: Library },
  { title: "مخطط", url: "/dashboard/scheduler", icon: Calendar },
];

const toolGroups = [
  {
    label: "🤖 الذكاء الاصطناعي",
    items: [
      { title: "كاتب المحتوى", url: "/dashboard/writer", icon: Pen },
      { title: "مولّد الإعلانات", url: "/dashboard/ad-generator", icon: Wand2 },
      { title: "تجسس المنافسين", url: "/dashboard/competitor-spy", icon: Eye },
      { title: "مقارنة الإعلانات", url: "/dashboard/ab-testing", icon: FlaskConical },
      { title: "مولّد الهاشتاجات", url: "/dashboard/hashtags", icon: Hash },
    ],
  },
  {
    label: "🎨 الاستوديو المرئي",
    items: [
      { title: "استوديو المصمم", url: "/dashboard/creator", icon: Sparkles },
      { title: "استوديو التصوير", url: "/dashboard/photoshoot", icon: Camera },
      { title: "استوديو التعديل", url: "/dashboard/edit-studio", icon: Edit3 },
      { title: "استوديو الصور", url: "/dashboard/studio", icon: Image },
      { title: "تكبير HD", url: "/dashboard/upscaler", icon: ZoomIn },
    ],
  },
  {
    label: "📊 النشر والإدارة",
    items: [
      { title: "مكتبة المحتوى", url: "/dashboard/library", icon: Library },
      { title: "المخطط", url: "/dashboard/scheduler", icon: Calendar },
      { title: "التحليلات", url: "/dashboard/analytics", icon: BarChart3 },
      { title: "ربط المتجر", url: "/dashboard/store", icon: Store },
    ],
  },
  {
    label: "⚙️ الحساب",
    items: [
      { title: "الاشتراك", url: "/dashboard/billing", icon: CreditCard },
      { title: "دعوة صديق 🎁", url: "/dashboard/referral", icon: Gift },
      { title: "الإعدادات", url: "/dashboard/settings", icon: Settings },
      { title: "المساعدة", url: "/dashboard/help", icon: HelpCircle },
    ],
  },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const isMoreActive = toolGroups.some((g) => g.items.some((i) => isActive(i.url)));

  return (
    <>
      {/* Full-screen tools overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background rounded-t-3xl max-h-[82vh] flex flex-col"
              style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
                <div>
                  <h3 className="text-base font-black text-foreground">كل الأدوات</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">اختار الأداة اللي تحتاجها</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-4 py-4 pb-6 space-y-5">
                {toolGroups.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-bold text-muted-foreground mb-2.5 px-1">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.url);
                        return (
                          <button
                            key={item.url}
                            onClick={() => { navigate(item.url); setOpen(false); }}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
                              active
                                ? "bg-primary/15 border border-primary/30 text-primary"
                                : "bg-surface-2 border border-transparent text-muted-foreground"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              active ? "bg-primary/20" : "bg-border/30"
                            }`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-[10px] font-bold leading-tight text-center">
                              {item.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-md"
        style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
        <div className="flex items-stretch h-16 px-1">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url);
            return (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/dashboard"}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
              >
                <div className={`w-11 h-7 rounded-xl flex items-center justify-center transition-all ${
                  active ? "bg-primary/15" : ""
                }`}>
                  <Icon className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <span className={`text-[9px] font-bold transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {item.title}
                </span>
              </NavLink>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
          >
            <div className={`w-11 h-7 rounded-xl flex items-center justify-center transition-all ${
              open || isMoreActive ? "bg-primary/15" : ""
            }`}>
              <Grid3X3 className={`w-5 h-5 transition-colors ${open || isMoreActive ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <span className={`text-[9px] font-bold transition-colors ${open || isMoreActive ? "text-primary" : "text-muted-foreground"}`}>
              المزيد
            </span>
          </button>
        </div>

        {/* iOS safe area */}
        <div className="h-safe-bottom" />
      </nav>
    </>
  );
}

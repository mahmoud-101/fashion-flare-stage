import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Pen,
  Image,
  Video,
  BarChart3,
  MoreHorizontal,
  Wand2,
  Calendar,
  Library,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";

const mainTabs = [
  { title: "الرئيسية", url: "/dashboard", icon: LayoutDashboard },
  { title: "الكاتب", url: "/dashboard/writer", icon: Pen },
  { title: "الإعلانات", url: "/dashboard/ad-generator", icon: Wand2 },
  { title: "الصور", url: "/dashboard/studio", icon: Image },
  { title: "المزيد", url: "#more", icon: MoreHorizontal },
];

const moreItems = [
  { title: "صانع الريلز", url: "/dashboard/reels", icon: Video },
  { title: "المخطط", url: "/dashboard/scheduler", icon: Calendar },
  { title: "التحليلات", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "المكتبة", url: "/dashboard/library", icon: Library },
  { title: "الإعدادات", url: "/dashboard/settings", icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const isMoreActive = moreItems.some((item) => isActive(item.url));

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div
            className="absolute bottom-20 left-4 right-4 glass-card gold-border rounded-2xl p-4 animate-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-foreground">المزيد من الأدوات</span>
              <button onClick={() => setShowMore(false)} className="text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                      isActive(item.url)
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-card border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isMoreTab = tab.url === "#more";
            const active = isMoreTab ? isMoreActive || showMore : isActive(tab.url);

            if (isMoreTab) {
              return (
                <button
                  key="more"
                  onClick={() => setShowMore(!showMore)}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{tab.title}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={tab.url}
                to={tab.url}
                end={tab.url === "/dashboard"}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.title}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}

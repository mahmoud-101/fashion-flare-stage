import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UsageMeter } from "@/components/UsageMeter";
import {
  LayoutDashboard,
  Pen,
  Image,
  Calendar,
  BarChart3,
  ShoppingBag,
  Settings,
  Sparkles,
  CreditCard,
  Library,
  Store,
  Camera,
  Edit3,
  Wand2,
  Eye,
  FlaskConical,
  Gift,
  HelpCircle,
  ZoomIn,
  Hash,
} from "lucide-react";

const groups = [
  {
    label: null,
    items: [
      { title: "الرئيسية", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "الذكاء الاصطناعي",
    items: [
      { title: "كاتب المحتوى", url: "/dashboard/writer", icon: Pen },
      { title: "مولّد الإعلانات", url: "/dashboard/ad-generator", icon: Wand2 },
      { title: "تجسس المنافسين", url: "/dashboard/competitor-spy", icon: Eye },
      { title: "مقارنة الإعلانات", url: "/dashboard/ab-testing", icon: FlaskConical },
      { title: "مولّد الهاشتاجات", url: "/dashboard/hashtags", icon: Hash },
    ],
  },
  {
    label: "الاستوديو المرئي",
    items: [
      { title: "استوديو المصمم", url: "/dashboard/creator", icon: Sparkles },
      { title: "استوديو التصوير", url: "/dashboard/photoshoot", icon: Camera },
      { title: "استوديو التعديل", url: "/dashboard/edit-studio", icon: Edit3 },
      { title: "استوديو الصور", url: "/dashboard/studio", icon: Image },
      { title: "تكبير الصور HD", url: "/dashboard/upscaler", icon: ZoomIn },
    ],
  },
  {
    label: "النشر والإدارة",
    items: [
      { title: "مكتبة المحتوى", url: "/dashboard/library", icon: Library },
      { title: "المخطط والجدولة", url: "/dashboard/scheduler", icon: Calendar },
      { title: "التحليلات", url: "/dashboard/analytics", icon: BarChart3 },
      { title: "قوالب جاهزة ✨", url: "/dashboard/templates", icon: Library },
      { title: "ربط المتجر", url: "/dashboard/store", icon: ShoppingBag },
    ],
  },
];

const bottomItems = [
  { title: "مركز المساعدة", url: "/dashboard/help", icon: HelpCircle },
  { title: "دعوة صديق 🎁", url: "/dashboard/referral", icon: Gift },
  { title: "إعدادات البراند", url: "/dashboard/brand", icon: Store },
  { title: "الاشتراك", url: "/dashboard/billing", icon: CreditCard },
  { title: "الإعدادات", url: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-l border-border/50 bg-surface hidden md:flex">
      <SidebarContent className="bg-surface flex flex-col h-full py-4 overflow-y-auto scrollbar-hide">
        {/* Logo */}
        <div className={`flex items-center gap-2 px-4 mb-6 shrink-0 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg btn-gold flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          {!collapsed && <span className="text-lg font-black text-gradient-gold">Moda AI</span>}
        </div>

        {/* Grouped nav */}
        {groups.map((group, gi) => (
          <SidebarGroup key={gi} className={gi === 0 ? "shrink-0" : "shrink-0"}>
            {!collapsed && group.label && (
              <SidebarGroupLabel className="text-muted-foreground/60 text-[10px] uppercase tracking-widest px-4 mb-1 font-bold">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center gap-3 px-4 py-2 rounded-xl mx-2 transition-all duration-200 ${
                          isActive(item.url)
                            ? "bg-primary/15 text-primary border border-primary/25"
                            : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Separator */}
        <div className="mx-4 my-2 h-px bg-border/40 shrink-0" />

        {/* Bottom nav */}
        <SidebarGroup className="shrink-0">
          {!collapsed && (
            <SidebarGroupLabel className="text-muted-foreground/60 text-[10px] uppercase tracking-widest px-4 mb-1 font-bold">
              الحساب
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={`flex items-center gap-3 px-4 py-2 rounded-xl mx-2 transition-all duration-200 ${
                        isActive(item.url)
                          ? "bg-primary/15 text-primary border border-primary/25"
                          : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mx-4 mt-4 shrink-0">
            <UsageMeter compact />
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

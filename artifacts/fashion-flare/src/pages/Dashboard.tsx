import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Pen, Image, Video, Calendar, BarChart3, ShoppingBag, TrendingUp, FileText, Zap, ArrowLeft, Clock, Wand2, Eye, FlaskConical, AlertCircle, Crown, Flame, Sparkles } from "lucide-react";
import { WelcomeModal } from "@/components/WelcomeModal";
import { useSubscription } from "@/hooks/useSubscription";

interface Stats {
  totalContent: number;
  publishedContent: number;
  scheduledContent: number;
  draftContent: number;
}

interface RecentItem {
  id: string;
  title: string;
  content_type: string;
  platform: string;
  status: string;
  created_at: string;
}

const quickTools = [
  { title: "مولّد الإعلانات", desc: "إعلانات احترافية بالـ AI", icon: Wand2, url: "/dashboard/ad-generator", badge: "جديد" },
  { title: "كاتب المحتوى", desc: "كابشن، إعلان، ستوري", icon: Pen, url: "/dashboard/writer", badge: "الأسرع" },
  { title: "تجسس المنافسين", desc: "حلل إعلانات منافسيك", icon: Eye, url: "/dashboard/competitor-spy", badge: "جديد" },
  { title: "A/B اختبار", desc: "قارن نسخ الإعلانات", icon: FlaskConical, url: "/dashboard/ab-testing", badge: null },
  { title: "است��ديو الصور", desc: "حذف خلفية + موديلات", icon: Image, url: "/dashboard/studio", badge: null },
  { title: "صانع الريلز", desc: "سكريبتات ريلز احترافية", icon: Video, url: "/dashboard/reels", badge: null },
  { title: "المخطط", desc: "جدولة كل منصاتك", icon: Calendar, url: "/dashboard/scheduler", badge: null },
  { title: "ربط المتجر", desc: "Shopify / Salla / Zid", icon: ShoppingBag, url: "/dashboard/store", badge: null },
];

const statusColor: Record<string, string> = {
  published: "text-green-400 bg-green-400/10",
  scheduled: "text-primary bg-primary/10",
  draft: "text-muted-foreground bg-surface-2",
};

const statusLabel: Record<string, string> = {
  published: "منشور",
  scheduled: "مجدول",
  draft: "مسودة",
};

type WeekDay = { day: string; count: number; isToday: boolean };

const Dashboard = () => {
  const { user } = useAuth();
  const { isExpiringSoon, daysLeft, plan } = useSubscription();
  const [stats, setStats] = useState<Stats>({ totalContent: 0, publishedContent: 0, scheduledContent: 0, draftContent: 0 });
  const [recentContent, setRecentContent] = useState<RecentItem[]>([]);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [createdToday, setCreatedToday] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch recent content (limited) for display
      const { data: content } = await supabase
        .from("saved_content")
        .select("id, title, content_type, platform, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (content) setRecentContent(content);

      // Fetch counts per status using individual count queries
      const [{ count: total }, { count: published }, { count: scheduled }, { count: draft }] =
        await Promise.all([
          supabase.from("saved_content").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("saved_content").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "published"),
          supabase.from("saved_content").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "scheduled"),
          supabase.from("saved_content").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "draft"),
        ]);

      setStats({
        totalContent: total ?? 0,
        publishedContent: published ?? 0,
        scheduledContent: scheduled ?? 0,
        draftContent: draft ?? 0,
      });

      // Fetch brand
      const { data: brand } = await supabase
        .from("brands")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (brand) setBrandName(brand.name);

      // Streak: last 7 days activity
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const { data: weekContent } = await supabase
        .from("saved_content")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (weekContent) {
        const arabicDays = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
        const days: WeekDay[] = [];
        let total = 0;
        const todayStr = new Date().toISOString().split("T")[0];
        let hasToday = false;
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStr = d.toISOString().split("T")[0];
          const count = weekContent.filter(c => c.created_at.startsWith(dayStr)).length;
          const isToday = dayStr === todayStr;
          if (isToday && count > 0) hasToday = true;
          total += count;
          days.push({ day: arabicDays[d.getDay()], count, isToday });
        }
        setWeekDays(days);
        setWeekTotal(total);
        setCreatedToday(hasToday);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const greeting = user?.user_metadata?.full_name || brandName || "صديقنا";

  const statsDisplay = [
    { label: "إجمالي المحتوى", value: stats.totalContent.toString(), icon: FileText, color: "text-primary" },
    { label: "منشور", value: stats.publishedContent.toString(), icon: TrendingUp, color: "text-green-400" },
    { label: "مجدول", value: stats.scheduledContent.toString(), icon: Calendar, color: "text-blue-400" },
    { label: "مسودة", value: stats.draftContent.toString(), icon: Clock, color: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout title="لوحة التحكم" subtitle={`أهلاً بيك، ${greeting}! 👋`}>

      {/* Subscription Expiry Warning Banner */}
      {isExpiringSoon && (
        <div className="mb-5 flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-sm text-amber-300 font-medium">
              اشتراكك ينتهي بعد {daysLeft} {daysLeft === 1 ? "يوم" : "أيام"}
            </span>
          </div>
          <Link
            to="/dashboard/billing"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline shrink-0"
          >
            جدّد الآن
          </Link>
        </div>
      )}

      {/* Upgrade Banner for Free users */}
      {plan === "free" && !isExpiringSoon && (
        <div className="mb-5 flex items-center justify-between gap-3 bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground/80">
              أنت على الخطة المجانية — <span className="text-primary font-medium">3 توليدات فقط يومياً</span>
            </span>
          </div>
          <Link
            to="/dashboard/billing"
            className="text-xs font-bold btn-gold px-3 py-1.5 rounded-lg shrink-0"
          >
            رقّي للاحترافي
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsDisplay.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card gold-border rounded-2xl p-5 card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              {loading
                ? <div className="h-8 w-16 bg-surface-2 rounded-lg animate-pulse" />
                : <div className="text-2xl font-black text-foreground">{stat.value}</div>
              }
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Streak Widget */}
      {!loading && (
        <div className="mb-6 glass-card gold-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {weekTotal > 0 ? (
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              {weekTotal > 0 ? (
                <>
                  <div className="text-sm font-bold text-foreground">
                    أنشأت <span className="text-amber-400">{weekTotal} قطعة</span> هذا الأسبوع 🔥
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {createdToday ? "رائع! أنشأت محتوى اليوم ✅" : "ابدأ يومك بقطعة محتوى جديدة ✨"}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-foreground">ابدأ يومك بقطعة محتوى جديدة ✨</div>
                  <div className="text-xs text-muted-foreground mt-0.5">لم تنشئ محتوى هذا الأسبوع بعد</div>
                </>
              )}
            </div>
          </div>
          {/* Mini 7-bar chart */}
          <div className="flex items-end gap-1 h-10 shrink-0">
            {weekDays.map((d, i) => {
              const maxCount = Math.max(...weekDays.map(w => w.count), 1);
              const pct = Math.max((d.count / maxCount) * 100, 8);
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 w-6">
                  <div
                    className={`w-full rounded-t transition-all duration-500 ${
                      d.isToday
                        ? "bg-amber-400"
                        : d.count > 0
                        ? "bg-primary/70"
                        : "bg-surface-2"
                    }`}
                    style={{ height: `${pct}%` }}
                    title={`${d.day}: ${d.count}`}
                  />
                  <span className={`text-[9px] leading-none ${d.isToday ? "text-amber-400 font-bold" : "text-muted-foreground/50"}`}>
                    {d.day.charAt(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick tools */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">الأدوات السريعة</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickTools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={i}
                  to={tool.url}
                  className="glass-card gold-border rounded-xl p-4 card-hover relative group flex flex-col gap-3"
                >
                  {tool.badge && (
                    <span className="absolute top-3 left-3 text-xs btn-gold px-2 py-0.5 rounded-full font-bold">
                      {tool.badge}
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{tool.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{tool.desc}</div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors mt-auto" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">آخر المحتوى</h2>
            <Link to="/dashboard/library" className="text-xs text-primary hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-3 h-16 animate-pulse" />
              ))
            ) : recentContent.length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center">
                <p className="text-muted-foreground text-sm">لم تنشئ محتوى بعد</p>
                <Link to="/dashboard/writer" className="text-xs text-primary hover:underline mt-2 inline-block">
                  ابدأ الآن ←
                </Link>
              </div>
            ) : (
              recentContent.map((item) => (
                <div key={item.id} className="glass-card rounded-xl p-3 border border-border/40 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.content_type} • {item.platform}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[item.status] || statusColor.draft}`}>
                    {statusLabel[item.status] || item.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Brand setup CTA */}
          {!loading && !brandName && (
            <div className="mt-4 glass-card gold-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">أكمل إعداد البراند</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">حدد هوية براندك عشان الـ AI يكتب بأسلوبك</p>
              <Link to="/dashboard/brand" className="text-xs text-primary hover:underline">
                إعداد البراند ←
              </Link>
            </div>
          )}
        </div>
      </div>
      <WelcomeModal />
    </DashboardLayout>
  );
};

export default Dashboard;

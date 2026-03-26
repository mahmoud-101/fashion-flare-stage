import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  TrendingUp, FileText, BarChart3, Zap, Image, Video, Pen,
  Download, ArrowUpRight, ArrowDownRight, Minus, Target,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";

interface ContentStats {
  total: number;
  published: number;
  scheduled: number;
  draft: number;
  byPlatform: Record<string, number>;
  byType: Record<string, number>;
  recentItems: { title: string; platform: string; content_type: string; created_at: string; status: string }[];
  thisMonth: number;
  lastMonth: number;
}

interface UsageStats {
  content_generation: number;
  image_generation: number;
  reel_generation: number;
}

type DayData = { day: string; date: string; count: number };

const platformLabel: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  twitter: "Twitter/X",
  ad: "Meta Ads",
};

const platformColor: Record<string, string> = {
  instagram: "#E1306C",
  tiktok: "#69C9D0",
  facebook: "#1877F2",
  twitter: "#1DA1F2",
  ad: "#0081FB",
};

const typeLabel: Record<string, string> = {
  caption: "كابشن",
  story: "ستوري",
  ad: "إعلان",
  reel: "ريلز",
  image: "صورة",
};

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

const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F5D06A";

const LineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card border border-border/40 rounded-xl px-3 py-2 text-xs shadow-lg">
        <div className="text-muted-foreground mb-1">{label}</div>
        <div className="text-primary font-bold">{payload[0].value} قطعة</div>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const total = payload[0].payload.total;
    return (
      <div className="glass-card border border-border/40 rounded-xl px-3 py-2 text-xs shadow-lg">
        <div className="font-bold text-foreground">{payload[0].name}</div>
        <div className="text-primary">{payload[0].value} قطعة</div>
        <div className="text-muted-foreground">{Math.round((payload[0].value / total) * 100)}%</div>
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card border border-border/40 rounded-xl px-3 py-2 text-xs shadow-lg">
        <div className="text-foreground font-bold">{label}</div>
        <div className="text-primary">{payload[0].value} قطعة</div>
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ContentStats>({
    total: 0, published: 0, scheduled: 0, draft: 0,
    byPlatform: {}, byType: {}, recentItems: [],
    thisMonth: 0, lastMonth: 0,
  });
  const [usage, setUsage] = useState<UsageStats>({ content_generation: 0, image_generation: 0, reel_generation: 0 });
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DayData[]>([]);
  const [allContent, setAllContent] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      const { data: content } = await supabase
        .from("saved_content")
        .select("id, title, platform, content_type, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (content) {
        setAllContent(content);

        const byPlatform: Record<string, number> = {};
        const byType: Record<string, number> = {};
        content.forEach(item => {
          byPlatform[item.platform] = (byPlatform[item.platform] || 0) + 1;
          byType[item.content_type] = (byType[item.content_type] || 0) + 1;
        });

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const thisMonth = content.filter(c => c.created_at >= thisMonthStart).length;
        const lastMonth = content.filter(c => c.created_at >= lastMonthStart && c.created_at < lastMonthEnd).length;

        setStats({
          total: content.length,
          published: content.filter(d => d.status === "published").length,
          scheduled: content.filter(d => d.status === "scheduled").length,
          draft: content.filter(d => d.status === "draft").length,
          byPlatform, byType,
          recentItems: content.slice(0, 6),
          thisMonth, lastMonth,
        });

        // Last 30 days
        const arabicMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
        const daily: DayData[] = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStr = d.toISOString().split("T")[0];
          const count = content.filter(c => c.created_at.startsWith(dayStr)).length;
          const label = i === 0 ? "اليوم" : i === 1 ? "أمس" : `${d.getDate()} ${arabicMonths[d.getMonth()]}`;
          daily.push({ day: label, date: dayStr, count });
        }
        setDailyData(daily);
      }

      const { data: usageData } = await supabase
        .from("usage_tracking")
        .select("action_type")
        .eq("user_id", user.id);

      if (usageData) {
        const counts: UsageStats = { content_generation: 0, image_generation: 0, reel_generation: 0 };
        usageData.forEach(u => {
          if (u.action_type in counts) counts[u.action_type as keyof UsageStats]++;
        });
        setUsage(counts);
      }

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const growthRate = stats.lastMonth === 0
    ? (stats.thisMonth > 0 ? 100 : 0)
    : Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100);

  const publishRate = stats.total === 0 ? 0 : Math.round((stats.published / stats.total) * 100);
  const totalAI = usage.content_generation + usage.image_generation + usage.reel_generation;

  const pieData = Object.entries(stats.byPlatform)
    .sort((a, b) => b[1] - a[1])
    .map(([platform, count]) => ({
      name: platformLabel[platform] || platform,
      value: count,
      total: stats.total,
      color: platformColor[platform] || GOLD,
    }));

  const barData = Object.entries(stats.byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      name: typeLabel[type] || type,
      count,
    }));

  const exportCSV = () => {
    const headers = ["العنوان", "النوع", "المنصة", "الحالة", "التاريخ"];
    const rows = allContent.map(item => [
      `"${(item.title || "").replace(/"/g, '""')}"`,
      typeLabel[item.content_type] || item.content_type,
      platformLabel[item.platform] || item.platform,
      statusLabel[item.status] || item.status,
      new Date(item.created_at).toLocaleDateString("ar-SA"),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fashion-flare-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const topPlatform = Object.entries(stats.byPlatform).sort((a, b) => b[1] - a[1])[0];
  const topType = Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">لوحة الإحصائيات</h1>
            <p className="text-sm text-muted-foreground mt-0.5">تتبّع أداء محتواك وإنتاجيتك</p>
          </div>
          <button
            onClick={exportCSV}
            disabled={loading || allContent.length === 0}
            className="flex items-center gap-2 px-4 py-2 glass-card border border-primary/30 text-primary text-sm font-medium rounded-xl hover:bg-primary/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تصدير CSV</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 h-32 animate-pulse bg-surface-2/50" />
            ))
          ) : (
            <>
              {/* This month vs last */}
              <div className="glass-card gold-border rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-bold ${
                    growthRate > 0 ? "text-green-400" : growthRate < 0 ? "text-red-400" : "text-muted-foreground"
                  }`}>
                    {growthRate > 0 ? <ArrowUpRight className="w-3 h-3" /> : growthRate < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {Math.abs(growthRate)}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.thisMonth}</div>
                <div className="text-xs text-muted-foreground mt-0.5">هذا الشهر</div>
                <div className="text-xs text-muted-foreground/60 mt-1">vs {stats.lastMonth} الشهر الماضي</div>
              </div>

              {/* Publish rate */}
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-green-400/15 flex items-center justify-center">
                    <Target className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-xs font-bold text-green-400">{publishRate}%</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.published}</div>
                <div className="text-xs text-muted-foreground mt-0.5">معدل النشر</div>
                <div className="mt-2 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 rounded-full transition-all duration-700"
                    style={{ width: `${publishRate}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground/60 mt-1">من {stats.total} إجمالي</div>
              </div>

              {/* AI generations */}
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-violet-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">{totalAI}</div>
                <div className="text-xs text-muted-foreground mt-0.5">توليدات AI</div>
                <div className="flex gap-2 mt-2">
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground/70">
                    <Pen className="w-2.5 h-2.5" /> {usage.content_generation}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground/70">
                    <Image className="w-2.5 h-2.5" /> {usage.image_generation}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground/70">
                    <Video className="w-2.5 h-2.5" /> {usage.reel_generation}
                  </span>
                </div>
              </div>

              {/* Quick summary */}
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-xs text-muted-foreground mt-0.5">إجمالي المحتوى</div>
                <div className="space-y-0.5 mt-2">
                  <div className="text-xs text-muted-foreground/70">
                    أفضل منصة: <span className="text-foreground font-medium">
                      {topPlatform ? (platformLabel[topPlatform[0]] || topPlatform[0]) : "—"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    أفضل نوع: <span className="text-foreground font-medium">
                      {topType ? (typeLabel[topType[0]] || topType[0]) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Line Chart — 30-day activity */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-foreground">نشاط آخر 30 يوم</h2>
              <p className="text-xs text-muted-foreground mt-0.5">عدد القطع المُنتَجة يومياً</p>
            </div>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          {loading ? (
            <div className="h-48 animate-pulse bg-surface-2/50 rounded-xl" />
          ) : dailyData.every(d => d.count === 0) ? (
            <div className="h-48 flex flex-col items-center justify-center text-center gap-2">
              <BarChart3 className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">لا يوجد نشاط بعد — أنشئ أول محتوى!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 9, fill: "#888", fontFamily: "inherit" }}
                  interval={4}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#888", fontFamily: "inherit" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<LineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={GOLD}
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.count === 0) return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={0} />;
                    const maxCount = Math.max(...dailyData.map(d => d.count));
                    const isPeak = payload.count === maxCount && maxCount > 0;
                    return (
                      <circle
                        key={`dot-${cx}-${cy}`}
                        cx={cx} cy={cy}
                        r={isPeak ? 5 : 3}
                        fill={isPeak ? GOLD_LIGHT : GOLD}
                        stroke={isPeak ? "#fff" : "transparent"}
                        strokeWidth={isPeak ? 1.5 : 0}
                      />
                    );
                  }}
                  activeDot={{ r: 5, fill: GOLD_LIGHT, stroke: GOLD, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie + Bar row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Pie Chart */}
          <div className="glass-card rounded-2xl p-5">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-foreground">توزيع المنصات</h2>
              <p className="text-xs text-muted-foreground mt-0.5">نسبة المحتوى لكل منصة</p>
            </div>
            {loading ? (
              <div className="h-56 animate-pulse bg-surface-2/50 rounded-xl" />
            ) : pieData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                لا يوجد بيانات بعد
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span style={{ fontSize: 11, color: "#aaa", fontFamily: "inherit" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar Chart */}
          <div className="glass-card rounded-2xl p-5">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-foreground">أنواع المحتوى</h2>
              <p className="text-xs text-muted-foreground mt-0.5">مقارنة بين أنواع ما أنتجته</p>
            </div>
            {loading ? (
              <div className="h-56 animate-pulse bg-surface-2/50 rounded-xl" />
            ) : barData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                لا يوجد بيانات بعد
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#888", fontFamily: "inherit" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#ccc", fontFamily: "inherit" }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {barData.map((_, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={index === 0 ? GOLD_LIGHT : index === 1 ? GOLD : `${GOLD}88`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Content */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">آخر المحتوى</h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse bg-surface-2/50 rounded-xl" />
              ))}
            </div>
          ) : stats.recentItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">لا يوجد محتوى بعد</p>
          ) : (
            <div className="space-y-2">
              {stats.recentItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 glass-card rounded-xl border border-border/30">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {platformLabel[item.platform] || item.platform} •{" "}
                      {typeLabel[item.content_type] || item.content_type} •{" "}
                      {new Date(item.created_at).toLocaleDateString("ar-SA")}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[item.status] || statusColor.draft}`}>
                    {statusLabel[item.status] || item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;

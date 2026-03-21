import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, Eye, Calendar, Clock, FileText, BarChart3, Zap, Image, Video, Pen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ContentStats {
  total: number;
  published: number;
  scheduled: number;
  draft: number;
  byPlatform: Record<string, number>;
  byType: Record<string, number>;
  recentItems: { title: string; platform: string; content_type: string; created_at: string; status: string }[];
}

interface UsageStats {
  content_generation: number;
  image_generation: number;
  reel_generation: number;
}

const platformLabel: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  twitter: "Twitter/X",
  ad: "Meta Ads",
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

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ContentStats>({
    total: 0, published: 0, scheduled: 0, draft: 0,
    byPlatform: {}, byType: {}, recentItems: [],
  });
  const [usage, setUsage] = useState<UsageStats>({ content_generation: 0, image_generation: 0, reel_generation: 0 });
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      // Content stats
      const { data: content } = await supabase
        .from("saved_content")
        .select("id, title, platform, content_type, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (content) {
        const byPlatform: Record<string, number> = {};
        const byType: Record<string, number> = {};
        content.forEach(item => {
          byPlatform[item.platform] = (byPlatform[item.platform] || 0) + 1;
          byType[item.content_type] = (byType[item.content_type] || 0) + 1;
        });

        setStats({
          total: content.length,
          published: content.filter(d => d.status === "published").length,
          scheduled: content.filter(d => d.status === "scheduled").length,
          draft: content.filter(d => d.status === "draft").length,
          byPlatform, byType,
          recentItems: content.slice(0, 6),
        });

        // Weekly activity (last 7 days)
        const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        const weekly: { day: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStr = d.toISOString().split("T")[0];
          const count = content.filter(c => c.created_at.startsWith(dayStr)).length;
          weekly.push({ day: days[d.getDay()], count });
        }
        setWeeklyData(weekly);
      }

      // Usage tracking stats (all time)
      const { data: usageData } = await supabase
        .from("usage_tracking")
        .select("action_type")
        .eq("user_id", user.id);

      if (usageData) {
        const counts: UsageStats = { content_generation: 0, image_generation: 0, reel_generation: 0 };
        usageData.forEach(u => {
          if (u.action_type in counts) {
            counts[u.action_type as keyof UsageStats]++;
          }
        });
        setUsage(counts);
      }

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const topPlatform = Object.entries(stats.byPlatform).sort((a, b) => b[1] - a[1])[0];
  const topType = Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0];
  const maxWeekly = Math.max(...weeklyData.map(w => w.count), 1);

  const metricCards = [
    { label: "إجمالي المحتوى", value: stats.total, icon: FileText, color: "text-primary" },
    { label: "منشور", value: stats.published, icon: Eye, color: "text-green-400" },
    { label: "مجدول", value: stats.scheduled, icon: Calendar, color: "text-blue-400" },
    { label: "مسودة", value: stats.draft, icon: Clock, color: "text-muted-foreground" },
  ];

  const usageCards = [
    { label: "محتوى تم توليده", value: usage.content_generation, icon: Pen, color: "text-primary" },
    { label: "صور تم توليدها", value: usage.image_generation, icon: Image, color: "text-emerald-400" },
    { label: "ريلز تم توليدها", value: usage.reel_generation, icon: Video, color: "text-purple-400" },
  ];

  return (
    <DashboardLayout title="التحليلات" subtitle="أداء ومحتوى حسابك">
      {/* Content metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {metricCards.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="glass-card gold-border rounded-2xl p-4 md:p-5 card-hover">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${m.color}`} />
              </div>
              <div className="text-xl md:text-2xl font-black text-foreground">{loading ? "—" : m.value}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-1">{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* AI Usage */}
      <div className="glass-card gold-border rounded-2xl p-5 md:p-6 mb-6">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          استخدام الـ AI (كل الوقت)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {usageCards.map((u, i) => {
            const Icon = u.icon;
            return (
              <div key={i} className="glass-card rounded-xl p-4 text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${u.color}`} />
                <div className="text-lg md:text-xl font-black text-foreground">{loading ? "—" : u.value}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground mt-1">{u.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly activity chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card gold-border rounded-2xl p-5 md:p-6">
            <h3 className="text-sm font-bold text-foreground mb-6">النشاط الأسبوعي</h3>
            {loading ? (
              <div className="h-40 animate-pulse bg-surface-2 rounded-xl" />
            ) : (
              <div className="flex items-end justify-between gap-2 h-32">
                {weeklyData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-foreground">{d.count}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary to-gold-light transition-all duration-500"
                      style={{ height: `${Math.max((d.count / maxWeekly) * 100, 4)}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Platform breakdown */}
          <div className="glass-card gold-border rounded-2xl p-5 md:p-6">
            <h3 className="text-sm font-bold text-foreground mb-6">توزيع المحتوى حسب المنصة</h3>
            {loading ? (
              <div className="h-40 animate-pulse bg-surface-2 rounded-xl" />
            ) : stats.total === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">لا يوجد بيانات بعد</p>
                <button onClick={() => navigate("/dashboard/writer")} className="mt-2 text-xs text-primary hover:underline">
                  أنشئ محتوى الآن ←
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.byPlatform)
                  .sort((a, b) => b[1] - a[1])
                  .map(([platform, count]) => {
                    const pct = Math.round((count / stats.total) * 100);
                    return (
                      <div key={platform}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{platformLabel[platform] || platform}</span>
                          <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-primary to-gold-light transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                <div className="mt-6 pt-5 border-t border-border/50">
                  <h4 className="text-xs font-bold text-foreground mb-3">حسب نوع المحتوى</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.byType)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <span key={type} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
                          {type} <span className="text-primary/60">({count})</span>
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="glass-card gold-border rounded-2xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              ملخص سريع
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">أكثر منصة استخداماً</span>
                <span className="text-xs font-bold text-primary">
                  {loading ? "—" : topPlatform ? platformLabel[topPlatform[0]] || topPlatform[0] : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">أكثر نوع محتوى</span>
                <span className="text-xs font-bold text-primary">
                  {loading ? "—" : topType ? topType[0] : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">معدل النشر</span>
                <span className="text-xs font-bold text-green-400">
                  {loading || stats.total === 0 ? "—" : `${Math.round((stats.published / stats.total) * 100)}%`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">إجمالي توليدات AI</span>
                <span className="text-xs font-bold text-primary">
                  {loading ? "—" : usage.content_generation + usage.image_generation + usage.reel_generation}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card gold-border rounded-2xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">آخر المحتوى</h3>
            <div className="space-y-2">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-12 animate-pulse bg-surface-2 rounded-xl" />)
              ) : stats.recentItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">لا يوجد محتوى</p>
              ) : (
                stats.recentItems.map((item, i) => (
                  <div key={i} className="p-3 glass-card rounded-xl border border-border/30">
                    <div className="text-xs font-bold text-foreground truncate mb-0.5">{item.title}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{platformLabel[item.platform] || item.platform}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[item.status] || statusColor.draft}`}>
                        {statusLabel[item.status] || item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;

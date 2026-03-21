import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Instagram, Smartphone, Facebook, Clock, CheckCircle2, Zap, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ar } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const platformIcon: Record<string, React.ElementType> = {
  instagram: Instagram,
  tiktok: Smartphone,
  facebook: Facebook,
};

const platformLabel: Record<string, string> = {
  instagram: "إنستجرام",
  tiktok: "تيك توك",
  facebook: "فيسبوك",
  ad: "إعلان",
};

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platform: string;
  scheduled_at: string;
  status: string;
  product_name: string | null;
}

const Scheduler = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingPost, setViewingPost] = useState<ScheduledPost | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchPosts();
  }, [user, currentMonth]);

  const fetchPosts = async () => {
    if (!user) return;
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data } = await supabase
      .from("saved_content")
      .select("id, title, content, platform, scheduled_at, status, product_name")
      .eq("user_id", user.id)
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at", { ascending: true });

    setPosts((data as ScheduledPost[]) || []);
    setLoading(false);
  };

  const deletePost = async (id: string) => {
    await supabase.from("saved_content").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success("تم حذف المنشور");
    setViewingPost(null);
    setDeletingPostId(null);
  };

  const markPublished = async (id: string) => {
    await supabase.from("saved_content").update({ status: "published", published_at: new Date().toISOString() }).eq("id", id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "published" } : p));
    toast.success("✅ تم تحديث الحالة لـ منشور");
    setViewingPost(null);
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getPostsForDate = (date: Date) => {
    return posts.filter(p => p.scheduled_at && isSameDay(new Date(p.scheduled_at), date));
  };

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  return (
    <DashboardLayout title="المخطط والجدولة" subtitle="خطط وجدول محتواك على كل المنصات">
      <div className="grid lg:grid-cols-3 gap-6 max-w-6xl">
        {/* Calendar */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card gold-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {format(currentMonth, "MMMM yyyy", { locale: ar })}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-8 h-8 glass-card border border-border/50 rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary/40 text-sm"
                >
                  ›
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-8 h-8 glass-card border border-border/50 rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary/40 text-sm"
                >
                  ‹
                </button>
              </div>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {days.map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOfMonth(currentMonth).getDay() }, (_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map((day) => {
                const dayPosts = getPostsForDate(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all relative ${
                      isSelected ? "btn-gold" :
                      isToday ? "bg-primary/20 border border-primary/40 text-primary" :
                      dayPosts.length > 0 ? "glass-card border border-primary/20 text-foreground hover:border-primary/40" :
                      "hover:bg-surface-2 text-muted-foreground"
                    }`}
                  >
                    {format(day, "d")}
                    {dayPosts.length > 0 && !isSelected && (
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayPosts.slice(0, 3).map((_, j) => (
                          <div key={j} className="w-1 h-1 rounded-full bg-primary" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day detail */}
          {selectedDate && (
            <div className="glass-card gold-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">
                منشورات يوم {format(selectedDate, "d MMMM", { locale: ar })}
              </h3>
              {selectedDatePosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">لا يوجد منشورات مجدولة لهذا اليوم</p>
              ) : (
                <div className="space-y-2">
                  {selectedDatePosts.map((post) => {
                    const Icon = platformIcon[post.platform] || Calendar;
                    return (
                      <div
                        key={post.id}
                        className="flex items-center gap-3 p-3 rounded-xl glass-card border border-border/30 cursor-pointer hover:border-primary/30"
                        onClick={() => setViewingPost(post)}
                      >
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs font-bold text-foreground">{post.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {platformLabel[post.platform]} • {format(new Date(post.scheduled_at), "h:mm a")}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          post.status === "published" ? "bg-green-500/15 text-green-400" : "bg-primary/15 text-primary"
                        }`}>
                          {post.status === "published" ? "منشور" : "مجدول"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* AI schedule suggestion */}
          <div className="glass-card rounded-2xl border border-primary/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">اقتراح أفضل أوقات النشر</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">بناءً على أفضل الممارسات لمنصات السوشيال ميديا العربية:</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { platform: "Instagram", time: "10:00 ص - 1:00 م", day: "الأثنين والخميس" },
                { platform: "TikTok", time: "8:00 م - 10:00 م", day: "يومياً" },
                { platform: "Facebook", time: "9:00 ص - 11:00 ص", day: "الأحد والأربعاء" },
              ].map((s) => (
                <div key={s.platform} className="glass-card rounded-xl p-3 border border-border/30">
                  <div className="text-xs font-bold text-primary mb-1">{s.platform}</div>
                  <div className="text-xs text-foreground">{s.time}</div>
                  <div className="text-xs text-muted-foreground">{s.day}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="glass-card gold-border rounded-2xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">المنشورات القادمة</h3>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 glass-card rounded-xl animate-pulse" />
                ))}
              </div>
            ) : posts.filter(p => p.status === "scheduled").length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا يوجد منشورات مجدولة</p>
            ) : (
              <div className="space-y-2">
                {posts.filter(p => p.status === "scheduled").slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="p-3 glass-card rounded-xl border border-border/30 cursor-pointer hover:border-primary/30"
                    onClick={() => setViewingPost(post)}
                  >
                    <div className="text-xs font-bold text-foreground mb-0.5">{post.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {platformLabel[post.platform]} • {format(new Date(post.scheduled_at), "d MMM h:mm a", { locale: ar })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card gold-border rounded-2xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">إحصائيات الشهر</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">مجدول</span>
                <span className="text-sm font-bold text-primary">{posts.filter(p => p.status === "scheduled").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">منشور</span>
                <span className="text-sm font-bold text-green-400">{posts.filter(p => p.status === "published").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">إجمالي</span>
                <span className="text-sm font-bold text-foreground">{posts.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View post dialog */}
      <Dialog open={!!viewingPost} onOpenChange={(open) => !open && setViewingPost(null)}>
        <DialogContent className="glass-card gold-border max-w-lg">
          {viewingPost && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-foreground">{viewingPost.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {format(new Date(viewingPost.scheduled_at), "d MMMM yyyy h:mm a", { locale: ar })}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {(() => { const Icon = platformIcon[viewingPost.platform] || Calendar; return <Icon className="w-4 h-4" />; })()}
                  {platformLabel[viewingPost.platform] || viewingPost.platform}
                </div>
                <div className="bg-surface-2 rounded-xl p-4 mt-3">
                  <pre className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{viewingPost.content}</pre>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                {viewingPost.status === "scheduled" && (
                  <button
                    onClick={() => markPublished(viewingPost.id)}
                    className="flex-1 btn-gold py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> تم النشر
                  </button>
                )}
                <button
                  onClick={() => setDeletingPostId(viewingPost.id)}
                  className="flex-1 glass-card border border-destructive/30 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> حذف
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingPostId} onOpenChange={(open) => !open && setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا المنشور؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المنشور نهائياً ولا يمكن استرجاعه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPostId && deletePost(deletingPostId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Scheduler;

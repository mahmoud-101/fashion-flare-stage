import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Copy, Trash2, Filter, Instagram, Smartphone, Facebook, Megaphone, CheckCircle2, Clock, FileText, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 30;

const platformIcon: Record<string, React.ElementType> = {
  instagram: Instagram,
  tiktok: Smartphone,
  facebook: Facebook,
  ad: Megaphone,
};

const platformLabel: Record<string, string> = {
  instagram: "إنستجرام",
  tiktok: "تيك توك",
  facebook: "فيسبوك",
  ad: "إعلان",
};

const statusStyle: Record<string, string> = {
  published: "bg-green-500/15 text-green-400 border-green-500/20",
  scheduled: "bg-primary/15 text-primary border-primary/20",
  draft: "bg-surface-2 text-muted-foreground border-border/30",
};

const statusLabel: Record<string, string> = {
  published: "منشور",
  scheduled: "مجدول",
  draft: "مسودة",
};

interface ContentItem {
  id: string;
  title: string;
  content: string;
  platform: string;
  status: string;
  product_name: string | null;
  created_at: string;
}

const ContentLibrary = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchPage();
  }, [user, page]);

  const fetchPage = async () => {
    if (!user) return;
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await supabase
      .from("saved_content")
      .select("id, title, content, platform, status, product_name, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    setItems((data as ContentItem[]) || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  const copyContent = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteItem = async (id: string) => {
    await supabase.from("saved_content").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotalCount((prev) => prev - 1);
  };

  const filtered = items.filter((item) => {
    const matchSearch =
      search === "" ||
      item.title.includes(search) ||
      item.content.includes(search) ||
      (item.product_name || "").includes(search);
    const matchFilter = filter === "all" || item.platform === filter || item.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <DashboardLayout title="مكتبة المحتوى" subtitle={`${totalCount} محتوى محفوظ`}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في مكتبتك..."
            className="w-full bg-surface-2 border border-border/50 rounded-xl pr-10 pl-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {["all", "instagram", "tiktok", "facebook", "published", "draft", "scheduled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? "btn-gold" : "glass-card border border-border/50 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {f === "all" ? "الكل" : platformLabel[f] || statusLabel[f] || f}
            </button>
          ))}
        </div>
      </div>

      {/* Content grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 border border-border/30 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="text-foreground font-bold mb-1">
            {totalCount === 0 ? "مكتبتك فاضية لسه" : "مفيش نتائج"}
          </p>
          <p className="text-muted-foreground text-sm mb-5">
            {totalCount === 0
              ? "ابدأ بإنشاء محتوى من كاتب المحتوى الذكي"
              : "حاول تغير كلمة البحث أو الفلتر"}
          </p>
          {totalCount === 0 && (
            <a
              href="/dashboard/writer"
              className="btn-gold px-6 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2"
            >
              <span>✨</span>
              إنشاء محتوى جديد
            </a>
          )}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const PlatformIcon = platformIcon[item.platform] || FileText;
              return (
                <div key={item.id} className="glass-card gold-border rounded-2xl p-5 flex flex-col gap-3 card-hover group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                        <PlatformIcon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">{platformLabel[item.platform] || item.platform}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusStyle[item.status] || statusStyle.draft}`}>
                      {statusLabel[item.status] || item.status}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-foreground mb-0.5">{item.title}</div>
                    {item.product_name && (
                      <div className="text-xs text-muted-foreground">{item.product_name}</div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                    {item.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString("ar-EG")}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyContent(item.id, item.content)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          copiedId === item.id ? "bg-green-500/20 text-green-400" : "glass-card border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/30"
                        }`}
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="w-7 h-7 rounded-lg glass-card border border-border/30 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد من حذف هذا المحتوى؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم حذف "{item.title}" نهائياً ولا يمكن استرجاعه.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteItem(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-9 h-9 glass-card border border-border/50 rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary/40 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                صفحة {page + 1} من {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-9 h-9 glass-card border border-border/50 rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary/40 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default ContentLibrary;

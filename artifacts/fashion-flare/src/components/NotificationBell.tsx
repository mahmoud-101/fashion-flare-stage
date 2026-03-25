import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, X, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
    staleTime: 15000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      markAllRead.mutate();
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `${mins} د`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} س`;
    return `${Math.floor(hrs / 24)} ي`;
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="relative w-9 h-9 glass-card gold-border rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 glass-card border-border/50" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border/30">
          <h3 className="text-sm font-bold text-foreground">الإشعارات</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              قراءة الكل
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">جاري التحميل...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">مفيش إشعارات لسه</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 border-b border-border/20 hover:bg-surface-2/50 transition-colors ${
                  !notif.is_read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{notif.title}</div>
                    {notif.message && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</div>
                    )}
                    <div className="text-xs text-muted-foreground/60 mt-1">{timeAgo(notif.created_at)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper to create notifications from anywhere
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message?: string,
  actionUrl?: string
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message: message || null,
    action_url: actionUrl || null,
  });
}

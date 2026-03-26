import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActiveSubscription {
  id: string;
  plan: "free" | "pro" | "agency";
  status: string;
  starts_at: string;
  expires_at: string | null;
  amount: number;
  payment_reference: string | null;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading, refetch } = useQuery<ActiveSubscription | null>({
    queryKey: ["active-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return null;

      // Auto-expire on client side if past expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        // Mark as expired in DB (fire-and-forget)
        supabase.from("subscriptions")
          .update({ status: "expired" })
          .eq("id", data.id)
          .then(() => {});
        return null;
      }

      return data as ActiveSubscription;
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Re-check every 5 minutes
  });

  const plan = subscription?.plan || "free";
  const isPro = plan === "pro" || plan === "agency";
  const isAgency = plan === "agency";

  const expiresAt = subscription?.expires_at;
  const daysLeft = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
    : null;

  const isExpiringSoon = daysLeft !== null && daysLeft <= 3;

  return {
    subscription,
    isLoading,
    refetch,
    plan,
    isPro,
    isAgency,
    expiresAt,
    daysLeft,
    isExpiringSoon,
  };
}

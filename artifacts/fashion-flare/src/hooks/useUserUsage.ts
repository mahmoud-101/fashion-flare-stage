import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UsageData {
  action_type: string;
  used: number;
  limit_value: number;
}

interface UserLimits {
  plan_name: string;
  daily_generations: number;
  daily_images: number;
  daily_reels: number;
  can_schedule: boolean;
  can_connect_store: boolean;
  can_batch_export: boolean;
}

export function useUserUsage() {
  const { user } = useAuth();

  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
    queryKey: ["user-usage", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("get_user_usage", { _user_id: user.id });
      if (error) throw error;
      return data as UsageData[];
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  const { data: limits, isLoading: limitsLoading } = useQuery({
    queryKey: ["user-limits", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("get_user_limits", { _user_id: user.id });
      if (error) throw error;
      return (data as UserLimits[])?.[0] || null;
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });

  const getUsage = (actionType: string) => {
    const item = usage?.find((u) => u.action_type === actionType);
    return {
      used: item?.used || 0,
      limit: item?.limit_value || 5,
      isUnlimited: item?.limit_value === -1,
      percentage: item?.limit_value === -1 ? 0 : ((item?.used || 0) / (item?.limit_value || 5)) * 100,
      remaining: item?.limit_value === -1 ? Infinity : (item?.limit_value || 5) - (item?.used || 0),
    };
  };

  return {
    usage,
    limits,
    isLoading: usageLoading || limitsLoading,
    refetchUsage,
    getUsage,
    planName: limits?.plan_name || "free",
    isPro: limits?.plan_name === "pro" || limits?.plan_name === "agency",
    isAgency: limits?.plan_name === "agency",
  };
}

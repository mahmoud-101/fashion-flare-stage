import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ONBOARDING_KEY = "moda_onboarding_done";

export interface OnboardingStep {
  id: string;
  label: string;
  done: boolean;
  link?: string;
}

interface OnboardingState {
  isComplete: boolean;
  steps: OnboardingStep[];
  progress: number;
  hasBrand: boolean;
  hasContent: boolean;
  hasStore: boolean;
  hasScheduled: boolean;
  markComplete: () => void;
  reload: () => void;
}

export function useOnboarding(): OnboardingState {
  const { user } = useAuth();
  const [hasBrand, setHasBrand] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [hasScheduled, setHasScheduled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;

    const [
      { data: brand },
      { count: contentCount },
      { count: scheduledCount },
    ] = await Promise.all([
      supabase.from("brands").select("name, salla_token").eq("user_id", user.id).maybeSingle(),
      supabase.from("saved_content").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("saved_content").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "scheduled"),
    ]);

    setHasBrand(!!(brand?.name));
    setHasContent((contentCount ?? 0) > 0);
    setHasStore(!!(brand?.salla_token));
    setHasScheduled((scheduledCount ?? 0) > 0);
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const markComplete = useCallback(() => {
    if (user) localStorage.setItem(ONBOARDING_KEY + "_" + user.id, "1");
  }, [user]);

  const steps: OnboardingStep[] = [
    { id: "register", label: "تسجيل الحساب", done: true },
    { id: "brand", label: "إعداد اسم البراند", done: hasBrand, link: "/dashboard/brand" },
    { id: "content", label: "أول توليد محتوى", done: hasContent, link: "/dashboard/writer" },
    { id: "store", label: "توصيل المتجر", done: hasStore, link: "/dashboard/store" },
    { id: "schedule", label: "جدولة أول بوست", done: hasScheduled, link: "/dashboard/scheduler" },
  ];

  const doneCnt = steps.filter((s) => s.done).length;
  const progress = Math.round((doneCnt / steps.length) * 100);
  const isComplete = doneCnt === steps.length;

  return {
    isComplete,
    steps,
    progress,
    hasBrand,
    hasContent,
    hasStore,
    hasScheduled,
    markComplete,
    reload: load,
  };
}

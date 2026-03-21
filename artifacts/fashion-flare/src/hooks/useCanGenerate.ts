import { useState, useCallback } from "react";
import { useUserUsage } from "./useUserUsage";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/components/NotificationBell";

type ActionType = "content_generation" | "image_generation" | "reel_generation";

interface UseCanGenerateReturn {
  canGenerate: (actionType: ActionType) => boolean;
  checkAndProceed: (actionType: ActionType, onProceed: () => void) => void;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  limitType: "content" | "image" | "reel";
  currentUsed: number;
  currentLimit: number;
}

const actionToLimitType: Record<ActionType, "content" | "image" | "reel"> = {
  content_generation: "content",
  image_generation: "image",
  reel_generation: "reel",
};

const limitLabels: Record<string, string> = {
  content: "المحتوى",
  image: "الصور",
  reel: "الريلز",
};

export function useCanGenerate(): UseCanGenerateReturn {
  const { user } = useAuth();
  const { getUsage, refetchUsage } = useUserUsage();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitType, setLimitType] = useState<"content" | "image" | "reel">("content");
  const [currentUsed, setCurrentUsed] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(5);

  const canGenerate = useCallback((actionType: ActionType): boolean => {
    const usage = getUsage(actionType);
    if (usage.isUnlimited) return true;
    return usage.remaining > 0;
  }, [getUsage]);

  const checkAndProceed = useCallback((actionType: ActionType, onProceed: () => void) => {
    const usage = getUsage(actionType);
    
    if (usage.isUnlimited || usage.remaining > 0) {
      onProceed();
      
      // After generation, check for notifications
      setTimeout(async () => {
        await refetchUsage();
        
        if (!user || usage.isUnlimited) return;
        const lt = actionToLimitType[actionType];
        const label = limitLabels[lt];
        
        // First generation notification
        if (usage.used === 0) {
          await createNotification(
            user.id,
            "first_generation",
            "🎉 أول محتوى لك!",
            `مبروك! ولّدت أول ${label} ليك. استكشف باقي الأدوات!`,
            "/dashboard"
          );
        }
        
        // 80% limit warning
        const newUsed = usage.used + 1;
        const threshold = Math.floor(usage.limit * 0.8);
        if (newUsed === threshold) {
          await createNotification(
            user.id,
            "limit_warning",
            `⚠️ استخدمت 80% من حصة ${label}`,
            `فاضلك ${usage.limit - newUsed} فقط اليوم. رقّي للاحترافي للمزيد!`,
            "/dashboard/billing"
          );
        }
      }, 2000);
    } else {
      setLimitType(actionToLimitType[actionType]);
      setCurrentUsed(usage.used);
      setCurrentLimit(usage.limit);
      setShowUpgradeModal(true);
    }
  }, [getUsage, refetchUsage, user]);

  return {
    canGenerate,
    checkAndProceed,
    showUpgradeModal,
    setShowUpgradeModal,
    limitType,
    currentUsed,
    currentLimit,
  };
}

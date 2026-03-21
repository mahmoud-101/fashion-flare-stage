// Conversion tracking utility
// Supports Google Analytics (gtag) and Facebook Pixel

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type EventName =
  | "sign_up"
  | "login"
  | "upgrade_plan"
  | "generate_content"
  | "generate_image"
  | "generate_reel"
  | "connect_store"
  | "referral_share"
  | "newsletter_subscribe";

interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

export function trackEvent(event: EventName, params?: EventParams) {
  // Google Analytics
  if (window.gtag) {
    window.gtag("event", event, params);
  }

  // Facebook Pixel
  if (window.fbq) {
    const fbEvents: Record<string, string> = {
      sign_up: "CompleteRegistration",
      upgrade_plan: "Purchase",
      generate_content: "Lead",
    };
    const fbEvent = fbEvents[event];
    if (fbEvent) {
      window.fbq("track", fbEvent, params);
    } else {
      window.fbq("trackCustom", event, params);
    }
  }
}

export function useAnalyticsTracking() {
  return { trackEvent };
}

import { errorResponse } from "./cors.ts";

export type PlanTier = "free" | "pro" | "enterprise";
export type UsageType = "images" | "text";

export const LIMITS: Record<PlanTier, Record<UsageType, number>> = {
  free: { images: 10, text: 30 },
  pro: { images: 50, text: 150 },
  enterprise: { images: 200, text: 500 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
  error?: string;
}

export async function checkRateLimit(
  userId: string,
  type: UsageType,
  plan: PlanTier,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<RateLimitResult> {
  const limit = LIMITS[plan][type];

  let res: Response;
  try {
    res = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_quota`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_type: type,
        p_limit: limit,
      }),
    });
  } catch (err) {
    console.error("Rate limit check network error", err);
    return { allowed: false, remaining: 0, limit, resetAt: "", error: "quota_unavailable" };
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown");
    console.error("Rate limit RPC failed", res.status, errText);
    return { allowed: false, remaining: 0, limit, resetAt: "", error: "quota_unavailable" };
  }

  let rows: unknown[];
  try {
    rows = await res.json();
  } catch (err) {
    console.error("Rate limit response parse error", err);
    return { allowed: false, remaining: 0, limit, resetAt: "", error: "quota_unavailable" };
  }

  const row = (rows as Record<string, unknown>[])?.[0];

  if (!row) {
    console.error("Rate limit returned no row");
    return { allowed: false, remaining: 0, limit, resetAt: "", error: "quota_unavailable" };
  }

  const currentCount: number = Number(row.current_count ?? 0);
  const allowed: boolean = Boolean(row.allowed);
  const windowStart: string = String(row.window_start ?? "");
  const windowEnd = windowStart
    ? new Date(new Date(windowStart).getTime() + 60 * 60 * 1000).toISOString()
    : "";
  const remaining = Math.max(0, limit - currentCount);

  return { allowed, remaining, limit, resetAt: windowEnd };
}

export async function getRemainingQuota(
  userId: string,
  type: UsageType,
  plan: PlanTier,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<number> {
  const limit = LIMITS[plan][type];
  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);
  windowStart.setSeconds(0, 0);

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/quota_counters?user_id=eq.${userId}&usage_type=eq.${type}&window_start=eq.${windowStart.toISOString()}&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );
    if (!res.ok) return 0;
    const rows = await res.json();
    const count = rows?.[0]?.count ?? 0;
    return Math.max(0, limit - count);
  } catch {
    return 0;
  }
}

export function rateLimitResponse(result: RateLimitResult): Response {
  if (result.error === "quota_unavailable") {
    return errorResponse(
      "تعذر التحقق من الحصة المتاحة حالياً. يرجى المحاولة مرة أخرى لاحقاً.",
      503,
      { code: "quota_unavailable" }
    );
  }
  return errorResponse(
    "لقد تجاوزت الحد الأقصى المسموح به من الطلبات. يرجى الانتظار حتى إعادة تعيين الحصة.",
    429,
    {
      remaining: result.remaining,
      limit: result.limit,
      reset_at: result.resetAt,
    }
  );
}

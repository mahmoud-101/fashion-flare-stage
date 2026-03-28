import type { PlanTier } from "./rate-limit.ts";

export async function getUserPlan(
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
  userEmail?: string
): Promise<PlanTier> {
  const now = new Date().toISOString();

  const byId = await fetch(
    `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&status=eq.active&expires_at=gte.${now}&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (byId.ok) {
    const rows = await byId.json();
    const tier = rows?.[0]?.plan_tier;
    if (tier === "pro" || tier === "enterprise") return tier;
    if (rows?.length > 0 && tier === "free") return "free";
  }

  if (userEmail) {
    const byEmail = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?user_email=eq.${encodeURIComponent(userEmail)}&status=eq.active&expires_at=gte.${now}&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    if (byEmail.ok) {
      const rows = await byEmail.json();
      const tier = rows?.[0]?.plan_tier;
      if (tier === "pro" || tier === "enterprise") return tier;

      if (rows?.length > 0 && rows[0]?.user_id == null) {
        await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?user_email=eq.${encodeURIComponent(userEmail)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ user_id: userId }),
          }
        );
        if (tier === "free") return "free";
      }
    }
  }

  return "free";
}

export async function logUsage(
  supabaseUrl: string,
  serviceRoleKey: string,
  entry: {
    user_id: string;
    action: string;
    tokens?: number;
    image_cost?: number;
  }
): Promise<void> {
  try {
    await fetch(`${supabaseUrl}/rest/v1/usage_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(entry),
    });
  } catch (err) {
    console.error("Failed to log usage", err);
  }
}

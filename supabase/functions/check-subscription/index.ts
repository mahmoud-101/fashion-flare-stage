import { handleCors, errorResponse, successResponse, getUserFromJWT } from "../_shared/cors.ts";
import { getRemainingQuota } from "../_shared/rate-limit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const user = await getUserFromJWT(req, SUPABASE_URL, SUPABASE_ANON_KEY);
  if (!user) return errorResponse("Unauthorized", 401);

  const now = new Date().toISOString();

  const subRes = await fetch(
    `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${user.id}&status=eq.active&expires_at=gte.${now}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  let sub = (await subRes.json())?.[0];

  if (!sub && user.email) {
    const byEmailRes = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions?user_email=eq.${encodeURIComponent(user.email)}&status=eq.active&expires_at=gte.${now}&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    sub = (await byEmailRes.json())?.[0];
  }

  const planTier = sub?.plan_tier ?? "free";

  const [imagesRemaining, textRemaining] = await Promise.all([
    getRemainingQuota(user.id, "images", planTier, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
    getRemainingQuota(user.id, "text", planTier, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
  ]);

  return successResponse({
    plan: planTier,
    status: sub?.status ?? "inactive",
    expires_at: sub?.expires_at ?? null,
    quota: {
      images: { remaining: imagesRemaining },
      text: { remaining: textRemaining },
    },
  });
});

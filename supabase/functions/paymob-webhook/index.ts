import { handleCors, errorResponse, successResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYMOB_HMAC_SECRET = Deno.env.get("PAYMOB_HMAC_SECRET")!;

async function computeHmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function determinePlanTier(amountCents: number): string {
  if (amountCents >= 50000) return "enterprise";
  if (amountCents >= 20000) return "pro";
  return "free";
}

async function lookupUserIdByEmail(email: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const users = data?.users ?? data;
  if (!Array.isArray(users) || users.length === 0) return null;
  const user = users.find(
    (u: Record<string, unknown>) => u.email === email
  );
  return user?.id ? String(user.id) : null;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const rawBody = await req.text();
  const incomingHmac = (req.headers.get("x-hmac") ?? "").toLowerCase();

  if (!PAYMOB_HMAC_SECRET) {
    return errorResponse("HMAC secret not configured", 500);
  }

  const computedHmac = await computeHmac(PAYMOB_HMAC_SECRET, rawBody);

  const enc = new TextEncoder();
  const computedBytes = enc.encode(computedHmac);
  const incomingBytes = enc.encode(incomingHmac);

  let hmacValid = computedBytes.length === incomingBytes.length;
  if (hmacValid) {
    let diff = 0;
    for (let i = 0; i < computedBytes.length; i++) {
      diff |= computedBytes[i] ^ incomingBytes[i];
    }
    hmacValid = diff === 0;
  }

  if (!hmacValid) {
    console.error("HMAC mismatch");
    return errorResponse("Invalid HMAC signature", 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const obj = (payload.obj ?? {}) as Record<string, unknown>;
  const success = obj.success === true;
  const isRefund = obj.is_refund === true;

  if (!success || isRefund) {
    return successResponse({ message: "Event acknowledged but not processed" });
  }

  const amountCents = Number(obj.amount_cents ?? 0);
  const planTier = determinePlanTier(amountCents);

  const orderRaw = obj.order;
  const orderId = typeof orderRaw === "object" && orderRaw !== null
    ? String((orderRaw as Record<string, unknown>).id ?? "")
    : String(orderRaw ?? "");

  const email = String((obj.billing_data as Record<string, unknown>)?.email ?? "");

  if (!email) {
    return errorResponse("No email in billing data", 400);
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const userId = await lookupUserIdByEmail(email);

  const upsertRes = await fetch(
    `${SUPABASE_URL}/rest/v1/subscriptions?on_conflict=user_email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        user_email: email,
        ...(userId ? { user_id: userId } : {}),
        plan_tier: planTier,
        status: "active",
        paymob_order: orderId,
        amount_cents: amountCents,
        expires_at: expiresAt,
      }),
    }
  );

  if (!upsertRes.ok) {
    const errText = await upsertRes.text();
    console.error("Supabase upsert failed", errText);
    return errorResponse("Failed to update subscription", 500);
  }

  return successResponse({ message: "Subscription activated", plan: planTier });
});

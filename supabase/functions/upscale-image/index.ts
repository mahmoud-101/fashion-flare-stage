import { handleCors, errorResponse, successResponse, getUserFromJWT } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { getUserPlan, logUsage } from "../_shared/subscription.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const PRIVATE_IP_PATTERN =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fd[0-9a-f]{2}:)/i;

function isSafeImageUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (PRIVATE_IP_PATTERN.test(parsed.hostname)) return false;
  return true;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const user = await getUserFromJWT(req, SUPABASE_URL, SUPABASE_ANON_KEY);
  if (!user) return errorResponse("Unauthorized", 401);

  const plan = await getUserPlan(user.id, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, user.email);
  const rateResult = await checkRateLimit(user.id, "images", plan, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!rateResult.allowed) return rateLimitResponse(rateResult);

  const body = await req.json();
  const {
    image_url,
    prompt = "Upscale and enhance this image to high resolution, preserving all details",
  } = body;

  if (!image_url) return errorResponse("image_url is required", 400);

  if (!isSafeImageUrl(image_url)) {
    return errorResponse(
      "image_url must be a valid public HTTPS URL (private/internal addresses are not allowed)",
      400
    );
  }

  let imageBlob: Blob;
  try {
    const imageRes = await fetch(image_url);
    if (!imageRes.ok) return errorResponse("Failed to fetch image from provided URL", 400);
    imageBlob = await imageRes.blob();
  } catch {
    return errorResponse("Invalid or unreachable image_url", 400);
  }

  const form = new FormData();
  form.append("image", new File([imageBlob], "image.png", { type: "image/png" }));
  form.append("prompt", prompt);
  form.append("n", "1");
  form.append("size", "1024x1024");
  form.append("model", "dall-e-2");

  const openaiRes = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: form,
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    console.error("OpenAI error", err);
    return errorResponse("Image upscaling failed", 502);
  }

  const data = await openaiRes.json();

  await logUsage(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    user_id: user.id,
    action: "upscale-image",
    image_cost: 1,
  });

  return successResponse(data);
});

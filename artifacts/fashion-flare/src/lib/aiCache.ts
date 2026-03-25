import { supabase } from '@/integrations/supabase/client';

const HOUR_MS = 60 * 60 * 1000;

const TTL: Record<string, number> = {
  hashtags: 24 * HOUR_MS,
  competitorSpy: HOUR_MS,
  default: 6 * HOUR_MS,
};

function makeCacheKey(feature: string, brandId: string, params: Record<string, unknown>): string {
  const raw = `${feature}::${brandId}::${JSON.stringify(params)}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (Math.imul(31, hash) + raw.charCodeAt(i)) | 0;
  }
  return `${feature}_${Math.abs(hash).toString(36)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function getCached<T>(
  feature: string,
  brandId: string,
  params: Record<string, unknown>
): Promise<T | null> {
  try {
    const key = makeCacheKey(feature, brandId, params);
    const { data, error } = await db
      .from('ai_cache')
      .select('response, expires_at')
      .eq('cache_key', key)
      .single();

    if (error || !data) return null;

    const expiry = new Date(data.expires_at as string).getTime();
    if (Date.now() > expiry) {
      await db.from('ai_cache').delete().eq('cache_key', key);
      return null;
    }

    return data.response as T;
  } catch {
    return null;
  }
}

export async function setCache(
  feature: string,
  brandId: string,
  params: Record<string, unknown>,
  response: unknown
): Promise<void> {
  try {
    const key = makeCacheKey(feature, brandId, params);
    const ttlMs = TTL[feature] ?? TTL.default;
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();

    await db.from('ai_cache').upsert(
      { cache_key: key, response, expires_at: expiresAt },
      { onConflict: 'cache_key' }
    );
  } catch {
  }
}

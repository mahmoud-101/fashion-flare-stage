import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TrackingEvent {
  feature_name: string;
  tokens_used?: number;
  response_time_ms?: number;
  success: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useFeatureTracking() {
  const { user } = useAuth();

  const track = useCallback(
    async (event: TrackingEvent) => {
      if (!user?.id) return;
      try {
        await db.from('feature_usage').insert({
          user_id: user.id,
          feature_name: event.feature_name,
          tokens_used: event.tokens_used ?? null,
          response_time_ms: event.response_time_ms ?? null,
          success: event.success,
        });
      } catch {
      }
    },
    [user]
  );

  const trackCall = useCallback(
    async <T>(
      feature: string,
      fn: () => Promise<T>
    ): Promise<T> => {
      const start = Date.now();
      try {
        const result = await fn();
        await track({ feature_name: feature, response_time_ms: Date.now() - start, success: true });
        return result;
      } catch (err) {
        await track({ feature_name: feature, response_time_ms: Date.now() - start, success: false });
        throw err;
      }
    },
    [track]
  );

  return { track, trackCall };
}

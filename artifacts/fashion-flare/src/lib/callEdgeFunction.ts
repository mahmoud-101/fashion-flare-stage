import { supabase } from '@/integrations/supabase/client';

interface CallOptions {
  retries?: number;
  retryDelay?: number;
  timeoutMs?: number;
}

const ARABIC_ERRORS: Record<string, string> = {
  TIMEOUT: 'الطلب أخذ وقت طويل. جرّب تاني.',
  RATE_LIMIT: 'طلبات كتيرة في وقت قصير. استنى ثانية وجرّب.',
  SERVER: 'سيرفر الذكاء الاصطناعي مشغول دلوقتي. جرّب بعد شوية.',
  AUTH: 'جلستك انتهت. سجّل دخولك تاني.',
  NETWORK: 'مشكلة في الاتصال بالإنترنت. تأكد من اتصالك وجرّب.',
  DEFAULT: 'حصل خطأ غير متوقع. جرّب تاني أو تواصل مع الدعم.',
};

function classifyMessage(msg: string): { arabic: string; retryable: boolean } {
  if (msg.includes('timeout') || msg.includes('AbortError') || msg === 'TIMEOUT') {
    return { arabic: ARABIC_ERRORS.TIMEOUT, retryable: true };
  }
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
    return { arabic: ARABIC_ERRORS.RATE_LIMIT, retryable: false };
  }
  if (msg.includes('502') || msg.includes('503') || msg.includes('overload') || msg.includes('capacity')) {
    return { arabic: ARABIC_ERRORS.SERVER, retryable: true };
  }
  if (msg.includes('401') || msg.includes('403') || msg.includes('JWT') || msg.includes('auth')) {
    return { arabic: ARABIC_ERRORS.AUTH, retryable: false };
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
    return { arabic: ARABIC_ERRORS.NETWORK, retryable: true };
  }
  return { arabic: ARABIC_ERRORS.DEFAULT, retryable: true };
}

export async function callEdgeFunction<T = Record<string, unknown>>(
  functionName: string,
  body: Record<string, unknown>,
  options: CallOptions = {}
): Promise<T> {
  const { retries = 2, retryDelay = 2000, timeoutMs = 60000 } = options;

  const attemptOnce = (): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    );

    const callPromise = supabase.functions.invoke(functionName, { body }).then(({ data, error }) => {
      if (error) throw new Error(error.message || 'edge function error');
      if (data?.error) throw new Error(typeof data.error === 'string' ? data.error : 'خطأ من السيرفر');
      if (!data) throw new Error('لم تصل بيانات من السيرفر');
      return data as T;
    });

    return Promise.race([callPromise, timeoutPromise]);
  };

  let lastErr: Error = new Error(ARABIC_ERRORS.DEFAULT);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await attemptOnce();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      const { arabic, retryable } = classifyMessage(raw);
      lastErr = Object.assign(new Error(arabic), { _raw: raw, _retryable: retryable });

      const isLast = attempt >= retries;
      if (isLast || !retryable) break;

      await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)));
    }
  }

  throw lastErr;
}

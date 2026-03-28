import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CallOptions {
  retries?: number;
  retryDelay?: number;
  timeoutMs?: number;
  includeBrand?: boolean;
}

export interface BrandContext {
  name: string;
  tone: string;
  dialect: string;
  audience: string;
  industry: string;
}

const ARABIC_ERRORS: Record<string, string> = {
  TIMEOUT: 'الطلب أخذ وقت طويل. جرّب تاني.',
  RATE_LIMIT: 'طلبات كتيرة في وقت قصير. استنى ثانية وجرّب.',
  SERVER: 'سيرفر الذكاء الاصطناعي مشغول دلوقتي. جرّب بعد شوية.',
  AUTH: 'جلستك انتهت. سجّل دخولك تاني.',
  NETWORK: 'مشكلة في الاتصال بالإنترنت. تأكد من اتصالك وجرّب.',
  DEFAULT: 'حصل خطأ غير متوقع. جرّب تاني أو تواصل مع الدعم.',
};

let _brandCache: BrandContext | null | undefined = undefined;

export async function getBrandContext(): Promise<BrandContext | null> {
  if (_brandCache !== undefined) return _brandCache;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { _brandCache = null; return null; }

    const { data } = await supabase
      .from('brands')
      .select('name, tone, dialect, target_audience, industry')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!data) { _brandCache = null; return null; }

    _brandCache = {
      name: data.name || '',
      tone: data.tone || '',
      dialect: data.dialect || '',
      audience: data.target_audience || '',
      industry: data.industry || '',
    };
    return _brandCache;
  } catch {
    _brandCache = null;
    return null;
  }
}

export function clearBrandCache(): void {
  _brandCache = undefined;
}

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
  const { retries = 2, retryDelay = 2000, timeoutMs = 60000, includeBrand = true } = options;

  let enrichedBody = { ...body };

  if (includeBrand) {
    const brand = await getBrandContext();
    const isBrandMissing = !brand || (!brand.name && !brand.dialect);
    if (isBrandMissing) {
      toast.error('أكمل إعدادات البراند أولاً لتخصيص المحتوى — اذهب إلى صفحة إعدادات البراند', {
        id: 'brand-missing',
        duration: 6000,
      });
      throw new Error('يرجى إكمال إعدادات البراند أولاً قبل توليد المحتوى');
    }
    enrichedBody = { ...enrichedBody, brand };
  }

  const attemptOnce = (): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    );

    const callPromise = supabase.functions.invoke(functionName, { body: enrichedBody }).then(({ data, error }) => {
      if (error) {
        const errMsg = (error as unknown as { context?: { error?: string } }).context?.error || error.message || 'edge function error';
        throw new Error(errMsg);
      }
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

export interface StreamChunk {
  text: string;
  done: boolean;
}

export async function* callEdgeFunctionStream(
  functionName: string,
  body: Record<string, unknown>,
  options: Pick<CallOptions, 'timeoutMs'> = {}
): AsyncGenerator<string> {
  const { timeoutMs = 60000 } = options;

  const brand = await getBrandContext();
  const isBrandMissing = !brand || (!brand.name && !brand.dialect);
  if (isBrandMissing) {
    toast.error('أكمل إعدادات البراند أولاً لتخصيص المحتوى — اذهب إلى صفحة إعدادات البراند', {
      id: 'brand-missing',
      duration: 6000,
    });
    throw new Error('يرجى إكمال إعدادات البراند أولاً قبل توليد المحتوى');
  }
  const enrichedBody = { ...body, brand };

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl
    ?? import.meta.env.VITE_SUPABASE_URL;

  const url = `${supabaseUrl}/functions/v1/${functionName}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...enrichedBody, stream: true }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(classifyMessage(msg).arabic);
  }

  if (!response.ok) {
    clearTimeout(timer);
    throw new Error(classifyMessage(String(response.status)).arabic);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    clearTimeout(timer);
    throw new Error(ARABIC_ERRORS.SERVER);
  }

  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        const json = line.slice(6).trim();
        if (json === '[DONE]') return;
        try {
          const parsed = JSON.parse(json) as { text?: string; content?: string };
          const text = parsed.text ?? parsed.content ?? '';
          if (text) yield text;
        } catch {
          if (json) yield json;
        }
      }
    }
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}

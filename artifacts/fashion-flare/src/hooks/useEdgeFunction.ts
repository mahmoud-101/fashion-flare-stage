import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EdgeFunctionOptions<TOutput = unknown> {
  functionName: string;
  onSuccess?: (data: TOutput) => void;
  onError?: (error: EdgeFunctionError) => void;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface EdgeFunctionError {
  code: string;
  message: string;
  details?: string;
  isRetryable: boolean;
}

type EdgeFunctionState = 'idle' | 'loading' | 'success' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  TIMEOUT: 'الطلب أخذ وقت طويل. جرب تاني.',
  NETWORK_ERROR: 'مشكلة في الاتصال بالإنترنت. تأكد من اتصالك وجرب تاني.',
  RATE_LIMIT: 'طلبات كتير في وقت قصير. استنى شوية وجرب تاني.',
  AUTH_ERROR: 'جلستك انتهت. سجّل دخول تاني.',
  AI_OVERLOADED: 'سيرفر الذكاء الاصطناعي مشغول. جرب بعد شوية.',
  INVALID_INPUT: 'البيانات المدخلة فيها مشكلة. راجعها وجرب تاني.',
  CONTENT_FILTERED: 'المحتوى المطلوب مش متاح. جرب وصف مختلف.',
  UNKNOWN: 'حصل خطأ غير متوقع. جرب تاني أو تواصل مع الدعم.',
};

function classifyError(error: unknown): EdgeFunctionError {
  const err = error as Record<string, unknown> | null;
  const message = typeof err?.message === 'string' ? err.message : String(error);
  const status = typeof err?.status === 'number' ? err.status : typeof err?.code === 'number' ? err.code : undefined;

  if (message.includes('timeout') || message.includes('AbortError')) {
    return { code: 'TIMEOUT', message: ERROR_MESSAGES.TIMEOUT, isRetryable: true };
  }
  if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
    return { code: 'NETWORK_ERROR', message: ERROR_MESSAGES.NETWORK_ERROR, isRetryable: true };
  }
  if (status === 429 || message.includes('rate limit') || message.includes('quota')) {
    return { code: 'RATE_LIMIT', message: ERROR_MESSAGES.RATE_LIMIT, isRetryable: true };
  }
  if (status === 401 || status === 403 || message.includes('auth') || message.includes('JWT')) {
    return { code: 'AUTH_ERROR', message: ERROR_MESSAGES.AUTH_ERROR, isRetryable: false };
  }
  if (status === 503 || status === 502 || message.includes('overloaded') || message.includes('capacity')) {
    return { code: 'AI_OVERLOADED', message: ERROR_MESSAGES.AI_OVERLOADED, isRetryable: true };
  }
  if (message.includes('safety') || message.includes('filter') || message.includes('blocked')) {
    return { code: 'CONTENT_FILTERED', message: ERROR_MESSAGES.CONTENT_FILTERED, isRetryable: false };
  }
  if (status === 400 || message.includes('invalid') || message.includes('required')) {
    return { code: 'INVALID_INPUT', message: ERROR_MESSAGES.INVALID_INPUT, details: message, isRetryable: false };
  }

  return { code: 'UNKNOWN', message: ERROR_MESSAGES.UNKNOWN, details: message, isRetryable: true };
}

export function useEdgeFunction<TInput = Record<string, unknown>, TOutput = Record<string, unknown>>(options: EdgeFunctionOptions<TOutput>) {
  const {
    functionName,
    onSuccess,
    onError,
    retryCount = 2,
    retryDelay = 2000,
    timeout = 60000,
  } = options;

  const [state, setState] = useState<EdgeFunctionState>('idle');
  const [data, setData] = useState<TOutput | null>(null);
  const [error, setError] = useState<EdgeFunctionError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { toast } = useToast();

  const invoke = useCallback(
    async (input: TInput): Promise<TOutput | null> => {
      setState('loading');
      setError(null);
      setAttempt(0);

      const executeWithRetry = async (currentAttempt: number): Promise<TOutput | null> => {
        try {
          setAttempt(currentAttempt);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const { data: responseData, error: fnError } = await supabase.functions.invoke(
            functionName,
            { body: input as Record<string, unknown> }
          );

          clearTimeout(timeoutId);

          if (fnError) throw fnError;
          if (!responseData) throw new Error('لم يتم استلام بيانات من السيرفر');
          if (responseData.error) throw new Error(responseData.error);

          setState('success');
          setData(responseData as TOutput);
          onSuccess?.(responseData as TOutput);
          return responseData as TOutput;
        } catch (err: unknown) {
          const classifiedError = classifyError(err);

          if (classifiedError.isRetryable && currentAttempt < retryCount) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (currentAttempt + 1)));
            return executeWithRetry(currentAttempt + 1);
          }

          setState('error');
          setError(classifiedError);
          onError?.(classifiedError);

          toast({
            title: 'خطأ',
            description: classifiedError.message,
            variant: 'destructive',
          });

          return null;
        }
      };

      return executeWithRetry(0);
    },
    [functionName, retryCount, retryDelay, timeout, onSuccess, onError, toast]
  );

  const cancel = useCallback(() => {
    setState('idle');
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setData(null);
    setError(null);
    setAttempt(0);
  }, []);

  return {
    invoke,
    cancel,
    reset,
    state,
    isLoading: state === 'loading',
    isError: state === 'error',
    isSuccess: state === 'success',
    data,
    error,
    attempt,
  };
}

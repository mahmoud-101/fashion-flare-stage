import { AlertTriangle, RefreshCw, Wifi, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EdgeFunctionError } from '@/hooks/useEdgeFunction';

interface ErrorCardProps {
  error: EdgeFunctionError;
  onRetry?: () => void;
  compact?: boolean;
}

const ERROR_ICONS: Record<string, React.ElementType> = {
  TIMEOUT: Clock,
  NETWORK_ERROR: Wifi,
  RATE_LIMIT: Clock,
  AUTH_ERROR: ShieldAlert,
  AI_OVERLOADED: Clock,
  DEFAULT: AlertTriangle,
};

export function ErrorCard({ error, onRetry, compact = false }: ErrorCardProps) {
  const Icon = ERROR_ICONS[error.code] || ERROR_ICONS.DEFAULT;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <Icon className="w-4 h-4 text-destructive flex-shrink-0" />
        <p className="text-sm text-destructive flex-1">{error.message}</p>
        {error.isRetryable && onRetry && (
          <Button size="sm" variant="ghost" onClick={onRetry} className="text-destructive hover:text-foreground h-7 px-2">
            <RefreshCw className="w-3 h-3 ml-1" />
            إعادة
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card border border-destructive/20 p-6 space-y-4 rounded-xl" dir="rtl">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-destructive" />
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="text-foreground font-medium">حصل خطأ</h3>
          <p className="text-muted-foreground text-sm">{error.message}</p>

          {error.code === 'RATE_LIMIT' && (
            <p className="text-primary/70 text-xs mt-2">💡 نصيحة: استنى 30 ثانية وجرب تاني</p>
          )}
          {error.code === 'AI_OVERLOADED' && (
            <p className="text-primary/70 text-xs mt-2">💡 نصيحة: السيرفر مشغول حالياً. جرب بعد دقيقة</p>
          )}
        </div>
      </div>

      {error.isRetryable && onRetry && (
        <Button onClick={onRetry} className="btn-gold w-full">
          <RefreshCw className="w-4 h-4 ml-2" />
          حاول مرة تانية
        </Button>
      )}
    </div>
  );
}

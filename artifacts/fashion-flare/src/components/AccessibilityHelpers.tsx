import { useEffect } from 'react';

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg"
    >
      تخطي إلى المحتوى الرئيسي
    </a>
  );
}

export function LoadingAnnouncer({ isLoading, message }: { isLoading: boolean; message: string }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {isLoading ? message : ''}
    </div>
  );
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Moda.ai`;
  }, [title]);
}

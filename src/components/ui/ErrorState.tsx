'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string | number;
  onRetry?: () => void;
  onBack?: () => void;
  retryLabel?: string;
  backLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'حدث خطأ غير متوقع',
  message = 'تعذر استكمال العملية بنجاح. يرجى المحاولة مرة أخرى أو مراجعة الاتصال.',
  code,
  onRetry,
  onBack,
  retryLabel = 'إعادة المحاولة',
  backLabel = 'العودة للخلف',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-2xl',
        'border border-rose-200 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 text-2xl shadow-sm">
        ⚠️
      </div>

      <h3 className="text-base font-bold text-rose-950 dark:text-rose-200 mb-1.5">
        {title}
      </h3>

      <p className="text-xs md:text-sm text-rose-700 dark:text-rose-300 max-w-sm mb-4 leading-relaxed">
        {message}
      </p>

      {code && (
        <span className="inline-block px-2.5 py-1 text-[11px] font-mono font-medium rounded-md bg-rose-100/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 mb-6 border border-rose-200 dark:border-rose-800">
          رمز الخطأ: {code}
        </span>
      )}

      {(onRetry || onBack) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <Button
              variant="destructive"
              size="md"
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          )}
          {onBack && (
            <Button
              variant="outline"
              size="md"
              onClick={onBack}
            >
              {backLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

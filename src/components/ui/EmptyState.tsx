'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-2xl',
        'border border-dashed border-[#E8DCC6] dark:border-stone-800 bg-[#FAF6EE]/50 dark:bg-stone-900/40',
        'transition-colors',
        className
      )}
    >
      {icon ? (
        <div className="w-14 h-14 rounded-2xl bg-[#E8DCC6]/40 dark:bg-stone-800 flex items-center justify-center text-[#B85C43] dark:text-[#E8DCC6] mb-4 text-2xl shadow-inner">
          {icon}
        </div>
      ) : (
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 text-2xl">
          📂
        </div>
      )}

      <h3 className="text-base font-bold text-[#3B2F2A] dark:text-[#FAF6EE] mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              size="md"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              size="md"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { Dialog } from '@ark-ui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AppleDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (details: { open: boolean }) => void;
  children: React.ReactNode;
}

export const AppleDialog: React.FC<AppleDialogProps> = ({
  open,
  defaultOpen,
  onOpenChange,
  children,
}) => {
  return (
    <Dialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
};

export const AppleDialogTrigger = Dialog.Trigger;

export interface AppleDialogContentProps {
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AppleDialogContent: React.FC<AppleDialogContentProps> = ({
  children,
  className,
  showCloseButton = true,
  onClose,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[size];

  return (
    <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <Dialog.Positioner className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Dialog.Content
          className={cn(
            'relative w-full rounded-[26px] p-6 sm:p-7 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.35)]',
            'apple-glass border border-white/60 dark:border-white/10 text-stone-900 dark:text-[#FAF6EE]',
            'animate-in zoom-in-95 duration-200 apple-font focus:outline-none',
            sizeClasses,
            className
          )}
        >
          {showCloseButton && (
            <Dialog.CloseTrigger
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-stone-500 dark:text-stone-300 transition-all active:scale-90 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Dialog.CloseTrigger>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Backdrop>
  );
};

export const AppleDialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <Dialog.Title
    className={cn('text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-white', className)}
  >
    {children}
  </Dialog.Title>
);

export const AppleDialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <Dialog.Description
    className={cn('text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed', className)}
  >
    {children}
  </Dialog.Description>
);

export const AppleDialogCloseTrigger = Dialog.CloseTrigger;

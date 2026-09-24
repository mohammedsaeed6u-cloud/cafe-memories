'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AppleDialog,
  AppleDialogContent,
  AppleDialogTitle,
  AppleDialogDescription,
} from '@/components/ui/ark/AppleDialog';

interface DestructiveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function DestructiveConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'تأكيد الحذف نهائياً',
  cancelLabel = 'إلغاء الأمر',
  isLoading = false,
}: DestructiveConfirmModalProps) {
  return (
    <AppleDialog open={isOpen} onOpenChange={(details) => !details.open && onClose()}>
      <AppleDialogContent onClose={onClose} size="sm" className="text-right border-red-500/20">
        <div className="flex items-center justify-between pb-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <AppleDialogTitle className="text-base font-bold text-stone-900 dark:text-white mt-1">
          {title}
        </AppleDialogTitle>
        <AppleDialogDescription className="text-xs text-stone-600 dark:text-stone-300">
          {description}
        </AppleDialogDescription>

        <div className="flex gap-2.5 pt-6">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'جارِ التنفيذ...' : confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="py-2.5 px-5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 active:scale-[0.98] text-stone-800 dark:text-stone-200 text-xs font-semibold transition cursor-pointer"
          >
            {cancelLabel}
          </button>
        </div>
      </AppleDialogContent>
    </AppleDialog>
  );
}

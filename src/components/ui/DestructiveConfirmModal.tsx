'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-cairo"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#142721] border border-rose-200 dark:border-rose-900/40 p-6 shadow-2xl text-right animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-base font-black text-[#1E3A32] dark:text-[#FAF6EE] mt-2 mb-1">
          {title}
        </h3>
        <p className="text-xs text-[#3B2F2A]/75 dark:text-[#FAF6EE]/75 leading-relaxed">
          {description}
        </p>

        <div className="flex gap-2.5 pt-6">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'جارِ التنفيذ...' : confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="py-3 px-5 rounded-2xl bg-[#FAF6EE] dark:bg-[#1E3A32] border border-[#E8DCC6] dark:border-[#2A4F44] text-[#3B2F2A] dark:text-[#FAF6EE] text-xs font-bold hover:bg-[#E8DCC6]/40 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

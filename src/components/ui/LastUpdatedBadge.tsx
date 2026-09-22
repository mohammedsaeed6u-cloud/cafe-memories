'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface LastUpdatedBadgeProps {
  dateString?: string;
  isoDate?: string;
  className?: string;
}

export function LastUpdatedBadge({
  dateString = '22 سبتمبر 2026',
  isoDate = '2026-09-22',
  className = '',
}: LastUpdatedBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8DCC6]/40 dark:bg-[#1E3A32]/60 border border-[#E8DCC6] dark:border-[#2A4F44] text-[11px] font-medium text-[#3B2F2A]/80 dark:text-[#FAF6EE]/80 font-cairo ${className}`}
    >
      <Clock className="w-3 h-3 text-[#B85C43]" />
      <span>آخر تحديث:</span>
      <time dateTime={isoDate} className="font-bold text-[#1E3A32] dark:text-[#FAF6EE]">
        {dateString}
      </time>
    </div>
  );
}

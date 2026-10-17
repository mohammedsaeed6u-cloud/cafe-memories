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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EADDC4]/40 dark:bg-[#3D2314]/60 border border-[#EADDC4] dark:border-[#3D2314]/30] text-[11px] font-medium text-[#3D2314]/80 dark:text-[#FAF5EB]/80 font-cairo ${className}`}
    >
      <Clock className="w-3 h-3 text-[#B83A26]" />
      <span>آخر تحديث:</span>
      <time dateTime={isoDate} className="font-bold text-[#3D2314] dark:text-[#FAF5EB]">
        {dateString}
      </time>
    </div>
  );
}

'use client';

import React from 'react';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  label = 'جارِ التحميل...',
  className = '',
}: LoadingSpinnerProps) {
  const dimensions = {
    sm: { icon: 16, ring: 'w-6 h-6', text: 'text-[11px]' },
    md: { icon: 24, ring: 'w-10 h-10', text: 'text-xs' },
    lg: { icon: 36, ring: 'w-16 h-16', text: 'text-sm' },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-4 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div
          className={`${dimensions.ring} rounded-full border-2 border-[#E8DCC6] border-t-[#B85C43] animate-spin`}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
          <MemoriesArchIcon size={dimensions.icon} color="#1E3A32" />
        </div>
      </div>
      {label && (
        <span className={`${dimensions.text} font-bold text-[#3B2F2A] dark:text-[#FAF6EE] tracking-tight`}>
          {label}
        </span>
      )}
    </div>
  );
}

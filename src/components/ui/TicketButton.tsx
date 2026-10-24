'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TicketButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function TicketButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: TicketButtonProps) {
  const base =
    'inline-flex items-center justify-center font-bold tracking-tight border-2 transition-all select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:translate-x-[2px] active:translate-y-[2px] active:shadow-stamp-pressed';

  const variants = {
    primary:
      'bg-[#B83A26] text-white border-[#3D2314] shadow-stamp-resting hover:bg-[#A3311F] hover:shadow-stamp-hover',
    secondary:
      'bg-[#E5A836] text-[#3D2314] border-[#3D2314] shadow-stamp-resting hover:bg-[#D99A27] hover:shadow-stamp-hover',
    outline:
      'bg-[#FAF5EB] text-[#3D2314] border-[#3D2314] shadow-stamp-resting hover:bg-white hover:shadow-stamp-hover',
    teal:
      'bg-[#527E78] text-white border-[#3D2314] shadow-stamp-resting hover:bg-[#436762] hover:shadow-stamp-hover',
    danger:
      'bg-rose-600 text-white border-[#3D2314] shadow-stamp-resting hover:bg-rose-700 hover:shadow-stamp-hover',
    ghost:
      'bg-transparent text-[#3D2314] border-transparent shadow-none hover:bg-[#EADDC4]/40 active:translate-x-0 active:translate-y-0',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-7 py-3.5 rounded-2xl gap-2.5',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

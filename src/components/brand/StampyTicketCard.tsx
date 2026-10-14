'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface StampyTicketCardProps {
  serial?: string;
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Official Stampy Ticket Card UI Component (DESIGN_SYSTEM.md Section 9.2)
 *
 * Implements:
 * - 3D Bottom Bevel Shadow in #451215
 * - Perforated Ticket Surface in #DFAB56
 * - Sub-pixel Stitch Border (stroke-dasharray="8 6" in rgba(247, 243, 234, 0.70))
 * - Verified First Class Header Pill
 */
export const StampyTicketCard: React.FC<StampyTicketCardProps> = ({
  serial = 'NO. 1874-902',
  title,
  subtitle,
  className = '',
  children,
}) => {
  return (
    <div className={cn('relative group transition-transform duration-300 hover:-translate-y-1', className)}>
      {/* 3D Bottom Bevel Shadow (Section 2.1 & 9.2) */}
      <div className="absolute inset-0 bg-[#451215] rounded-[28px] translate-y-3" />

      {/* Main Ticket Surface in Primary Ochre */}
      <div className="relative bg-[#DFAB56] border border-[#682025]/20 rounded-[28px] p-6 shadow-ticket overflow-hidden">
        {/* Sub-pixel Stitch Border */}
        <div className="absolute inset-3 border-2 border-dashed border-[#F7F3EA]/70 rounded-[20px] pointer-events-none" />

        {/* Content Header */}
        <div className="flex items-center justify-between border-b border-[#682025]/20 pb-4 mb-4 relative z-10">
          <span className="font-mono text-xs uppercase tracking-widest text-[#682025]/80 font-bold">
            {serial}
          </span>
          <span className="text-xs bg-[#682025] text-[#F7F3EA] px-2.5 py-0.5 rounded-full font-semibold">
            VERIFIED
          </span>
        </div>

        {/* Card Body */}
        <div className="text-[#682025] relative z-10">
          <h3 className="text-2xl font-bold leading-tight font-sans tracking-tight">{title}</h3>
          {subtitle && <p className="text-sm mt-1 text-[#682025]/90">{subtitle}</p>}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

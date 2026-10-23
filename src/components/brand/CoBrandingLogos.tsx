'use client';

import React from 'react';
import { StampyLogo, StampyTicketIcon, StampyApertureIcon } from '@/components/brand/StampyLogo';
import { Store } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CoBrandingLogosProps {
  cafeName: string;
  cafeLogoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark' | 'transparent';
  className?: string;
  showTagline?: boolean;
}

/**
 * CoBrandingLogos Component for Stampy (استامبي)
 * Displays the platform brand (Stampy) and the merchant brand
 * side-by-side with a clean collaboration cross `×`.
 */
export const CoBrandingLogos: React.FC<CoBrandingLogosProps> = ({
  cafeName,
  cafeLogoUrl,
  size = 'md',
  theme = 'light',
  className = '',
  showTagline = true,
}) => {
  const isDark = theme === 'dark';

  const iconSizes = {
    sm: { box: 'w-7 h-7 rounded-lg', ticketW: 56, ticketH: 28, text: 'text-xs', cross: 'text-sm' },
    md: { box: 'w-9 h-9 rounded-xl', ticketW: 72, ticketH: 36, text: 'text-sm sm:text-base', cross: 'text-lg' },
    lg: { box: 'w-11 h-11 rounded-2xl', ticketW: 96, ticketH: 48, text: 'text-base sm:text-lg', cross: 'text-2xl' },
  }[size];

  const isFlagshipSolo =
    !cafeName ||
    cafeName.trim().toLowerCase() === 'stampy' ||
    cafeName.trim().toLowerCase() === 'استامبي' ||
    cafeName.trim().toLowerCase() === 'memories' ||
    cafeName.trim().toLowerCase() === 'stampy.';

  if (isFlagshipSolo) {
    return (
      <div className={cn('inline-flex items-center justify-center select-none', className)}>
        <StampyLogo size={size} showTagline={showTagline} />
      </div>
    );
  }

  return (
    <div
      className={cn('inline-flex items-center gap-2 sm:gap-3 select-none flex-wrap', className)}
      dir="ltr"
    >
      {/* 1. Client Business Brand */}
      <div className="flex items-center gap-2">
        {cafeLogoUrl ? (
          <img
            src={cafeLogoUrl}
            alt={cafeName}
            className={cn(
              iconSizes.box,
              'object-cover border border-white/20 shadow-xs'
            )}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div
            className={cn(
              iconSizes.box,
              'bg-[#3D2314] text-[#DFAB56] flex items-center justify-center font-bold shadow-xs border border-[#DFAB56]/30'
            )}
          >
            <Store className="w-4 h-4" />
          </div>
        )}
        <div className="text-left">
          <span
            className={cn(
              'font-bold tracking-tight block leading-tight',
              iconSizes.text,
              isDark ? 'text-white' : 'text-[#12100E]'
            )}
          >
            {cafeName}
          </span>
          {showTagline && (
            <span
              className={cn(
                'text-[8px] font-mono tracking-wider uppercase block font-semibold',
                isDark ? 'text-[#DFAB56]/80' : 'text-[#AC3E25]'
              )}
            >
              الفرع المعتمد
            </span>
          )}
        </div>
      </div>

      {/* Collaboration multiplication cross */}
      <span
        className={cn(
          'font-light select-none px-0.5',
          iconSizes.cross,
          isDark ? 'text-white/40' : 'text-[#3D2314]/40'
        )}
        aria-hidden="true"
      >
        ×
      </span>

      {/* 2. Platform Brand: Stampy */}
      <div className="flex items-center gap-2">
        <div className="shrink-0">
          <StampyTicketIcon width={iconSizes.ticketW} height={iconSizes.ticketH} />
        </div>
        <div className="text-left">
          <div className="flex items-baseline gap-1">
            <span
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              className={cn(
                'font-black tracking-tight leading-none',
                iconSizes.text,
                isDark ? 'text-white' : 'text-[#12100E]'
              )}
            >
              stampy<span className="text-[#DFAB56]">.</span>
            </span>
            <span className="text-[9px] font-bold text-[#DFAB56] font-mono">
              استامبي
            </span>
          </div>
          {showTagline && (
            <span
              className={cn(
                'text-[7.5px] font-mono tracking-widest uppercase block font-bold mt-0.5',
                isDark ? 'text-[#D9D9D9]/60' : 'text-stone-500'
              )}
            >
              LOYALTY STUDIO
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

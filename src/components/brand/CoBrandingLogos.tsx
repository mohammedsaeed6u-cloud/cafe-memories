'use client';

import React from 'react';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';
import { Coffee } from 'lucide-react';

export interface CoBrandingLogosProps {
  cafeName: string;
  cafeLogoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark' | 'transparent';
  className?: string;
  showTagline?: boolean;
}

/**
 * CoBrandingLogos Component
 * 
 * Displays the platform brand (Memories) and the client brand (Cafe)
 * directly side-by-side with a prominent multiplication/collaboration cross `×`.
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
    sm: { box: 'w-7 h-7 rounded-lg', icon: 16, text: 'text-xs', cross: 'text-sm' },
    md: { box: 'w-9 h-9 rounded-xl', icon: 20, text: 'text-sm sm:text-base', cross: 'text-lg' },
    lg: { box: 'w-11 h-11 rounded-2xl', icon: 26, text: 'text-base sm:text-lg', cross: 'text-2xl' },
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center gap-3 sm:gap-4 select-none ${className}`}
      dir="ltr"
    >
      {/* 1. OUR BRAND: MEMORIES */}
      <div className="flex items-center gap-2">
        <div
          className={`${iconSizes.box} bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-xs border border-amber-600/30 shrink-0`}
        >
          <MemoriesArchIcon size={iconSizes.icon} color="#FFFFFF" />
        </div>
        <div className="text-left">
          <span
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            className={`font-black tracking-tight block leading-tight lowercase ${
              isDark ? 'text-white' : 'text-stone-950'
            } ${iconSizes.text}`}
          >
            memories
          </span>
          {showTagline && (
            <span
              className={`text-[8px] font-mono tracking-widest font-bold uppercase block leading-none ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              STUDIO
            </span>
          )}
        </div>
      </div>

      {/* 2. THE COLLABORATION CROSS `×` */}
      <div className="flex items-center justify-center px-0.5">
        <span
          className={`font-black text-amber-500 font-sans ${iconSizes.cross} leading-none`}
          aria-hidden="true"
        >
          ×
        </span>
      </div>

      {/* 3. CLIENT BRAND: CAFE / RESTAURANT */}
      <div className="flex items-center gap-2">
        {cafeLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cafeLogoUrl}
            alt={cafeName}
            className={`${iconSizes.box} object-contain border p-0.5 shadow-xs shrink-0 ${
              isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
            }`}
          />
        ) : (
          <div
            className={`${iconSizes.box} flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0 ${
              isDark
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-stone-100 text-stone-800 border border-stone-200'
            }`}
          >
            <Coffee className="w-4 h-4 text-amber-600" />
          </div>
        )}
        <div className="text-left">
          <span
            className={`font-extrabold tracking-tight block leading-tight ${
              isDark ? 'text-white' : 'text-stone-950'
            } ${iconSizes.text}`}
          >
            {cafeName || 'Specialty Partner'}
          </span>
          {showTagline && (
            <span
              className={`text-[8px] font-mono tracking-widest font-bold uppercase block leading-none ${
                isDark ? 'text-amber-400/80' : 'text-amber-700'
              }`}
            >
              PARTNER
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

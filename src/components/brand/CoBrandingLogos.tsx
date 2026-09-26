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

  const isFlagshipSolo =
    !cafeName ||
    cafeName.trim().toLowerCase() === 'memories' ||
    cafeName.trim().toLowerCase() === 'memories studio' ||
    cafeName.trim().toLowerCase() === 'استوديو الذكريات' ||
    cafeName.trim().toLowerCase() === 'استوديو الذكريات • memories studio';

  if (isFlagshipSolo) {
    return (
      <div
        className={`inline-flex items-center justify-center gap-2.5 select-none ${className}`}
        dir="ltr"
      >
        <div
          className={`${iconSizes.box} bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center shadow-xs border border-[#DD0200]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] shrink-0`}
        >
          <MemoriesArchIcon size={iconSizes.icon} color="#FBF9F5" />
        </div>
        <div className="text-left">
          <span
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            className={`font-black tracking-tight block leading-tight lowercase ${
              isDark ? 'text-[#FBF9F5]' : 'text-[#141313]'
            } ${iconSizes.text}`}
          >
            memories
          </span>
          {showTagline && (
            <span
              className={`text-[8px] font-mono tracking-widest font-bold uppercase block leading-none ${
                isDark ? 'text-[#DD0200]' : 'text-[#55100D]'
              }`}
            >
              HOSPITALITY PHOTOBOOTH STUDIO
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center gap-3 sm:gap-4 select-none ${className}`}
      dir="ltr"
    >
      {/* 1. OUR BRAND: MEMORIES */}
      <div className="flex items-center gap-2">
        <div
          className={`${iconSizes.box} bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center shadow-xs border border-[#DD0200]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] shrink-0`}
        >
          <MemoriesArchIcon size={iconSizes.icon} color="#FBF9F5" />
        </div>
        <div className="text-left">
          <span
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            className={`font-black tracking-tight block leading-tight lowercase ${
              isDark ? 'text-[#FBF9F5]' : 'text-[#141313]'
            } ${iconSizes.text}`}
          >
            memories
          </span>
          {showTagline && (
            <span
              className={`text-[8px] font-mono tracking-widest font-bold uppercase block leading-none ${
                isDark ? 'text-[#A19E9B]' : 'text-stone-500'
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
          className={`font-black text-[#DD0200] font-sans ${iconSizes.cross} leading-none`}
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
              isDark ? 'bg-[#141212] border-white/10' : 'bg-white border-stone-200'
            }`}
          />
        ) : (
          <div
            className={`${iconSizes.box} flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0 ${
              isDark
                ? 'bg-[#55100D]/40 text-[#FBF9F5] border border-[#DD0200]/30'
                : 'bg-stone-100 text-stone-800 border border-stone-200'
            }`}
          >
            <Coffee className="w-4 h-4 text-[#DD0200]" />
          </div>
        )}
        <div className="text-left">
          <span
            className={`font-extrabold tracking-tight block leading-tight ${
              isDark ? 'text-[#FBF9F5]' : 'text-[#141313]'
            } ${iconSizes.text}`}
          >
            {cafeName || 'Specialty Partner'}
          </span>
          {showTagline && (
            <span
              className={`text-[8px] font-mono tracking-widest font-bold uppercase block leading-none ${
                isDark ? 'text-[#DD0200]' : 'text-[#55100D]'
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

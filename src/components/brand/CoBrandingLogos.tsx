'use client';

import React from 'react';
import { StampyIcon } from '@/components/brand/StampyLogo';
import { Coffee } from 'lucide-react';

export interface CoBrandingLogosProps {
  cafeName: string;
  cafeLogoUrl?: string | null;
  /** When false, the cafe side renders its name badge instead of the logo image. */
  showLogo?: boolean;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark' | 'transparent';
  className?: string;
  showTagline?: boolean;
  /** Optional white-label override: hide any platform mentions */
  hidePlatformBadge?: boolean;
}

/**
 * CoBrandingLogos Component - White-Label & Stampy Ecosystem
 * 
 * In world-class SaaS like Shopify, the merchant's brand is 100% front and center.
 * Displays the merchant's pure identity proudly with an optional, subtle, luxury
 * 'Powered by Stampy' badge.
 */
export const CoBrandingLogos: React.FC<CoBrandingLogosProps> = ({
  cafeName,
  cafeLogoUrl,
  showLogo = true,
  size = 'md',
  theme = 'light',
  className = '',
  showTagline = true,
  hidePlatformBadge = false,
}) => {
  const isDark = theme === 'dark';

  const iconSizes = {
    sm: { box: 'w-7 h-7 rounded-lg', icon: 16, text: 'text-xs', badge: 'text-[9px]' },
    md: { box: 'w-9 h-9 rounded-xl', icon: 20, text: 'text-sm sm:text-base', badge: 'text-[10px]' },
    lg: { box: 'w-11 h-11 rounded-2xl', icon: 26, text: 'text-base sm:text-lg', badge: 'text-xs' },
  }[size];

  // Clean fallback name
  const displayName = cafeName?.replace(/•\s*(memories|stampy)\s*studio/gi, '').trim() || 'متجر ولاء';

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      dir="ltr"
    >
      {/* 1. MERCHANT BRAND: THE HERO (White-Label) */}
      <div className="flex items-center gap-2.5">
        {cafeLogoUrl && showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cafeLogoUrl}
            alt={displayName}
            className={`${iconSizes.box} object-contain rounded-xl border p-0.5 shadow-xs shrink-0 ${
              isDark ? 'bg-stone-900 border-white/10' : 'bg-white border-amber-900/10'
            }`}
          />
        ) : (
          <div
            className={`${iconSizes.box} rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0 ${
              isDark
                ? 'bg-amber-950/60 text-amber-200 border border-amber-500/20'
                : 'bg-amber-50 text-amber-900 border border-amber-200/80'
            }`}
          >
            <img src="/brand/stampy-icon.svg" alt="Stampy" className="w-5 h-5 object-contain" />
          </div>
        )}
        <div className="text-left">
          <span
            className={`font-black tracking-tight block leading-tight ${
              isDark ? 'text-[#FAF8F5]' : 'text-stone-900'
            } ${iconSizes.text}`}
          >
            {displayName}
          </span>
          {showTagline && (
            <span
              className={`text-[8px] font-mono tracking-widest font-bold uppercase block leading-none ${
                isDark ? 'text-amber-400/80' : 'text-amber-700'
              }`}
            >
              LOYALTY PASS • VIP
            </span>
          )}
        </div>
      </div>

      {/* 2. SUBTLE POWERED BY STAMPY (Shopify-Style elegant watermark) */}
      {!hidePlatformBadge && (
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-stone-200/60 ${
            isDark ? 'bg-stone-900/80 text-stone-400 border-stone-800' : 'bg-stone-100/70 text-stone-500'
          }`}
        >
          <StampyIcon size={12} color="#D97706" />
          <span className="text-[9px] font-semibold tracking-wide">
            Powered by <strong className="font-extrabold text-stone-700 dark:text-stone-300">stampy.</strong>
          </span>
        </div>
      )}
    </div>
  );
};

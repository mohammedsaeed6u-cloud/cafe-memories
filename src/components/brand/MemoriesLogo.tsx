'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface MemoriesLogoProps {
  className?: string;
  variant?: 'full' | 'horizontal' | 'icon' | 'coaster' | 'badge';
  theme?: 'dark' | 'light' | 'forest' | 'terracotta' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

/**
 * The Arch & Dunes Iconic Vector Mark for Memories
 * Depicts the architectural arch window, morning sun, and coffee/landscape dunes.
 */
export function MemoriesArchIcon({
  className = '',
  size = 48,
  color = 'currentColor',
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none', className)}
      aria-label="Memories Logo Mark"
    >
      {/* Outer Arch Frame with authentic thick stroke */}
      <path
        d="M14 102V46C14 26.1177 30.1177 10 50 10C69.8823 10 86 26.1177 86 46V102H14Z"
        stroke={color}
        strokeWidth="9"
        strokeLinejoin="round"
      />

      {/* Sun / Moon / Coffee Bean Circle */}
      <circle cx="63" cy="40" r="10" fill={color} />

      {/* Rolling Dunes / Coffee Wave Silhouette */}
      <path
        d="M17 100C17 90 26 80 39 80C50 80 57 91 67 91C75 91 80 84 83 78V100H17Z"
        fill={color}
      />

      {/* Small accent pebble / coffee bean drop */}
      <circle cx="65" cy="95" r="2" fill="white" opacity="0.8" />
    </svg>
  );
}

/**
 * Full Memories Brand Component
 */
export function MemoriesLogo({
  className = '',
  variant = 'full',
  theme = 'auto',
  size = 'md',
  showTagline = true,
}: MemoriesLogoProps) {
  // Dimension mappings
  const iconSizeMap = {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 88,
  };

  const titleSizeMap = {
    xs: 'text-base',
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl sm:text-5xl',
    xl: 'text-5xl sm:text-6xl',
  };

  const taglineSizeMap = {
    xs: 'text-[7px] tracking-[0.2em]',
    sm: 'text-[9px] tracking-[0.22em]',
    md: 'text-[11px] tracking-[0.26em]',
    lg: 'text-xs tracking-[0.28em]',
    xl: 'text-sm tracking-[0.3em]',
  };

  // Theme color palettes (Atelier Nostalgia)
  const colorMap = {
    auto: {
      icon: '#DD0200',
      text: '#FBF9F5',
      tagline: '#A19E9B',
      bg: 'transparent',
    },
    dark: {
      icon: '#DD0200',
      text: '#FBF9F5',
      tagline: '#A19E9B',
      bg: 'transparent',
    },
    light: {
      icon: '#141313',
      text: '#141313',
      tagline: '#55100D',
      bg: 'transparent',
    },
    forest: {
      icon: '#FBF9F5',
      text: '#FBF9F5',
      tagline: '#A19E9B',
      bg: '#141212',
    },
    terracotta: {
      icon: '#FBF9F5',
      text: '#FBF9F5',
      tagline: '#FBF9F5',
      bg: '#55100D',
    },
  };

  const colors = colorMap[theme] || colorMap.auto;
  const iconPixel = iconSizeMap[size];

  // Coaster Variant (Atelier Nostalgia vitrine coaster)
  if (variant === 'coaster') {
    const isDarkCoaster = theme === 'forest' || theme === 'dark' || theme === 'auto';
    return (
      <div
        className={cn(
          'aspect-square rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl transition-transform duration-300 hover:rotate-1 border',
          isDarkCoaster
            ? 'bg-[#141212] text-[#FBF9F5] border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            : 'bg-[#FBF9F5] text-[#141313] border-black/10',
          className
        )}
      >
        <MemoriesArchIcon
          size={iconPixel * 1.3}
          color={isDarkCoaster ? '#DD0200' : '#141313'}
        />
      </div>
    );
  }

  // Icon only
  if (variant === 'icon') {
    return (
      <div className={cn('inline-flex items-center justify-center', className)}>
        <MemoriesArchIcon size={iconPixel} color={colors.icon} />
      </div>
    );
  }

  // Horizontal Lockup (for Navbar & Headers)
  if (variant === 'horizontal') {
    return (
      <div className={cn('inline-flex items-center gap-3 select-none', className)}>
        <MemoriesArchIcon size={iconPixel} color={colors.icon} />
        <div className="flex flex-col text-left">
          <span
            className={cn(
              'font-serif font-black tracking-tight leading-none',
              titleSizeMap[size]
            )}
            style={{ color: colors.text, fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            memories
          </span>
          {showTagline && (
            <span
              className={cn(
                'font-sans font-bold uppercase mt-1 opacity-85',
                taglineSizeMap[size]
              )}
              style={{ color: colors.tagline }}
            >
              CAFÉ MOMENTS. LASTING LOYALTY.
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full Stacked Brand Lockup (for Hero & Splash)
  return (
    <div
      className={cn(
        'inline-flex flex-col items-center text-center select-none',
        colors.bg !== 'transparent' && 'p-8 rounded-3xl',
        className
      )}
      style={{ backgroundColor: colors.bg }}
    >
      <MemoriesArchIcon size={iconPixel * 1.4} color={colors.icon} />

      <h1
        className={cn(
          'font-serif font-black tracking-tight mt-3 mb-1.5 leading-none lowercase',
          titleSizeMap[size]
        )}
        style={{ color: colors.text, fontFamily: 'var(--font-playfair), Georgia, serif' }}
      >
        memories
      </h1>

      {showTagline && (
        <p
          className={cn(
            'font-sans font-bold uppercase tracking-[0.28em] opacity-90',
            taglineSizeMap[size]
          )}
          style={{ color: colors.tagline }}
        >
          CAFÉ MOMENTS. LASTING LOYALTY.
        </p>
      )}
    </div>
  );
}

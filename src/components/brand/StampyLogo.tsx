'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface StampyLogoProps {
  className?: string;
  variant?: 'full' | 'horizontal' | 'icon' | 'ticket' | 'hero' | 'badge';
  theme?: 'dark' | 'light' | 'gold' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

/**
 * Official 6-Blade Camera Iris Aperture Shutter Icon for Stampy (استامبي)
 */
export function StampyApertureIcon({
  className = '',
  size = 32,
  color = '#DFAB56',
  bladeColor = '#3D2314',
}: {
  className?: string;
  size?: number;
  color?: string;
  bladeColor?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none', className)}
      aria-label="Stampy Aperture Icon"
    >
      <g transform="translate(50, 50) scale(1.17647) translate(-350, -230)">
        <path d="M 359.96 235.75 L 359.96 262.51 A 34 34 0 0 1 326.83 254.88 L 350.00 241.50 Z" fill={bladeColor} stroke={color} strokeWidth="1.0" strokeLinejoin="round" />
        <path d="M 350.00 241.50 L 326.83 254.88 A 34 34 0 0 1 316.87 222.37 L 340.04 235.75 Z" fill={bladeColor} stroke={color} strokeWidth="1.0" strokeLinejoin="round" />
        <path d="M 340.04 235.75 L 316.87 222.37 A 34 34 0 0 1 340.04 197.49 L 340.04 224.25 Z" fill={bladeColor} stroke={color} strokeWidth="1.0" strokeLinejoin="round" />
        <path d="M 340.04 224.25 L 340.04 197.49 A 34 34 0 0 1 373.17 205.12 L 350.00 218.50 Z" fill={bladeColor} stroke={color} strokeWidth="1.0" strokeLinejoin="round" />
        <path d="M 350.00 218.50 L 373.17 205.12 A 34 34 0 0 1 383.13 237.63 L 359.96 224.25 Z" fill={bladeColor} stroke={color} strokeWidth="1.0" strokeLinejoin="round" />
        <path d="M 359.96 224.25 L 383.13 237.63 A 34 34 0 0 1 359.96 262.51 L 359.96 235.75 Z" fill={bladeColor} stroke={color} strokeWidth="1.0" strokeLinejoin="round" />
        <circle cx="350" cy="230" r="34" fill="none" stroke={bladeColor} strokeWidth="1.6" />
      </g>
    </svg>
  );
}

/**
 * Official Stampy Perforated Ticket Icon (استامبي)
 */
export function StampyTicketIcon({
  className = '',
  width = 120,
  height = 60,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 310 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none', className)}
      aria-label="Stampy Ticket"
    >
      <defs>
        <clipPath id="stampy-ticket-clip">
          <path d="M 43.0 29.0 L 267.0 29.0 A 13 13 0 0 0 280.0 42.0 C 277.2 45.8 277.2 51.9 280.0 55.7 C 277.2 59.6 277.2 65.6 280.0 69.4 C 277.2 73.3 277.2 79.3 280.0 83.1 C 277.2 87.0 277.2 93.0 280.0 96.9 C 277.2 100.7 277.2 106.7 280.0 110.6 C 277.2 114.4 277.2 120.4 280.0 124.3 C 277.2 128.1 277.2 134.2 280.0 138.0 A 13 13 0 0 0 267.0 151.0 L 43.0 151.0 A 13 13 0 0 0 30.0 138.0 C 32.8 134.2 32.8 128.1 30.0 124.3 C 32.8 120.4 32.8 114.4 30.0 110.6 C 32.8 106.7 32.8 100.7 30.0 96.9 C 32.8 93.0 32.8 87.0 30.0 83.1 C 32.8 79.3 32.8 73.3 30.0 69.4 C 32.8 65.6 32.8 59.6 30.0 55.7 C 32.8 51.9 32.8 45.8 30.0 42.0 A 13 13 0 0 0 43.0 29.0 Z" />
        </clipPath>
      </defs>

      {/* Ticket Body: Warm Gold Ochre (#DFAB56) */}
      <path
        d="M 43.0 29.0 L 267.0 29.0 A 13 13 0 0 0 280.0 42.0 C 277.2 45.8 277.2 51.9 280.0 55.7 C 277.2 59.6 277.2 65.6 280.0 69.4 C 277.2 73.3 277.2 79.3 280.0 83.1 C 277.2 87.0 277.2 93.0 280.0 96.9 C 277.2 100.7 277.2 106.7 280.0 110.6 C 277.2 114.4 277.2 120.4 280.0 124.3 C 277.2 128.1 277.2 134.2 280.0 138.0 A 13 13 0 0 0 267.0 151.0 L 43.0 151.0 A 13 13 0 0 0 30.0 138.0 C 32.8 134.2 32.8 128.1 30.0 124.3 C 32.8 120.4 32.8 114.4 30.0 110.6 C 32.8 106.7 32.8 100.7 30.0 96.9 C 32.8 93.0 32.8 87.0 30.0 83.1 C 32.8 79.3 32.8 73.3 30.0 69.4 C 32.8 65.6 32.8 59.6 30.0 55.7 C 32.8 51.9 32.8 45.8 30.0 42.0 A 13 13 0 0 0 43.0 29.0 Z"
        fill="#DFAB56"
      />

      {/* 5 Spectral Stripes */}
      <g clipPath="url(#stampy-ticket-clip)">
        <rect x="30" y="78" width="250" height="4.8" fill="#3D2314" />
        <rect x="30" y="82.8" width="250" height="4.8" fill="#AC3E25" />
        <rect x="30" y="87.6" width="250" height="4.8" fill="#EBA935" />
        <rect x="30" y="92.4" width="250" height="4.8" fill="#B18944" />
        <rect x="30" y="97.2" width="250" height="4.8" fill="#337482" />
      </g>

      {/* Chamfered Solid Border */}
      <path d="M 49 37 L 261 37 L 272 48 L 272 132 L 261 143 L 49 143 L 38 132 L 38 48 Z" fill="none" stroke="#3D2314" strokeWidth="1.6" />

      {/* Dashed Stitch Line */}
      <path d="M 50 40 L 260 40 L 269 49 L 269 131 L 260 140 L 50 140 L 41 131 L 41 49 Z" fill="none" stroke="#3D2314" strokeWidth="1.0" strokeDasharray="3, 2.5" opacity="0.9" />

      {/* Aperture Center */}
      <circle cx="155" cy="90" r="24" fill="#DFAB56" />
      <circle cx="155" cy="90" r="24" fill="none" stroke="#3D2314" strokeWidth="1.4" />

      {/* 6-Blade Camera Iris Aperture Shutter */}
      <g transform="translate(155, 90) scale(0.65) translate(-350, -230)">
        <path d="M 359.96 235.75 L 359.96 262.51 A 34 34 0 0 1 326.83 254.88 L 350.00 241.50 Z" fill="#3D2314" stroke="#DFAB56" strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M 350.00 241.50 L 326.83 254.88 A 34 34 0 0 1 316.87 222.37 L 340.04 235.75 Z" fill="#3D2314" stroke="#DFAB56" strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M 340.04 235.75 L 316.87 222.37 A 34 34 0 0 1 340.04 197.49 L 340.04 224.25 Z" fill="#3D2314" stroke="#DFAB56" strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M 340.04 224.25 L 340.04 197.49 A 34 34 0 0 1 373.17 205.12 L 350.00 218.50 Z" fill="#3D2314" stroke="#DFAB56" strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M 350.00 218.50 L 373.17 205.12 A 34 34 0 0 1 383.13 237.63 L 359.96 224.25 Z" fill="#3D2314" stroke="#DFAB56" strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M 359.96 224.25 L 383.13 237.63 A 34 34 0 0 1 359.96 262.51 L 359.96 235.75 Z" fill="#3D2314" stroke="#DFAB56" strokeWidth="0.8" strokeLinejoin="round" />
        <circle cx="350" cy="230" r="34" fill="none" stroke="#3D2314" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

/**
 * Stampy Tilted Hero Ticket (-6.42°) with 3D drop shadow edge
 */
export function StampyHeroTicket({
  className = '',
  size = 320,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div className={cn('relative inline-flex items-center justify-center select-none', className)}>
      <img
        src="/stampy-hero-exact.svg"
        alt="Stampy Official Hero Ticket"
        width={size}
        height={Math.round(size * 0.7)}
        className="w-full h-auto drop-shadow-2xl animate-in fade-in zoom-in-95 duration-500"
      />
    </div>
  );
}

/**
 * Full Stampy Brand Logo with Ticket Mark and Wordmark
 */
export function StampyLogo({
  className = '',
  variant = 'horizontal',
  theme = 'auto',
  size = 'md',
  showTagline = true,
}: StampyLogoProps) {
  const sizeMap = {
    xs: { ticketWidth: 48, ticketHeight: 24, text: 'text-base', sub: 'text-[7px]' },
    sm: { ticketWidth: 64, ticketHeight: 32, text: 'text-xl', sub: 'text-[8px]' },
    md: { ticketWidth: 84, ticketHeight: 42, text: 'text-2xl', sub: 'text-[9.5px]' },
    lg: { ticketWidth: 110, ticketHeight: 55, text: 'text-3xl', sub: 'text-[11px]' },
    xl: { ticketWidth: 150, ticketHeight: 75, text: 'text-5xl', sub: 'text-xs' },
  }[size];

  if (variant === 'icon') {
    return (
      <div className={cn('inline-flex items-center justify-center', className)}>
        <StampyApertureIcon size={sizeMap.ticketHeight} />
      </div>
    );
  }

  if (variant === 'ticket') {
    return (
      <div className={cn('inline-flex items-center justify-center', className)}>
        <StampyTicketIcon width={sizeMap.ticketWidth} height={sizeMap.ticketHeight} />
      </div>
    );
  }

  if (variant === 'hero') {
    return <StampyHeroTicket size={280} className={className} />;
  }

  const isLight = theme === 'light' || theme === 'auto';
  const textColor = isLight ? 'text-[#3D2314]' : 'text-white';
  const subColor = isLight ? 'text-[#3D2314]/70 font-semibold' : 'text-[#D9D9D9]/70';
  const arColor = isLight ? 'text-[#AC3E25] font-bold' : 'text-[#DFAB56]/90';

  return (
    <div className={cn('inline-flex items-center gap-2.5 sm:gap-3 select-none text-left', className)} dir="ltr">
      {/* Perforated Gold Ochre Ticket */}
      <div className="shrink-0 transition-transform duration-200 hover:scale-105">
        <StampyTicketIcon width={sizeMap.ticketWidth} height={sizeMap.ticketHeight} />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-black tracking-tight leading-none',
              textColor,
              sizeMap.text
            )}
            style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
          >
            stampy<span className="text-[#DFAB56]">.</span>
          </span>
          <span className={cn('text-xs font-mono tracking-tight', arColor)}>
            استامبي
          </span>
        </div>
        {showTagline && (
          <span className={cn('font-mono font-bold tracking-widest uppercase block mt-0.5 leading-none', subColor, sizeMap.sub)}>
            PHOTOBOOTH & LOYALTY STUDIO
          </span>
        )}
      </div>
    </div>
  );
}

// Backward Compatibility Exports
export const MemoriesLogo = StampyLogo;
export const MemoriesArchIcon = StampyApertureIcon;

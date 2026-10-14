'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface StampyLogoProps {
  className?: string;
  variant?: 'full' | 'horizontal' | 'icon' | 'badge' | 'stacked' | 'aperture' | 'hero';
  theme?: 'dark' | 'light' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

/**
 * 6-Blade Iris Aperture Symbol Solo (DESIGN_SYSTEM.md Section 4 & 5)
 * Pure CAD regular hexagon opening with 6 touching shutter blades
 */
export function StampyApertureIcon({
  className = '',
  size = 32,
  color = '#3D2314',
  strokeColor = '#DFAB56',
}: {
  className?: string;
  size?: number;
  color?: string;
  strokeColor?: string;
}) {
  const cadCx = 350;
  const cadCy = 230;
  const cadBlades = [
    'M 359.96 235.75 L 359.96 262.51 A 34 34 0 0 1 326.83 254.88 L 350.00 241.50 Z',
    'M 350.00 241.50 L 326.83 254.88 A 34 34 0 0 1 316.87 222.37 L 340.04 235.75 Z',
    'M 340.04 235.75 L 316.87 222.37 A 34 34 0 0 1 340.04 197.49 L 340.04 224.25 Z',
    'M 340.04 224.25 L 340.04 197.49 A 34 34 0 0 1 373.17 205.12 L 350.00 218.50 Z',
    'M 350.00 218.50 L 373.17 205.12 A 34 34 0 0 1 383.13 237.63 L 359.96 224.25 Z',
    'M 359.96 224.25 L 383.13 237.63 A 34 34 0 0 1 359.96 262.51 L 359.96 235.75 Z',
  ];
  const scale = 40 / 34;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none', className)}
      aria-label="Stampy Aperture Symbol"
    >
      <g transform={`translate(50, 50) scale(${scale}) translate(-${cadCx}, -${cadCy})`}>
        {cadBlades.map((b, idx) => (
          <path key={idx} d={b} fill={color} stroke={strokeColor} strokeWidth="1.0" strokeLinejoin="round" />
        ))}
        <circle cx={cadCx} cy={cadCy} r="34" fill="none" stroke={color} strokeWidth="1.6" />
      </g>
    </svg>
  );
}

/**
 * Authentic Ticket Stub Mark with 4 Corner Fillet Cutouts, 7 Scallops, 5 Spectral Stripes & 6-Blade Aperture
 * Pure CAD Mathematics (DESIGN_SYSTEM.md Section 6 & reference.jpg)
 */
export function StampyIcon({
  className = '',
  size = 40,
}: {
  className?: string;
  size?: number;
  theme?: string;
  color?: string;
}) {
  const w = 420;
  const h = 205;
  const cornerR = 20;
  const numTeeth = 7;
  const verticalSpan = h - 2 * cornerR;
  const step = verticalSpan / numTeeth;

  // Contour with 4 inward concave fillet cutouts and 7 scallops
  let contour = `M ${cornerR} 0 L ${w - cornerR} 0 A ${cornerR} ${cornerR} 0 0 0 ${w} ${cornerR} `;
  for (let i = 0; i < numTeeth; i++) {
    const y0 = cornerR + i * step;
    const y1 = y0 + step;
    contour += `C ${w - 4.2} ${(y0 + step * 0.28).toFixed(1)} ${w - 4.2} ${(y1 - step * 0.28).toFixed(1)} ${w} ${y1.toFixed(1)} `;
  }
  contour += `A ${cornerR} ${cornerR} 0 0 0 ${w - cornerR} ${h} L ${cornerR} ${h} A ${cornerR} ${cornerR} 0 0 0 0 ${h - cornerR} `;
  for (let i = numTeeth - 1; i >= 0; i--) {
    const y0 = cornerR + (i + 1) * step;
    const y1 = cornerR + i * step;
    contour += `C 4.2 ${(y0 - step * 0.28).toFixed(1)} 4.2 ${(y1 + step * 0.28).toFixed(1)} 0 ${y1.toFixed(1)} `;
  }
  contour += `A ${cornerR} ${cornerR} 0 0 0 ${cornerR} 0 Z`;

  // Chamfered border (inset 12px, chamfer 18px)
  const chamferPath = `M 30 12 L 390 12 L 408 30 L 408 175 L 390 193 L 30 193 L 12 175 L 12 30 Z`;
  // Stitch line (inset 16px, chamfer 15px)
  const stitchPath = `M 31 16 L 389 16 L 404 31 L 404 174 L 389 189 L 31 189 L 16 174 L 16 31 Z`;

  const cx = 210;
  const cy = 102.5;
  const stripeH = 8.0;
  const startStripeY = cy - 2.5 * stripeH;
  const stripeColors = ['#3D2314', '#AC3E25', '#EBA935', '#B18944', '#337482'];

  const cadCx = 350;
  const cadCy = 230;
  const cadBlades = [
    'M 359.96 235.75 L 359.96 262.51 A 34 34 0 0 1 326.83 254.88 L 350.00 241.50 Z',
    'M 350.00 241.50 L 326.83 254.88 A 34 34 0 0 1 316.87 222.37 L 340.04 235.75 Z',
    'M 340.04 235.75 L 316.87 222.37 A 34 34 0 0 1 340.04 197.49 L 340.04 224.25 Z',
    'M 340.04 224.25 L 340.04 197.49 A 34 34 0 0 1 373.17 205.12 L 350.00 218.50 Z',
    'M 350.00 218.50 L 373.17 205.12 A 34 34 0 0 1 383.13 237.63 L 359.96 224.25 Z',
    'M 359.96 224.25 L 383.13 237.63 A 34 34 0 0 1 359.96 262.51 L 359.96 235.75 Z',
  ];

  const aspectWidth = size * (420 / 205);

  return (
    <svg
      width={aspectWidth}
      height={size}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none drop-shadow-sm', className)}
      aria-label="Stampy Official Ticket Mark"
    >
      <defs>
        <clipPath id="stampy-icon-clip">
          <path d={contour} />
        </clipPath>
      </defs>

      {/* Ticket Body: Warm Gold Ochre (#DFAB56) */}
      <path d={contour} fill="#DFAB56" />

      {/* 5 Spectral Film Stripes */}
      <g clipPath="url(#stampy-icon-clip)">
        {stripeColors.map((col, idx) => (
          <rect key={idx} x="0" y={startStripeY + idx * stripeH} width={w} height={stripeH} fill={col} />
        ))}
      </g>

      {/* Chamfered Solid Border */}
      <path d={chamferPath} fill="none" stroke="#3D2314" strokeWidth="2.2" />

      {/* Dashed Stitch Line */}
      <path d={stitchPath} fill="none" stroke="#3D2314" strokeWidth="1.2" strokeDasharray="4, 3" opacity="0.9" />

      {/* Aperture Backing Mask & Outer Moat Ring */}
      <circle cx={cx} cy={cy} r="39" fill="#DFAB56" />
      <circle cx={cx} cy={cy} r="39" fill="none" stroke="#3D2314" strokeWidth="1.8" />

      {/* 6-Blade Camera Iris Aperture Shutter */}
      <g transform={`translate(${cx}, ${cy}) scale(1.05) translate(-${cadCx}, -${cadCy})`}>
        {cadBlades.map((b, idx) => (
          <path key={idx} d={b} fill="#3D2314" stroke="#DFAB56" strokeWidth="0.8" strokeLinejoin="round" />
        ))}
        <circle cx={cadCx} cy={cadCy} r="34" fill="none" stroke="#3D2314" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

/**
 * Full Stampy Brand Logo Component (DESIGN_SYSTEM.md)
 * Pure CAD Vector Precision across all variants
 */
export function StampyLogo({
  className = '',
  variant = 'horizontal',
  theme = 'auto',
  size = 'md',
  showTagline = true,
}: StampyLogoProps) {
  const iconBase = {
    xs: 20,
    sm: 28,
    md: 38,
    lg: 48,
    xl: 60,
  }[size];

  const isDark = theme === 'dark';

  if (variant === 'aperture') {
    return (
      <div className={cn('inline-flex items-center justify-center', className)}>
        <StampyApertureIcon size={iconBase} color={isDark ? '#E8BF70' : '#3D2314'} />
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className={cn('inline-flex items-center justify-center', className)}>
        <StampyIcon size={iconBase} />
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={cn('inline-flex flex-col items-center justify-center select-none', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/01-stampy-hero-logo.svg"
          alt="stampy."
          className="w-auto h-auto max-w-full drop-shadow-md"
          style={{ maxHeight: iconBase * 4.2 }}
        />
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={cn('inline-flex flex-col items-center text-center gap-2 select-none', className)} dir="ltr">
        <StampyIcon size={iconBase * 1.15} />
        <div>
          <span
            className={cn(
              'font-black tracking-tight leading-none block text-2xl',
              isDark ? 'text-[#F7F3EA]' : 'text-[#3D2314]'
            )}
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
          >
            stampy.
          </span>
          {showTagline && (
            <span
              className={cn(
                'font-mono font-bold tracking-[0.16em] uppercase block mt-1 text-[9px]',
                isDark ? 'text-[#DFAB56]' : 'text-[#3D2314]/80'
              )}
            >
              EVERY STAMP TELLS A STORY
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border-2 transition-transform hover:-translate-y-0.5 select-none shadow-sm',
          isDark
            ? 'bg-[#1B1B1E] text-[#F7F3EA] border-[#DFAB56]/40'
            : 'bg-[#F7F3EA] text-[#3D2314] border-[#DFAB56]',
          className
        )}
        dir="ltr"
      >
        <StampyIcon size={20} />
        <span
          className="font-black tracking-tight text-xs"
          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
        >
          stampy.
        </span>
      </div>
    );
  }

  // Default Horizontal Lockup (Level 0° Ticket + Wordmark "stampy.")
  return (
    <div
      className={cn('inline-flex items-center gap-3 select-none', className)}
      dir="ltr"
    >
      <div className="relative flex items-center justify-center shrink-0">
        <StampyIcon size={iconBase} />
      </div>

      <div className="text-left flex flex-col justify-center">
        <span
          className={cn(
            'font-black tracking-tight leading-none',
            size === 'xs' ? 'text-lg' :
            size === 'sm' ? 'text-xl' :
            size === 'md' ? 'text-2xl' :
            size === 'lg' ? 'text-3xl' : 'text-4xl',
            isDark ? 'text-[#F7F3EA]' : 'text-[#3D2314]'
          )}
          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
        >
          stampy.
        </span>
        {showTagline && (
          <span
            className={cn(
              'font-mono font-bold tracking-[0.16em] block mt-1 uppercase text-[9px]',
              isDark ? 'text-[#DFAB56]' : 'text-[#3D2314]/75'
            )}
          >
            EST. 1874 • VERIFIED
          </span>
        )}
      </div>
    </div>
  );
}

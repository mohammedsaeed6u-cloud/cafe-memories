'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { StampyLogo, StampyApertureMark, StampyIcon } from './StampyLogo';

export interface MemoriesLogoProps {
  className?: string;
  variant?: 'full' | 'horizontal' | 'icon' | 'coaster' | 'badge';
  theme?: 'dark' | 'light' | 'forest' | 'terracotta' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

/**
 * Legacy alias for MemoriesArchIcon -> Modernized to StampyApertureMark (6-Blade Camera Shutter Iris)
 * Conforms 100% to DESIGN_SYSTEM.md Section 4 & 5
 */
export function MemoriesArchIcon({
  className = '',
  size = 48,
  color = '#3D2314',
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return <StampyApertureMark size={size} color={color} className={className} />;
}

/**
 * MemoriesLogo modernized to canonical StampyLogo
 */
export function MemoriesLogo({
  className = '',
  variant = 'horizontal',
  theme = 'auto',
  size = 'md',
  showTagline = true,
}: MemoriesLogoProps) {
  const stampyTheme = theme === 'dark' || theme === 'forest' ? 'dark' : theme === 'light' ? 'light' : 'auto';

  if (variant === 'icon') {
    return <StampyIcon size={size === 'xs' ? 20 : size === 'sm' ? 28 : size === 'lg' ? 48 : size === 'xl' ? 60 : 38} className={className} />;
  }

  if (variant === 'coaster') {
    return (
      <div className={cn('p-4 rounded-3xl bg-[#FAF5EB] border border-[#DFAB56]/40 shadow-md inline-flex items-center justify-center', className)}>
        <StampyIcon size={44} />
      </div>
    );
  }

  return (
    <StampyLogo
      variant={variant === 'full' ? 'stacked' : variant === 'badge' ? 'badge' : 'horizontal'}
      theme={stampyTheme}
      size={size}
      showTagline={showTagline}
      className={className}
    />
  );
}

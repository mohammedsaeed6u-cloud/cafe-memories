'use client';

import React from 'react';

interface SvgProps {
  size?: number;
  className?: string;
  color?: string;
}

// ============================================================================
// 1. THE SNAP EXPRESS VINTAGE TICKET SVGS
// ============================================================================

/**
 * Highly detailed classic steam locomotive engine SVG
 */
export function LocomotiveTrainSvg({ size = 36, className = '', color = 'currentColor' }: SvgProps) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.65)}
      viewBox="0 0 56 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Locomotive Steam Train"
    >
      {/* Smoke puffs from chimney */}
      <circle cx="12" cy="5" r="2.5" fill={color} opacity="0.35" />
      <circle cx="8" cy="3" r="2" fill={color} opacity="0.25" />
      <circle cx="16" cy="4" r="3" fill={color} opacity="0.45" />

      {/* Chimney / Funnel */}
      <path d="M11 8H17L16 14H12L11 8Z" fill={color} />
      <rect x="10" y="7" width="8" height="2" rx="0.5" fill={color} />

      {/* Steam Dome & Sand Dome */}
      <path d="M24 10C24 8.5 25.5 7.5 27 7.5C28.5 7.5 30 8.5 30 10V14H24V10Z" fill={color} />
      <path d="M35 11C35 9.8 36 9 37.2 9C38.4 9 39.4 9.8 39.4 11V14H35V11Z" fill={color} />

      {/* Main Boiler Body */}
      <rect x="11" y="14" width="31" height="11" rx="2" fill={color} />

      {/* Headlight / Cowcatcher Pilot */}
      <polygon points="5,28 12,23 12,28" fill={color} />
      <path d="M9 17H11V21H9C8.4 21 8 20.6 8 20V18C8 17.4 8.4 17 9 17Z" fill={color} />

      {/* Driver Cabin */}
      <path d="M42 9H52V25H42V9Z" fill={color} />
      {/* Cabin Roof curved overhang */}
      <path d="M40 8H54V10H40V8Z" fill={color} />
      {/* Cabin Window */}
      <rect x="44" y="12" width="6" height="5" rx="1" fill="#FAF5EC" />

      {/* Base Chassis Beam */}
      <rect x="6" y="25" width="48" height="3" rx="1" fill={color} />

      {/* Wheels */}
      {/* Front Small Pilot Wheels */}
      <circle cx="12" cy="29" r="3" stroke={color} strokeWidth="1.5" fill="#FAF5EC" />
      <circle cx="12" cy="29" r="1" fill={color} />
      <circle cx="19" cy="29" r="3" stroke={color} strokeWidth="1.5" fill="#FAF5EC" />
      <circle cx="19" cy="29" r="1" fill={color} />

      {/* Big Driving Wheels with Spokes */}
      <circle cx="28" cy="29" r="4.5" stroke={color} strokeWidth="1.8" fill="#FAF5EC" />
      <circle cx="28" cy="29" r="1.5" fill={color} />
      <circle cx="38" cy="29" r="4.5" stroke={color} strokeWidth="1.8" fill="#FAF5EC" />
      <circle cx="38" cy="29" r="1.5" fill={color} />
      <circle cx="48" cy="29" r="4.5" stroke={color} strokeWidth="1.8" fill="#FAF5EC" />
      <circle cx="48" cy="29" r="1.5" fill={color} />

      {/* Connecting Rod */}
      <rect x="26" y="28" width="24" height="1.8" rx="0.9" fill={color} />

      {/* Track Rail */}
      <rect x="2" y="34" width="52" height="1.5" rx="0.5" fill={color} opacity="0.6" />
    </svg>
  );
}

/**
 * Authentic 1D Ticket Barcode SVG
 */
export function TicketBarcodeSvg({ width = 160, height = 28, color = 'currentColor', className = '' }: { width?: number; height?: number; color?: string; className?: string }) {
  return (
    <svg width={width} height={height} viewBox="0 0 160 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="4" y="0" width="3" height="28" fill={color} />
      <rect x="9" y="0" width="1.5" height="28" fill={color} />
      <rect x="13" y="0" width="4" height="28" fill={color} />
      <rect x="19" y="0" width="2" height="28" fill={color} />
      <rect x="24" y="0" width="1.5" height="28" fill={color} />
      <rect x="28" y="0" width="5" height="28" fill={color} />
      <rect x="35" y="0" width="2" height="28" fill={color} />
      <rect x="39" y="0" width="3.5" height="28" fill={color} />
      <rect x="45" y="0" width="1" height="28" fill={color} />
      <rect x="48" y="0" width="4.5" height="28" fill={color} />
      <rect x="55" y="0" width="2" height="28" fill={color} />
      <rect x="59" y="0" width="1.5" height="28" fill={color} />
      <rect x="63" y="0" width="3.5" height="28" fill={color} />
      <rect x="69" y="0" width="2" height="28" fill={color} />
      <rect x="74" y="0" width="5" height="28" fill={color} />
      <rect x="81" y="0" width="1.5" height="28" fill={color} />
      <rect x="85" y="0" width="3" height="28" fill={color} />
      <rect x="90" y="0" width="4" height="28" fill={color} />
      <rect x="96" y="0" width="2" height="28" fill={color} />
      <rect x="100" y="0" width="1" height="28" fill={color} />
      <rect x="103" y="0" width="4.5" height="28" fill={color} />
      <rect x="110" y="0" width="2" height="28" fill={color} />
      <rect x="114" y="0" width="3.5" height="28" fill={color} />
      <rect x="120" y="0" width="1.5" height="28" fill={color} />
      <rect x="124" y="0" width="5" height="28" fill={color} />
      <rect x="131" y="0" width="2" height="28" fill={color} />
      <rect x="135" y="0" width="4" height="28" fill={color} />
      <rect x="141" y="0" width="1" height="28" fill={color} />
      <rect x="144" y="0" width="3.5" height="28" fill={color} />
      <rect x="150" y="0" width="2" height="28" fill={color} />
      <rect x="154" y="0" width="3" height="28" fill={color} />
    </svg>
  );
}

// ============================================================================
// 2. SPOTIFY PLAYER SVGS
// ============================================================================

/**
 * Official Spotify 3 curved sound wave logo SVG
 */
export function SpotifyLogoSvg({ size = 20, color = '#1DB954', className = '' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="12" fill={color} />
      <path
        d="M17.8 15.6C17.6 15.9 17.2 16 16.9 15.8C14.1 14.1 10.7 13.7 6.9 14.6C6.6 14.7 6.2 14.5 6.1 14.1C6 13.8 6.2 13.4 6.6 13.3C10.8 12.3 14.5 12.8 17.6 14.7C17.9 14.9 18 15.3 17.8 15.6ZM18.9 13C18.6 13.4 18.1 13.5 17.7 13.3C14.6 11.4 9.9 10.9 6.4 11.9C6 12 5.5 11.8 5.4 11.4C5.3 11 5.5 10.5 5.9 10.4C10 9.2 15.2 9.8 18.7 11.9C19.1 12.1 19.1 12.6 18.9 13ZM19 10.2C15.4 8.1 9.4 7.9 5.8 9C5.2 9.2 4.6 8.8 4.4 8.3C4.2 7.7 4.6 7.1 5.2 6.9C9.3 5.7 16 5.9 20.1 8.3C20.7 8.6 20.9 9.3 20.5 9.8C20.2 10.3 19.5 10.5 19 10.2Z"
        fill="#000000"
      />
    </svg>
  );
}

/**
 * Explicit Content Badge [E]
 */
export function SpotifyExplicitBadge({ size = 13, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      style={{ width: `${size * 1.3}px`, height: `${size}px`, fontSize: `${size * 0.75}px` }}
      className={`inline-flex items-center justify-center bg-white/20 text-white font-mono font-black rounded-xs select-none ${className}`}
      title="Explicit Content"
    >
      E
    </span>
  );
}

/**
 * Shuffle crossed arrows SVG
 */
export function SpotifyShuffleSvg({ size = 15, color = 'currentColor', className = '' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  );
}

/**
 * Previous Track SVG
 */
export function SpotifyPreviousSvg({ size = 16, color = 'currentColor', className = '' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
      <polygon points="19,20 9,12 19,4" />
      <rect x="5" y="4" width="2.5" height="16" rx="1" />
    </svg>
  );
}

/**
 * Next Track SVG
 */
export function SpotifyNextSvg({ size = 16, color = 'currentColor', className = '' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
      <polygon points="5,4 15,12 5,20" />
      <rect x="16.5" y="4" width="2.5" height="16" rx="1" />
    </svg>
  );
}

/**
 * Repeat Loop SVG
 */
export function SpotifyRepeatSvg({ size = 15, color = 'currentColor', className = '' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

// ============================================================================
// 3. IPHONE GALLERY & IOS SYSTEM SVGS
// ============================================================================

/**
 * iOS Cellular Signal Strength (4 stepped rounded bars)
 */
export function IosCellularBarsSvg({ size = 14, color = 'currentColor', bars = 4, className = '' }: SvgProps & { bars?: number }) {
  return (
    <svg width={size * 1.2} height={size} viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="1" y="9" width="2.5" height="3" rx="1" fill={color} opacity={bars >= 1 ? 1 : 0.3} />
      <rect x="5.5" y="6" width="2.5" height="6" rx="1" fill={color} opacity={bars >= 2 ? 1 : 0.3} />
      <rect x="10" y="3" width="2.5" height="9" rx="1" fill={color} opacity={bars >= 3 ? 1 : 0.3} />
      <rect x="14.5" y="0" width="2.5" height="12" rx="1" fill={color} opacity={bars >= 4 ? 1 : 0.3} />
    </svg>
  );
}

/**
 * iOS Battery Pill with Terminal Cap & Level
 */
export function IosBatterySvg({ size = 12, color = 'currentColor', level = 0.88, className = '' }: SvgProps & { level?: number }) {
  return (
    <svg width={size * 2} height={size} viewBox="0 0 25 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="1" y="1" width="20" height="10" rx="3.5" stroke={color} strokeWidth="1.2" />
      <path d="M22.5 4.5C23.3 4.8 23.3 7.2 22.5 7.5V4.5Z" fill={color} />
      <rect x="2.5" y="2.5" width={Math.max(2, 17 * level)} height="7" rx="2" fill={color} />
    </svg>
  );
}



/**
 * Apple Photos Tab Bar: Library Icon
 */
export function IosPhotosLibrarySvg({ size = 18, color = 'currentColor', className = '' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M7 21h12a2 2 0 0 0 2-2V7" />
      <circle cx="8" cy="8" r="1.5" fill={color} />
      <polyline points="17 13 13 9 5 17" />
    </svg>
  );
}

/**
 * Apple Photos Tab Bar: For You Icon (sparkling star photos)
 */
export function IosPhotosForYouSvg({ size = 18, color = 'currentColor', className = '' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M12 2l1.2 2.6L16 5.8l-2 2 .5 2.8L12 9.2l-2.5 1.4.5-2.8-2-2 2.8-1.2L12 2z" fill={color} stroke="none" />
      <path d="M17 19h4a1 1 0 0 0 1-1V9" />
    </svg>
  );
}

/**
 * Apple Photos Tab Bar: Albums Icon
 */
export function IosPhotosAlbumsSvg({ size = 18, color = 'currentColor', className = '' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

// ============================================================================
// 4. IPHONE CAMERA SVGS
// ============================================================================

/**
 * iOS Camera Viewfinder Focus Reticle
 */
export function IosCameraReticleSvg({ size = 44, color = '#FFCC00', className = '' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* 4 Corner Brackets */}
      <path d="M12 4H4V12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M36 4H44V12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 36V44H12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M44 36V44H36" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Center Micro Crosshair */}
      <circle cx="24" cy="24" r="1.5" fill={color} />
      {/* Sun Exposure Slider Icon on the right */}
      <circle cx="45" cy="24" r="2.5" stroke={color} strokeWidth="1.2" />
      <line x1="45" y1="18" x2="45" y2="30" stroke={color} strokeWidth="1" strokeDasharray="1 1" />
    </svg>
  );
}

/**
 * iOS Dual-Ring Shutter Button
 */
export function IosCameraShutterSvg({ size = 52, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer brushed aluminum ring */}
      <circle cx="32" cy="32" r="30" stroke="#FFFFFF" strokeWidth="4" />
      {/* Inner solid white capture disc */}
      <circle cx="32" cy="32" r="24" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Flip Camera Lens Icon
 */
export function IosCameraFlipLensSvg({ size = 20, color = '#FFFFFF', className = '' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8" />
      <polyline points="4 6 4 10 8 10" />
      <path d="M4 14c0 4.4 3.6 8 8 8s8-3.6 8-8" />
      <polyline points="20 18 20 14 16 14" />
    </svg>
  );
}

/**
 * iOS AirPlay / Audio Output Device Icon
 */
export function IosAirPlaySvg({ size = 14, color = 'currentColor', className = '' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 15 17 21 7 21 12 15" fill={color} />
      <path d="M5 16.93a10 10 0 0 1 0-9.86" />
      <path d="M19 16.93a10 10 0 0 0 0-9.86" />
    </svg>
  );
}

/**
 * iOS Volume Speaker (Low / High)
 */
export function IosSpeakerSvg({ size = 12, mode = 'low', color = 'currentColor', className = '' }: SvgProps & { mode?: 'low' | 'high' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={color} />
      {mode === 'high' ? (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      ) : (
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      )}
    </svg>
  );
}

/**
 * iOS WiFi Icon
 */
export function IosWifiSvg({ size = 12, color = 'currentColor', className = '' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.8" />
    </svg>
  );
}

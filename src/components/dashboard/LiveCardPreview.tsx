'use client';

import React, { useMemo } from 'react';
import { PHOTOBOOTH_CARD_MODES } from '@/lib/constants/photobooth-presets';
import {
  getFixedCardCanvasSize,
  resolveFixedCardSize,
} from '@/lib/services/print.service';

export interface LiveCardPreviewProps {
  businessName: string;
  logoUrl: string;
  showLogo: boolean;
  cardMode?: string;
  orientation?: 'vertical' | 'horizontal';
  shotCount: number;
  giftTitle?: string;
}

const SLOT_PLACEHOLDER_GRADIENT = 'linear-gradient(135deg, #3b3939 0%, #1F1D1D 100%)';

/**
 * Live merchant-side card preview: reflects size, theme colors, the logo
 * toggle, and the shot count instantly — before anything is saved.
 * Rendered at true aspect ratio from the two fixed print sizes.
 */
export function LiveCardPreview({
  businessName,
  logoUrl,
  showLogo,
  cardMode = 'luxury_glass',
  orientation = 'vertical',
  shotCount,
  giftTitle = 'هدية خاصة',
}: LiveCardPreviewProps) {
  const mode = useMemo(
    () => PHOTOBOOTH_CARD_MODES.find((m) => m.id === cardMode) || PHOTOBOOTH_CARD_MODES[0],
    [cardMode]
  );
  const size = resolveFixedCardSize({
    widthCm: mode.widthCm,
    heightCm: mode.heightCm,
  });
  const { width, height } = getFixedCardCanvasSize(size, orientation);
  const isVertical = orientation === 'vertical';
  const displayWidth = isVertical ? Math.round((width / height) * 300) : 300;
  const displayHeight = isVertical ? 300 : Math.round((height / width) * 300);

  const slots = Array.from({ length: Math.max(1, shotCount) });
  const effectiveLogo = showLogo && logoUrl.trim() ? logoUrl.trim() : null;
  const bg = mode.defaultBg || '#1C1B1B';
  const text = mode.defaultText || '#FBF9F5';
  const accent = mode.defaultAccent || '#d97706';
  const border = mode.defaultBorder || 'rgba(255,255,255,0.12)';

  return (
    <div className="flex flex-col items-center gap-2" aria-label="معاينة حية للكارت">
      <div
        className="relative rounded-xl shadow-2xl overflow-hidden transition-all duration-300"
        style={{
          width: displayWidth,
          height: displayHeight,
          background: bg,
          border: `2px solid ${border}`,
        }}
      >
        {/* Header: logo or business name (matches composer behavior) */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-center h-14 px-3">
          {effectiveLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={effectiveLogo}
              alt={`شعار ${businessName}`}
              className="max-h-10 max-w-[80%] object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span
              className="font-bold text-sm text-center leading-tight line-clamp-2"
              style={{ color: text }}
            >
              {businessName || 'مقهى ومحمصة ولاء'}
            </span>
          )}
        </div>

        {/* Photo slots */}
        <div
          className="absolute inset-x-3 bottom-10 top-16 flex flex-col gap-1.5"
          style={{ justifyContent: 'space-evenly' }}
        >
          {slots.map((_, i) => (
            <div
              key={i}
              className="rounded-md flex-1 max-h-full"
              style={{
                background: SLOT_PLACEHOLDER_GRADIENT,
                border: `1px solid ${border}`,
              }}
            />
          ))}
        </div>

        {/* Badge + gift footer */}
        <div className="absolute bottom-0 inset-x-0 h-8 flex items-center justify-center gap-2 px-2"
          style={{ background: 'rgba(0,0,0,0.25)' }}
        >
          <span className="text-[9px] font-mono font-bold truncate" style={{ color: accent }}>
            {(mode.filmBadge || 'MEMORIES').toUpperCase()}
          </span>
          <span className="text-[9px] truncate" style={{ color: text }}>
            {giftTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-mono text-[#A19E9B]" dir="ltr">
        <span className="px-2 py-0.5 rounded bg-[#1C1B1B] border border-white/10">
          {size === 'strip_2x6' ? '2×6 in' : '4×6 in'}
        </span>
        <span className="px-2 py-0.5 rounded bg-[#1C1B1B] border border-white/10">
          {width}×{height}px @300DPI
        </span>
        <span className="px-2 py-0.5 rounded bg-[#1C1B1B] border border-white/10">
          {shotCount} shots
        </span>
      </div>
    </div>
  );
}

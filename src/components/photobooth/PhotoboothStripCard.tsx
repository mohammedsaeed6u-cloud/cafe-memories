'use client';

import React, { useRef } from 'react';
import {
  PhotoboothFrame,
  BusinessBranding,
  FreeGiftOffer,
  PhotoboothCardMode,
  PlacedSticker,
} from '@/types/photobooth';
import { Check } from 'lucide-react';
import { DraggableStickerLayer } from './DraggableStickerLayer';
import { PHOTOBOOTH_CARD_MODES } from '@/lib/constants/photobooth-presets';

interface PhotoboothStripCardProps {
  photos: string[];
  frame: PhotoboothFrame;
  branding: BusinessBranding;
  freeGiftOffer?: FreeGiftOffer;
  giftCode?: string;
  timestamp?: string;
  onPrint?: () => void;
  className?: string;
  isCompleted?: boolean;
  cardMode?: PhotoboothCardMode;
  stickers?: PlacedSticker[];
  onUpdateStickers?: (stickers: PlacedSticker[]) => void;
  isStickersInteractive?: boolean;
}

export const PhotoboothStripCard: React.FC<PhotoboothStripCardProps> = ({
  photos,
  frame,
  branding,
  freeGiftOffer = {
    title: 'مشروب مجاني مميز + طباعة الكارت 2x6',
    subtitle: 'هدية فورية عند اكتمال كارت ذكرياتك',
    icon: '🎁',
  },
  timestamp = new Date().toISOString(),
  onPrint,
  className = '',
  cardMode = frame.cardMode || 'korean_noir',
  stickers = [],
  onUpdateStickers,
  isStickersInteractive = false,
}) => {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const isHorizontal = frame.orientation === 'horizontal';
  const totalSlots = Math.max(frame.shotCount || 3, 1);

  // Date format: 2026.09.20
  const dateObj = new Date(timestamp);
  const dateFormatted = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;

  const modeInfo =
    PHOTOBOOTH_CARD_MODES.find((m) => m.id === cardMode) ||
    PHOTOBOOTH_CARD_MODES[0];

  // Derive mode-specific styles
  const isKorean = cardMode === 'korean_noir';
  const isRetro = cardMode === 'retro_film';
  const isSakura = cardMode === 'sakura_y2k';
  const isPolaroid = cardMode === 'polaroid_classic';

  const outerRadiusClass = isPolaroid ? 'rounded-xl pb-10' : 'rounded-xl';

  // Card background & text colors based on frame/mode
  const effectiveBg = frame.bgColor || modeInfo.defaultBg;
  const effectiveBorder = frame.borderColor || modeInfo.defaultBorder;
  const effectiveText = frame.textColor || modeInfo.defaultText;
  const effectiveAccent = frame.accentColor || modeInfo.defaultAccent;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Printable 2x6 Physical Photobooth Card */}
      <div
        id="printable-strip"
        ref={cardContainerRef}
        style={{
          backgroundColor: effectiveBg,
          borderColor: effectiveBorder,
          color: effectiveText,
        }}
        className={`relative transition-all duration-300 select-none shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] border-[1px] ${outerRadiusClass} overflow-hidden print:shadow-none print:border-none ${
          isHorizontal ? 'w-full max-w-[480px] p-5' : 'w-[300px] sm:w-[340px] p-4 py-5'
        }`}
      >
        {/* Paper Texture Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.15] z-0"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />

        {/* Retro Film Sprocket Holes Edge (Analog 35mm styling) */}
        {isRetro && (
          <>
            <div className="absolute top-0 bottom-0 left-1.5 flex flex-col justify-around py-4 pointer-events-none z-10 opacity-30">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-2 h-3.5 rounded-sm bg-white/40 mb-1" />
              ))}
            </div>
            <div className="absolute top-0 bottom-0 right-1.5 flex flex-col justify-around py-4 pointer-events-none z-10 opacity-30">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-2 h-3.5 rounded-sm bg-white/40 mb-1" />
              ))}
            </div>
          </>
        )}

        {/* Sakura Y2K Sparkle Glow Accents */}
        {isSakura && (
          <div className="absolute inset-0 bg-gradient-to-b from-pink-200/20 via-transparent to-rose-200/20 pointer-events-none z-0" />
        )}

        {/* Subtle Corner Stickers/Emojis (from frame preset) */}
        {frame.cornerEmojis && frame.cornerEmojis.enabled && (
          <>
            {frame.cornerEmojis.topRight && (
              <div
                className="absolute top-4 right-4 text-2xl filter drop-shadow-sm select-none z-20 pointer-events-none"
                title="Corner Sticker"
              >
                {frame.cornerEmojis.topRight}
              </div>
            )}
            {frame.cornerEmojis.bottomLeft && (
              <div
                className="absolute bottom-4 left-4 text-2xl filter drop-shadow-sm select-none z-20 pointer-events-none"
                title="Corner Sticker"
              >
                {frame.cornerEmojis.bottomLeft}
              </div>
            )}
          </>
        )}

        {/* Top Header: Authentic Minimal Photobooth Branding */}
        <div className="relative z-10 flex flex-col items-center justify-center mb-3 text-center">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="h-8 object-contain mb-1 max-w-[120px]"
            />
          ) : (
            <h3
              style={{ color: effectiveText }}
              className="font-black text-[13px] tracking-wide uppercase"
            >
              {branding.name || 'Memories • موميريز'}
            </h3>
          )}

          {/* Mode-specific Badge */}
          <div className="flex items-center gap-1.5 mt-1">
            <span
              style={{ color: effectiveAccent }}
              className="text-[8px] font-black uppercase tracking-[0.2em] font-mono opacity-80"
            >
              {frame.badgeText || modeInfo.filmBadge}
            </span>
          </div>
        </div>

        {/* Multi-Visit Slots Grid or Vertical Strip */}
        <div
          className={`relative z-10 w-full ${
            isHorizontal
              ? 'grid grid-cols-2 gap-3 my-2'
              : 'flex flex-col gap-2 my-1'
          }`}
        >
          {Array.from({ length: totalSlots }).map((_, slotIdx) => {
            const photo = photos[slotIdx];
            const isLastSlot = slotIdx === totalSlots - 1;
            const visitNumber = slotIdx + 1;
            const slotNumberFormatted = String(visitNumber).padStart(2, '0');

            // Aspect ratio depends on orientation, typically 3:4 for vertical strips, 4:3 for horizontal
            const aspectClass = isHorizontal ? 'aspect-[4/3]' : 'aspect-[3/4]';

            return (
              <div
                key={slotIdx}
                style={{ borderColor: effectiveBorder }}
                className={`relative overflow-hidden bg-white ${aspectClass}`}
              >
                {/* Inner white border / photo margin */}
                <div className="absolute inset-1 bg-stone-100 flex items-center justify-center overflow-hidden">
                  {photo ? (
                    <>
                      <img
                        src={photo}
                        alt={`Visit ${visitNumber}`}
                        className="w-full h-full object-cover filter contrast-105 saturate-[0.95]"
                      />
                      {/* Checkmark Tag (minimal) */}
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[9px] font-bold rounded-sm flex items-center gap-1 shadow-sm select-none">
                        <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
                      </div>
                    </>
                  ) : isLastSlot ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 text-center">
                       <span style={{ color: effectiveAccent }} className="text-xl mb-2 opacity-80">🎁</span>
                       <span className="text-[11px] font-bold opacity-80">هدية عند الاكتمال</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black/5 dark:bg-white/5 opacity-50">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        الزيارة {visitNumber}
                      </span>
                    </div>
                  )}
                </div>

                {/* Authentic Film Slot Number */}
                <div className="absolute top-1.5 left-2 text-[8px] font-mono font-bold tracking-tighter opacity-50 select-none z-10 pointer-events-none mix-blend-difference text-white">
                  #{slotNumberFormatted}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive / Static Draggable Stickers Layer Overlay */}
        {(stickers.length > 0 || isStickersInteractive) && (
          <DraggableStickerLayer
            stickers={stickers}
            onUpdateStickers={onUpdateStickers || (() => {})}
            isInteractive={isStickersInteractive}
            cardContainerRef={cardContainerRef}
          />
        )}

        {/* Authentic Photobooth Footer */}
        <div
          style={{ borderColor: effectiveBorder }}
          className="relative z-10 mt-5 pt-2 border-t-[0.5px] flex items-center justify-between text-[9px] opacity-80 font-mono px-1"
        >
          <div className="flex items-center gap-3">
            {/* Date in typewriter format */}
            <span className="tracking-tight">{dateFormatted}</span>
            
            {/* Open Source Studio Barcode for Korean Noir & Retro Film */}
            {(isKorean || isRetro) && (
              <div className="flex items-center gap-[1px] opacity-60 select-none">
                <span className="w-[1px] h-2.5 bg-current inline-block" />
                <span className="w-[2px] h-2.5 bg-current inline-block" />
                <span className="w-[1px] h-2.5 bg-current inline-block" />
                <span className="w-[3px] h-2.5 bg-current inline-block" />
                <span className="w-[1px] h-2.5 bg-current inline-block" />
              </div>
            )}
          </div>

          <span className="tracking-widest uppercase font-bold">
            {branding.name ? branding.name : 'MEMORIES'}
          </span>
        </div>

        {/* Polaroid chin handwritten note line */}
        {isPolaroid && (
          <div className="mt-3 text-center text-[10px] italic font-serif opacity-60 tracking-wider">
            memories together ♡
          </div>
        )}
      </div>
    </div>
  );
};

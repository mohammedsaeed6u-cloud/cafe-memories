'use client';

import React, { useRef } from 'react';
import {
  PhotoboothFrame,
  BusinessBranding,
  FreeGiftOffer,
  PhotoboothCardMode,
  PlacedSticker,
  PhotoboothLayoutType,
} from '@/types/photobooth';
import { Check, Gift, Scissors } from 'lucide-react';
import { DraggableStickerLayer } from './DraggableStickerLayer';
import { PHOTOBOOTH_CARD_MODES, PHOTOBOOTH_FRAME_TEMPLATES } from '@/lib/constants/photobooth-presets';

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
    title: 'مشروب مجاني مميز + طباعة الكارت',
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

  // Determine layout type from frame.layoutType or templateId or fallback
  const template = PHOTOBOOTH_FRAME_TEMPLATES.find(
    (t) => t.id === frame.templateId || t.layoutType === frame.layoutType
  );
  const layoutType: PhotoboothLayoutType =
    frame.layoutType || template?.layoutType || (frame.shotCount === 4 ? 'strip_4' : frame.shotCount === 2 ? 'strip_2' : frame.shotCount === 1 ? 'polaroid_square' : frame.orientation === 'horizontal' ? 'grid_2x2' : 'strip_3');

  const totalSlots = template?.shotCount || Math.max(frame.shotCount || 3, 1);

  // Format date as 2026.09.20
  const dateObj = new Date(timestamp);
  const dateFormatted = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;

  const modeInfo = PHOTOBOOTH_CARD_MODES.find((m) => m.id === cardMode) || PHOTOBOOTH_CARD_MODES[0];

  const isRetro = layoutType === 'film_35mm' || cardMode === 'retro_film';
  const isPolaroid = layoutType === 'polaroid_square' || layoutType === 'polaroid_wide' || cardMode === 'polaroid_classic' || frame.frameShape === 'polaroid';
  const isKorean = cardMode === 'korean_noir' || layoutType === 'strip_4';
  const isCinema = layoutType === 'cinema_horizontal';
  const isTwin = layoutType === 'twin_strip';

  const effectiveBg = frame.bgColor || template?.defaultBg || modeInfo.defaultBg;
  const effectiveBorder = frame.borderColor || template?.defaultBorder || modeInfo.defaultBorder;
  const effectiveText = frame.textColor || template?.defaultText || modeInfo.defaultText;
  const effectiveAccent = frame.accentColor || template?.defaultAccent || modeInfo.defaultAccent;

  // Card container sizing by layout type
  let cardWidthClass = 'w-[300px] sm:w-[330px] p-4 py-5';
  if (layoutType === 'grid_2x2') {
    cardWidthClass = 'w-[350px] sm:w-[390px] p-5 py-5';
  } else if (layoutType === 'grid_2x3') {
    cardWidthClass = 'w-[380px] sm:w-[440px] p-5 py-5';
  } else if (layoutType === 'twin_strip') {
    cardWidthClass = 'w-[420px] sm:w-[500px] p-4 py-5';
  } else if (layoutType === 'cinema_horizontal') {
    cardWidthClass = 'w-[380px] sm:w-[450px] p-4 py-5';
  } else if (layoutType === 'polaroid_wide') {
    cardWidthClass = 'w-[350px] sm:w-[390px] p-5 pb-9';
  } else if (layoutType === 'polaroid_square') {
    cardWidthClass = 'w-[310px] sm:w-[340px] p-5 pb-10';
  }

  const outerRadiusClass = isPolaroid ? 'rounded-2xl' : 'rounded-xl';

  // Render single photo slot with high-end photobooth styling
  const renderPhotoSlot = (slotIdx: number, aspect = 'aspect-[3/4]') => {
    const photo = photos[slotIdx];
    const isLastSlot = slotIdx === totalSlots - 1;
    const visitNumber = slotIdx + 1;
    const slotFormatted = String(visitNumber).padStart(2, '0');

    return (
      <div
        key={slotIdx}
        style={{ borderColor: effectiveBorder }}
        className={`relative overflow-hidden bg-white/90 shadow-2xs ${aspect} rounded-sm border`}
      >
        <div className="absolute inset-[3px] bg-stone-100 flex items-center justify-center overflow-hidden rounded-xs">
          {photo ? (
            <>
              <img
                src={photo}
                alt={`Shot ${visitNumber}`}
                className="w-full h-full object-cover filter contrast-[1.04] saturate-[0.96]"
              />
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/50 backdrop-blur-xs text-white text-[8px] font-bold rounded-xs flex items-center gap-1 select-none">
                <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
                <span>#{slotFormatted}</span>
              </div>
            </>
          ) : isLastSlot ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-stone-50/80">
              <span style={{ color: effectiveAccent }} className="text-lg mb-1">🎁</span>
              <span className="text-[10px] font-bold opacity-80 leading-tight">هدية فورية</span>
              <span className="text-[8px] text-stone-400 mt-0.5">الخانة الأخيرة #{slotFormatted}</span>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/[0.02] text-stone-400">
              <span className="text-xs font-mono font-bold">#{slotFormatted}</span>
              <span className="text-[9px] font-medium mt-0.5 opacity-60">في الانتظار</span>
            </div>
          )}
        </div>

        {/* Micro film rebate numbering */}
        <div className="absolute top-1 left-1.5 text-[7px] font-mono font-bold tracking-tighter opacity-60 select-none z-10 pointer-events-none mix-blend-difference text-white">
          #{slotFormatted}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Main Printable Card */}
      <div
        id="printable-strip"
        ref={cardContainerRef}
        style={{
          backgroundColor: effectiveBg,
          borderColor: effectiveBorder,
          color: effectiveText,
        }}
        className={`relative transition-all duration-300 select-none shadow-[0_6px_24px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] border ${outerRadiusClass} overflow-hidden print:shadow-none print:border-none ${cardWidthClass}`}
      >
        {/* Subtle Paper Noise Texture */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.14] z-0"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")'
          }}
        />

        {/* Analog 35mm Sprocket Holes */}
        {isRetro && (
          <>
            <div className="absolute top-0 bottom-0 left-1.5 flex flex-col justify-around py-3 pointer-events-none z-10 opacity-30">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-1.5 h-3 rounded-xs bg-white/50 mb-1" />
              ))}
            </div>
            <div className="absolute top-0 bottom-0 right-1.5 flex flex-col justify-around py-3 pointer-events-none z-10 opacity-30">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-1.5 h-3 rounded-xs bg-white/50 mb-1" />
              ))}
            </div>
          </>
        )}

        {/* Header Branding */}
        <div className="relative z-10 flex flex-col items-center justify-center mb-3 text-center">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="h-7 object-contain mb-1 max-w-[120px]"
            />
          ) : (
            <h3
              style={{ color: effectiveText }}
              className="font-black text-xs tracking-wider uppercase"
            >
              {branding.name || 'MEMORIES STUDIO'}
            </h3>
          )}

          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              style={{ color: effectiveAccent }}
              className="text-[8px] font-black uppercase tracking-[0.2em] font-mono opacity-80"
            >
              {frame.badgeText || template?.badge || modeInfo.filmBadge}
            </span>
          </div>
        </div>

        {/* Dynamic Photo Slot Layouts */}
        <div className="relative z-10 w-full my-1.5">
          {/* 1. Grid 2x2 (Postcard) */}
          {layoutType === 'grid_2x2' && (
            <div className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: 4 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[4/3]'))}
            </div>
          )}

          {/* 2. Grid 2x3 (Friends Mini Grid) */}
          {layoutType === 'grid_2x3' && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[4/3]'))}
            </div>
          )}

          {/* 3. Twin Strip (Dual 2x6 with Perforation) */}
          {layoutType === 'twin_strip' && (
            <div className="grid grid-cols-2 gap-4 relative">
              {/* Center Cut Line */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-between pointer-events-none z-20">
                <Scissors className="w-3 h-3 text-stone-400 rotate-90 mb-1" />
                <div className="w-0 flex-1 border-r border-dashed border-stone-300 dark:border-stone-600" />
                <span className="text-[7px] font-mono text-stone-400 mt-1 uppercase tracking-tighter">CUT</span>
              </div>
              {/* Left Strip */}
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[3/4]'))}
              </div>
              {/* Right Strip (Duplicate or remaining) */}
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[3/4]'))}
              </div>
            </div>
          )}

          {/* 4. Cinema Horizontal 3 Cuts */}
          {layoutType === 'cinema_horizontal' && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[16/9]'))}
              <div className="text-center text-[8px] font-mono text-stone-400 italic mt-1 tracking-wider">
                — A warm coffee moment worth remembering —
              </div>
            </div>
          )}

          {/* 5. Polaroid Square 1 Cut */}
          {layoutType === 'polaroid_square' && (
            <div className="w-full flex justify-center">
              <div className="w-full">{renderPhotoSlot(0, 'aspect-square')}</div>
            </div>
          )}

          {/* 6. Polaroid Wide 1 Cut */}
          {layoutType === 'polaroid_wide' && (
            <div className="w-full flex justify-center">
              <div className="w-full">{renderPhotoSlot(0, 'aspect-[4/3]')}</div>
            </div>
          )}

          {/* 7. Default Vertical Strips (strip_4, strip_3, strip_2, film_35mm) */}
          {(layoutType === 'strip_4' || layoutType === 'strip_3' || layoutType === 'strip_2' || layoutType === 'film_35mm') && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: totalSlots }).map((_, idx) =>
                renderPhotoSlot(idx, layoutType === 'strip_3' ? 'aspect-[4/3]' : 'aspect-[3/4]')
              )}
            </div>
          )}
        </div>

        {/* Draggable Stickers Layer */}
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
          className="relative z-10 mt-4 pt-2 border-t-[0.5px] flex items-center justify-between text-[9px] opacity-80 font-mono px-1"
        >
          <div className="flex items-center gap-2.5">
            <span className="tracking-tight">{dateFormatted}</span>
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

          <span className="tracking-widest uppercase font-bold text-[8px]">
            {template?.dimensions || '2x6 IN'}
          </span>
        </div>

        {/* Polaroid Handwritten Chin */}
        {isPolaroid && (
          <div className="mt-2.5 text-center text-[10px] italic font-serif opacity-70 tracking-wider">
            special coffee memory ♡
          </div>
        )}
      </div>
    </div>
  );
};
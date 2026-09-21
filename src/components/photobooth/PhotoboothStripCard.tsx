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
import { Check, Scissors } from 'lucide-react';
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

  // Look up template configuration
  const template = PHOTOBOOTH_FRAME_TEMPLATES.find(
    (t) => t.id === frame.templateId || t.layoutType === frame.layoutType
  );

  const isHorizontal = frame.orientation === 'horizontal';

  // Determine layout type
  const layoutType: PhotoboothLayoutType =
    frame.layoutType || template?.layoutType || (frame.shotCount === 2 ? 'wide_duo_2cut' : frame.shotCount === 4 ? (isHorizontal ? 'wide_duo_4cut' : 'strip_4') : isHorizontal ? 'grid_2x2' : 'strip_3');

  const totalSlots = template?.shotCount || Math.max(frame.shotCount || 2, 1);

  // Physical dimensions display (e.g. 10 × 7.6 سم / 4x3 in)
  const widthCm = frame.widthCm || template?.widthCm || (layoutType === 'wide_duo_2cut' ? 10 : isHorizontal ? 15.2 : 5);
  const heightCm = frame.heightCm || template?.heightCm || (layoutType === 'wide_duo_2cut' ? 7.6 : isHorizontal ? 10 : 15.2);
  const dimensionsText = template?.dimensionsCm ? `${template.dimensionsCm} (${template.dimensions})` : `${widthCm} × ${heightCm} سم`;

  const dateObj = new Date(timestamp);
  const dateFormatted = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;

  const modeInfo = PHOTOBOOTH_CARD_MODES.find((m) => m.id === cardMode) || PHOTOBOOTH_CARD_MODES[0];

  const isRetro = layoutType === 'film_35mm' || cardMode === 'retro_film';
  const isPolaroid = layoutType === 'polaroid_square' || layoutType === 'polaroid_wide' || cardMode === 'polaroid_classic' || frame.frameShape === 'polaroid';
  const isKorean = cardMode === 'korean_noir' || layoutType === 'strip_4';

  const effectiveBg = frame.bgColor || template?.defaultBg || modeInfo.defaultBg;
  const effectiveBorder = frame.borderColor || template?.defaultBorder || modeInfo.defaultBorder;
  const effectiveText = frame.textColor || template?.defaultText || modeInfo.defaultText;
  const effectiveAccent = frame.accentColor || template?.defaultAccent || modeInfo.defaultAccent;

  // Sizing & aspect classes for the Base
  let cardContainerClass = 'w-[290px] sm:w-[320px] p-4 py-5';

  if (layoutType === 'wide_duo_2cut') {
    // The requested wide, shorter card (between strip and big card)
    cardContainerClass = isHorizontal
      ? 'w-[370px] sm:w-[420px] p-4 py-4.5' // Horizontal: 2 photos side-by-side
      : 'w-[280px] sm:w-[310px] p-4 py-5';   // Vertical: 2 photos stacked
  } else if (layoutType === 'wide_duo_4cut') {
    cardContainerClass = 'w-[350px] sm:w-[390px] p-4 py-4.5';
  } else if (layoutType === 'kinfolk_minimal') {
    cardContainerClass = 'w-[290px] sm:w-[330px] p-5 py-6';
  } else if (layoutType === 'arabica_monochrome') {
    cardContainerClass = 'w-[290px] sm:w-[320px] p-4 py-5';
  } else if (layoutType === 'grid_2x2') {
    cardContainerClass = 'w-[350px] sm:w-[390px] p-5 py-5';
  } else if (layoutType === 'grid_2x3') {
    cardContainerClass = 'w-[380px] sm:w-[440px] p-5 py-5';
  } else if (layoutType === 'twin_strip') {
    cardContainerClass = 'w-[420px] sm:w-[500px] p-4 py-5';
  } else if (layoutType === 'cinema_horizontal') {
    cardContainerClass = 'w-[380px] sm:w-[450px] p-4 py-5';
  } else if (layoutType === 'polaroid_wide') {
    cardContainerClass = 'w-[350px] sm:w-[390px] p-5 pb-9';
  } else if (layoutType === 'polaroid_square') {
    cardContainerClass = 'w-[300px] sm:w-[330px] p-5 pb-10';
  } else if (isHorizontal) {
    cardContainerClass = 'w-[420px] sm:w-[480px] p-4 py-4.5';
  }

  const outerRadiusClass = isPolaroid ? 'rounded-2xl' : 'rounded-xl';

  // Clean Base Photo Slot Renderer
  const renderPhotoSlot = (slotIdx: number, aspect = 'aspect-[3/4]') => {
    const photo = photos[slotIdx];
    const isLastSlot = slotIdx === totalSlots - 1;
    const visitNumber = slotIdx + 1;
    const slotFormatted = String(visitNumber).padStart(2, '0');

    return (
      <div
        key={slotIdx}
        style={{ borderColor: effectiveBorder }}
        className={`relative overflow-hidden bg-white shadow-2xs ${aspect} rounded-sm border`}
      >
        {/* 3mm Studio White Border */}
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
          ) : (
            /* Clean Base Placeholder */
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/[0.02] text-stone-400 p-2">
              <span className="text-xs font-mono font-bold text-stone-500">#{slotFormatted}</span>
              <span className="text-[8px] font-medium mt-0.5 opacity-70">
                {isLastSlot ? 'الخانة الأخيرة' : 'خانة صورة'}
              </span>
            </div>
          )}
        </div>

        {/* Micro Film Edge Number */}
        <div className="absolute top-1 left-1.5 text-[7px] font-mono font-bold tracking-tighter opacity-60 select-none z-10 pointer-events-none mix-blend-difference text-white">
          #{slotFormatted}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Real-World Dimension Label Tag */}
      <div className="mb-2 flex items-center gap-1.5 px-2.5 py-1 bg-stone-100/90 rounded-full border border-stone-200 text-[10px] font-mono font-bold text-stone-700 shadow-2xs">
        <span>📏 المقاس الفعلي:</span>
        <span className="text-amber-700">{dimensionsText}</span>
        <span className="text-stone-400">•</span>
        <span className="text-stone-600">{isHorizontal ? 'أفقي (Horizontal)' : 'رأسي (Vertical)'}</span>
      </div>

      {/* Printable Base Card */}
      <div
        id="printable-strip"
        ref={cardContainerRef}
        style={{
          backgroundColor: effectiveBg,
          borderColor: effectiveBorder,
          color: effectiveText,
        }}
        className={`relative transition-all duration-300 select-none shadow-[0_6px_24px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] border ${outerRadiusClass} overflow-hidden print:shadow-none print:border-none ${cardContainerClass}`}
      >
        {/* Realistic Paper Texture Overlay */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.14] z-0"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")'
          }}
        />

        {/* 35mm Film Sprocket Holes */}
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

        {/* Card Header */}
        <div className="relative z-10 flex flex-col items-center justify-center mb-2.5 text-center">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="h-6 object-contain mb-0.5 max-w-[120px]"
            />
          ) : (
            <h3
              style={{ color: effectiveText }}
              className="font-black text-xs tracking-wider uppercase"
            >
              {branding.name || 'MEMORIES STUDIO'}
            </h3>
          )}

          <div className="flex items-center gap-1.5">
            <span
              style={{ color: effectiveAccent }}
              className="text-[7px] font-black uppercase tracking-[0.2em] font-mono opacity-80"
            >
              {frame.badgeText || template?.badge || modeInfo.filmBadge}
            </span>
          </div>
        </div>

        {/* Layout Slots */}
        <div className="relative z-10 w-full my-1">
          {/* 1. WIDE DUO (2 Photos Side by Side) - Short & Wide Card */}
          {layoutType === 'wide_duo_2cut' && isHorizontal && (
            <div className="grid grid-cols-2 gap-3.5">
              {renderPhotoSlot(0, 'aspect-[3/4]')}
              {renderPhotoSlot(1, 'aspect-[3/4]')}
            </div>
          )}
          {layoutType === 'wide_duo_2cut' && !isHorizontal && (
            <div className="flex flex-col gap-3">
              {renderPhotoSlot(0, 'aspect-[4/3]')}
              {renderPhotoSlot(1, 'aspect-[4/3]')}
            </div>
          )}

          {/* 2. Compact Duo (4 Photos, 2x2) */}
          {layoutType === 'wide_duo_4cut' && (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[4/3]'))}
            </div>
          )}

          {/* 3. Postcard Grid 2x2 */}
          {layoutType === 'grid_2x2' && (
            <div className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: 4 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[4/3]'))}
            </div>
          )}

          {/* 4. Mini Grid 2x3 */}
          {layoutType === 'grid_2x3' && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[4/3]'))}
            </div>
          )}

          {/* 5. Twin Strip (Dual 2x6) */}
          {layoutType === 'twin_strip' && (
            <div className="grid grid-cols-2 gap-4 relative">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-between pointer-events-none z-20">
                <Scissors className="w-3 h-3 text-stone-400 rotate-90 mb-1" />
                <div className="w-0 flex-1 border-r border-dashed border-stone-300 dark:border-stone-600" />
                <span className="text-[7px] font-mono text-stone-400 mt-1 uppercase tracking-tighter">CUT</span>
              </div>
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[3/4]'))}
              </div>
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[3/4]'))}
              </div>
            </div>
          )}

          {/* 6. Cinema Horizontal 3 Cuts */}
          {layoutType === 'cinema_horizontal' && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[16/9]'))}
              <div className="text-center text-[8px] font-mono text-stone-400 italic mt-0.5 tracking-wider">
                — A warm coffee moment worth remembering —
              </div>
            </div>
          )}

          {/* 7. Polaroid Square / Wide */}
          {layoutType === 'polaroid_square' && (
            <div className="w-full">{renderPhotoSlot(0, 'aspect-square')}</div>
          )}
          {layoutType === 'polaroid_wide' && (
            <div className="w-full">{renderPhotoSlot(0, 'aspect-[4/3]')}</div>
          )}

          {/* 8. Kinfolk Minimal (3 Cuts with generous breathing room & hairline borders) */}
          {layoutType === 'kinfolk_minimal' && (
            <div className="flex flex-col gap-3.5 my-1">
              {Array.from({ length: 3 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[3/4]'))}
            </div>
          )}

          {/* 9. % Arabica Monochrome (3 Cuts with stark geometric lines) */}
          {layoutType === 'arabica_monochrome' && (
            <div className="flex flex-col gap-2.5 my-1">
              {Array.from({ length: 3 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[3/4]'))}
            </div>
          )}

          {/* 10. Horizontal Strip Mode (4 or 3 cuts side-by-side) */}
          {isHorizontal && layoutType !== 'wide_duo_2cut' && layoutType !== 'wide_duo_4cut' && layoutType !== 'grid_2x2' && layoutType !== 'grid_2x3' && layoutType !== 'twin_strip' && layoutType !== 'cinema_horizontal' && layoutType !== 'polaroid_square' && layoutType !== 'polaroid_wide' && (
            <div className={`grid gap-2 ${totalSlots === 2 ? 'grid-cols-2' : totalSlots === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {Array.from({ length: totalSlots }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[3/4]'))}
            </div>
          )}

          {/* 11. Standard Vertical Strips (strip_4, strip_3, strip_2, film_35mm) */}
          {!isHorizontal && layoutType !== 'kinfolk_minimal' && layoutType !== 'arabica_monochrome' && (layoutType === 'strip_4' || layoutType === 'strip_3' || layoutType === 'strip_2' || layoutType === 'film_35mm') && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: totalSlots }).map((_, idx) =>
                renderPhotoSlot(idx, layoutType === 'strip_3' ? 'aspect-[4/3]' : 'aspect-[3/4]')
              )}
            </div>
          )}
        </div>

        {/* Draggable Stickers Overlay */}
        {(stickers.length > 0 || isStickersInteractive) && (
          <DraggableStickerLayer
            stickers={stickers}
            onUpdateStickers={onUpdateStickers || (() => {})}
            isInteractive={isStickersInteractive}
            cardContainerRef={cardContainerRef}
          />
        )}

        {/* Footer */}
        <div
          style={{ borderColor: effectiveBorder }}
          className="relative z-10 mt-3 pt-1.5 border-t-[0.5px] flex items-center justify-between text-[8px] opacity-80 font-mono px-1"
        >
          <div className="flex items-center gap-2">
            <span className="tracking-tight">{dateFormatted}</span>
            {(isKorean || isRetro) && (
              <div className="flex items-center gap-[1px] opacity-60 select-none">
                <span className="w-[1px] h-2 bg-current inline-block" />
                <span className="w-[2px] h-2 bg-current inline-block" />
                <span className="w-[1px] h-2 bg-current inline-block" />
                <span className="w-[3px] h-2 bg-current inline-block" />
                <span className="w-[1px] h-2 bg-current inline-block" />
              </div>
            )}
          </div>

          <span className="tracking-widest uppercase font-bold">
            {widthCm}×{heightCm} CM
          </span>
        </div>

        {isPolaroid && (
          <div className="mt-2 text-center text-[9px] italic font-serif opacity-70 tracking-wider">
            special coffee memory ♡
          </div>
        )}
      </div>
    </div>
  );
};
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
import { Check } from 'lucide-react';
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

  // Business Authoritative Shot Count: frame.shotCount is the single source of truth
  const totalSlots = Math.max(Number(frame.shotCount) || template?.shotCount || 3, 1);

  // Determine layout type
  const layoutType: PhotoboothLayoutType =
    frame.layoutType ||
    (totalSlots === 1
      ? (cardMode === 'polaroid_vintage' || cardMode === 'polaroid_classic' ? 'polaroid_vintage' : 'strip_1')
      : totalSlots === 2
      ? (isHorizontal ? 'wide_duo_2cut' : 'strip_2')
      : totalSlots === 3
      ? (isHorizontal ? 'cinema_horizontal' : 'strip_3')
      : totalSlots === 4
      ? (isHorizontal ? 'wide_duo_4cut' : 'strip_4')
      : totalSlots === 6
      ? (isHorizontal ? 'grid_3x2' : 'grid_2x3')
      : isHorizontal
      ? 'grid_2x2'
      : 'strip_4');

  // Physical dimensions display
  const widthCm = frame.widthCm || template?.widthCm || (layoutType === 'wide_duo_2cut' ? 10 : isHorizontal ? 15.2 : 5);
  const heightCm = frame.heightCm || template?.heightCm || (layoutType === 'wide_duo_2cut' ? 7.6 : isHorizontal ? 10 : 15.2);
  const dimensionsText = template?.dimensionsCm ? `${template.dimensionsCm} (${template.dimensions})` : `${widthCm} × ${heightCm} سم`;

  const dateObj = new Date(timestamp);
  const dateFormatted = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
  const shortYear = String(dateObj.getFullYear()).slice(-2);
  const tokyoStampDate = `'${shortYear} ${String(dateObj.getMonth() + 1).padStart(2, '0')} ${String(dateObj.getDate()).padStart(2, '0')}`;

  const modeInfo = PHOTOBOOTH_CARD_MODES.find((m) => m.id === cardMode) || PHOTOBOOTH_CARD_MODES[0];

  // Visual Theme Identifiers
  const isKoreanNoir = cardMode === 'korean_noir' || template?.cardMode === 'korean_noir';
  const isTokyoPastel = cardMode === 'tokyo_pastel' || template?.cardMode === 'tokyo_pastel';
  const isKinfolkMinimal = cardMode === 'kinfolk_minimal' || template?.cardMode === 'kinfolk_minimal';
  const isFilm35mm = cardMode === 'film_35mm' || cardMode === 'retro_film' || layoutType === 'film_35mm';
  const isArabicaGold = cardMode === 'arabica_luxury_gold' || layoutType === 'arabica_luxury_gold';
  const isPolaroidVintage =
    cardMode === 'polaroid_vintage' ||
    cardMode === 'polaroid_classic' ||
    layoutType === 'polaroid_vintage' ||
    layoutType === 'polaroid_square' ||
    layoutType === 'polaroid_wide' ||
    frame.frameShape === 'polaroid';

  const effectiveBg = frame.bgColor || template?.defaultBg || modeInfo.defaultBg;
  const effectiveBorder = frame.borderColor || template?.defaultBorder || modeInfo.defaultBorder;
  const effectiveText = frame.textColor || template?.defaultText || modeInfo.defaultText;
  const effectiveAccent = frame.accentColor || template?.defaultAccent || modeInfo.defaultAccent;

  // Custom Border Radius
  const borderRadiusValue =
    frame.borderRadius !== undefined
      ? `${frame.borderRadius}px`
      : frame.frameShape === 'sharp'
      ? '0px'
      : frame.frameShape === 'polaroid'
      ? '16px'
      : frame.frameShape === 'pill'
      ? '28px'
      : '18px';

  // Container width & padding sizing
  let cardContainerClass = 'w-[290px] sm:w-[320px] p-4 py-5';

  if (isHorizontal) {
    if (totalSlots === 1) {
      cardContainerClass = 'w-[360px] sm:w-[420px] p-4 py-4.5';
    } else if (totalSlots === 2) {
      cardContainerClass = 'w-[370px] sm:w-[420px] p-4 py-4.5';
    } else if (totalSlots === 3) {
      cardContainerClass = 'w-[390px] sm:w-[450px] p-4 py-4.5';
    } else if (totalSlots === 4) {
      cardContainerClass = 'w-[350px] sm:w-[390px] p-4 py-4.5';
    } else if (totalSlots === 6) {
      cardContainerClass = 'w-[400px] sm:w-[460px] p-4 py-4.5';
    } else {
      cardContainerClass = 'w-[380px] sm:w-[440px] p-4 py-4.5';
    }
  } else {
    // Vertical
    if (totalSlots === 1) {
      cardContainerClass = isPolaroidVintage
        ? 'w-[290px] sm:w-[320px] p-4 pt-5 pb-12'
        : 'w-[290px] sm:w-[320px] p-4 py-5';
    } else if (totalSlots === 6) {
      cardContainerClass = 'w-[340px] sm:w-[380px] p-4 py-5';
    } else {
      cardContainerClass = isKinfolkMinimal
        ? 'w-[290px] sm:w-[320px] p-5 py-6'
        : isPolaroidVintage
        ? 'w-[290px] sm:w-[320px] p-4 pt-4 pb-10'
        : 'w-[280px] sm:w-[320px] p-4 py-5';
    }
  }

  // Clean Authentic Photo Slot Renderer
  const renderPhotoSlot = (slotIdx: number, aspect = 'aspect-[3/4]') => {
    const photo = photos[slotIdx];
    const isLastSlot = slotIdx === totalSlots - 1;
    const visitNumber = slotIdx + 1;
    const slotFormatted = String(visitNumber).padStart(2, '0');

    // Slot border & styling per theme
    let slotBorderClass = 'border';
    let slotInnerClass = 'inset-[3px] rounded-xs';
    let slotNumberBadge = `#${slotFormatted}`;

    if (isKoreanNoir) {
      slotBorderClass = 'border-[1.5px] border-white/80 shadow-xs';
      slotInnerClass = 'inset-[2px] rounded-xs';
      slotNumberBadge = `SEOUL #${slotFormatted}`;
    } else if (isTokyoPastel) {
      slotBorderClass = 'border-[1.5px] border-pink-200/90 shadow-2xs rounded-lg';
      slotInnerClass = 'inset-[3px] rounded-md';
      slotNumberBadge = `✧ ${slotFormatted} ✧`;
    } else if (isKinfolkMinimal) {
      slotBorderClass = 'border-[0.5px] border-stone-300 shadow-none';
      slotInnerClass = 'inset-[4px] rounded-none';
      slotNumberBadge = `FIG. ${slotFormatted}`;
    } else if (isFilm35mm) {
      slotBorderClass = 'border border-amber-900/40 shadow-xs';
      slotInnerClass = 'inset-[2px] rounded-xs';
      slotNumberBadge = `► ${slotFormatted}A`;
    } else if (isArabicaGold) {
      slotBorderClass = 'border-[1.5px] border-[#D4AF37]/90 shadow-xs';
      slotInnerClass = 'inset-[3px] rounded-xs';
      slotNumberBadge = `★ #${slotFormatted}`;
    } else if (isPolaroidVintage) {
      slotBorderClass = 'border border-stone-200 shadow-2xs';
      slotInnerClass = 'inset-[3px] rounded-xs';
      slotNumberBadge = `NO. ${slotFormatted}`;
    }

    return (
      <div
        key={slotIdx}
        style={{ borderColor: isArabicaGold ? '#D4AF37' : effectiveBorder }}
        className={`relative overflow-hidden bg-white shadow-2xs ${aspect} ${slotBorderClass}`}
      >
        {/* White / Neutral Emulsion Margin */}
        <div className={`absolute ${slotInnerClass} bg-stone-100 flex items-center justify-center overflow-hidden`}>
          {photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`Shot ${visitNumber}`}
                className="w-full h-full object-cover filter contrast-[1.03] saturate-[0.98]"
              />
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold rounded-xs flex items-center gap-1 select-none">
                <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
                <span>#{slotFormatted}</span>
              </div>
            </>
          ) : (
            /* Authentic Loyalty Milestone Placeholder */
            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50/90 border border-dashed border-stone-300/80 text-stone-400 p-2 text-center select-none">
              <div className="w-6 h-6 rounded-full bg-stone-200/80 flex items-center justify-center mb-1 text-stone-500 text-xs">
                {isLastSlot ? '🎁' : '🔒'}
              </div>
              <span className="text-[10px] font-mono font-black text-stone-600">#{slotFormatted}</span>
              <span className="text-[8px] font-bold text-stone-500 mt-0.5 leading-tight">
                {isLastSlot ? (freeGiftOffer.title || 'هدية الاكتمال') : `صورة الزيارة #${visitNumber}`}
              </span>
            </div>
          )}
        </div>

        {/* Micro Theme Frame Number Marker */}
        <div className="absolute top-1 left-1.5 text-[7px] font-mono font-bold tracking-tighter select-none z-10 pointer-events-none mix-blend-difference text-white/90">
          {slotNumberBadge}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Real-World Dimension Label Tag */}
      <div className="mb-2.5 flex items-center gap-1.5 px-3 py-1 bg-stone-100/90 rounded-full border border-stone-200 text-[10px] font-mono font-bold text-stone-700 shadow-2xs">
        <span>📏 المقاس:</span>
        <span className="text-amber-700">{dimensionsText}</span>
        <span className="text-stone-400">•</span>
        <span className="text-stone-600">{totalSlots} {totalSlots === 1 ? 'لقطة' : 'صور'}</span>
        <span className="text-stone-400">•</span>
        <span className="text-stone-600">{isHorizontal ? 'أفقي' : 'رأسي'}</span>
      </div>

      {/* Printable Base Card with Dynamic Visual Themes */}
      <div
        id="printable-strip"
        ref={cardContainerRef}
        style={{
          backgroundColor: effectiveBg,
          borderColor: isArabicaGold ? '#D4AF37' : effectiveBorder,
          color: effectiveText,
          borderRadius: borderRadiusValue,
        }}
        className={`relative transition-all duration-300 select-none shadow-[0_6px_24px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.06)] border overflow-hidden print:shadow-none print:border-none ${cardContainerClass}`}
      >
        {/* Paper Texture Overlay */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.14] z-0"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")',
          }}
        />

        {/* 1. Theme Specific Visual Layer: TOKYO PASTEL GRADIENT */}
        {isTokyoPastel && (
          <div
            className="absolute inset-0 pointer-events-none z-0 opacity-40"
            style={{
              background: 'linear-gradient(135deg, #FFF0F5 0%, #F5EEFD 50%, #EFF6FF 100%)',
            }}
          />
        )}

        {/* 2. Theme Specific Visual Layer: ARABICA LUXURY GOLD FOIL BORDER */}
        {isArabicaGold && (
          <div
            className="absolute inset-[3px] rounded-[inherit] pointer-events-none border border-[#D4AF37]/50 z-0"
            style={{
              boxShadow: 'inset 0 0 12px rgba(212, 175, 55, 0.15)',
            }}
          />
        )}

        {/* 3. Theme Specific Visual Layer: 35MM FILM SPROCKET HOLES */}
        {isFilm35mm && !isHorizontal && (
          <>
            <div className="absolute top-0 bottom-0 left-1.5 flex flex-col justify-around py-3 pointer-events-none z-10 opacity-35">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-1.5 h-3 rounded-xs bg-white/70 mb-1 shadow-2xs" />
              ))}
            </div>
            <div className="absolute top-0 bottom-0 right-1.5 flex flex-col justify-around py-3 pointer-events-none z-10 opacity-35">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-1.5 h-3 rounded-xs bg-white/70 mb-1 shadow-2xs" />
              ))}
            </div>
          </>
        )}

        {/* Card Header */}
        <div className={`relative z-10 flex flex-col items-center justify-center text-center ${isKinfolkMinimal ? 'mb-3.5 pt-1' : 'mb-2.5'}`}>
          {/* Business Logo or Authentic Typography Name */}
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="h-6 object-contain mb-0.5 max-w-[120px]"
            />
          ) : (
            <h3
              style={{ color: effectiveText }}
              className={`font-black uppercase ${
                isKinfolkMinimal
                  ? 'font-serif tracking-[0.25em] text-[11px]'
                  : isArabicaGold
                  ? 'font-serif tracking-[0.18em] text-[11px] text-[#F7F2E7]'
                  : isTokyoPastel
                  ? 'tracking-wide text-xs text-[#831843]'
                  : 'tracking-wider text-xs'
              }`}
            >
              {branding.name || (isArabicaGold ? '% ARABICA ROASTERS' : isKinfolkMinimal ? 'KINFOLK GALLERY' : 'MEMORIES STUDIO')}
            </h3>
          )}

          {/* Subtitle / Badge with Theme Identity */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {isArabicaGold && <span className="text-[#D4AF37] text-[9px]">★</span>}
            {isTokyoPastel && <span className="text-[#F43F5E] text-[9px]">🌸</span>}
            <span
              style={{ color: isArabicaGold ? '#C5A059' : effectiveAccent }}
              className={`text-[7.5px] font-black uppercase tracking-[0.2em] font-mono opacity-85 ${
                isKinfolkMinimal ? 'font-serif tracking-[0.28em] italic' : ''
              }`}
            >
              {frame.badgeText || template?.badge || modeInfo.filmBadge}
            </span>
            {isArabicaGold && <span className="text-[#D4AF37] text-[9px]">★</span>}
            {isTokyoPastel && <span className="text-[#F43F5E] text-[9px]">✧</span>}
          </div>

          {/* Korean & Japanese touches */}
          {isKoreanNoir && (
            <span className="text-[6.5px] text-stone-400 font-mono tracking-widest mt-0.5">
              인생네컷 • SEOUL PHOTO
            </span>
          )}
          {isTokyoPastel && (
            <span className="text-[6.5px] text-pink-700/80 font-mono tracking-widest mt-0.5">
              東京 • メモリースタジオ
            </span>
          )}
        </div>

        {/* Layout Slots: Completely Configurable for 1, 2, 3, 4, 6 cuts & arbitrary count */}
        <div className={`relative z-10 w-full my-1 ${isFilm35mm && !isHorizontal ? 'px-3' : ''}`}>
          {isHorizontal ? (
            /* Horizontal Card Layouts */
            totalSlots === 1 ? (
              <div className="w-full">{renderPhotoSlot(0, 'aspect-[16/9]')}</div>
            ) : totalSlots === 2 ? (
              <div className="grid grid-cols-2 gap-3">
                {renderPhotoSlot(0, 'aspect-[3/4]')}
                {renderPhotoSlot(1, 'aspect-[3/4]')}
              </div>
            ) : totalSlots === 3 ? (
              <div className="grid grid-cols-3 gap-2">
                {renderPhotoSlot(0, 'aspect-[3/4]')}
                {renderPhotoSlot(1, 'aspect-[3/4]')}
                {renderPhotoSlot(2, 'aspect-[3/4]')}
              </div>
            ) : totalSlots === 4 ? (
              layoutType === 'wide_duo_4cut' || layoutType === 'grid_2x2' ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[4/3]'))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: 4 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[3/4]'))}
                </div>
              )
            ) : totalSlots === 6 ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[4/3]'))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: totalSlots }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[4/3]'))}
              </div>
            )
          ) : (
            /* Vertical Strip Layouts */
            totalSlots === 1 ? (
              <div className="w-full">{renderPhotoSlot(0, isPolaroidVintage ? 'aspect-square' : 'aspect-[3/4]')}</div>
            ) : totalSlots === 2 ? (
              <div className="flex flex-col gap-2.5">
                {renderPhotoSlot(0, 'aspect-[4/3]')}
                {renderPhotoSlot(1, 'aspect-[4/3]')}
              </div>
            ) : totalSlots === 3 ? (
              <div className="flex flex-col gap-2">
                {renderPhotoSlot(0, 'aspect-[4/3]')}
                {renderPhotoSlot(1, 'aspect-[4/3]')}
                {renderPhotoSlot(2, 'aspect-[4/3]')}
              </div>
            ) : totalSlots === 4 ? (
              layoutType === 'grid_2x2' ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[4/3]'))}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {Array.from({ length: 4 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[3/4]'))}
                </div>
              )
            ) : totalSlots === 6 ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[4/3]'))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: totalSlots }).map((_, idx) => renderPhotoSlot(idx, 'aspect-[4/3]'))}
              </div>
            )
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

        {/* Footer with Distinctive Visual Identities */}
        <div
          style={{ borderColor: isArabicaGold ? '#D4AF37' : effectiveBorder }}
          className="relative z-10 mt-2.5 pt-1.5 border-t-[0.5px] flex items-center justify-between text-[8px] opacity-85 font-mono px-1"
        >
          {/* Theme Specific Date Styles */}
          <div className="flex items-center gap-2">
            {isTokyoPastel ? (
              /* Harajuku Vintage Digital Date Stamp (Glowing Orange LCD style) */
              <span className="text-[#FF6B35] font-mono font-black tracking-widest text-[9px] drop-shadow-2xs">
                {tokyoStampDate}
              </span>
            ) : isKinfolkMinimal ? (
              /* Kinfolk Editorial Issue & Date */
              <span className="font-serif italic tracking-wider text-[8px]">
                Issue No. 04 • {dateFormatted}
              </span>
            ) : (
              <span className="tracking-tight">{dateFormatted}</span>
            )}

            {/* Korean / Retro Barcode */}
            {(isKoreanNoir || isFilm35mm) && (
              <div className="flex items-center gap-[1px] opacity-70 select-none">
                <span className="w-[1px] h-2.5 bg-current inline-block" />
                <span className="w-[2px] h-2.5 bg-current inline-block" />
                <span className="w-[1px] h-2.5 bg-current inline-block" />
                <span className="w-[3px] h-2.5 bg-current inline-block" />
                <span className="w-[1px] h-2.5 bg-current inline-block" />
                <span className="w-[2px] h-2.5 bg-current inline-block" />
              </div>
            )}
          </div>

          <span className="tracking-widest uppercase font-bold text-[7.5px]">
            {widthCm}×{heightCm} CM
          </span>
        </div>

        {/* Polaroid Authentic Wide Chin Text */}
        {isPolaroidVintage && (
          <div className="mt-3 text-center">
            {/* Polaroid Rainbow Accent Strip */}
            <div className="w-8 h-[2.5px] mx-auto mb-1.5 flex rounded-full overflow-hidden opacity-80">
              <span className="flex-1 bg-red-500" />
              <span className="flex-1 bg-orange-400" />
              <span className="flex-1 bg-yellow-400" />
              <span className="flex-1 bg-green-500" />
              <span className="flex-1 bg-blue-500" />
            </div>
            <div className="text-[9.5px] italic font-serif opacity-80 tracking-wider text-stone-700">
              {frame.customText || branding.tagline || 'special coffee memory ♡'}
            </div>
          </div>
        )}

        {/* Arabica Gold Luxury Bottom Note */}
        {isArabicaGold && (
          <div className="mt-1 text-center text-[7px] tracking-[0.25em] text-[#C5A059] font-mono opacity-80 uppercase">
            {frame.customText || 'SPECIALTY COFFEE ARCHIVE • RESERVE EDITION'}
          </div>
        )}

        {/* Kinfolk Editorial Tagline */}
        {isKinfolkMinimal && (
          <div className="mt-1 text-center text-[7px] tracking-[0.2em] font-serif italic text-stone-500">
            {frame.customText || 'A SENSE OF PLACE • CURATED MEMORIES'}
          </div>
        )}
      </div>
    </div>
  );
};
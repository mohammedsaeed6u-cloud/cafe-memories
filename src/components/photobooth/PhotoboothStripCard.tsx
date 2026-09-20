'use client';

import React, { useRef } from 'react';
import {
  PhotoboothFrame,
  BusinessBranding,
  FreeGiftOffer,
  PhotoboothCardMode,
  PlacedSticker,
} from '@/types/photobooth';
import { Gift, Printer, Check } from 'lucide-react';
import { PrintService } from '@/lib/services/print.service';
import { DraggableStickerLayer } from './DraggableStickerLayer';
import { PHOTOBOOTH_CARD_MODES } from '@/lib/constants/photobooth-presets';

interface PhotoboothStripCardProps {
  photos: string[]; // Photos taken so far
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

  const dateFormatted = new Date(timestamp).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const modeInfo =
    PHOTOBOOTH_CARD_MODES.find((m) => m.id === cardMode) ||
    PHOTOBOOTH_CARD_MODES[0];

  // Derive mode-specific styles
  const isKorean = cardMode === 'korean_noir';
  const isRetro = cardMode === 'retro_film';
  const isSakura = cardMode === 'sakura_y2k';
  const isPolaroid = cardMode === 'polaroid_classic';

  const shape = frame.frameShape || (isPolaroid ? 'polaroid' : 'rounded');
  const outerRadiusClass =
    shape === 'sharp'
      ? 'rounded-md'
      : shape === 'polaroid' || isPolaroid
      ? 'rounded-2xl pb-10'
      : 'rounded-3xl';

  const slotRadiusClass =
    shape === 'sharp'
      ? 'rounded-xs'
      : shape === 'polaroid' || isPolaroid
      ? 'rounded-md'
      : 'rounded-2xl';

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
        className={`relative transition-all duration-300 select-none shadow-[0_20px_50px_rgba(0,0,0,0.12)] border-[3px] ${outerRadiusClass} overflow-hidden print:shadow-none print:border-none ${
          isHorizontal ? 'w-full max-w-[480px] p-5' : 'w-[280px] sm:w-[310px] p-4 py-6'
        }`}
      >
        {/* Retro Film Sprocket Holes Edge (Analog 35mm styling) */}
        {isRetro && (
          <>
            <div className="absolute top-0 bottom-0 left-1.5 flex flex-col justify-around py-4 pointer-events-none z-10 opacity-30">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-2 h-3.5 rounded-xs bg-white/40 mb-1" />
              ))}
            </div>
            <div className="absolute top-0 bottom-0 right-1.5 flex flex-col justify-around py-4 pointer-events-none z-10 opacity-30">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-2 h-3.5 rounded-xs bg-white/40 mb-1" />
              ))}
            </div>
          </>
        )}

        {/* Sakura Y2K Sparkle Glow Accents */}
        {isSakura && (
          <div className="absolute inset-0 bg-gradient-to-b from-pink-100/30 via-transparent to-rose-100/30 pointer-events-none z-0" />
        )}

        {/* Subtle Corner Stickers/Emojis (from frame preset) */}
        {frame.cornerEmojis && frame.cornerEmojis.enabled && (
          <>
            {frame.cornerEmojis.topRight && (
              <div
                className="absolute top-4 right-4 text-2xl filter drop-shadow-xs select-none z-20 pointer-events-none"
                title="Corner Sticker"
              >
                {frame.cornerEmojis.topRight}
              </div>
            )}
            {frame.cornerEmojis.bottomLeft && (
              <div
                className="absolute bottom-4 left-4 text-2xl filter drop-shadow-xs select-none z-20 pointer-events-none"
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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="h-9 object-contain mb-1 max-w-[130px]"
            />
          ) : (
            <h3
              style={{ color: effectiveText }}
              className="font-black text-sm sm:text-base tracking-wide"
            >
              {branding.name || 'Memories • موميريز'}
            </h3>
          )}

          {/* Mode-specific Badge */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              style={{ color: effectiveAccent }}
              className="text-[9px] font-black uppercase tracking-widest font-mono"
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
              : 'flex flex-col gap-3 my-1'
          }`}
        >
          {Array.from({ length: totalSlots }).map((_, slotIdx) => {
            const photo = photos[slotIdx];
            const isLastSlot = slotIdx === totalSlots - 1;
            const visitNumber = slotIdx + 1;
            const slotNumberFormatted = String(visitNumber).padStart(2, '0');

            // 1. Slot is already filled with a photo
            if (photo) {
              return (
                <div
                  key={slotIdx}
                  style={{ borderColor: effectiveBorder }}
                  className={`relative overflow-hidden ${slotRadiusClass} border bg-stone-100 shadow-inner group ${
                    isHorizontal ? 'aspect-[4/3]' : 'aspect-square'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={`Visit ${visitNumber}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Authentic Film Slot Number (01, 02, 03...) */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono font-black rounded-sm flex items-center gap-1 shadow-xs select-none">
                    <span className="text-amber-400">#</span>
                    <span>{slotNumberFormatted}</span>
                  </div>

                  {/* Checkmark Tag */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow-xs select-none">
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    <span>الزيارة #{visitNumber}</span>
                  </div>
                </div>
              );
            }

            // 2. The LAST Slot: Shows the Big Reward Milestone!
            if (isLastSlot) {
              return (
                <div
                  key={slotIdx}
                  style={{ borderColor: effectiveAccent }}
                  className={`relative overflow-hidden ${slotRadiusClass} border-2 border-dashed bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 flex flex-col items-center justify-center text-center shadow-inner ${
                    isHorizontal ? 'aspect-[4/3]' : 'aspect-square'
                  }`}
                >
                  {/* Slot number on milestone */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[9px] font-mono font-black rounded-sm">
                    #{slotNumberFormatted}
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-1.5 shadow-xs">
                    <Gift className="w-5 h-5 animate-bounce" />
                  </div>
                  <span
                    style={{ color: effectiveAccent }}
                    className="text-[10px] font-black uppercase tracking-wider"
                  >
                    الخانة الأخيرة • الزيارة #{visitNumber}
                  </span>
                  <p
                    style={{ color: effectiveText }}
                    className="text-xs font-black mt-1 leading-tight px-2"
                  >
                    {freeGiftOffer.title}
                  </p>
                  <span className="text-[9px] opacity-70 font-medium mt-1">
                    اكتمال الكارت والطباعة
                  </span>
                </div>
              );
            }

            // 3. Middle upcoming slots: Clean minimal placeholder
            return (
              <div
                key={slotIdx}
                style={{ borderColor: effectiveBorder }}
                className={`relative overflow-hidden ${slotRadiusClass} border-2 border-dashed bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center opacity-60 text-center ${
                  isHorizontal ? 'aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-stone-300/40 flex items-center justify-center text-xs font-mono font-bold mb-1">
                  {slotNumberFormatted}
                </span>
                <span className="text-[11px] font-bold">
                  الزيارة القادمة
                </span>
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
          className="relative z-10 mt-4 pt-3 border-t flex items-center justify-between text-[10px] opacity-70 font-medium px-2"
        >
          <div className="flex items-center gap-2">
            {/* Authentic Open Source Studio Barcode for Korean Noir & Retro Film */}
            {(isKorean || isRetro) && (
              <div className="flex items-center gap-0.5 font-mono text-[8px] tracking-tighter opacity-80 select-none">
                <span className="w-0.5 h-3 bg-current inline-block" />
                <span className="w-1 h-3 bg-current inline-block" />
                <span className="w-0.5 h-3 bg-current inline-block" />
                <span className="w-1.5 h-3 bg-current inline-block" />
                <span className="w-0.5 h-3 bg-current inline-block" />
                <span className="ml-1 text-[8px] font-mono">4-CUT</span>
              </div>
            )}
            <span>{dateFormatted}</span>
          </div>

          <span className="tracking-widest uppercase text-[9px] font-black font-mono">
            {branding.name ? `${branding.name} • MEMORIES` : 'MEMORIES STUDIO'}
          </span>
        </div>

        {/* Polaroid chin handwritten note line */}
        {isPolaroid && (
          <div className="mt-2 text-center text-[10px] italic font-serif opacity-60 tracking-wider">
            memories together ♡
          </div>
        )}
      </div>

      {/* Print Action Button */}
      {onPrint && (
        <button
          onClick={() => {
            if (onPrint) {
              onPrint();
            } else {
              PrintService.printElement('printable-strip');
            }
          }}
          className="mt-4 px-5 py-2.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition active:scale-[0.98]"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>طباعة كارت الذكريات (2x6)</span>
        </button>
      )}
    </div>
  );
};

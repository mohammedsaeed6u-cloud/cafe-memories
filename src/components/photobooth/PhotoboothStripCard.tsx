'use client';

import React from 'react';
import { PhotoboothFrame, BusinessBranding, FreeGiftOffer } from '@/types/photobooth';
import { Gift, Printer, Sparkles, Check } from 'lucide-react';
import { PrintService } from '@/lib/services/print.service';

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
}) => {
  const isHorizontal = frame.orientation === 'horizontal';
  const totalSlots = Math.max(frame.shotCount || 3, 1);
  const isCardComplete = photos.length >= totalSlots;

  const dateFormatted = new Date(timestamp).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Printable 2x6 Physical Photobooth Card */}
      <div
        id="printable-strip"
        style={{
          backgroundColor: frame.bgColor || '#FAF8F5',
          borderColor: frame.borderColor || '#E7E2D9',
          color: frame.textColor || '#1C1917',
        }}
        className={`relative transition-all duration-300 select-none shadow-[0_16px_48px_rgba(0,0,0,0.08)] border-[3px] rounded-3xl overflow-hidden print:shadow-none print:border-none ${
          isHorizontal ? 'w-full max-w-[480px] p-5' : 'w-[280px] sm:w-[310px] p-4 py-6'
        }`}
      >
        {/* Subtle Corner Stickers/Emojis (Minimal, Aesthetic Photobooth) */}
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

        {/* Top Header: Clean Minimal Branding */}
        <div className="flex flex-col items-center justify-center mb-4 text-center">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="h-10 object-contain mb-1 max-w-[130px]"
            />
          ) : (
            <h3 className="font-extrabold text-sm sm:text-base tracking-wide text-stone-900">
              {branding.name || 'Memories • موميريز'}
            </h3>
          )}

          {frame.badgeText && (
            <span
              style={{ color: frame.accentColor || '#D97706' }}
              className="text-[9px] font-black uppercase tracking-widest mt-0.5"
            >
              {frame.badgeText}
            </span>
          )}
        </div>

        {/* Multi-Visit Slots Grid or Vertical Strip */}
        <div
          className={`w-full ${
            isHorizontal
              ? 'grid grid-cols-2 gap-3 my-2'
              : 'flex flex-col gap-3 my-1'
          }`}
        >
          {Array.from({ length: totalSlots }).map((_, slotIdx) => {
            const photo = photos[slotIdx];
            const isCurrentSlot = slotIdx === photos.length - 1 && photo;
            const isLastSlot = slotIdx === totalSlots - 1;
            const visitNumber = slotIdx + 1;

            // 1. Slot is already filled with a photo
            if (photo) {
              return (
                <div
                  key={slotIdx}
                  style={{ borderColor: frame.borderColor || '#E7E2D9' }}
                  className={`relative overflow-hidden rounded-2xl border bg-stone-100 shadow-inner ${
                    isHorizontal ? 'aspect-[4/3]' : 'aspect-square'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={`Visit ${visitNumber}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 text-white text-[10px] font-bold rounded-md backdrop-blur-xs flex items-center gap-1">
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
                  style={{ borderColor: frame.accentColor || '#D97706' }}
                  className={`relative overflow-hidden rounded-2xl border-2 border-dashed bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 flex flex-col items-center justify-center text-center shadow-inner ${
                    isHorizontal ? 'aspect-[4/3]' : 'aspect-square'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 shadow-xs">
                    <Gift className="w-5 h-5 animate-bounce" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                    الخانة الأخيرة • الزيارة #{visitNumber}
                  </span>
                  <p className="text-xs font-black text-stone-900 mt-1 leading-tight px-2">
                    {freeGiftOffer.title}
                  </p>
                  <span className="text-[9px] text-amber-700/90 font-medium mt-1">
                    اكتمال الكارت والطباعة
                  </span>
                </div>
              );
            }

            // 3. Middle upcoming slots: Clean minimal placeholder
            return (
              <div
                key={slotIdx}
                style={{ borderColor: frame.borderColor || '#E7E2D9' }}
                className={`relative overflow-hidden rounded-2xl border-2 border-dashed bg-stone-50/60 flex flex-col items-center justify-center text-stone-400 text-center ${
                  isHorizontal ? 'aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-stone-200/60 flex items-center justify-center text-xs font-bold text-stone-500 mb-1">
                  {visitNumber}
                </span>
                <span className="text-[11px] font-bold text-stone-500">
                  الزيارة القادمة
                </span>
              </div>
            );
          })}
        </div>

        {/* Clean Minimalist Footer (NO fake barcode, NO ugly clutter!) */}
        <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-400 font-medium px-2">
          <span>{dateFormatted}</span>
          <span className="tracking-widest uppercase text-[9px] font-bold text-stone-500">
            {branding.name ? `${branding.name} • Memories` : 'Memories'}
          </span>
        </div>
      </div>

      {/* Print Action Button */}
      {onPrint && (
        <button
          onClick={() => {
            PrintService.printElement('printable-strip');
            if (onPrint) onPrint();
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

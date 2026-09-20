'use client';

import React from 'react';
import { PhotoboothFrame, BusinessBranding } from '@/types/photobooth';
import { Gift, Printer } from 'lucide-react';

interface PhotoboothStripCardProps {
  photos: string[];
  frame: PhotoboothFrame;
  branding: BusinessBranding;
  giftCode?: string;
  timestamp?: string;
  onPrint?: () => void;
  className?: string;
}

export const PhotoboothStripCard: React.FC<PhotoboothStripCardProps> = ({
  photos,
  frame,
  branding,
  giftCode = 'MEMO-FREE',
  timestamp = new Date().toISOString(),
  onPrint,
  className = '',
}) => {
  const isHorizontal = frame.orientation === 'horizontal';

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
        className={`relative transition-all duration-300 select-none shadow-[0_12px_40px_rgba(0,0,0,0.12)] border-[3px] rounded-2xl overflow-hidden print:shadow-none print:border-none ${
          isHorizontal ? 'w-full max-w-[480px] p-5' : 'w-[280px] sm:w-[310px] p-4 py-5'
        }`}
      >
        {/* Corner Stickers/Emojis (Photobooth Trademark) */}
        {frame.cornerEmojis && frame.cornerEmojis.enabled && (
          <>
            {/* Top-Right Corner Sticker */}
            {frame.cornerEmojis.topRight && (
              <div
                className="absolute top-3 right-3 text-2xl filter drop-shadow-sm select-none z-20 pointer-events-none transform hover:scale-125 transition"
                title="Corner Sticker"
              >
                {frame.cornerEmojis.topRight}
              </div>
            )}
            {/* Bottom-Left Corner Sticker */}
            {frame.cornerEmojis.bottomLeft && (
              <div
                className="absolute bottom-3 left-3 text-2xl filter drop-shadow-sm select-none z-20 pointer-events-none transform hover:scale-125 transition"
                title="Corner Sticker"
              >
                {frame.cornerEmojis.bottomLeft}
              </div>
            )}
          </>
        )}

        {/* Top Header: Business Branding & Badge */}
        <div className="flex flex-col items-center justify-center mb-3.5 text-center">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="h-10 object-contain mb-1 max-w-[140px]"
            />
          ) : (
            <h3 className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-1.5">
              <span>{branding.name || 'Memories • موميريز'}</span>
            </h3>
          )}

          {frame.badgeText && (
            <span
              style={{ color: frame.accentColor || '#D97706' }}
              className="text-[10px] font-black uppercase tracking-widest mt-0.5"
            >
              {frame.badgeText}
            </span>
          )}
        </div>

        {/* Photos Grid or Vertical Strip */}
        <div
          className={`w-full ${
            isHorizontal
              ? 'grid grid-cols-2 gap-2.5 my-2'
              : 'flex flex-col gap-2.5 my-1'
          }`}
        >
          {photos.map((imgSrc, idx) => (
            <div
              key={idx}
              style={{ borderColor: frame.borderColor || '#E7E2D9' }}
              className={`relative overflow-hidden rounded-xl border bg-stone-200 shadow-inner ${
                isHorizontal ? 'aspect-[4/3]' : 'aspect-square'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/40 text-white/90 text-[9px] font-mono rounded backdrop-blur-xs">
                #{idx + 1}
              </span>
            </div>
          ))}
        </div>

        {/* Photobooth Footer Details */}
        <div className="mt-3.5 pt-2 border-t border-dashed border-stone-300/80 flex flex-col items-center text-center">
          {/* Free Gift Indicator */}
          <div
            style={{
              backgroundColor: `${frame.accentColor || '#D97706'}15`,
              color: frame.accentColor || '#B45309',
            }}
            className="w-full py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold mb-2 border border-amber-300/40"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>هدية فورية: {giftCode}</span>
          </div>

          <div className="flex items-center justify-between w-full text-[10px] text-stone-500 font-medium px-1">
            <span>{dateFormatted}</span>
            <span>MEMORIES PHOTOBOOTH</span>
          </div>

          {/* Barcode Graphic */}
          <div className="mt-2 w-44 h-4 flex items-center justify-center gap-[2px] opacity-70">
            {Array.from({ length: 34 }).map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: frame.textColor || '#1C1917',
                  width: i % 3 === 0 ? '3px' : i % 5 === 0 ? '4px' : '1.5px',
                  height: '100%',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Print Action Button */}
      {onPrint && (
        <button
          onClick={onPrint}
          className="mt-4 px-5 py-2.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>طباعة شريط الصور (2x6)</span>
        </button>
      )}
    </div>
  );
};

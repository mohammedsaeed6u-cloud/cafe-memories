'use client';

import React from 'react';
import { PhotoboothStripCard } from '@/components/photobooth/PhotoboothStripCard';
import { PhotoboothFrame, BusinessBranding, FreeGiftOffer, PhotoboothCardMode, PlacedSticker } from '@/types/photobooth';

interface PhotoboothResponsiveCardProps {
  photos: string[];
  frame: PhotoboothFrame;
  branding: BusinessBranding;
  freeGiftOffer?: FreeGiftOffer;
  timestamp?: string;
  cardMode?: PhotoboothCardMode;
  stickers?: PlacedSticker[];
  onUpdateStickers?: (stickers: PlacedSticker[]) => void;
  isStickersInteractive?: boolean;
  onSlotClick?: (slotIdx: number) => void;
  dimensionPreset?: 'strip_2x6' | 'grid_4x6' | 'wide_4x3' | 'polaroid_vintage' | 'cinema_6x2' | 'custom';
  className?: string;
}

export const PhotoboothResponsiveCard: React.FC<PhotoboothResponsiveCardProps> = ({
  photos,
  frame,
  branding,
  freeGiftOffer,
  timestamp,
  cardMode,
  stickers,
  onUpdateStickers,
  isStickersInteractive,
  onSlotClick,
  dimensionPreset = frame.dimensionsPreset || (frame.widthCm === 10 ? 'grid_4x6' : 'strip_2x6'),
  className = '',
}) => {
  const is4x6 = dimensionPreset === 'grid_4x6' || frame.widthCm === 10;
  if (is4x6) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="w-[330px] sm:w-[370px] bg-[#141212] rounded-2xl p-3.5 shadow-2xl border border-white/10">
          <PhotoboothStripCard
            photos={photos}
            frame={{
              ...frame,
              widthCm: 10,
              heightCm: 15.2,
              orientation: 'vertical',
            }}
            branding={branding}
            freeGiftOffer={freeGiftOffer}
            timestamp={timestamp}
            cardMode={cardMode}
            stickers={stickers}
            onUpdateStickers={onUpdateStickers}
            isStickersInteractive={isStickersInteractive}
            onSlotClick={onSlotClick}
          />
        </div>
      </div>
    );
  }
  return (
    <PhotoboothStripCard
      photos={photos}
      frame={{
        ...frame,
        widthCm: 5,
        heightCm: 15.2,
      }}
      branding={branding}
      freeGiftOffer={freeGiftOffer}
      timestamp={timestamp}
      cardMode={cardMode}
      stickers={stickers}
      onUpdateStickers={onUpdateStickers}
      isStickersInteractive={isStickersInteractive}
      onSlotClick={onSlotClick}
      className={className}
    />
  );
};
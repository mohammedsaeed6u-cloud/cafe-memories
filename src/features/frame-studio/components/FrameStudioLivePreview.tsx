'use client';

import React from 'react';
import { Sparkles, RotateCw } from 'lucide-react';
import { PhotoboothStripCard } from '@/components/photobooth/PhotoboothStripCard';
import { StickerControlTray } from '@/components/photobooth/DraggableStickerLayer';
import { PrintService } from '@/lib/services/print.service';
import { UseFrameStudioReturn } from '../types';

interface Props {
  studio: UseFrameStudioReturn;
}

export const FrameStudioLivePreview: React.FC<Props> = ({ studio }) => {
  const {
    activeFrame,
    samplePhotos,
    branding,
    freeGift,
    cardMode,
    previewStickers,
    setPreviewStickers,
    isCardFlipped,
    setIsCardFlipped,
    handlePreviewAddSticker,
    allowCustomerColors,
  } = studio;

  return (
    <div className="lg:col-span-5 sticky top-24">
      <div className="p-6 bg-[#141212] rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4 w-full justify-between">
          <span className="text-xs font-black tracking-widest text-[#A19E9B] uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
            <span>معاينة كارت الولاء المطبوع</span>
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/30 font-bold">
            {activeFrame.shotCount} خانات • {activeFrame.orientation === 'horizontal' ? 'أفقي' : 'رأسي'}
          </span>
        </div>

        {/* Card with Multi-Visit Slots & Last Slot Reward */}
        <PhotoboothStripCard
          photos={samplePhotos}
          frame={activeFrame}
          branding={branding}
          freeGiftOffer={freeGift}
          cardMode={cardMode}
          stickers={previewStickers}
          onUpdateStickers={setPreviewStickers}
          isStickersInteractive={true}
          isFlipped={isCardFlipped}
          onPrint={() => PrintService.printElement('printable-strip')}
        />

        {/* Sticker Test Tray in Studio Preview */}
        <div className="w-full mt-4">
          <StickerControlTray
            onAddSticker={handlePreviewAddSticker}
            stickersCount={previewStickers.length}
            onClearAll={() => setPreviewStickers([])}
          />
        </div>

        {/* Flip Toggle */}
        <button
          type="button"
          onClick={() => setIsCardFlipped((v) => !v)}
          className="mt-4 px-4 py-2 rounded-full text-[11px] font-bold border transition cursor-pointer flex items-center gap-2 bg-[#1C1B1B] hover:bg-[#252424] text-[#A19E9B] hover:text-[#FBF9F5] border-white/10 hover:border-[#d97706]/40"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{isCardFlipped ? 'عودة للوجه الأمامي' : 'اقلب الكارت — شوف الوجه الخلفي'}</span>
        </button>

        <p className="text-[11px] text-[#A19E9B] mt-4 text-center font-medium leading-relaxed">
          يملأ العميل صورة في كل زيارة، وتظهر هديته المحددة في الخانة الأخيرة لتحفيزه على إكمال الكارت.
          {allowCustomerColors
            ? ' (العميل مخوّل لاختيار لونه المفضل من الألوان المحددة)'
            : ' (الكارت مقفول بلون الكافيه الموحد)'}
        </p>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import {
  PhotoboothFrame,
  BusinessBranding,
  FreeGiftOffer,
  PhotoboothCardMode,
  PlacedSticker,
} from '@/types/photobooth';
import { PhotoboothStripCard } from './PhotoboothStripCard';
import { ShareStoryWidget } from './ShareStoryWidget';
import { Gift, Printer, Sparkles, CheckCircle, X, Camera, Lock } from 'lucide-react';
import { PrintService } from '@/lib/services/print.service';

interface PrintGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  stripDataUrl?: string;
  frame: PhotoboothFrame;
  branding: BusinessBranding;
  freeGiftOffer: FreeGiftOffer;
  giftCode: string;
  customerName: string;
  customerRoleLabel?: string;
  visitCount?: number;
  onPrintStrip?: () => void;
  extraShots?: number;
  onTakeNextPhoto?: () => void;
  cardMode?: PhotoboothCardMode;
  stickers?: PlacedSticker[];
}

export const PrintGiftModal: React.FC<PrintGiftModalProps> = ({
  isOpen,
  onClose,
  photos,
  stripDataUrl,
  frame,
  branding,
  freeGiftOffer,
  giftCode,
  customerName,
  customerRoleLabel,
  visitCount,
  onPrintStrip,
  extraShots = 0,
  onTakeNextPhoto,
  cardMode,
  stickers,
}) => {
  if (!isOpen) return null;

  const totalSlots = Math.max(frame.shotCount || 3, 1);
  const isCardComplete = photos.length >= totalSlots;

  const handlePrint = () => {
    if (onPrintStrip) {
      onPrintStrip();
    } else if (stripDataUrl) {
      PrintService.printStripImage(stripDataUrl);
    } else {
      PrintService.printElement('printable-strip');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-stone-900 my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 w-9 h-9 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Congratulation */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mb-2 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-stone-900">
            {isCardComplete
              ? '🎉 مبارك! اكتمل كارت ذكرياتك بالكامل!'
              : `تم توثيق زيارتك بنجاح يا ${customerName}! ✨`}
          </h3>
          {customerRoleLabel && (
            <p className="text-xs font-bold text-amber-800 mt-1">
              {customerRoleLabel}
            </p>
          )}
          <p className="text-xs text-stone-600 mt-1.5">
            {isCardComplete
              ? `استحققت جائزتك: ${freeGiftOffer.title}`
              : `الزيارة #${photos.length} من أصل ${totalSlots} زيارات للحصول على الجائزة الكبرى`}
          </p>
        </div>

        {/* Realistic Strip Preview */}
        <div className="flex justify-center mb-5 overflow-x-auto py-2">
          <PhotoboothStripCard
            photos={photos}
            frame={frame}
            branding={branding}
            freeGiftOffer={freeGiftOffer}
            giftCode={giftCode}
            cardMode={cardMode}
            stickers={stickers}
          />
        </div>

        {/* Story Share & Download HD Actions */}
        <div className="mb-5">
          <ShareStoryWidget
            stripDataUrl={stripDataUrl || photos[0] || ''}
            brandName={branding.name || 'Memories'}
            cafeHandle={branding.name ? `@${branding.name.toLowerCase().replace(/\s+/g, '')}` : '@memories'}
            isCardComplete={isCardComplete}
            completedShots={photos.length}
            totalShots={totalSlots}
          />
        </div>

        {/* Gift Redemption Voucher Card: ONLY SHOWN WHEN CARD IS 100% COMPLETE */}
        {isCardComplete ? (
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 mb-5 text-center shadow-sm animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-2 text-amber-800 font-extrabold text-sm mb-1">
              <Gift className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>{freeGiftOffer.title || 'مشروب مجاني أو هدية فورية'}</span>
            </div>
            <p className="text-xs text-stone-600 mb-3">
              🎉 مبروك! اكتمل كارت ذكرياتك بالكامل. أظهر هذا الكود لفريق المكان لاستلام هديتك مع الصورة المطبوعة:
            </p>

            <div className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-amber-300 shadow-inner">
              <span className="text-[11px] text-stone-500 font-bold">كود كارتك:</span>
              <span className="font-mono text-xl font-black tracking-wider text-amber-900">
                {giftCode || 'GIFT-FREE'}
              </span>
            </div>
          </div>
        ) : (
          /* Incomplete Card: Show Progress toward the Gift Milestone (NO gift code issued yet) */
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 mb-5 text-center space-y-2.5">
            <div className="flex items-center justify-center gap-2 text-stone-800 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>تقدم كارت الذكريات: {photos.length} من أصل {totalSlots} لقطات</span>
            </div>

            {/* Visual Step Dots */}
            <div className="flex items-center justify-center gap-2 py-1">
              {Array.from({ length: totalSlots }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all ${
                    idx < photos.length
                      ? 'bg-amber-600 text-white border-amber-600'
                      : idx === totalSlots - 1
                      ? 'bg-amber-100 text-amber-800 border-amber-400 animate-pulse'
                      : 'bg-stone-200 text-stone-500 border-stone-300'
                  }`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              تم حفظ لقطة اليوم بنجاح في كارتك!
              <br />
              متبقي <span className="font-bold text-amber-800">{totalSlots - photos.length} زيارات</span> لاكتمال الكارت بالكامل واستحقاق هديتك: <span className="font-bold text-stone-900">{freeGiftOffer.title}</span>.
            </p>
          </div>
        )}

        {/* Order Shots Loop Button: If customer has remaining extra shots, let them snap next photo */}
        {extraShots > 0 && onTakeNextPhoto && (
          <button
            onClick={onTakeNextPhoto}
            className="w-full mb-3 py-3.5 px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <Camera className="w-4 h-4" />
            <span>لديك رصيد صور من أوردراتك! التقط الصورة التالية الآن (+{extraShots}) 📸</span>
          </button>
        )}

        {/* Action Buttons: Printing strictly gated until card is complete */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isCardComplete ? (
            <button
              onClick={handlePrint}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة كارت الذكريات المكتمل ({frame.orientation === 'horizontal' ? 'كارت عريض' : '2x6'})</span>
            </button>
          ) : (
            <button
              disabled
              className="flex-1 py-3.5 px-4 rounded-2xl bg-stone-100 text-stone-400 font-bold text-xs border border-stone-200 flex items-center justify-center gap-2 cursor-not-allowed"
              title="الطباعة مقفولة حتى إكمال الكارت"
            >
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>الطباعة مقفولة (متبقي {totalSlots - photos.length} صور لاكتمال الكارت)</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3.5 px-6 rounded-2xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-sm transition"
          >
            تم ورجوع
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-medium">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>تم تسجيل زيارتك في سجل أصدقاء المكان</span>
        </div>
      </div>
    </div>
  );
};

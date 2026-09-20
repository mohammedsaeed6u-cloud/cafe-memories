'use client';

import React from 'react';
import { PhotoboothFrame, BusinessBranding, FreeGiftOffer } from '@/types/photobooth';
import { PhotoboothStripCard } from './PhotoboothStripCard';
import { ShareStoryWidget } from './ShareStoryWidget';
import { Gift, Printer, Sparkles, CheckCircle, X, Camera } from 'lucide-react';
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
  visitCount = 1,
  onPrintStrip,
  extraShots = 0,
  onTakeNextPhoto,
}) => {
  if (!isOpen) return null;

  const totalSlots = Math.max(frame.shotCount || 3, 1);
  const isCardComplete = photos.length >= totalSlots;

  const handlePrint = () => {
    PrintService.printElement('printable-strip');
    if (onPrintStrip) {
      onPrintStrip();
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
          />
        </div>

        {/* Story Share & Download HD Actions */}
        <div className="mb-5">
          <ShareStoryWidget
            stripDataUrl={stripDataUrl || photos[0]}
            brandName={branding.name}
            cafeHandle={`@${branding.name?.toLowerCase().replace(/\s+/g, '') || 'memories'}`}
          />
        </div>

        {/* Gift Redemption Voucher Card */}
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300/80 mb-5 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 text-amber-800 font-extrabold text-sm mb-1">
            <Gift className="w-4 h-4 text-amber-600" />
            <span>{freeGiftOffer.title || 'هدية فورية مجانية'}</span>
          </div>
          <p className="text-xs text-stone-600 mb-3">
            {isCardComplete
              ? 'أظهر هذا الكود للباريستا لاستلام هديتك فوراً مع شريط الصور المطبوع'
              : freeGiftOffer.subtitle || 'تُمنح هديتك فور اكتمال خانات كارت الذكريات'}
          </p>

          <div className="inline-flex items-center gap-2 bg-white px-5 py-2 rounded-xl border border-amber-300 shadow-inner">
            <span className="text-[11px] text-stone-500 font-bold">كود كارتك:</span>
            <span className="font-mono text-xl font-black tracking-wider text-stone-900">
              {giftCode}
            </span>
          </div>
        </div>

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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طباعة كارت الذكريات (2x6)</span>
          </button>

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

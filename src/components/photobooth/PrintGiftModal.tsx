'use client';

import React from 'react';
import { PhotoboothFrame, BusinessBranding, FreeGiftOffer } from '@/types/photobooth';
import { PhotoboothStripCard } from './PhotoboothStripCard';
import { Gift, Printer, Download, Sparkles, CheckCircle, X } from 'lucide-react';

interface PrintGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  frame: PhotoboothFrame;
  branding: BusinessBranding;
  freeGiftOffer: FreeGiftOffer;
  giftCode: string;
  customerName: string;
  customerRoleLabel?: string;
  onPrintStrip?: () => void;
}

export const PrintGiftModal: React.FC<PrintGiftModalProps> = ({
  isOpen,
  onClose,
  photos,
  frame,
  branding,
  freeGiftOffer,
  giftCode,
  customerName,
  customerRoleLabel,
  onPrintStrip,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    if (onPrintStrip) {
      onPrintStrip();
    } else {
      window.print();
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-700 mb-3 shadow-inner">
            <Sparkles className="w-7 h-7 animate-bounce" />
          </div>
          <h3 className="text-2xl font-black text-stone-900">
            تم توثيق لحظتك بنجاح يا {customerName}! 🎉
          </h3>
          {customerRoleLabel && (
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-200/80 mt-1">
              {customerRoleLabel}
            </p>
          )}
          <p className="text-xs text-stone-600 mt-2">
            تم حفظ شريط ذكرياتك، ولديك هدية ترحيبية فورية مقدمة من {branding.name}.
          </p>
        </div>

        {/* Realistic Strip Preview */}
        <div className="flex justify-center mb-6 overflow-x-auto py-2">
          <PhotoboothStripCard
            photos={photos}
            frame={frame}
            branding={branding}
            giftCode={giftCode}
          />
        </div>

        {/* Gift Redemption Voucher Card */}
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300/80 mb-6 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 text-amber-800 font-extrabold text-sm mb-1">
            <Gift className="w-4 h-4 text-amber-600" />
            <span>{freeGiftOffer.title || 'هدية فورية مجانية'}</span>
          </div>
          <p className="text-xs text-stone-600 mb-3">
            {freeGiftOffer.subtitle || 'أظهر هذا الكود للباريستا لاستلام هديتك فوراً مع الشريط المطبوع'}
          </p>

          <div className="inline-flex items-center gap-2 bg-white px-5 py-2 rounded-xl border border-amber-300 shadow-inner">
            <span className="text-[11px] text-stone-500 font-bold">كود الاستلام:</span>
            <span className="font-mono text-xl font-black tracking-wider text-stone-900">
              {giftCode}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طباعة الشريط (2x6) الآن</span>
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
          <span>تم تسجيل زيارتك في سجل أعضاء المكان</span>
        </div>
      </div>
    </div>
  );
};

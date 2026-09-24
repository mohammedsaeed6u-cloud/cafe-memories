'use client';

import React, { useState } from 'react';
import { CustomerLoyaltyData } from './loyalty-purse.service';
import { ShieldCheck, Sparkles, Award, Gift, Check, Download } from 'lucide-react';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';
import { AddToWalletButtons } from '@/components/wallet/AddToWalletButtons';
import { CardCanvasExportService } from '@/lib/services/card-canvas-export.service';
import { ImageSaveService } from '@/lib/services/image-save.service';
import { IosSaveImageModal } from '@/components/photobooth/IosSaveImageModal';

interface CustomerLoyaltyCardProps {
  loyaltyData: CustomerLoyaltyData;
  giftTitle?: string;
  brandName?: string;
  customerName?: string;
  instagramHandle?: string;
  onOpenStaffStamp: () => void;
  className?: string;
}

export const CustomerLoyaltyCard: React.FC<CustomerLoyaltyCardProps> = ({
  loyaltyData,
  giftTitle = 'هدية ترحيبية خاصة',
  brandName = 'Memories Studio',
  customerName = 'ضيف مميز',
  instagramHandle = '@memories',
  onOpenStaffStamp,
  className = '',
}) => {
  const { stampedCount, maxSlots, customerPhone, cafeSlug } = loyaltyData;
  const [isExporting, setIsExporting] = useState(false);
  const [iosModalImage, setIosModalImage] = useState<string | null>(null);

  const cleanPhone = encodeURIComponent(customerPhone || 'guest');
  const stampQrValue = `https://memories-c9w.pages.dev/c/${cafeSlug || 'memories'}?action=stamp&customer=${cleanPhone}`;

  const handleSaveCardToDevice = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await CardCanvasExportService.exportCardToDataUrl({
        customerName: customerName || 'ضيف مميز',
        cafeName: brandName,
        stampsCount: stampedCount,
        totalSlots: maxSlots,
        theme: 'botanical_matcha',
      });
      const res = await ImageSaveService.saveImage({
        dataUrl,
        filename: `loyalty-card-${(customerName || brandName).replace(/\s+/g, '-')}.png`,
        title: `كارت ولاء ${brandName}`,
        text: `كارت ذكرياتي في ${brandName} • ${stampedCount}/${maxSlots} ختم • Memories`,
      });
      if (res.method === 'fallback') {
        setIosModalImage(res.blobUrl || dataUrl);
      }
    } catch (err) {
      console.warn('Failed to save card to device:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto p-4 sm:p-5 bg-white border border-stone-200/90 rounded-2xl shadow-xs text-stone-900 transition-all ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-center sm:text-right space-y-2.5 w-full">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm sm:text-base font-black text-stone-900">
              كارت الولاء والأختام الرقمي
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 font-bold">
              {stampedCount} / {maxSlots} أختام
            </span>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            امسح الرمز عند كل زيارة ليختم لك فريق الخدمة وتفتح لقطاتك وتستلم <span className="font-bold text-stone-800">{giftTitle}</span>.
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
            {Array.from({ length: maxSlots }).map((_, idx) => {
              const isStamped = idx < stampedCount;
              const isGiftSlot = idx === maxSlots - 1;
              return (
                <div
                  key={idx}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                    isStamped
                      ? 'bg-stone-900 border-stone-900 text-amber-400 shadow-xs scale-105'
                      : isGiftSlot
                      ? 'bg-amber-50/80 border-dashed border-amber-300 text-amber-700'
                      : 'bg-stone-50 border-dashed border-stone-200 text-stone-400'
                  }`}
                >
                  {isStamped ? (
                    <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                  ) : isGiftSlot ? (
                    <Gift className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <span className="font-mono text-[10px] text-stone-400">{idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={onOpenStaffStamp}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold border border-stone-300/80 transition cursor-pointer shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />
              <span>ختم مباشر للموظف (PIN)</span>
            </button>
            <button
              type="button"
              onClick={handleSaveCardToDevice}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300/80 transition cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              <span>{isExporting ? 'جاري تجهيز الكارت...' : 'حفظ الكارت في ألبوم الصور'}</span>
            </button>
          </div>
          <div className="pt-1.5 border-t border-stone-100">
            <AddToWalletButtons
              passData={{
                cafeSlug: cafeSlug || 'memories',
                cafeName: brandName || 'Memories Studio',
                customerPhone: customerPhone || 'guest',
                stampedCount,
                maxSlots,
                giftTitle,
                instagramHandle: instagramHandle || '@memories',
              }}
            />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-stone-50 rounded-2xl border border-stone-200/90 shadow-2xs shrink-0 text-center">
          <div className="w-24 h-24 bg-white p-1 rounded-xl border border-stone-200 flex items-center justify-center shadow-xs overflow-hidden">
            <RealOutsourcedQr
              value={stampQrValue}
              size={84}
              alt="QR ختم الولاء الحقيقي"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[9px] font-mono text-stone-500 font-bold mt-1.5">
            QR الختم الفوري
          </span>
        </div>
      </div>

      {/* iOS Safari Save Modal */}
      <IosSaveImageModal
        imageUrl={iosModalImage}
        isOpen={Boolean(iosModalImage)}
        onClose={() => setIosModalImage(null)}
        title="كارت الولاء والمحفظة"
      />
    </div>
  );
};
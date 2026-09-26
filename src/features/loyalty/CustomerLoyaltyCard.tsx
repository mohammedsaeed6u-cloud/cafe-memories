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
    <div className={`w-full max-w-xl mx-auto p-5 sm:p-6 bg-[#141212] border border-white/10 rounded-2xl shadow-2xl text-[#e6e1e1] backdrop-blur-xl transition-all relative overflow-hidden ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#55100D]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
        <div className="flex-1 text-center sm:text-right space-y-3 w-full">
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <Award className="w-4 h-4 text-[#DD0200]" />
            <h3 className="text-base font-semibold text-white tracking-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              كارت الولاء والأختام الرقمي
            </h3>
            {/* VIP / Loyalty Tier Badge: Dark Cherry Backing (#55100D) with high-contrast alabaster typography and faint red hairline border */}
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-[#55100D] border border-[#DD0200]/40 text-[#FBF9F5] font-bold shadow-xs">
              {stampedCount} / {maxSlots} أختام
            </span>
          </div>

          {/* Tier Horizon Bar: minimal hairline progress tracker transitioning from #55100D to #DD0200 */}
          <div className="w-full bg-[#1C1B1B] h-1.5 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#55100D] to-[#DD0200] transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(221,2,0,0.5)]"
              style={{ width: `${Math.min(100, (stampedCount / maxSlots) * 100)}%` }}
            />
          </div>

          <p className="text-xs text-[#A19E9B] leading-relaxed">
            امسح الرمز عند كل زيارة ليختم لك فريق الخدمة وتفتح لقطاتك وتستلم <span className="font-bold text-[#FBF9F5]">{giftTitle}</span>.
          </p>

          {/* Stamp Rings */}
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
            {Array.from({ length: maxSlots }).map((_, idx) => {
              const isStamped = idx < stampedCount;
              const isGiftSlot = idx === maxSlots - 1;
              return (
                <div
                  key={idx}
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${
                    isStamped
                      ? 'bg-[#DD0200] border-[#DD0200] text-white shadow-md shadow-red-950/60 scale-105'
                      : isGiftSlot
                      ? 'bg-[#55100D]/50 border-dashed border-[#DD0200]/60 text-[#FBF9F5]'
                      : 'bg-[#1C1B1B] border-white/10 text-stone-500'
                  }`}
                >
                  {isStamped ? (
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                  ) : isGiftSlot ? (
                    <Gift className="w-3.5 h-3.5 text-[#FBF9F5]" />
                  ) : (
                    <span className="font-mono text-[10px] text-stone-500">{idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={onOpenStaffStamp}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-[#FBF9F5] text-[11px] font-bold border border-white/10 hover:border-[#DD0200]/30 transition cursor-pointer backdrop-blur-md"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#DD0200]" />
              <span>ختم مباشر للموظف (PIN)</span>
            </button>
            <button
              type="button"
              onClick={handleSaveCardToDevice}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] text-[11px] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-6px_rgba(221,2,0,0.4)] transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#FBF9F5]" />
              <span>{isExporting ? 'جاري تجهيز الكارت...' : 'حفظ الكارت في ألبوم الصور'}</span>
            </button>
          </div>

          <div className="pt-1.5 border-t border-white/10">
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

        {/* QR Section with Dark Framing */}
        <div className="flex flex-col items-center justify-center p-3.5 bg-[#1C1B1B] rounded-xl border border-white/10 shadow-lg shrink-0 text-center">
          <div className="w-24 h-24 bg-white p-1 rounded-lg border border-white/20 flex items-center justify-center shadow-xs overflow-hidden">
            <RealOutsourcedQr
              value={stampQrValue}
              size={84}
              alt="QR ختم الولاء الحقيقي"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[9px] font-mono text-[#A19E9B] font-bold mt-2 uppercase tracking-wider">
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
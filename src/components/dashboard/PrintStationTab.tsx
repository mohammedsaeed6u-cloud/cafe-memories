'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CustomerVisitRecord } from './CustomerCRMTab';
import { Printer, Gift, CheckCircle2, Clock, Sparkles, Sliders, Scissors, Bell, BellOff } from 'lucide-react';
import { PrintService, PrintFormat, getPrintDimensions } from '@/lib/services/print.service';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';

interface PrintStationTabProps {
  queue: CustomerVisitRecord[];
  onPrintItem?: (item: CustomerVisitRecord) => void;
  brandName?: string;
}

export const PrintStationTab: React.FC<PrintStationTabProps> = ({
  queue,
  onPrintItem,
  brandName = 'Memories',
}) => {
  const [activeFormat, setActiveFormat] = useState<PrintFormat>('standard-2x6');
  const [handedOverGifts, setHandedOverGifts] = useState<Record<string, boolean>>({});
  const [soundAlertEnabled, setSoundAlertEnabled] = useState(true);
  const prevQueueLengthRef = useRef(queue.length);

  // Trigger barista counter bell alert whenever new items enter the queue
  useEffect(() => {
    if (soundAlertEnabled && queue.length > prevQueueLengthRef.current) {
      SoundEffectsService.playBaristaDing();
    }
    prevQueueLengthRef.current = queue.length;
  }, [queue.length, soundAlertEnabled]);

  const activeDims = getPrintDimensions(activeFormat);

  const toggleGiftHandover = (id: string) => {
    setHandedOverGifts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePrint = (item: CustomerVisitRecord, format: PrintFormat = activeFormat) => {
    if (onPrintItem) {
      onPrintItem(item);
    } else if (item.photoStripUrl) {
      PrintService.printStripImage(item.photoStripUrl, {
        format,
        highContrast: format.startsWith('thermal'),
        showCutLine: true,
      });
    } else {
      PrintService.printElement('printable-strip', { format });
    }
  };

  const completedPrintsCount = Object.values(handedOverGifts).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[#141212] rounded-2xl border border-white/10 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1C1B1B] border border-white/10 text-[#DD0200] flex items-center justify-center">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#A19E9B] font-bold">أشرطة بانتظار الطباعة</p>
            <p className="text-2xl font-bold text-[#FBF9F5] font-mono">{queue.length}</p>
          </div>
        </div>

        <div className="p-5 bg-[#141212] rounded-2xl border border-white/10 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#55100D] border border-[#DD0200]/40 text-[#DD0200] flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#A19E9B] font-bold">هدايا تم تسليمها اليوم</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono">{completedPrintsCount}</p>
          </div>
        </div>

        <div className="p-5 bg-[#141212] rounded-2xl border border-white/10 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1C1B1B] border border-white/10 text-[#FBF9F5] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#DD0200]" />
          </div>
          <div>
            <p className="text-xs text-[#A19E9B] font-bold">البروفايل النشط حالياً</p>
            <p className="text-sm font-bold text-[#FBF9F5] font-serif">{activeDims.nameAr}</p>
          </div>
        </div>
      </div>

      {/* Format Selector & Precision Calibration Panel */}
      <div className="bg-[#141212] p-6 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
              <Sliders className="w-4 h-4 text-[#DD0200]" />
              <span>محرك المعايرة والطباعة عالي الدقة (Hardware Print Calibration)</span>
            </h4>
            <p className="text-xs text-[#A19E9B] mt-0.5">
              معاير فيزيائياً بأبعاد دقيقة 100% مع إلغاء هوامش المتصفح ورؤوس الصفحات تلقائياً
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'standard-2x6', label: 'شريط 2×6 بوصة (قياسي)', icon: 'film' },
              { id: 'dual-4x6', label: 'مزدوج 4×6 مع خط قص', icon: 'scissors' },
              { id: 'thermal-80mm', label: 'حراري 80 مم (ملصقات)', icon: 'receipt' },
              { id: 'thermal-58mm', label: 'حراري 58 مم (مدمج)', icon: 'tag' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setActiveFormat(fmt.id as PrintFormat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeFormat === fmt.id
                    ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] font-bold'
                    : 'bg-[#1C1B1B] hover:bg-[#211F1F] text-[#A19E9B] hover:text-[#FBF9F5] border border-white/10'
                }`}
              >
                <span>{fmt.icon}</span>
                <span>{fmt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Calibration Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B0A0A] p-4 rounded-xl border border-white/10 text-xs">
          <div>
            <span className="text-[#A19E9B] block font-medium">الأبعاد بالميليمتر:</span>
            <span className="font-bold text-[#FBF9F5] font-mono">
              {activeDims.widthMm} × {activeDims.heightMm} مم
            </span>
          </div>
          <div>
            <span className="text-[#A19E9B] block font-medium">الأبعاد بالبوصة:</span>
            <span className="font-bold text-[#FBF9F5] font-mono">
              {activeDims.widthInches.toFixed(1)} × {activeDims.heightInches.toFixed(1)} in
            </span>
          </div>
          <div>
            <span className="text-[#A19E9B] block font-medium">الدقة (300 DPI):</span>
            <span className="font-bold text-[#FBF9F5] font-mono">
              {activeDims.widthPx300Dpi} × {activeDims.heightPx300Dpi} px
            </span>
          </div>
          <div>
            <span className="text-[#A19E9B] block font-medium">معايرة الهوامش:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <span>0mm (بدون هوامش)</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Print Queue List */}
      <div className="bg-[#141212] p-6 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <Clock className="w-4 h-4 text-[#DD0200]" />
            <span>طابور الأشرطة الجاهزة للطباعة والتسليم لطاقم الكاونتر</span>
          </h3>

          <button
            onClick={() => {
              const next = !soundAlertEnabled;
              setSoundAlertEnabled(next);
              if (next) {
                SoundEffectsService.playBaristaDing();
              }
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              soundAlertEnabled
                ? 'bg-[#55100D]/70 text-[#FBF9F5] border-[#DD0200]/40 shadow-xs'
                : 'bg-[#1C1B1B] text-[#A19E9B] border-white/10 hover:bg-[#211F1F]'
            }`}
            title="تفعيل أو كتم جرس تنبيه الطلبات الجديدة لطاقم العمل"
          >
            {soundAlertEnabled ? (
              <Bell className="w-3.5 h-3.5 text-[#DD0200] animate-pulse" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-[#A19E9B]/60" />
            )}
            <span>تنبيه صوتي للطلبات</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                soundAlertEnabled ? 'bg-[#DD0200] text-[#FBF9F5]' : 'bg-[#141212] text-[#A19E9B]'
              }`}
            >
              {soundAlertEnabled ? 'مفعل' : 'مكتوم'}
            </span>
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="py-16 text-center text-[#A19E9B]/40">
            <Printer className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="font-bold text-[#FBF9F5]">لا توجد طلبات طباعة جديدة في الطابور حالياً</p>
            <p className="text-xs text-[#A19E9B] mt-1">
              ستظهر هنا أشرطة الصور فور اكتمال تصويرها من قبل العملاء
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queue.map((item) => {
              const isHandedOver = !!handedOverGifts[item.id];
              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-xl border transition flex items-center justify-between gap-4 ${
                    isHandedOver
                      ? 'bg-[#141212] border-white/5 opacity-60'
                      : 'bg-[#1C1B1B] border-white/10 shadow-lg hover:border-[#DD0200]/40'
                  }`}
                >
                  {/* Strip Thumbnail */}
                  <div className="w-16 h-24 rounded-lg overflow-hidden border border-white/10 bg-[#0B0A0A] flex-shrink-0 shadow-inner">
                    {item.photoStripUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.photoStripUrl}
                        alt="Strip"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#A19E9B]/40 text-[10px] font-mono">
                        2x6
                      </div>
                    )}
                  </div>

                  {/* Customer & Gift Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#FBF9F5] text-sm truncate font-serif">
                        {item.name}
                      </h4>
                      {item.totalVisits && item.totalVisits >= 5 ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#55100D]/80 border border-[#DD0200]/50 text-[#FBF9F5] font-bold text-[9px] shadow-xs flex items-center gap-1 shrink-0 font-mono">
                          <span>VIP</span>
                          <span>VIP ذهبي (#{item.totalVisits})</span>
                        </span>
                      ) : item.totalVisits && item.totalVisits >= 3 ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#1C1B1B] text-[#FBF9F5] font-bold text-[9px] border border-white/10 flex items-center gap-1 shrink-0 font-mono">
                          <span>⭐</span>
                          <span>مميز (#{item.totalVisits})</span>
                        </span>
                      ) : null}
                    </div>

                    <p className="text-[11px] text-[#A19E9B] font-mono mt-0.5">
                      {item.phone}
                    </p>

                    {/* Gift Code */}
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0B0A0A] border border-white/10 text-[#DD0200] text-xs font-mono font-bold">
                      <Gift className="w-3.5 h-3.5 text-[#DD0200]" />
                      <span>{item.giftCode || '#GIFT-FREE'}</span>
                    </div>
                  </div>

                  {/* Actions: Print & Handover */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePrint(item, activeFormat)}
                        className="px-3.5 py-2 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold flex items-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition cursor-pointer"
                        title={`طباعة بنمط: ${activeDims.nameAr}`}
                      >
                        <Printer className="w-3.5 h-3.5 text-[#FBF9F5]" />
                        <span>
                          {activeFormat === 'dual-4x6'
                            ? 'طباعة 4x6 مزدوج'
                            : activeFormat.startsWith('thermal')
                            ? `حراري ${activeDims.rollWidthMm}مم`
                            : 'طباعة 2x6'}
                        </span>
                      </button>

                      {activeFormat !== 'dual-4x6' && (
                        <button
                          onClick={() => handlePrint(item, 'dual-4x6')}
                          className="p-2 rounded-lg bg-[#141212] hover:bg-[#211F1F] text-[#FBF9F5] border border-white/10 text-xs font-bold transition cursor-pointer"
                          title="طباعة سريعة كشريطين مزدوجين 4×6 مع خط قص"
                        >
                          <Scissors className="w-3.5 h-3.5 text-[#A19E9B]" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => toggleGiftHandover(item.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                        isHandedOver
                          ? 'bg-[#141212] text-emerald-400 border-emerald-500/40'
                          : 'bg-[#0B0A0A] text-[#A19E9B] hover:text-[#FBF9F5] border-white/10'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isHandedOver ? 'تم التسليم' : 'تسليم الهدية'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { ShieldCheck, Info, Check } from 'lucide-react';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';

export interface AppleWalletPassFaceProps {
  brandName: string;
  cafeLogoUrl?: string;
  stampedCount: number;
  maxSlots: number;
  activeStamp: string;
  giftTitle: string;
  customerName: string;
  customerTitle: string;
  qrTargetUrl: string;
  onFlip: () => void;
  accentColor?: string;
}

export const AppleWalletPassFace: React.FC<AppleWalletPassFaceProps> = ({
  brandName,
  cafeLogoUrl,
  stampedCount,
  maxSlots,
  activeStamp,
  giftTitle,
  customerName,
  customerTitle,
  qrTargetUrl,
  onFlip,
  accentColor,
}) => {
  const safeMaxSlots = Math.max(maxSlots || 5, 1);
  const safeStampedCount = Math.min(Math.max(stampedCount || 0, 0), safeMaxSlots);
  const remainingCount = Math.max(safeMaxSlots - safeStampedCount, 0);
  const isComplete = safeStampedCount >= safeMaxSlots;
  const progressPercent = Math.min(100, Math.round((safeStampedCount / safeMaxSlots) * 100));

  // Determine grid columns: 4 or 5 columns for single row if <= 5 slots, or 4/5 cols for 2 rows if > 5
  const gridCols = safeMaxSlots <= 5 ? safeMaxSlots : safeMaxSlots <= 8 ? 4 : 5;

  return (
    <div className="relative z-10 p-5 sm:p-6 flex flex-col">
      {/* 1. TOP HEADER ROW: Brand Name (Left) & Header Field "الأختام" (Right) */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {cafeLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cafeLogoUrl}
              alt={brandName}
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-white/20 shrink-0 shadow-xs"
            />
          )}
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate font-sans">
            {brandName}
          </h3>
        </div>

        <div className="text-left shrink-0">
          <span className="text-[11px] font-medium text-white/60 block leading-tight">
            الأختام
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
            {safeStampedCount}/{safeMaxSlots} {activeStamp}
          </span>
        </div>
      </div>

      {/* 2. PRIMARY FIELD: "المكافأة القادمة" with Large Bold Reward Text */}
      <div className="mb-4 text-right">
        <span className="text-xs font-medium text-white/60 block mb-0.5">
          المكافأة القادمة
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
          {giftTitle}
        </h2>
      </div>

      {/* 3. SECONDARY FIELDS ROW: "العميل" (Left) & "الفئة" (Right) */}
      <div className="flex items-start justify-between gap-4 pt-0.5 mb-4 text-right">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-white/60 block mb-0.5">
            العميل
          </span>
          <span className="text-sm font-bold text-white truncate block">
            {customerName}
          </span>
        </div>

        <div className="min-w-0 text-left shrink-0">
          <span className="text-[11px] font-medium text-white/60 block mb-0.5">
            الفئة
          </span>
          <span className="text-sm font-bold text-white block">
            {customerTitle}
          </span>
        </div>
      </div>

      {/* 4. SIGNATURE INTERACTIVE STAMP SLOTS GRID (خانات الستامبس الفاخرة) */}
      <div className="w-full mb-5 bg-black/40 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15 shadow-inner">
        {/* Status Header */}
        <div className="flex items-center justify-between text-xs mb-3 px-1">
          <span className="font-bold text-white flex items-center gap-1.5">
            <span>سجل أختامك التراكمية</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {safeStampedCount} من {safeMaxSlots}
            </span>
          </span>
          <span className="text-[11px] font-bold text-amber-300">
            {isComplete ? (
              <span className="animate-pulse">🎉 هديتك جاهزة للاستلام!</span>
            ) : (
              <span>متبقي {remainingCount} أختام للهدية 🎁</span>
            )}
          </span>
        </div>

        {/* Dynamic Slots Grid */}
        <div
          className="grid gap-2 select-none"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: safeMaxSlots }).map((_, index) => {
            const isStamped = index < safeStampedCount;
            const isRewardSlot = index === safeMaxSlots - 1;

            return (
              <div
                key={index}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 ${
                  isStamped
                    ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-stone-950 font-black shadow-[0_4px_14px_rgba(245,158,11,0.45),inset_0_1px_1px_rgba(255,255,255,0.6)] border border-amber-200 scale-100'
                    : isRewardSlot
                    ? 'bg-amber-500/10 border-2 border-dashed border-amber-400/70 text-amber-300'
                    : 'bg-white/5 border border-white/15 text-white/40'
                }`}
              >
                {isStamped ? (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xl sm:text-2xl transform hover:scale-110 transition-transform leading-none">
                      {activeStamp}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-tighter opacity-90 leading-none mt-1">
                      ختم #{index + 1}
                    </span>
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-stone-950/80 text-amber-300 flex items-center justify-center text-[8px] font-black">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  </div>
                ) : isRewardSlot ? (
                  <div className="flex flex-col items-center justify-center text-center p-0.5">
                    <span className="text-lg sm:text-xl animate-bounce leading-none">🎁</span>
                    <span className="text-[9px] font-bold text-amber-300 leading-tight mt-0.5">الهدية</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs sm:text-sm font-mono font-bold text-white/50">
                      #{index + 1}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar Track */}
        <div className="w-full bg-white/10 rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 5. SIGNATURE WHITE BARCODE BOX (Exact Apple Wallet QR Container) */}
      <div className="w-full max-w-[260px] sm:max-w-[280px] mx-auto bg-white rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col items-center justify-center text-center">
        <div className="w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center bg-white">
          <RealOutsourcedQr
            value={qrTargetUrl}
            size={140}
            className="rounded-lg"
          />
        </div>
        <p className="text-[11px] sm:text-xs font-bold text-stone-900 mt-2 tracking-tight">
          امسح عند الكاشير للختم الفوري
        </p>
      </div>

      {/* 6. BOTTOM PASS FOOTER: (i) Info Flip Button */}
      <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>APPLE WALLET PASS</span>
        </div>

        <button
          type="button"
          onClick={onFlip}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer"
          title="معلومات وشروط البطاقة"
          aria-label="معلومات وشروط البطاقة"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

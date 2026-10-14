'use client';

import React from 'react';
import { Camera, Zap } from 'lucide-react';

interface TerminalScanRibbonProps {
  onOpenScanner: () => void;
  stampsToAdd: number;
  setStampsToAdd: (val: number) => void;
  autoStampEnabled: boolean;
  onToggleAutoStamp: () => void;
  autoResetTimer: number | null;
  onCancelAutoReset: () => void;
}

export function TerminalScanRibbon({
  onOpenScanner,
  stampsToAdd,
  setStampsToAdd,
  autoStampEnabled,
  onToggleAutoStamp,
  autoResetTimer,
  onCancelAutoReset,
}: TerminalScanRibbonProps) {
  return (
    <div className="p-5 rounded-3xl bg-[#141212] border border-white/10 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#c92a54] text-[#FBF9F5] flex items-center justify-center shadow-xs">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm text-[#FBF9F5]">
              الماسح السريع لكروت المحفظة
            </h4>
            <p className="text-[11px] text-[#A19E9B]">
              مسح مباشر بكاميرا التابلت/الموبايل بدقة 100%
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenScanner}
          className="py-2.5 px-4 rounded-xl bg-[#c92a54] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-[#c92a54]/40"
        >
          <Camera className="w-4 h-4 text-[#FBF9F5]" />
          <span>مسح كارت العميل بالكاميرا 📷</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-[#A19E9B] block">
            عدد الأختام للعملية:
          </span>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0B0A0A] rounded-xl border border-white/10">
            {[1, 2, 3].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setStampsToAdd(val)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                  stampsToAdd === val
                    ? 'bg-[#c92a54] text-[#FBF9F5] shadow-xs'
                    : 'text-[#A19E9B] hover:text-[#FBF9F5] hover:bg-[#1C1B1B]'
                }`}
              >
                <span>+${val}</span>
                <span className="text-[10px] font-sans font-normal">
                  {val === 1 ? 'ختم' : val === 2 ? 'ختمين' : 'أختام'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-[#A19E9B] block">
            وضع السرعة الفائقة:
          </span>
          <button
            type="button"
            onClick={onToggleAutoStamp}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              autoStampEnabled
                ? 'bg-[#98183c]/30 border-[#c92a54]/40 text-[#FBF9F5] shadow-2xs'
                : 'bg-[#0B0A0A] border-white/10 text-[#A19E9B] hover:bg-[#1C1B1B]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${autoStampEnabled ? 'text-[#c92a54] fill-current' : 'text-[#A19E9B]'}`} />
              <span>الختم التلقائي الفوري عند المسح</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              autoStampEnabled ? 'bg-[#c92a54] text-[#FBF9F5]' : 'bg-[#1C1B1B] text-[#A19E9B]'
            }`}>
              {autoStampEnabled ? 'مفعل ⚡' : 'معطل'}
            </span>
          </button>
        </div>
      </div>

      {autoResetTimer !== null && (
        <div className="p-2.5 rounded-xl bg-[#0B0A0A] border border-[#c92a54]/30 flex items-center justify-between text-xs animate-pulse">
          <span className="text-[#A19E9B]">
            سيتم إعادة تعيين الشاشة خلال <strong className="text-[#c92a54] font-mono">{autoResetTimer}</strong> ثوانٍ...
          </span>
          <button
            type="button"
            onClick={onCancelAutoReset}
            className="px-2.5 py-1 rounded-lg bg-[#1C1B1B] text-[#FBF9F5] text-[11px] font-bold hover:bg-[#282727] cursor-pointer"
          >
            إلغاء التعيين
          </button>
        </div>
      )}
    </div>
  );
}

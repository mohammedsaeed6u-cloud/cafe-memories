'use client';

import React from 'react';

export interface AppleWalletPassBackProps {
  brandName: string;
  customerPhone?: string;
  giftTitle: string;
  maxSlots: number;
  instagramHandle: string;
  onFlipBack: () => void;
}

export const AppleWalletPassBack: React.FC<AppleWalletPassBackProps> = ({
  brandName,
  customerPhone,
  giftTitle,
  maxSlots,
  instagramHandle,
  onFlipBack,
}) => {
  return (
    <div className="relative z-10 p-6 flex flex-col min-h-[440px] text-right">
      <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white/60">
            تفاصيل كارت الولاء
          </span>
        </div>
        <button
          type="button"
          onClick={onFlipBack}
          className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition cursor-pointer"
        >
          تم
        </button>
      </div>

      <div className="space-y-4 text-xs flex-1">
        <div>
          <span className="text-[10px] uppercase font-bold text-white/50 block mb-0.5">
            المنشأة المصدرة
          </span>
          <span className="text-white font-bold text-sm">{brandName}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-white/50 block mb-0.5">
            رقم الهاتف المسجل
          </span>
          <span className="text-white font-mono font-bold text-sm">
            {customerPhone || 'غير مسجل'}
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-white/50 block mb-0.5">
            الشروط والأحكام
          </span>
          <p className="text-white/70 text-[11px] leading-relaxed">
            يتم احتساب ختم واحد لكل زيارة معتمدة عند الكاشير. عند اكتمال جمع {maxSlots} أختام
            يحق لحامل البطاقة استبدال المكافأة ({giftTitle}) فورياً. هذه البطاقة شخصية وغير قابلة
            للتحويل أو الاستبدال النقدي.
          </p>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-white/50 block mb-0.5">
            حساب التواصل
          </span>
          <span className="text-amber-400 font-mono">{instagramHandle}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-white/15 flex items-center justify-between text-[10px] text-white/40 font-mono">
        <span>SERIAL: {customerPhone || 'STAMPY-PASS'}</span>
        <span>VERIFIED ISSUER</span>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { Radio, Tv, CheckCircle2, RotateCw } from 'lucide-react';
import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';
import { UseLiveWallReturn } from '../types';

interface Props {
  wall: UseLiveWallReturn;
}

export const WallUnpairedView: React.FC<Props> = ({ wall }) => {
  const {
    brandName,
    brandLogoUrl,
    pairedSuccessMsg,
    screenPairingCode,
    handleRegenerateCode,
    setIsPaired,
    screenId,
  } = wall;

  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex flex-col items-center justify-between p-6 sm:p-12 select-none font-sans relative overflow-hidden">
      {/* Subtle Archival Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-700/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10 border-b border-white/10 pb-5">
        <CoBrandingLogos
          cafeName={brandName}
          cafeLogoUrl={brandLogoUrl}
          size="lg"
          theme="dark"
          showTagline={true}
        />
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#231C18] border border-amber-500/40 text-xs font-mono font-bold text-amber-400 shadow-sm">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="uppercase tracking-wider">بث الشاشة الذكية • جاهز للإقران</span>
        </div>
      </div>

      {/* Main Pairing Card */}
      <div className="max-w-2xl w-full p-8 sm:p-12 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl text-center space-y-6 z-10 backdrop-blur-xl">
        {pairedSuccessMsg ? (
          <div className="p-8 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 space-y-3 animate-in zoom-in-95 duration-300">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-2xl font-bold font-serif">{pairedSuccessMsg}</h3>
            <p className="text-xs text-emerald-300 font-bold">جاري فتح شاشة العرض الحية وبث الذكريات فوراً...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-xl bg-[#231C18] text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 shadow-lg">
              <Tv className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-amber-400 font-bold block">
                SMART TV LIVE SIGNAGE
              </span>
              <h1
                style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                className="text-2xl sm:text-3xl font-bold text-[#FBF9F5] tracking-tight"
              >
                اقتران شاشة التلفزيون الذكية
              </h1>
              <p className="text-xs sm:text-sm text-[#A19E9B] max-w-lg mx-auto leading-relaxed">
                أدخل هذا الرقم المكون من 6 أرقام في <strong className="text-[#FBF9F5] font-bold underline decoration-amber-400">لوحة تحكم التاجر</strong> لربط هذه الشاشة مع فرعك ونشاطك التجاري وبث ذكريات الصالة فوراً:
              </p>
            </div>

            {/* Huge 6-Digit Screen Code */}
            <div className="py-2" dir="ltr">
              <div className="flex items-center justify-center gap-2.5 sm:gap-4 font-mono font-black text-4xl sm:text-7xl">
                {screenPairingCode.split('').map((digit, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-16 sm:w-20 sm:h-26 rounded-xl bg-[#0B0A0A] border-2 border-amber-500/50 text-[#FBF9F5] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] font-mono"
                  >
                    {digit}
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right pt-2">
              <div className="p-3.5 rounded-xl bg-[#1C1B1B] border border-white/10 text-xs text-[#A19E9B]">
                <span className="font-mono font-black text-amber-400 block mb-1">الخطوة 1:</span>
                افتح لوحة تحكم التاجر على هاتفك أو حاسوبك.
              </div>
              <div className="p-3.5 rounded-xl bg-[#1C1B1B] border border-white/10 text-xs text-[#A19E9B]">
                <span className="font-mono font-black text-amber-400 block mb-1">الخطوة 2:</span>
                انتقل إلى تبويب «شاشات الصالة».
              </div>
              <div className="p-3.5 rounded-xl bg-[#1C1B1B] border border-white/10 text-xs text-[#A19E9B]">
                <span className="font-mono font-black text-amber-400 block mb-1">الخطوة 3:</span>
                اكتب الرمز ({screenPairingCode}) واضغط «تأكيد وربط الشاشة».
              </div>
            </div>

            {/* Listening Status & Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 text-[#A19E9B] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span>بانتظار إدخال الكود من التاجر...</span>
              </div>

              <button
                type="button"
                onClick={handleRegenerateCode}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] border border-white/10 transition font-bold text-xs cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#A19E9B]" />
                <span>توليد كود جديد</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaired(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
              >
                <span>معاينة الشاشة مباشرة ←</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#A19E9B]/60 font-mono z-10">
        Screen ID: {screenId} • Stampy Smart TV Live Signage
      </div>
    </div>
  );
};

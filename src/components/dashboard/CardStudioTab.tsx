'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CreditCard,
  CheckCircle2,
  Share2,
  Smartphone,
  Eye,
  Sliders,
  Palette,
} from 'lucide-react';
import { TicketButton } from '@/components/ui/TicketButton';
import { StampyApertureIcon } from '@/components/brand/StampyLogo';

export function CardStudioTab({ businessSlug = 'store' }: { businessSlug?: string }) {
  const [cardTitle, setCardTitle] = useState('بطاقة أختام وذكريات');
  const [totalStamps, setTotalStamps] = useState<number>(5);
  const [rewardTitle, setRewardTitle] = useState('هدية تذكارية مجانية عند اكتمال الأختام');
  const [cardTheme, setCardTheme] = useState<'ochre' | 'earth' | 'sienna' | 'teal'>('ochre');
  const [appleWalletEnabled, setAppleWalletEnabled] = useState(true);
  const [googleWalletEnabled, setGoogleWalletEnabled] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const themeColors = {
    ochre: { bg: 'bg-[#E5A836]', border: 'border-[#3D2314]', text: 'text-[#3D2314]' },
    earth: { bg: 'bg-[#3D2314]', border: 'border-[#EADDC4]', text: 'text-[#FAF5EB]' },
    sienna: { bg: 'bg-[#B83A26]', border: 'border-[#3D2314]', text: 'text-white' },
    teal: { bg: 'bg-[#527E78]', border: 'border-[#3D2314]', text: 'text-white' },
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      const config = {
        cardTitle,
        totalStamps,
        rewardTitle,
        cardTheme,
        appleWalletEnabled,
        googleWalletEnabled,
      };
      localStorage.setItem(`stampy_card_config_${businessSlug}`, JSON.stringify(config));
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-[#3D2314] rounded-2xl p-5 sm:p-6 shadow-stamp-resting">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B83A26] uppercase">
            <Sliders className="w-4 h-4" />
            <span>STAMP CARD STUDIO & WALLET PASS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#3D2314] mt-1">
            ستوديو تخصيص كرت الأختام والمحفظة
          </h2>
          <p className="text-xs text-[#3D2314]/70 mt-1">
            تخصيص عدد الأختام، شكل التذكرة، ومزامنة بطاقة Apple Wallet و Google Wallet في الوقت اللحظي.
          </p>
        </div>
        <TicketButton variant="primary" size="md" onClick={handleSave} className="shrink-0">
          <Sparkles className="w-4 h-4" />
          <span>حفظ التعديلات</span>
        </TicketButton>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-600 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>تم حفظ إعدادات الكرت والمحفظة بنجاح!</span>
        </div>
      )}

      {/* Split Columns: Controls vs Sticky Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-7 bg-white border-2 border-[#3D2314] rounded-2xl p-5 sm:p-6 shadow-stamp-resting space-y-5">
          <div>
            <label className="block text-xs font-black text-[#3D2314] mb-1.5">
              عنوان الكرت الترويجي:
            </label>
            <input
              type="text"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#3D2314] mb-2">
              عدد الأختام المطلوبة للاكتمال:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTotalStamps(num)}
                  className={`py-2.5 rounded-xl border-2 font-bold text-xs transition cursor-pointer ${
                    totalStamps === num
                      ? 'bg-[#E5A836] border-[#3D2314] text-[#3D2314] shadow-stamp-resting'
                      : 'bg-[#FAF5EB] border-[#EADDC4] text-[#3D2314]/70 hover:border-[#3D2314]'
                  }`}
                >
                  {num} أختام
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[#3D2314] mb-1.5">
              اسم الجائزة أو المكافأة:
            </label>
            <input
              type="text"
              value={rewardTitle}
              onChange={(e) => setRewardTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#3D2314] mb-2">
              لون تذكرة الكرت (Brand Theme):
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['ochre', 'earth', 'sienna', 'teal'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCardTheme(t)}
                  className={`py-2.5 rounded-xl border-2 font-bold text-xs capitalize transition cursor-pointer ${
                    cardTheme === t
                      ? 'border-[#3D2314] shadow-stamp-resting'
                      : 'border-[#EADDC4] opacity-70'
                  } ${themeColors[t].bg} ${themeColors[t].text}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Digital Wallet Passes */}
          <div className="pt-3 border-t border-[#EADDC4]">
            <h4 className="text-xs font-black text-[#3D2314] mb-2 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#B83A26]" />
              <span>مزامنة المحفظة الرقمية اللحظية (Apple & Google Wallet)</span>
            </h4>
            <div className="space-y-2 bg-[#FAF5EB] p-3 rounded-xl border border-[#EADDC4]">
              <label className="flex items-center justify-between cursor-pointer text-xs font-bold text-[#3D2314]">
                <span>تفعيل بطاقة Apple Wallet على أجهزة iPhone</span>
                <input
                  type="checkbox"
                  checked={appleWalletEnabled}
                  onChange={(e) => setAppleWalletEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#B83A26]"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer text-xs font-bold text-[#3D2314]">
                <span>تفعيل بطاقة Google Wallet على هواتف Android</span>
                <input
                  type="checkbox"
                  checked={googleWalletEnabled}
                  onChange={(e) => setGoogleWalletEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#B83A26]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white border-2 border-[#3D2314] rounded-2xl p-5 shadow-stamp-hover">
            <div className="flex items-center justify-between border-b border-[#EADDC4] pb-2.5 mb-4">
              <span className="text-xs font-black text-[#3D2314] flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#B83A26]" />
                <span>المعاينة الحية للكرت على جوال العميل</span>
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#E5A836] text-[#3D2314] px-2 py-0.5 rounded border border-[#3D2314]">
                LIVE PREVIEW
              </span>
            </div>

            {/* Tactile Card Preview */}
            <div
              className={`rounded-2xl border-2 border-[#3D2314] p-5 shadow-stamp-resting transition-all ${themeColors[cardTheme].bg} ${themeColors[cardTheme].text}`}
            >
              <div className="flex items-center justify-between border-b border-[#3D2314]/30 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF5EB] border border-[#3D2314] flex items-center justify-center">
                    <StampyApertureIcon size={18} color="#3D2314" />
                  </div>
                  <div>
                    <h5 className="font-black text-sm tracking-tight">stampy.</h5>
                    <span className="text-[10px] opacity-80 block">{cardTitle}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#FAF5EB] text-[#3D2314] px-2 py-0.5 rounded border border-[#3D2314]/30">
                  ADMIT ONE
                </span>
              </div>

              {/* Stamps Grid */}
              <div className="grid grid-cols-5 gap-2 my-4">
                {Array.from({ length: totalStamps }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-xl border-2 flex items-center justify-center font-bold text-sm transition-all ${
                      i < 2
                        ? 'bg-[#B83A26] text-white border-[#3D2314] shadow-stamp-pressed scale-95'
                        : 'bg-[#FAF5EB] text-[#3D2314]/40 border-dashed border-[#3D2314]'
                    }`}
                  >
                    {i < 2 ? '✦' : i + 1}
                  </div>
                ))}
              </div>

              {/* Reward Box */}
              <div className="bg-[#FAF5EB] text-[#3D2314] p-3 rounded-xl border border-[#3D2314]/30 text-xs font-bold text-center">
                🎁 {rewardTitle}
              </div>

              <div className="mt-3 text-[10px] font-mono text-center opacity-80" dir="ltr">
                &ldquo;Every moment is a stamp in time.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

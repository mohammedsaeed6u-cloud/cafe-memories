'use client';

import React from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { UseFrameStudioReturn } from '../types';

interface Props {
  studio: UseFrameStudioReturn;
}

export const FrameStudioBrandingSection: React.FC<Props> = ({ studio }) => {
  const {
    branding,
    setBranding,
    badgeText,
    setBadgeText,
    customText,
    setCustomText,
    setActiveFrame,
    handleLogoUpload,
  } = studio;

  return (
    <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/30 flex items-center justify-center font-bold">
          1
        </div>
        <div>
          <h3 className="font-bold text-[#FBF9F5] text-base font-serif">
            هوية البيزنس والنصوص التحريرية (Custom Branding & Texts)
          </h3>
          <p className="text-xs text-[#A19E9B] mt-0.5">
            خصص اسم المكان، الشعار، اللوجو، ونصوص الترويسة والتذييل على الكارت
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
              اسم المكان في ترويسة الكارت
            </label>
            <input
              type="text"
              value={branding.name}
              onChange={(e) => setBranding({ ...branding, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-sm focus:ring-1 focus:ring-[#d97706] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50"
              placeholder="مثلاً: Memories Studio أو Elixir Roastery"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
              بادج / ترويسة الفريم الإضافية (Header Badge)
            </label>
            <input
              type="text"
              value={badgeText}
              onChange={(e) => {
                setBadgeText(e.target.value);
                setActiveFrame((prev) => ({ ...prev, badgeText: e.target.value }));
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-sm focus:ring-1 focus:ring-[#d97706] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50 font-mono"
              placeholder="مثلاً: SEOUL 4-CUTS // 35MM أو % ARABICA GOLD"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
            حساب إنستغرام المتجر للمنشن (Instagram Handle)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[#A19E9B] font-bold text-xs">@</span>
            <input
              type="text"
              value={(branding.instagramHandle || '').replace('@', '')}
              onChange={(e) => setBranding({ ...branding, instagramHandle: `@${e.target.value.replace('@', '')}` })}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-white/10 text-sm focus:ring-1 focus:ring-[#d97706] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50 font-mono"
              placeholder="مثلاً: roastery.official"
            />
          </div>
          <p className="text-[10px] text-[#A19E9B] mt-1">يظهر للعميل في نهاية التجربة لعمل منشن للمكان في ستوري إنستغرام</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
            نص التذييل / ذقن الكارت (Custom Chin / Footer Note)
          </label>
          <input
            type="text"
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              setActiveFrame((prev) => ({ ...prev, customText: e.target.value }));
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-sm focus:ring-1 focus:ring-[#d97706] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50"
            placeholder="مثلاً: special coffee memories أو A SENSE OF PLACE"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
            لوجو المكان
          </label>
          <div className="flex items-center gap-4">
            {branding.logoUrl ? (
              <div className="relative w-20 h-14 rounded-xl border border-white/10 bg-[#0B0A0A] flex items-center justify-center overflow-hidden p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={branding.logoUrl}
                  alt="Business Logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-20 h-14 rounded-xl border border-dashed border-white/20 bg-[#0B0A0A] flex flex-col items-center justify-center text-[#A19E9B]">
                <ImageIcon className="w-5 h-5" />
                <span className="text-[9px]">بدون لوجو</span>
              </div>
            )}

            <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#1C1B1B] hover:bg-[#252424] text-[#FBF9F5] text-xs font-bold border border-white/10 flex items-center gap-2 transition">
              <Upload className="w-3.5 h-3.5 text-[#A19E9B]" />
              <span>{branding.logoUrl ? 'تغيير اللوجو' : 'رفع لوجو المكان'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setBranding({ ...branding, showLogo: branding.showLogo === false })}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-2 ${
                branding.showLogo === false
                  ? 'bg-[#1C1B1B] hover:bg-[#252424] text-[#A19E9B] border-white/10'
                  : 'bg-[#b45309]/40 text-[#FBF9F5] border-[#d97706]/40 hover:border-[#d97706]'
              }`}
              title="تشغيل/إيقاف ظهور اللوجو على الكارت — ينعكس فوراً على المعاينة"
            >
              <span className={`w-2 h-2 rounded-full ${branding.showLogo === false ? 'bg-[#A19E9B]' : 'bg-[#d97706] animate-pulse'}`}></span>
              <span>{branding.showLogo === false ? 'اللوجو مخفي — اسم المكان نصاً' : 'اللوجو ظاهر على الكارت'}</span>
            </button>

            {branding.logoUrl && (
              <button
                type="button"
                onClick={() => setBranding({ ...branding, logoUrl: '' })}
                className="text-xs text-rose-400 hover:underline font-medium cursor-pointer"
              >
                حذف اللوجو
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

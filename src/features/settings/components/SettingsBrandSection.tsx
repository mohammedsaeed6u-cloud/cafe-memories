'use client';

import React from 'react';
import { UseDashboardSettingsReturn } from '../types';

interface Props {
  vm: UseDashboardSettingsReturn;
}

export const SettingsBrandSection: React.FC<Props> = ({ vm }) => {
  const {
    businessName,
    setBusinessName,
    tagline,
    setTagline,
    logoUrl,
    setLogoUrl,
    showLogo,
    setShowLogo,
  } = vm;

  return (
    <div className="p-6 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-sm space-y-4">
      <h4 className="font-bold text-sm text-[#FBF9F5] pb-3 border-b border-[rgba(255,255,255,0.1)]">
        2. بيانات العلامة التجارية (Brand Information)
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            اسم النشاط التجاري / الفرع:
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="مثال: بوتيك الأناقة / كافيه الذكريات"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] focus:outline-none focus:border-[#c92a54] text-[#FBF9F5]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            الشعار الإعلاني (Tagline):
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="مثال: ذكريات مميزة مع كل زيارة"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] focus:outline-none focus:border-[#c92a54] text-[#FBF9F5]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            رابط الشعار المباشر (Logo Image URL):
          </label>
          <input
            type="url"
            dir="ltr"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] focus:outline-none focus:border-[#c92a54] text-[#FBF9F5] font-mono"
          />
          <span className="text-[10px] text-stone-500 mt-1 block">
            يظهر الشعار أعلى كروت العملاء، شاشات العرض المباشر، وأكواد الطاولات.
          </span>
          <div className="flex items-center gap-2 mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-950 text-[11px] leading-relaxed">
            <span className="shrink-0 text-[#c92a54] text-sm">🔔</span>
            <span>
              <strong>أيقونة إشعارات شاشة القفل:</strong> هذا الشعار يُعتمد تلقائياً كأيقونة رسمية تظهر على شاشات هواتف عملائك عند إرسال أي إشعار أو تحديث لكروت المحفظة (Apple Wallet & Google Wallet APNs).
            </span>
          </div>

          <label className="flex items-center justify-between gap-3 mt-3 p-3.5 rounded-2xl bg-[#141212] border border-[rgba(255,255,255,0.1)] cursor-pointer hover:border-[#c92a54] transition">
            <span className="flex flex-col">
              <span className="text-xs font-bold text-[#FBF9F5]">عرض الشعار على كارت الولاء</span>
              <span className="text-[10px] text-stone-500">عند إيقاف المفتاح، يظهر اسم المنشأة كنص أنيق بدلاً من الصورة.</span>
            </span>
            <span className="relative shrink-0">
              <input
                type="checkbox"
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
                className="peer sr-only"
              />
              <span className="block w-10 h-6 rounded-full bg-stone-300 peer-checked:bg-amber-800 transition-colors"></span>
              <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4"></span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

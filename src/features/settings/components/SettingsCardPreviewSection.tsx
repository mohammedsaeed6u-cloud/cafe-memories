'use client';

import React from 'react';
import { LiveCardPreview } from '@/components/dashboard/LiveCardPreview';
import { UseDashboardSettingsReturn } from '../types';

interface Props {
  vm: UseDashboardSettingsReturn;
}

export const SettingsCardPreviewSection: React.FC<Props> = ({ vm }) => {
  const { businessName, logoUrl, showLogo, shotCount, giftTitle } = vm;

  return (
    <div className="p-6 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-700 animate-pulse" />
          <h4 className="text-sm font-bold text-[#FBF9F5]">معاينة حية — كارت الفوتوبوث والطباعة</h4>
        </div>
        <span className="text-[10px] font-mono text-stone-500">تحديث فوري</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <LiveCardPreview
          businessName={businessName}
          logoUrl={logoUrl}
          showLogo={showLogo}
          shotCount={shotCount}
          giftTitle={giftTitle}
        />
        <div className="flex-1 space-y-2 text-[11px] text-stone-600 leading-relaxed">
          <p className="font-bold text-[#FBF9F5] text-xs">مواصفات الطباعة المعتمدة:</p>
          <p>• المقاس ثابت وفق المعايير الرسمية (2×6 أو 4×6) لمنع تشويه الصور عند الطباعة.</p>
          <p>• اللوجو المعتمد يظهر في ترويسة الكارت وتلقائياً على شاشات العرض الصالة.</p>
          <p>• الختم المخصص في الاستوديو أعلاه هو المعتمد في كروت الزوار وسجلات الزيارات.</p>
        </div>
      </div>
    </div>
  );
};

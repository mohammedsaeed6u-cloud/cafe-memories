'use client';

import React from 'react';
import { UseDashboardSettingsReturn } from '../types';

interface Props {
  vm: UseDashboardSettingsReturn;
}

export const SettingsLoyaltySection: React.FC<Props> = ({ vm }) => {
  const {
    giftTitle,
    setGiftTitle,
    shotCount,
    setShotCount,
    giftSubtitle,
    setGiftSubtitle,
  } = vm;

  return (
    <div className="p-6 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-sm space-y-4">
      <h4 className="font-bold text-sm text-[#FBF9F5] pb-3 border-b border-[rgba(255,255,255,0.1)]">
        3. برنامج مكافآت الزيارات والولاء (Loyalty Rewards Program)
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            عنوان الهدية المجانية:
          </label>
          <input
            type="text"
            value={giftTitle}
            onChange={(e) => setGiftTitle(e.target.value)}
            placeholder="مثال: كوب سبيشالتي مجاني / خصم 20%"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] focus:outline-none focus:border-[#c92a54] text-[#FBF9F5]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            عدد الزيارات المطلوبة لفتح الهدية:
          </label>
          <div className="flex gap-2">
            {[3, 4, 5, 6].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => setShotCount(cnt)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                  shotCount === cnt
                    ? 'bg-[#FBF9F5] text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-[rgba(255,255,255,0.1)]'
                }`}
              >
                {cnt} زيارات
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            تفاصيل وشروط الهدية:
          </label>
          <input
            type="text"
            value={giftSubtitle}
            onChange={(e) => setGiftSubtitle(e.target.value)}
            placeholder="مثال: يستحق العميل هذه المكافأة فور إكمال الخانات في نقطة الكاشير"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] focus:outline-none focus:border-[#c92a54] text-[#FBF9F5]"
          />
        </div>
      </div>
    </div>
  );
};

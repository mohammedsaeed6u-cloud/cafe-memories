'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { BUSINESS_INDUSTRY_OPTIONS } from '@/lib/constants/photobooth-presets';
import { BusinessType } from '@/types/photobooth';
import { UseDashboardSettingsReturn } from '../types';

interface Props {
  vm: UseDashboardSettingsReturn;
}

export const SettingsIndustrySection: React.FC<Props> = ({ vm }) => {
  const { businessType, activeIndustry, handleSelectIndustry } = vm;

  return (
    <div className="p-6 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.1)]">
        <div>
          <h4 className="font-bold text-sm text-[#FBF9F5]">1. قطاع النشاط التجاري (Business Industry)</h4>
          <p className="text-xs text-stone-500">اختر القطاع ليتم ضبط مسميات طاقم الخدمة ونوع الهدايا والبطاقات تلقائياً.</p>
        </div>
        <span className="text-xs font-bold text-amber-950 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 font-mono">
          {activeIndustry.nameAr}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {BUSINESS_INDUSTRY_OPTIONS.map((ind) => {
          const isSelected = businessType === ind.id;
          return (
            <button
              key={ind.id}
              type="button"
              onClick={() => handleSelectIndustry(ind.id as BusinessType)}
              className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-amber-700 bg-amber-50 text-[#FBF9F5] shadow-xs'
                  : 'border-[rgba(255,255,255,0.1)] bg-white hover:bg-[#0B0A0A] text-stone-600'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xl">
                  {ind.id === 'retail' && '🛍️'}
                  {ind.id === 'salon' && '💇‍♀️'}
                  {ind.id === 'restaurant' && '🍽️'}
                  {ind.id === 'events' && '🎪'}
                  {ind.id === 'entertainment' && '🎮'}
                  {ind.id === 'cafe' && '☕'}
                  {ind.id === 'general' && '🏢'}
                </span>
                {isSelected && <Check className="w-4 h-4 text-amber-800 stroke-[3]" />}
              </div>
              <div>
                <strong className="text-xs font-bold block text-[#FBF9F5]">{ind.nameAr}</strong>
                <span className="text-[10px] text-stone-500 font-mono block mt-0.5">{ind.staffLabel}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

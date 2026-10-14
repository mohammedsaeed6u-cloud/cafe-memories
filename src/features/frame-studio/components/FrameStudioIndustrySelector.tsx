'use client';

import React from 'react';
import { BUSINESS_INDUSTRY_OPTIONS } from '@/lib/constants/photobooth-presets';
import { BusinessType } from '@/types/photobooth';
import { Check } from 'lucide-react';
import { UseFrameStudioReturn } from '../types';

interface Props {
  studio: UseFrameStudioReturn;
}

export const FrameStudioIndustrySelector: React.FC<Props> = ({ studio }) => {
  const { businessType, setBusinessType, freeGift, setFreeGift } = studio;

  return (
    <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/30 flex items-center justify-center font-bold">
            0
          </div>
          <div>
            <h3 className="font-bold text-[#FBF9F5] text-base font-serif">
              نوع ونشاط البيزنس (Multi-Industry)
            </h3>
            <p className="text-xs text-[#A19E9B] mt-0.5">
              حدد مجال عملك لتخصيص الهدايا، تسميات الموظفين، وتجربة كارت الولاء
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/30">
          متعدد الأنشطة
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {BUSINESS_INDUSTRY_OPTIONS.map((ind) => {
          const isSelected = businessType === ind.id;
          return (
            <button
              key={ind.id}
              type="button"
              onClick={() => {
                setBusinessType(ind.id as BusinessType);
                if (!freeGift.title || freeGift.title === 'مشروب مجاني أو هدية فورية') {
                  setFreeGift({
                    ...freeGift,
                    title: ind.defaultGiftTitle,
                    subtitle: ind.defaultGiftSubtitle,
                  });
                }
              }}
              className={`p-3 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                isSelected
                  ? 'border-[#d97706] bg-[#b45309]/30 shadow-md ring-1 ring-[#d97706]'
                  : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xl">{ind.icon}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#d97706]" />}
              </div>
              <div>
                <span className="text-xs font-bold text-[#FBF9F5] block leading-tight">
                  {ind.nameAr}
                </span>
                <span className="text-[10px] text-[#A19E9B] line-clamp-1 mt-0.5">
                  الموظف: {ind.staffLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

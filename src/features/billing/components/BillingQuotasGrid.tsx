'use client';

import React from 'react';
import { Zap, Users, Tv, Printer } from 'lucide-react';
import { UseSubscriptionBillingReturn } from '../types';

interface Props {
  vm: UseSubscriptionBillingReturn;
}

export const BillingQuotasGrid: React.FC<Props> = ({ vm }) => {
  const {
    visitsUsed,
    visitsLimit,
    visitsPercent,
    screensUsed,
    screensLimit,
    printsUsed,
    printsLimit,
    printsPercent,
  } = vm;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <Zap className="w-4 h-4 text-[#d97706]" />
            <span>استهلاك الحصص والموارد الشهرية (Resource Quotas)</span>
          </h3>
          <p className="text-xs text-[#A19E9B] mt-0.5">
            تتجدد كافة العدادات تلقائياً مع بداية كل دورة فوترة شهرية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Visits */}
        <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-[#A19E9B]">
            <span className="text-xs font-bold text-[#FBF9F5]">زيارات وتفاعلات العملاء</span>
            <Users className="w-4 h-4 text-[#d97706]" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[#FBF9F5]">
              {visitsUsed.toLocaleString()}{' '}
              <span className="text-xs font-normal text-[#A19E9B]">
                / {visitsLimit === 'unlimited' ? 'غير محدود' : visitsLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0B0A0A] mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#b45309] to-[#d97706] rounded-full transition-all duration-500"
                style={{ width: `${visitsPercent}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-[#A19E9B] font-mono">
            {visitsPercent}% من الحصة الشهرية المشمولة
          </p>
        </div>

        {/* Metric 2: TV Screens */}
        <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-[#A19E9B]">
            <span className="text-xs font-bold text-[#FBF9F5]">شاشات العرض بالصالة (TV Wall)</span>
            <Tv className="w-4 h-4 text-[#d97706]" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[#FBF9F5]">
              {screensUsed}{' '}
              <span className="text-xs font-normal text-[#A19E9B]">
                / {screensLimit === 'unlimited' ? 'غير محدود' : `${screensLimit} شاشات`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0B0A0A] mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#b45309] to-[#d97706] rounded-full transition-all duration-500"
                style={{
                  width: screensLimit === 'unlimited' ? '20%' : `${(screensUsed / (screensLimit as number)) * 100}%`,
                }}
              />
            </div>
          </div>
          <p className="text-[11px] text-[#A19E9B]">
            {screensUsed === screensLimit ? 'تم استخدام الحد الأقصى للشاشات' : 'يمكنك ربط شاشات إضافية'}
          </p>
        </div>

        {/* Metric 3: Prints */}
        <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-[#A19E9B]">
            <span className="text-xs font-bold text-[#FBF9F5]">كروت الصور المطبوعة 2×6</span>
            <Printer className="w-4 h-4 text-[#d97706]" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[#FBF9F5]">
              {printsUsed}{' '}
              <span className="text-xs font-normal text-[#A19E9B]">
                / {printsLimit === 'unlimited' ? 'غير محدود' : printsLimit === 0 ? 'غير مشمولة' : `${printsLimit} كارت`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0B0A0A] mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#b45309] to-[#d97706] rounded-full transition-all duration-500"
                style={{ width: `${printsPercent}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-[#A19E9B]">
            {printsLimit === 0 ? 'تتطلب باقة الطباعة والتفاعل' : `متبقي ${(printsLimit as number) - printsUsed} كارت لهذا الشهر`}
          </p>
        </div>
      </div>
    </div>
  );
};

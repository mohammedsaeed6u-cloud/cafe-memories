'use client';

import React from 'react';
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';
import { SaaSPlatformMetrics } from '@/types/subscription';

interface AdminFinancialMetricsProps {
  saasMetrics: SaaSPlatformMetrics;
}

export function AdminFinancialMetrics({ saasMetrics }: AdminFinancialMetricsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <TrendingUp className="w-5 h-5 text-[#c92a54]" />
            <span>مؤشرات إيرادات الـ SaaS الشهرية والسنوية (MRR & ARR Telemetry)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            متابعة الاشتراكات المتكررة، تدفقات السداد، وتوزيع الباقات عبر الفروع
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: MRR */}
        <div className="p-5 bg-[#141212] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xl space-y-1">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold text-stone-500">الإيراد الشهري المتكرر (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {saasMetrics.totalMrr.toLocaleString()}{' '}
            <span className="text-xs font-bold text-stone-500">ر.س</span>
          </p>
          <p className="text-[10px] text-stone-500/60 font-bold">Monthly Recurring Revenue</p>
        </div>

        {/* Metric 2: ARR */}
        <div className="p-5 bg-[#141212] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xl space-y-1">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold text-stone-500">الإيراد السنوي المتوقع (ARR)</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-[#FBF9F5]">
            {saasMetrics.totalArr.toLocaleString()}{' '}
            <span className="text-xs font-bold text-stone-500">ر.س</span>
          </p>
          <p className="text-[10px] text-emerald-400 font-bold">Annual Run Rate Projection</p>
        </div>

        {/* Metric 3: Active Subscriptions */}
        <div className="p-5 bg-[#141212] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xl space-y-1">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold text-stone-500">المشتركون النشطون</span>
            <Users className="w-4 h-4 text-[#c92a54]" />
          </div>
          <p className="text-2xl font-black text-[#FBF9F5]">
            {saasMetrics.activeSubscriptionsCount}{' '}
            <span className="text-xs font-bold text-stone-500">منشآت ومتاجر نشطة</span>
          </p>
          <p className="text-[10px] text-stone-500/60 font-bold">
            {saasMetrics.trialingCount} فروع في التجربة المجانية
          </p>
        </div>

        {/* Metric 4: ARPU */}
        <div className="p-5 bg-[#141212] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xl space-y-1">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold text-stone-500">متوسط العائد لكل مقهى (ARPU)</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-[#FBF9F5]">
            {saasMetrics.averageRevenuePerUser.toLocaleString()}{' '}
            <span className="text-xs font-bold text-stone-500">ر.س</span>
          </p>
          <p className="text-[10px] text-emerald-400 font-bold">معدل الإلغاء Churn: 1.2%</p>
        </div>
      </div>
    </div>
  );
}

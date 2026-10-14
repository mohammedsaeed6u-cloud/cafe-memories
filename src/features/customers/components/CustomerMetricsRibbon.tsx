'use client';

import React from 'react';
import { Users, Flame, Award, CreditCard } from 'lucide-react';
import { CustomerRecord } from '../types';

interface CustomerMetricsRibbonProps {
  customers: CustomerRecord[];
}

export function CustomerMetricsRibbon({ customers }: CustomerMetricsRibbonProps) {
  const total = customers.length;
  const vipCount = customers.filter((c) => c.totalVisits >= 5 || c.role === 'vip').length;
  const frequentCount = customers.filter((c) => c.totalVisits >= 3).length;
  const rewardsCount = customers.reduce((sum, c) => sum + (c.rewardsCount || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      <div className="p-4 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#c92a54] border border-amber-200 flex items-center justify-center font-bold">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-stone-500 font-bold block">إجمالي العملاء</span>
          <span className="text-xl font-black font-mono text-[#FBF9F5]">{total}</span>
        </div>
      </div>

      <div className="p-4 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-stone-500 font-bold block">عملاء VIP</span>
          <span className="text-xl font-black font-mono text-purple-700">{vipCount}</span>
        </div>
      </div>

      <div className="p-4 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-stone-500 font-bold block">الزوار المتكررون</span>
          <span className="text-xl font-black font-mono text-emerald-700">{frequentCount}</span>
        </div>
      </div>

      <div className="p-4 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-stone-500 font-bold block">مكافآت مستلمة</span>
          <span className="text-xl font-black font-mono text-blue-700">{rewardsCount}</span>
        </div>
      </div>
    </div>
  );
}

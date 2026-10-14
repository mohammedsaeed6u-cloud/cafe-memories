'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { UseSubscriptionBillingReturn } from '../types';

interface Props {
  vm: UseSubscriptionBillingReturn;
}

export const BillingPlanStatusCard: React.FC<Props> = ({ vm }) => {
  const {
    subscription,
    isAnnual,
    activePlan,
    formatDate,
    handleToggleInterval,
    setIsChangingCard,
    setIsCancelConfirmOpen,
  } = vm;

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-[#141212] border border-white/10 shadow-xl relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#b45309]/60 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {subscription.status === 'active'
                ? 'الاشتراك نشط • Active'
                : subscription.status === 'trialing'
                ? 'فترة تجربة نشطة • Trial'
                : 'معلق'}
            </span>

            {subscription.cancelAtPeriodEnd && (
              <span className="px-2.5 py-1 rounded-md bg-[#b45309]/70 text-[#FBF9F5] border border-[#d97706]/40 text-xs font-bold font-mono">
                ينتهي عند نهاية الدورة
              </span>
            )}

            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#1C1B1B] text-[#A19E9B] font-bold border border-white/10">
              {isAnnual ? 'فوترة سنوية (وفر 20%)' : 'فوترة شهرية'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#FBF9F5] font-serif">
            {activePlan.name}{' '}
            <span className="text-base font-normal text-[#A19E9B]">({activePlan.nameEn})</span>
          </h2>

          <p className="text-xs sm:text-sm text-[#A19E9B] leading-relaxed max-w-2xl font-sans">
            {activePlan.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Price badge */}
          <div className="p-4 rounded-xl bg-[#1C1B1B] border border-white/10 text-center min-w-[160px]">
            <div className="text-2xl font-bold font-mono text-[#FBF9F5]">
              {isAnnual ? activePlan.annualPricePerMonth : activePlan.monthlyPrice}{' '}
              <span className="text-xs font-bold text-[#A19E9B]">ر.س / شهر</span>
            </div>
            <p className="text-[11px] text-[#A19E9B] mt-0.5 font-sans">
              تتجدد تلقائياً في {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>

          {/* Toggle Billing Interval */}
          <button
            onClick={handleToggleInterval}
            className="px-4 py-3 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-[#FBF9F5] font-bold text-xs flex items-center justify-center gap-2 transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAnnual ? 'التحويل للدفع الشهري' : 'وفر 20% بالتحويل للسنوي'}</span>
          </button>
        </div>
      </div>

      {/* Payment Method Bar */}
      <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 text-[#e6e1e1]">
          <div className="w-10 h-7 rounded-lg bg-[#1C1B1B] border border-white/10 flex items-center justify-center font-black text-[10px] text-[#FBF9F5] uppercase tracking-wider font-mono">
            {subscription.paymentMethod.brand}
          </div>
          <div>
            <p className="font-bold text-[#FBF9F5]">
              بطاقة الدفع المعتمدة: •••• {subscription.paymentMethod.last4}
            </p>
            <p className="text-[11px] text-[#A19E9B] font-mono">
              الصلاحية: {String(subscription.paymentMethod.expiryMonth).padStart(2, '0')}/
              {subscription.paymentMethod.expiryYear} • {subscription.paymentMethod.cardHolderName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsChangingCard(true)}
            className="px-3.5 py-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold transition text-xs cursor-pointer"
          >
            تحديث البطاقة
          </button>

          <button
            onClick={() => setIsCancelConfirmOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-[#A19E9B] hover:text-rose-400 hover:bg-rose-950/30 transition text-xs font-medium cursor-pointer"
          >
            {subscription.cancelAtPeriodEnd ? 'إلغاء طلب الإيقاف' : 'إدارة أو إيقاف الاشتراك'}
          </button>
        </div>
      </div>
    </div>
  );
};

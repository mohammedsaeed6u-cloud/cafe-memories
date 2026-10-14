'use client';

import React from 'react';
import { Sparkles, Check, ArrowUpRight } from 'lucide-react';
import { UseSubscriptionBillingReturn } from '../types';

interface Props {
  vm: UseSubscriptionBillingReturn;
}

export const BillingPlansUpgradeGrid: React.FC<Props> = ({ vm }) => {
  const { plans, subscription, isAnnual, handleUpgradePlan } = vm;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <Sparkles className="w-4 h-4 text-[#d97706]" />
            <span>ترقية أو تغيير باقة الاشتراك (Plans & Upgrades)</span>
          </h3>
          <p className="text-xs text-[#A19E9B] mt-0.5">
            ترقية فورية بدون أي توقف في الخدمة، وتُحسب الفروقات تلقائياً
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => {
          const isCurrent = p.id === subscription.planId;
          const price = isAnnual ? p.annualPricePerMonth : p.monthlyPrice;

          return (
            <div
              key={p.id}
              className={`p-6 rounded-2xl bg-[#141212] border flex flex-col justify-between transition-all duration-200 relative ${
                isCurrent
                  ? 'border-[#d97706] shadow-[0_0_25px_-5px_rgba(217,119,6,0.25)]'
                  : 'border-white/10 hover:border-white/25 shadow-xl'
              }`}
            >
              {/* Badges */}
              <div className="flex items-center justify-between mb-4">
                {p.badge ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#b45309]/70 text-[#FBF9F5] text-[10px] font-bold border border-[#d97706]/40 font-mono">
                    {p.badge}
                  </span>
                ) : (
                  <span />
                )}

                {isCurrent && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#b45309] text-[#FBF9F5] text-[10px] font-bold border border-[#d97706]/50 font-mono">
                    باقتك الحالية
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-[#FBF9F5] leading-tight font-serif">{p.name}</h4>
                  <p className="text-xs text-[#A19E9B] mt-0.5 font-sans">{p.nameEn}</p>
                </div>

                <div className="pt-2 pb-3 border-y border-white/10">
                  <div className="text-2xl font-bold font-mono text-[#FBF9F5]">
                    {price}{' '}
                    <span className="text-xs font-bold text-[#A19E9B]">ر.س / شهرياً</span>
                  </div>
                  {isAnnual && (
                    <p className="text-[10px] text-emerald-400 font-bold mt-0.5 font-mono">
                      فاتورة سنوية: {price * 12} ر.س (وفر 20%)
                    </p>
                  )}
                </div>

                {/* Feature Checklist */}
                <ul className="space-y-2 text-xs text-[#e6e1e1]">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#d97706] mt-0.5 shrink-0" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10">
                <button
                  disabled={isCurrent}
                  onClick={() => handleUpgradePlan(p.id)}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-[#1C1B1B] text-[#A19E9B]/50 cursor-not-allowed border border-white/5'
                      : 'bg-[#d97706] hover:bg-[#b45309] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                  }`}
                >
                  {isCurrent ? (
                    <span>الباقة المفعلة الآن</span>
                  ) : (
                    <>
                      <span>ترقية إلى هذه الباقة</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { CreditCard, Key, Sliders, ExternalLink } from 'lucide-react';
import { TenantSummary } from '@/types/super-admin';
import { TenantSubscription, SubscriptionPlanId } from '@/types/subscription';
import { SuperAdminService } from '@/lib/services/super-admin.service';
import { SubscriptionBillingService, SAAS_PLANS } from '@/lib/services/subscription-billing.service';

interface AdminSubscriptionsTableProps {
  tenants: TenantSummary[];
  subscriptions: Record<string, TenantSubscription>;
  onAdminChangePlan: (cafeSlug: string, newPlanId: SubscriptionPlanId) => void;
  onOpenWalletModal: (tenant: TenantSummary) => void;
}

export function AdminSubscriptionsTable({
  tenants,
  subscriptions,
  onAdminChangePlan,
  onOpenWalletModal,
}: AdminSubscriptionsTableProps) {
  return (
    <div className="bg-[#141212] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xl overflow-hidden">
      <div className="p-6 border-b border-[rgba(255,255,255,0.1)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <CreditCard className="w-4 h-4 text-[#c92a54]" />
            <span>إدارة اشتراكات وباقات الفروع المركزية (Tenant Subscriptions)</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            يمكن لمالك المنصة تعديل باقة أي فرع فورياً، تفعيل الاشتراك، ومطالعة الفواتير
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#FBF9F5] bg-[#141212] border border-[rgba(255,255,255,0.1)] px-3 py-1.5 rounded-xl">
          <span>الفروع المربوطة: {tenants.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.1)] bg-[#141212] text-[11px] font-bold uppercase text-stone-500 tracking-wider">
              <th className="py-4 px-5">المنشأة / المشترك</th>
              <th className="py-4 px-5">باقة الـ SaaS الحالية</th>
              <th className="py-4 px-5">كوتا كروت المحفظة</th>
              <th className="py-4 px-5">مفتاح الـ API</th>
              <th className="py-4 px-5">دورة الفوترة</th>
              <th className="py-4 px-5">مساهمة الـ MRR</th>
              <th className="py-4 px-5">حالة الاشتراك</th>
              <th className="py-4 px-5 text-center">تعديل الباقة فوراً</th>
              <th className="py-4 px-5 text-center">إدارة الكوتا والمفتاح</th>
              <th className="py-4 px-5">إدارة التاجر</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {tenants.map((t) => {
              const sub = subscriptions[t.slug] || SubscriptionBillingService.getSubscription(t.slug);
              const currentPlan = SubscriptionBillingService.getPlan(sub.planId);
              const mrrValue =
                sub.billingInterval === 'annually'
                  ? currentPlan.annualPricePerMonth
                  : currentPlan.monthlyPrice;

              return (
                <tr key={t.id} className="hover:bg-white/[0.03] transition">
                  <td className="py-4 px-5 font-bold text-[#FBF9F5]">
                    <div>
                      <p className="leading-tight">{t.name}</p>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                        /{t.slug}
                      </p>
                    </div>
                  </td>

                  <td className="py-4 px-5">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                        sub.planId === 'enterprise'
                          ? 'bg-amber-100 text-[#FBF9F5] border-amber-200'
                          : sub.planId === 'multi_location'
                          ? 'bg-[#141212] text-[#FBF9F5] border-[rgba(255,255,255,0.1)]'
                          : sub.planId === 'print'
                          ? 'bg-amber-50 text-[#FBF9F5] border-amber-200'
                          : 'bg-white text-stone-500 border-[rgba(255,255,255,0.1)]'
                      }`}
                    >
                      {currentPlan.name}
                    </span>
                  </td>

                  <td className="py-4 px-5">
                    {(() => {
                      const q = SuperAdminService.checkTenantQuota(t.slug);
                      const percent = q.isByok ? 0 : Math.min(100, Math.round((q.used / Math.max(1, q.quota)) * 100));
                      const isDanger = !q.isByok && percent >= 90;
                      const isWarn = !q.isByok && percent >= 70 && percent < 90;

                      return (
                        <div className="w-36">
                          <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                            <span className="text-[#FBF9F5]">{q.isByok ? 'BYOK خاص' : `${q.used} / ${q.quota}`}</span>
                            <span className={isDanger ? 'text-rose-600' : isWarn ? 'text-[#c92a54]' : 'text-emerald-700'}>
                              {q.isByok ? 'غير محدود' : `${percent}%`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                q.isByok ? 'bg-indigo-600 w-full' : isDanger ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: q.isByok ? '100%' : `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  <td className="py-4 px-5">
                    {(() => {
                      const cfg = SuperAdminService.getTenantWalletConfig(t.id);
                      const isCustom = Boolean(cfg.walletWalletApiKey && !cfg.usePlatformKey);
                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isCustom
                              ? 'bg-purple-50 text-purple-900 border-purple-200'
                              : 'bg-[#0B0A0A] text-stone-700 border-stone-200'
                          }`}
                        >
                          <Key className="w-3 h-3 text-[#c92a54]" />
                          <span>{isCustom ? 'مفتاح خاص (BYOK)' : 'مفتاح المنصة'}</span>
                        </span>
                      );
                    })()}
                  </td>

                  <td className="py-4 px-5 text-xs text-stone-500 font-medium">
                    {sub.billingInterval === 'annually' ? 'سنوي (مخصوم 20%)' : 'شهري'}
                  </td>

                  <td className="py-4 px-5 text-xs font-bold text-[#FBF9F5]">
                    {mrrValue} ر.س / شهر
                  </td>

                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        sub.status === 'active'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60'
                          : sub.status === 'trialing'
                          ? 'bg-amber-50 text-[#FBF9F5] border border-amber-200'
                          : 'bg-red-950/40 text-red-400 border border-red-800/60'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          sub.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-[#c92a54]'
                        }`}
                      />
                      <span>{sub.status === 'active' ? 'نشط' : sub.status === 'trialing' ? 'فترة تجربة' : 'متوقف'}</span>
                    </span>
                  </td>

                  <td className="py-4 px-5 text-center">
                    <select
                      value={sub.planId}
                      onChange={(e) =>
                        onAdminChangePlan(t.slug, e.target.value as SubscriptionPlanId)
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] text-xs font-bold text-[#FBF9F5] focus:outline-none focus:ring-1 focus:ring-[#c92a54]"
                    >
                      {SAAS_PLANS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.monthlyPrice} ر.س)
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="py-4 px-5 text-center">
                    <button
                      type="button"
                      onClick={() => onOpenWalletModal(t)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-[#FBF9F5] text-xs font-bold border border-[rgba(255,255,255,0.1)] shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#c92a54]" />
                      <span>ضبط الكوتا</span>
                    </button>
                  </td>

                  <td className="py-4 px-5">
                    <a
                      href="/dashboard"
                      className="px-2.5 py-1 rounded-lg bg-[#141212] hover:bg-[#252424] text-[#FBF9F5] text-xs font-bold flex items-center gap-1 transition w-fit border border-[rgba(255,255,255,0.1)]"
                      title="عرض في لوحة التاجر"
                    >
                      <span>لوحة التاجر</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

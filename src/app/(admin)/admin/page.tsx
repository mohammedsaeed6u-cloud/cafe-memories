'use client';

import React, { useState, useEffect } from 'react';
import { SuperAdminService } from '@/lib/services/super-admin.service';
import { SubscriptionBillingService, SAAS_PLANS } from '@/lib/services/subscription-billing.service';
import { TenantSummary, SystemTelemetry, TenantFeatureFlags } from '@/types/super-admin';
import {
  SubscriptionPlanId,
  SaaSPlatformMetrics,
  TenantSubscription,
} from '@/types/subscription';
import {
  Shield,
  Activity,
  Server,
  HardDrive,
  Users,
  Printer,
  Monitor,
  ExternalLink,
  CheckCircle,
  Zap,
  Globe,
  Lock,
  Layers,
  Sparkles,
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
  BadgeCheck,
} from 'lucide-react';

export default function SuperAdminPortalPage() {
  const [tenants, setTenants] = useState<TenantSummary[]>(() =>
    SuperAdminService.getTenants()
  );
  const [telemetry, setTelemetry] = useState<SystemTelemetry>(() =>
    SuperAdminService.getTelemetry()
  );
  const [saasMetrics, setSaasMetrics] = useState<SaaSPlatformMetrics>(() =>
    SubscriptionBillingService.getPlatformSaaSMetrics()
  );
  const [subscriptions, setSubscriptions] = useState<Record<string, TenantSubscription>>(() =>
    SubscriptionBillingService.getAllSubscriptions()
  );
  const [notice, setNotice] = useState<string | null>(null);

  // Sync state updates
  useEffect(() => {
    const handleTenantsUpdate = (e: any) => {
      if (e.detail) {
        setTenants(e.detail);
        setTelemetry(SuperAdminService.getTelemetry());
      }
    };

    const handleSubsUpdate = () => {
      setSubscriptions(SubscriptionBillingService.getAllSubscriptions());
      setSaasMetrics(SubscriptionBillingService.getPlatformSaaSMetrics());
    };

    window.addEventListener('memories-tenants-updated', handleTenantsUpdate);
    window.addEventListener('memories-subscription-updated', handleSubsUpdate);
    return () => {
      window.removeEventListener('memories-tenants-updated', handleTenantsUpdate);
      window.removeEventListener('memories-subscription-updated', handleSubsUpdate);
    };
  }, []);

  // Toggle Feature Flag (Printing / TV Wall)
  const handleToggleFeature = (
    tenantId: string,
    feature: keyof TenantFeatureFlags,
    currentValue: boolean
  ) => {
    const updated = SuperAdminService.toggleFeature(tenantId, feature, !currentValue);
    setTenants(updated);
    setTelemetry(SuperAdminService.getTelemetry());

    const tenant = updated.find((t) => t.id === tenantId);
    const featureName = feature === 'printing' ? 'محطة الطباعة 2x6' : 'شاشة العرض الحية (TV Wall)';
    setNotice(
      `تم ${!currentValue ? 'تفعيل' : 'تعطيل'} ${featureName} للفرع (${tenant?.name}) بنجاح!`
    );
    setTimeout(() => setNotice(null), 3500);
  };

  // Change Subscription Plan for a tenant
  const handleAdminChangePlan = (cafeSlug: string, newPlanId: SubscriptionPlanId) => {
    SubscriptionBillingService.adminSetTenantPlan(cafeSlug, newPlanId, 'active');
    setSubscriptions(SubscriptionBillingService.getAllSubscriptions());
    setSaasMetrics(SubscriptionBillingService.getPlatformSaaSMetrics());
    const plan = SubscriptionBillingService.getPlan(newPlanId);
    setNotice(`تم تعديل باقة الاشتراك للفرع (${cafeSlug}) بنجاح إلى "${plan.name}"!`);
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex flex-col selection:bg-[#DD0200] selection:text-white font-sans">
      {/* Super Admin Navigation */}
      <header className="bg-[#0E0D0D] text-[#FBF9F5] border-b border-white/10 sticky top-0 z-40 px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-[#FBF9F5] flex items-center justify-center font-black text-lg shadow-lg border border-white/10">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-[#FBF9F5] font-serif">
                  Memories SaaS • Super Admin Portal
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#55100D]/50 text-[#FBF9F5] text-[10px] font-mono font-bold border border-[#DD0200]/40">
                  ENTERPRISE CONTROL
                </span>
              </div>
              <p className="text-[11px] text-[#A19E9B]">
                بوابة الإدارة المركزية، إدارة باقات الـ SaaS، ومتابعة الإيرادات المتكررة MRR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1B1B] border border-white/10 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MRR: {saasMetrics.totalMrr.toLocaleString()} ر.س</span>
            </div>
            <a
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-[#1C1B1B] hover:bg-[#252424] text-[#FBF9F5] font-bold transition flex items-center gap-1.5 border border-white/10"
            >
              <span>لوحة التاجر والاشتراك</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Notice Bar */}
        {notice && (
          <div className="p-4 bg-[#55100D]/40 border border-[#DD0200]/40 text-[#FBF9F5] text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* SECTION 1: SaaS Financial & Revenue Analytics (MRR, ARR, ARPU) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
                <TrendingUp className="w-5 h-5 text-[#DD0200]" />
                <span>مؤشرات إيرادات الـ SaaS الشهرية والسنوية (MRR & ARR Telemetry)</span>
              </h2>
              <p className="text-xs text-[#A19E9B] mt-0.5">
                متابعة الاشتراكات المتكررة، تدفقات السداد، وتوزيع الباقات عبر الفروع
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1: MRR */}
            <div className="p-5 bg-[#141212] rounded-2xl border border-white/10 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-[#A19E9B] mb-1">
                <span className="text-xs font-bold text-[#A19E9B]">الإيراد الشهري المتكرر (MRR)</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">
                {saasMetrics.totalMrr.toLocaleString()}{' '}
                <span className="text-xs font-bold text-[#A19E9B]">ر.س</span>
              </p>
              <p className="text-[10px] text-[#A19E9B]/60 font-bold">Monthly Recurring Revenue</p>
            </div>

            {/* Metric 2: ARR */}
            <div className="p-5 bg-[#141212] rounded-2xl border border-white/10 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-[#A19E9B] mb-1">
                <span className="text-xs font-bold text-[#A19E9B]">الإيراد السنوي المتوقع (ARR)</span>
                <TrendingUp className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-[#FBF9F5]">
                {saasMetrics.totalArr.toLocaleString()}{' '}
                <span className="text-xs font-bold text-[#A19E9B]">ر.س</span>
              </p>
              <p className="text-[10px] text-emerald-400 font-bold">Annual Run Rate Projection</p>
            </div>

            {/* Metric 3: Active Subscriptions */}
            <div className="p-5 bg-[#141212] rounded-2xl border border-white/10 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-[#A19E9B] mb-1">
                <span className="text-xs font-bold text-[#A19E9B]">المشتركون النشطون</span>
                <Users className="w-4 h-4 text-[#DD0200]" />
              </div>
              <p className="text-2xl font-black text-[#FBF9F5]">
                {saasMetrics.activeSubscriptionsCount}{' '}
                <span className="text-xs font-bold text-[#A19E9B]">منشآت ومتاجر نشطة</span>
              </p>
              <p className="text-[10px] text-[#A19E9B]/60 font-bold">
                {saasMetrics.trialingCount} فروع في التجربة المجانية
              </p>
            </div>

            {/* Metric 4: ARPU */}
            <div className="p-5 bg-[#141212] rounded-2xl border border-white/10 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-[#A19E9B] mb-1">
                <span className="text-xs font-bold text-[#A19E9B]">متوسط العائد لكل مقهى (ARPU)</span>
                <CreditCard className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-[#FBF9F5]">
                {saasMetrics.averageRevenuePerUser.toLocaleString()}{' '}
                <span className="text-xs font-bold text-[#A19E9B]">ر.س</span>
              </p>
              <p className="text-[10px] text-emerald-400 font-bold">معدل الإلغاء Churn: 1.2%</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Central SaaS Subscriptions & Tier Control */}
        <div className="bg-[#141212] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
                <CreditCard className="w-4 h-4 text-[#DD0200]" />
                <span>إدارة اشتراكات وباقات الفروع المركزية (Tenant Subscriptions)</span>
              </h3>
              <p className="text-xs text-[#A19E9B] mt-0.5">
                يمكن لمالك المنصة تعديل باقة أي فرع فورياً، تفعيل الاشتراك، ومطالعة الفواتير
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-[#FBF9F5] bg-[#1C1B1B] border border-white/10 px-3 py-1.5 rounded-xl">
              <span>الفروع المربوطة: {tenants.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#1C1B1B] text-[11px] font-bold uppercase text-[#A19E9B] tracking-wider">
                  <th className="py-4 px-5">المنشأة / المشترك</th>
                  <th className="py-4 px-5">باقة الـ SaaS الحالية</th>
                  <th className="py-4 px-5">دورة الفوترة</th>
                  <th className="py-4 px-5">مساهمة الـ MRR</th>
                  <th className="py-4 px-5">حالة الاشتراك</th>
                  <th className="py-4 px-5 text-center">تعديل الباقة فوراً</th>
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
                      {/* Name & Slug */}
                      <td className="py-4 px-5 font-bold text-[#FBF9F5]">
                        <div>
                          <p className="leading-tight">{t.name}</p>
                          <p className="text-[11px] text-[#A19E9B] font-mono mt-0.5">
                            /{t.slug}
                          </p>
                        </div>
                      </td>

                      {/* Current Plan Badge */}
                      <td className="py-4 px-5">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                            sub.planId === 'enterprise'
                              ? 'bg-[#55100D]/60 text-[#FBF9F5] border-[#DD0200]/40'
                              : sub.planId === 'multi_location'
                              ? 'bg-[#1C1B1B] text-[#FBF9F5] border-white/20'
                              : sub.planId === 'print'
                              ? 'bg-[#55100D]/30 text-[#FBF9F5] border-[#DD0200]/30'
                              : 'bg-[#141212] text-[#A19E9B] border-white/10'
                          }`}
                        >
                          {currentPlan.name}
                        </span>
                      </td>

                      {/* Billing Cycle */}
                      <td className="py-4 px-5 text-xs text-[#A19E9B] font-medium">
                        {sub.billingInterval === 'annually' ? 'سنوي (مخصوم 20%)' : 'شهري'}
                      </td>

                      {/* MRR Value */}
                      <td className="py-4 px-5 text-xs font-bold text-[#FBF9F5]">
                        {mrrValue} ر.س / شهر
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'active'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60'
                              : sub.status === 'trialing'
                              ? 'bg-[#55100D]/50 text-[#FBF9F5] border border-[#DD0200]/40'
                              : 'bg-red-950/40 text-red-400 border border-red-800/60'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sub.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-[#DD0200]'
                            }`}
                          />
                          <span>{sub.status === 'active' ? 'نشط' : sub.status === 'trialing' ? 'فترة تجربة' : 'متوقف'}</span>
                        </span>
                      </td>

                      {/* Admin Quick Tier Selector */}
                      <td className="py-4 px-5 text-center">
                        <select
                          value={sub.planId}
                          onChange={(e) =>
                            handleAdminChangePlan(t.slug, e.target.value as SubscriptionPlanId)
                          }
                          className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-[#0B0A0A] text-xs font-bold text-[#FBF9F5] focus:outline-none focus:ring-1 focus:ring-[#DD0200]"
                        >
                          {SAAS_PLANS.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.monthlyPrice} ر.س)
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Direct Link to Merchant Dashboard */}
                      <td className="py-4 px-5">
                        <a
                          href="/dashboard"
                          className="px-2.5 py-1 rounded-lg bg-[#1C1B1B] hover:bg-[#252424] text-[#FBF9F5] text-xs font-bold flex items-center gap-1 transition w-fit border border-white/10"
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

        {/* SECTION 3: High-Scale Infrastructure Telemetry (1M+ Users) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
                <Server className="w-5 h-5 text-[#DD0200]" />
                <span>حالة السيرفرات السحابية ومقاييس الأداء لمليون مستخدم (1M Scale)</span>
              </h2>
              <p className="text-xs text-[#A19E9B] mt-0.5">
                توزيع الحمل عبر Cloudflare Global Network + Supabase RLS Multi-Tenancy + R2 Storage
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="p-5 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between text-[#A19E9B] mb-2">
                <span className="text-xs font-bold text-[#A19E9B]">طاقة الاستيعاب التزامنية</span>
                <Zap className="w-4 h-4 text-[#DD0200]" />
              </div>
              <p className="text-2xl font-black text-[#FBF9F5]">{telemetry.totalUsersCapacity}</p>
              <p className="text-[10px] text-emerald-400 font-bold mt-1">Distributed Workers</p>
            </div>

            {/* Metric 2 */}
            <div className="p-5 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between text-[#A19E9B] mb-2">
                <span className="text-xs font-bold text-[#A19E9B]">معدل كاش الحافة (Edge Cache)</span>
                <Globe className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">{telemetry.edgeCacheHitRatio}</p>
              <p className="text-[10px] text-[#A19E9B]/70 font-mono mt-1">330+ Global PoPs</p>
            </div>

            {/* Metric 3 */}
            <div className="p-5 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between text-[#A19E9B] mb-2">
                <span className="text-xs font-bold text-[#A19E9B]">مساحة تخزين الصور (R2 / S3)</span>
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-[#FBF9F5]">{telemetry.storageUsedGb} GB</p>
              <p className="text-[10px] text-[#A19E9B]/70 mt-1">WebP Compressed Buckets</p>
            </div>

            {/* Metric 4 */}
            <div className="p-5 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between text-[#A19E9B] mb-2">
                <span className="text-xs font-bold text-[#A19E9B]">زمن الاستجابة العالمي</span>
                <Activity className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-[#FBF9F5]">{telemetry.globalLatencyMs} ms</p>
              <p className="text-[10px] text-emerald-400 font-bold mt-1">Zero Origin Bottleneck</p>
            </div>
          </div>
        </div>

        {/* SECTION 4: Tenants Feature Flagging (Printing / TV Wall) */}
        <div className="bg-[#141212] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
                <Layers className="w-4 h-4 text-[#DD0200]" />
                <span>التحكم في الميزات التشغيلية (Feature Flags)</span>
              </h3>
              <p className="text-xs text-[#A19E9B] mt-0.5">
                تفعيل أو إيقاف محطة الطباعة وشاشات العرض لكل فرع بنقرة واحدة
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#1C1B1B] text-[11px] font-bold uppercase text-[#A19E9B] tracking-wider">
                  <th className="py-4 px-5">المنشأة / المشترك</th>
                  <th className="py-4 px-5 text-center">ميزة الطباعة 2x6</th>
                  <th className="py-4 px-5 text-center">ميزة شاشة العرض (TV Wall)</th>
                  <th className="py-4 px-5">المعاينة المباشرة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.03] transition">
                    <td className="py-4 px-5 font-bold text-[#FBF9F5]">
                      <div>
                        <p className="leading-tight">{t.name}</p>
                        <p className="text-[11px] text-[#A19E9B] font-mono mt-0.5">/{t.slug}</p>
                      </div>
                    </td>

                    {/* Printing Toggle */}
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() =>
                          handleToggleFeature(t.id, 'printing', t.features.printing)
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                          t.features.printing
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60'
                            : 'bg-[#1C1B1B] text-[#A19E9B] border border-white/10 hover:bg-[#252424]'
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{t.features.printing ? 'مُفعّلة (ON)' : 'مُعطّلة (OFF)'}</span>
                      </button>
                    </td>

                    {/* TV Wall Toggle */}
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() =>
                          handleToggleFeature(t.id, 'tvWall', t.features.tvWall)
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                          t.features.tvWall
                            ? 'bg-sky-950/40 text-sky-400 border border-sky-800/60'
                            : 'bg-[#1C1B1B] text-[#A19E9B] border border-white/10 hover:bg-[#252424]'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>{t.features.tvWall ? 'مُفعّلة (ON)' : 'مُعطّلة (OFF)'}</span>
                      </button>
                    </td>

                    {/* Direct Links */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/c/${t.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[#1C1B1B] hover:bg-[#252424] text-[#FBF9F5] text-xs font-bold flex items-center gap-1 transition border border-white/10"
                        >
                          <span>الفوتوبوث</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <a
                          href={`/wall/${t.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold flex items-center gap-1 transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                        >
                          <span>الشاشة</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

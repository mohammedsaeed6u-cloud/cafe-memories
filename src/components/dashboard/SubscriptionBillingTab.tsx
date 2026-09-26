'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Tv,
  Printer,
  Users,
  ShieldCheck,
  ArrowUpRight,
  Download,
  AlertCircle,
  Calendar,
  Building,
  Sparkles,
  Clock,
  FileText,
  Check,
  X,
  RefreshCw,
  QrCode,
  Lock,
} from 'lucide-react';
import { SubscriptionBillingService } from '@/lib/services/subscription-billing.service';
import {
  SubscriptionPlan,
  SubscriptionPlanId,
  BillingInterval,
  TenantSubscription,
  InvoiceRecord,
  PaymentMethodInfo,
} from '@/types/subscription';

interface Props {
  cafeSlug: string;
}

export function SubscriptionBillingTab({ cafeSlug }: Props) {
  const [subscription, setSubscription] = useState<TenantSubscription>(() =>
    SubscriptionBillingService.getSubscription(cafeSlug)
  );
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() =>
    SubscriptionBillingService.getInvoices(cafeSlug)
  );
  const [plans] = useState<SubscriptionPlan[]>(() => SubscriptionBillingService.getPlans());

  const [notification, setNotification] = useState<string | null>(null);
  const [isChangingCard, setIsChangingCard] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // New Card State
  const [cardHolder, setCardHolder] = useState('إدارة المقهى');
  const [cardNumber, setCardNumber] = useState('4820 1930 2840 9102');
  const [expiry, setExpiry] = useState('11/28');
  const [cardBrand, setCardBrand] = useState<'mada' | 'visa' | 'mastercard'>('mada');

  // Sync when event emits
  useEffect(() => {
    const handleUpdate = () => {
      setSubscription(SubscriptionBillingService.getSubscription(cafeSlug));
      setInvoices(SubscriptionBillingService.getInvoices(cafeSlug));
    };

    window.addEventListener('memories-subscription-updated', handleUpdate);
    window.addEventListener('memories-invoices-updated', handleUpdate);
    return () => {
      window.removeEventListener('memories-subscription-updated', handleUpdate);
      window.removeEventListener('memories-invoices-updated', handleUpdate);
    };
  }, [cafeSlug]);

  const activePlan = SubscriptionBillingService.getPlan(subscription.planId);
  const isAnnual = subscription.billingInterval === 'annually';

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleInterval = () => {
    const updated = SubscriptionBillingService.toggleBillingInterval(cafeSlug);
    setSubscription(updated);
    showNotification(
      `تم تحويل دورة الفوترة بنجاح إلى ${updated.billingInterval === 'annually' ? 'الدفع السنوي (مع وفر 20%)' : 'الدفع الشهري'}`
    );
  };

  const handleUpgradePlan = (planId: SubscriptionPlanId) => {
    if (planId === subscription.planId) return;
    const targetPlan = SubscriptionBillingService.getPlan(planId);
    const updated = SubscriptionBillingService.changePlan(cafeSlug, planId);
    setSubscription(updated);
    setInvoices(SubscriptionBillingService.getInvoices(cafeSlug));
    showNotification(`تمت ترقية الاشتراك بنجاح إلى "${targetPlan.name}" وتوليد الفاتورة الضريبية!`);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    const last4 = cardNumber.replace(/\s+/g, '').slice(-4) || '1234';
    const [m, y] = expiry.split('/').map((s) => parseInt(s.trim(), 10));

    const updatedPayment: PaymentMethodInfo = {
      brand: cardBrand,
      last4,
      expiryMonth: m || 12,
      expiryYear: y ? 2000 + y : 2028,
      cardHolderName: cardHolder,
    };

    const updated = SubscriptionBillingService.updatePaymentMethod(cafeSlug, updatedPayment);
    setSubscription(updated);
    setIsChangingCard(false);
    showNotification('تم تحديث بطاقة الدفع المعتمدة بنجاح!');
  };

  const handleToggleCancel = () => {
    if (subscription.cancelAtPeriodEnd) {
      const updated = SubscriptionBillingService.reactivateSubscription(cafeSlug);
      setSubscription(updated);
      setIsCancelConfirmOpen(false);
      showNotification('تم إلغاء طلب إنهاء الاشتراك واستمراره بنجاح!');
    } else {
      const updated = SubscriptionBillingService.cancelSubscription(cafeSlug);
      setSubscription(updated);
      setIsCancelConfirmOpen(false);
      showNotification('تمت جدولة إيقاف الاشتراك عند نهاية الدورة الحالية مع الحفاظ الكامل على بياناتك.');
    }
  };

  // Quotas calculations
  const visitsLimit = activePlan.limits.maxVisitsPerMonth;
  const visitsUsed = subscription.usage.currentMonthVisits;
  const visitsPercent =
    visitsLimit === 'unlimited' ? 10 : Math.min(100, Math.round((visitsUsed / visitsLimit) * 100));

  const screensLimit = activePlan.limits.maxTvScreens;
  const screensUsed = subscription.usage.activeTvScreens;

  const printsLimit = activePlan.limits.maxPrintsPerMonth;
  const printsUsed = subscription.usage.currentMonthPrints;
  const printsPercent =
    printsLimit === 'unlimited'
      ? 15
      : printsLimit === 0
      ? 0
      : Math.min(100, Math.round((printsUsed / printsLimit) * 100));

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 left-6 z-50 p-4 bg-[#141212] text-[#FBF9F5] rounded-xl shadow-2xl flex items-center gap-3 border border-[#DD0200]/40 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-bold">{notification}</p>
        </div>
      )}

      {/* Header & Plan Status Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#141212] border border-white/10 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#55100D]/60 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {subscription.status === 'active'
                  ? 'الاشتراك نشط • Active'
                  : subscription.status === 'trialing'
                  ? 'فترة تجربة نشطة • Trial'
                  : 'معلق'}
              </span>

              {subscription.cancelAtPeriodEnd && (
                <span className="px-2.5 py-1 rounded-md bg-[#55100D]/70 text-[#FBF9F5] border border-[#DD0200]/40 text-xs font-bold font-mono">
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
              className="px-4 py-3 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs flex items-center justify-center gap-2 transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
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

      {/* Quota & Resource Usage Meters */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
              <Zap className="w-4 h-4 text-[#DD0200]" />
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
              <Users className="w-4 h-4 text-[#DD0200]" />
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
                  className="h-full bg-gradient-to-r from-[#55100D] to-[#DD0200] rounded-full transition-all duration-500"
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
              <Tv className="w-4 h-4 text-[#DD0200]" />
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
                  className="h-full bg-gradient-to-r from-[#55100D] to-[#DD0200] rounded-full transition-all duration-500"
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
              <Printer className="w-4 h-4 text-[#DD0200]" />
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
                  className="h-full bg-gradient-to-r from-[#55100D] to-[#DD0200] rounded-full transition-all duration-500"
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

      {/* Plan Switcher / Upgrade Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
              <Sparkles className="w-4 h-4 text-[#DD0200]" />
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
                    ? 'border-[#DD0200] shadow-[0_0_25px_-5px_rgba(221,2,0,0.25)]'
                    : 'border-white/10 hover:border-white/25 shadow-xl'
                }`}
              >
                {/* Badges */}
                <div className="flex items-center justify-between mb-4">
                  {p.badge ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-[#55100D]/70 text-[#FBF9F5] text-[10px] font-bold border border-[#DD0200]/40 font-mono">
                      {p.badge}
                    </span>
                  ) : (
                    <span />
                  )}

                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-md bg-[#55100D] text-[#FBF9F5] text-[10px] font-bold border border-[#DD0200]/50 font-mono">
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
                        <Check className="w-3.5 h-3.5 text-[#DD0200] mt-0.5 shrink-0" />
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
                        : 'bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
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

      {/* ZATCA Tax Invoices & Billing History */}
      <div className="bg-[#141212] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
              <FileText className="w-4 h-4 text-[#DD0200]" />
              <span>الفواتير الضريبية وسجل السداد (ZATCA Tax Invoices)</span>
            </h3>
            <p className="text-xs text-[#A19E9B] mt-0.5">
              فواتير ضريبية إلكترونية نظامية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك
            </p>
          </div>

          <div className="text-xs text-[#A19E9B] bg-[#0B0A0A] px-3 py-1.5 rounded-lg border border-white/10 font-mono">
            الرقم الضريبي للمنصة: 310294850200003
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center text-[#A19E9B]/50 text-sm">لا توجد فواتير سابقة حتى الآن.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#1C1B1B] text-[11px] font-bold uppercase text-[#A19E9B] tracking-wider font-mono">
                  <th className="py-3.5 px-5">رقم الفاتورة</th>
                  <th className="py-3.5 px-5">التاريخ</th>
                  <th className="py-3.5 px-5">فترة الفوترة</th>
                  <th className="py-3.5 px-5">المبلغ الأساسي</th>
                  <th className="py-3.5 px-5">الضريبة (15%)</th>
                  <th className="py-3.5 px-5">الإجمالي</th>
                  <th className="py-3.5 px-5">الحالة</th>
                  <th className="py-3.5 px-5 text-center">الفاتورة الضريبية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-[#e6e1e1]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#1C1B1B]/50 transition">
                    <td className="py-3.5 px-5 font-mono font-bold text-[#FBF9F5]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-5 text-[#A19E9B]">{formatDate(inv.date)}</td>
                    <td className="py-3.5 px-5 text-[#A19E9B] font-mono text-[11px]">
                      {new Date(inv.periodStart).toLocaleDateString('en-GB')} -{' '}
                      {new Date(inv.periodEnd).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3.5 px-5 text-[#FBF9F5] font-bold font-mono">{inv.amount} ر.س</td>
                    <td className="py-3.5 px-5 text-[#A19E9B] font-mono">{inv.taxAmount} ر.س</td>
                    <td className="py-3.5 px-5 font-bold font-mono text-[#FBF9F5]">{inv.totalAmount} ر.س</td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#55100D]/70 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>مدفوعة</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold transition shadow-sm text-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>عرض الفاتورة</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal (ZATCA Official Preview) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141212] rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-white/10 space-y-6 relative max-h-[90vh] overflow-y-auto text-[#e6e1e1]">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-6 left-6 p-2 rounded-lg text-[#A19E9B] hover:text-[#FBF9F5] hover:bg-[#1C1B1B] transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Invoice Top */}
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#1C1B1B] text-[#A19E9B] border border-white/10">
                  فاتورة ضريبية مبسطة • Simplified Tax Invoice
                </span>
                <h3 className="text-xl font-bold text-[#FBF9F5] mt-1 font-mono">
                  {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#55100D] border border-[#DD0200]/40 text-[#FBF9F5] flex items-center justify-center font-serif font-bold text-xl shadow-md">
                M
              </div>
            </div>

            {/* Vendor & Buyer Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-[#1C1B1B] p-4 rounded-xl border border-white/10">
              <div>
                <p className="font-bold text-[#A19E9B]">المورد (Seller):</p>
                <p className="font-bold text-[#FBF9F5] mt-0.5">منصة ذكريات المحدودة (Memories SaaS)</p>
                <p className="text-[11px] text-[#A19E9B] font-mono">الرقم الضريبي: 310294850200003</p>
                <p className="text-[11px] text-[#A19E9B]">الرياض، المملكة العربية السعودية</p>
              </div>
              <div>
                <p className="font-bold text-[#A19E9B]">العميل (Buyer):</p>
                <p className="font-bold text-[#FBF9F5] mt-0.5 font-mono">{cafeSlug}</p>
                <p className="text-[11px] text-[#A19E9B]">
                  التاريخ: {formatDate(selectedInvoice.date)}
                </p>
                <p className="text-[11px] text-[#A19E9B]">طريقة الدفع: بطاقة مدى / ائتمانية</p>
              </div>
            </div>

            {/* Items */}
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#1C1B1B] border-b border-white/10 font-bold text-[#A19E9B]">
                  <tr>
                    <th className="p-3">الوصف</th>
                    <th className="p-3">المبلغ الخاضع للضريبة</th>
                    <th className="p-3">نسبة الضريبة</th>
                    <th className="p-3">قيمة الضريبة</th>
                    <th className="p-3">المجموع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#e6e1e1]">
                  <tr>
                    <td className="p-3 font-bold text-[#FBF9F5]">
                      اشتراك منصة ذكريات - باقة {selectedInvoice.planId} (
                      {selectedInvoice.billingInterval === 'annually' ? 'سنوي' : 'شهري'})
                    </td>
                    <td className="p-3 text-[#FBF9F5] font-mono">{selectedInvoice.amount} ر.س</td>
                    <td className="p-3 text-[#A19E9B] font-mono">15%</td>
                    <td className="p-3 text-[#A19E9B] font-mono">{selectedInvoice.taxAmount} ر.س</td>
                    <td className="p-3 font-bold text-[#FBF9F5] font-mono">{selectedInvoice.totalAmount} ر.س</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total & QR */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white border border-white/20 rounded-xl flex items-center justify-center p-1 shadow-md">
                  <QrCode className="w-12 h-12 text-[#141212]" />
                </div>
                <div className="text-[10px] text-[#A19E9B] max-w-[180px] leading-tight">
                  رمز الاستجابة السريع المشفر وفق لوائح هيئة الزكاة والضريبة والجمارك (ZATCA E-Invoicing)
                </div>
              </div>

              <div className="text-left space-y-1">
                <p className="text-xs text-[#A19E9B]">المبلغ الإجمالي المستحق:</p>
                <p className="text-2xl font-bold font-mono text-[#DD0200]">
                  {selectedInvoice.totalAmount} ر.س
                </p>
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#55100D]/70 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                  مدفوعة بالكامل
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs flex items-center gap-1.5 transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>طباعة / تحميل الفاتورة PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Update Modal */}
      {isChangingCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141212] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white/10 space-y-5 text-[#e6e1e1]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#FBF9F5] font-serif">تحديث بطاقة الدفع المعتمدة</h3>
                <p className="text-xs text-[#A19E9B] mt-0.5">ربط آمن عبر بوابة الدفع المعتمدة</p>
              </div>
              <button
                onClick={() => setIsChangingCard(false)}
                className="p-1.5 rounded-lg text-[#A19E9B] hover:text-[#FBF9F5] hover:bg-[#1C1B1B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">نوع البطاقة</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mada', 'visa', 'mastercard'] as const).map((b) => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => setCardBrand(b)}
                      className={`py-2 rounded-lg text-xs font-bold uppercase border transition cursor-pointer ${
                        cardBrand === b
                          ? 'border-[#DD0200] bg-[#55100D]/50 text-[#FBF9F5] shadow-xs'
                          : 'border-white/10 text-[#A19E9B] bg-[#1C1B1B] hover:bg-[#211F1F]'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">الاسم على البطاقة</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs font-medium focus:border-[#DD0200] outline-none text-[#FBF9F5] placeholder:text-[#A19E9B]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">رقم البطاقة</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs font-mono font-medium focus:border-[#DD0200] outline-none text-[#FBF9F5] placeholder:text-[#A19E9B]/40"
                  placeholder="0000 0000 0000 0000"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
                    تاريخ الانتهاء
                  </label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs font-mono text-center focus:border-[#DD0200] outline-none text-[#FBF9F5] placeholder:text-[#A19E9B]/40"
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">رمز CVC</label>
                  <input
                    type="password"
                    maxLength={4}
                    defaultValue="***"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs font-mono text-center focus:border-[#DD0200] outline-none text-[#FBF9F5] placeholder:text-[#A19E9B]/40"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangingCard(false)}
                  className="px-4 py-2 rounded-lg text-[#A19E9B] hover:bg-[#1C1B1B] text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
                >
                  حفظ وتأكيد البطاقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141212] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white/10 space-y-5 text-[#e6e1e1]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#55100D] text-[#DD0200] border border-[#DD0200]/40 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#FBF9F5] font-serif">
                  {subscription.cancelAtPeriodEnd ? 'التراجع عن إيقاف الاشتراك' : 'تأكيد إيقاف التجديد التلقائي'}
                </h3>
                <p className="text-xs text-[#A19E9B]">حماية كاملة لبيانات المقهى وأختام العملاء</p>
              </div>
            </div>

            <p className="text-xs text-[#A19E9B] leading-relaxed">
              {subscription.cancelAtPeriodEnd
                ? 'هل ترغب في الاستمرار في باقتك الحالية وتفعيل التجديد التلقائي لضمان عدم توقف الشاشات والطباعة؟'
                : 'عند إيقاف التجديد، ستستمر باقتك نشطة حتى نهاية الفترة المدفوعة. ونضمن لك الحفاظ على كافة كروت العملاء، الأختام، وقوالب الفريمات لمدة 30 يوماً إضافية.'}
            </p>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsCancelConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-[#A19E9B] hover:bg-[#1C1B1B] text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleToggleCancel}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  subscription.cancelAtPeriodEnd
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5]'
                }`}
              >
                {subscription.cancelAtPeriodEnd ? 'تأكيد استمرار الاشتراك' : 'تأكيد جدولة الإيقاف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

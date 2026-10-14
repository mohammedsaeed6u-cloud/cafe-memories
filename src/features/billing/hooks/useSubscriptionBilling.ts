'use client';

import { useState, useEffect } from 'react';
import {
  SubscriptionPlan,
  SubscriptionPlanId,
  TenantSubscription,
  InvoiceRecord,
  PaymentMethodInfo,
} from '@/types/subscription';
import { SubscriptionBillingService } from '@/lib/services/subscription-billing.service';
import { UseSubscriptionBillingReturn } from '../types';

export function useSubscriptionBilling(cafeSlug: string): UseSubscriptionBillingReturn {
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

  return {
    subscription,
    invoices,
    plans,
    notification,
    isChangingCard,
    setIsChangingCard,
    selectedInvoice,
    setSelectedInvoice,
    isCancelConfirmOpen,
    setIsCancelConfirmOpen,
    cardHolder,
    setCardHolder,
    cardNumber,
    setCardNumber,
    expiry,
    setExpiry,
    cardBrand,
    setCardBrand,
    activePlan,
    isAnnual,
    visitsLimit,
    visitsUsed,
    visitsPercent,
    screensLimit,
    screensUsed,
    printsLimit,
    printsUsed,
    printsPercent,
    formatDate,
    handleToggleInterval,
    handleUpgradePlan,
    handleSaveCard,
    handleToggleCancel,
  };
}

import {
  SubscriptionPlan,
  SubscriptionPlanId,
  BillingInterval,
  SubscriptionStatus,
  TenantSubscription,
  InvoiceRecord,
  SaaSPlatformMetrics,
  PaymentMethodInfo,
} from '@/types/subscription';

export const SAAS_PLANS: SubscriptionPlan[] = [
  {
    id: 'digital',
    name: 'الباقة الرقمية',
    nameEn: 'Digital Experience',
    monthlyPrice: 390,
    annualPricePerMonth: 310,
    currency: 'SAR',
    description: 'المثالية للمقاهي العصرية التي تبحث عن ولاء رقمي تفاعلي وتجربة ضيوف فورية بكاميرا الهاتف.',
    popular: false,
    limits: {
      maxVisitsPerMonth: 3000,
      maxTvScreens: 1,
      maxPrintsPerMonth: 0,
      maxBranches: 1,
      customBranding: true,
      dedicatedSupport: false,
      apiAccess: false,
      zatcaInvoicing: true,
    },
    features: [
      'استوديو كاميرا الهاتف الفوري عبر QR الطاولات',
      'كارت الولاء الرقمي في Apple Wallet & Google Wallet',
      'شاشة صالة واحدة حية (1 Live TV Wall Screen)',
      'سعة تصل إلى 3,000 زيارة وتفاعل شهرياً',
      'لوحة تحكم إحصائيات الزوار وسجل العملاء',
      'إدارة أختام الولاء وكوبونات المشروبات المجانية',
      'فواتير ضريبية إلكترونية معتمدة (ZATCA)',
    ],
  },
  {
    id: 'print',
    name: 'باقة الطباعة والتفاعل',
    nameEn: 'Print & Display',
    monthlyPrice: 690,
    annualPricePerMonth: 550,
    currency: 'SAR',
    description: 'الخيار الأكثر شعبية للمتاجر، المطاعم، الصالونات والمقاهي لربط الذكريات الرقمية بطباعة فورية فاخرة.',
    popular: true,
    badge: 'الأكثر طلباً للأنشطة التجارية',
    limits: {
      maxVisitsPerMonth: 8000,
      maxTvScreens: 3,
      maxPrintsPerMonth: 500,
      maxBranches: 1,
      customBranding: true,
      dedicatedSupport: true,
      apiAccess: false,
      zatcaInvoicing: true,
    },
    features: [
      'كافة مميزات الباقة الرقمية بالكامل',
      'ربط محطة الطباعة اللاسلكية اللحظية (AirPrint / DNP / Epson)',
      'تخصيص كامل لأبعاد وقوالب كروت 2×6 و 4×6 مع شعارك',
      'شاشات عرض صالة متعددة (حتى 3 شاشات متزامنة)',
      'حصة 500 كارت صور مطبوع شهرياً مشمولة مع النظام',
      'اعتماد فوري للذكريات عبر رمز PIN الموظف السريع',
      'أولوية الدعم الفني وخدمة العملاء المباشرة',
    ],
  },
  {
    id: 'multi_location',
    name: 'باقة السلاسل والفروع',
    nameEn: 'Multi-Location Enterprise',
    monthlyPrice: 1190,
    annualPricePerMonth: 950,
    currency: 'SAR',
    description: 'المصممة لشركات وسلاسل المقاهي ذات الفروع المتعددة التي تحتاج لإدارة مركزية موحدة.',
    popular: false,
    badge: 'للنمو والتوسع',
    limits: {
      maxVisitsPerMonth: 25000,
      maxTvScreens: 10,
      maxPrintsPerMonth: 2000,
      maxBranches: 5,
      customBranding: true,
      dedicatedSupport: true,
      apiAccess: true,
      zatcaInvoicing: true,
    },
    features: [
      'كافة مميزات باقة الطباعة مع دعم حتى 5 فروع مختلفة',
      'لوحة قيادة مركزية موحدة مع مقارنة أداء الفروع',
      'حتى 10 شاشات عرض متزامنة عبر الفروع',
      'حصة 2,000 كارت صور مطبوع شهرياً',
      'ربط برمجي عبر REST API لتكامل أنظمة المحاسبة والولاء',
      'نطاق مخصص فرعي لكل مقهى وحماية عزل البيانات RLS',
      'مدير حساب خاص ودعم فني على مدار الساعة',
    ],
  },
  {
    id: 'enterprise',
    name: 'باقة المشاريع الكبرى',
    nameEn: 'Enterprise & White-Label',
    monthlyPrice: 2490,
    annualPricePerMonth: 1990,
    currency: 'SAR',
    description: 'حلول مخصصة لسلاسل الامتياز التجاري (Franchises) والهيئات والفعاليات الضخمة.',
    popular: false,
    badge: 'حلول مخصصة',
    limits: {
      maxVisitsPerMonth: 'unlimited',
      maxTvScreens: 'unlimited',
      maxPrintsPerMonth: 'unlimited',
      maxBranches: 'unlimited',
      customBranding: true,
      dedicatedSupport: true,
      apiAccess: true,
      zatcaInvoicing: true,
    },
    features: [
      'تخصيص كامل للنظام وهوية بصرية بيضاء (White-Label 100%)',
      'استضافة مخصصة وسيرفرات معزولة بالكامل',
      'فروع وشاشات وطباعة غير محدودة بدون قيود',
      'تكامل مخصص مع أنظمة نقاط البيع POS (Foodics, Geidea)',
      'اتفاقية مستوى الخدمة التشغيلية المضمونة (99.9% SLA)',
      'عقود سنوية معتمدة مع إصدار فواتير ضريبية مخصصة',
    ],
  },
];

const SUBSCRIPTIONS_KEY = 'memories_tenant_subscriptions_v1';
const INVOICES_KEY = 'memories_tenant_invoices_v1';

const INITIAL_SUBSCRIPTIONS: Record<string, TenantSubscription> = {
  'memories': {
    id: 'sub-memories',
    cafeSlug: 'memories',
    planId: 'print',
    billingInterval: 'monthly',
    status: 'active',
    currentPeriodStart: '2026-09-01T00:00:00.000Z',
    currentPeriodEnd: '2026-10-01T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    paymentMethod: {
      brand: 'mada',
      last4: '4820',
      expiryMonth: 11,
      expiryYear: 2028,
      cardHolderName: 'Memories Studio Operations',
    },
    usage: {
      currentMonthVisits: 1840,
      activeTvScreens: 2,
      currentMonthPrints: 285,
      cycleStartDate: '2026-09-01T00:00:00.000Z',
    },
  },
  'roaster-co': {
    id: 'sub-roaster-co',
    cafeSlug: 'roaster-co',
    planId: 'print',
    billingInterval: 'annually',
    status: 'active',
    currentPeriodStart: '2026-08-15T00:00:00.000Z',
    currentPeriodEnd: '2027-08-15T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    paymentMethod: {
      brand: 'visa',
      last4: '9104',
      expiryMonth: 6,
      expiryYear: 2029,
      cardHolderName: 'Roaster & Co Finance',
    },
    usage: {
      currentMonthVisits: 920,
      activeTvScreens: 1,
      currentMonthPrints: 140,
      cycleStartDate: '2026-09-01T00:00:00.000Z',
    },
  },
  'artisan-cairo': {
    id: 'sub-artisan-cairo',
    cafeSlug: 'artisan-cairo',
    planId: 'digital',
    billingInterval: 'monthly',
    status: 'active',
    currentPeriodStart: '2026-09-05T00:00:00.000Z',
    currentPeriodEnd: '2026-10-05T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    paymentMethod: {
      brand: 'mastercard',
      last4: '3318',
      expiryMonth: 3,
      expiryYear: 2027,
      cardHolderName: 'Artisan Cairo Mgmt',
    },
    usage: {
      currentMonthVisits: 540,
      activeTvScreens: 1,
      currentMonthPrints: 0,
      cycleStartDate: '2026-09-05T00:00:00.000Z',
    },
  },
  'bloom-cafe': {
    id: 'sub-bloom-cafe',
    cafeSlug: 'bloom-cafe',
    planId: 'digital',
    billingInterval: 'monthly',
    status: 'trialing',
    currentPeriodStart: '2026-09-15T00:00:00.000Z',
    currentPeriodEnd: '2026-09-29T00:00:00.000Z',
    trialEndsAt: '2026-09-29T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    paymentMethod: {
      brand: 'mada',
      last4: '7721',
      expiryMonth: 9,
      expiryYear: 2028,
      cardHolderName: 'Bloom Coffee Admin',
    },
    usage: {
      currentMonthVisits: 180,
      activeTvScreens: 0,
      currentMonthPrints: 0,
      cycleStartDate: '2026-09-15T00:00:00.000Z',
    },
  },
};

const INITIAL_INVOICES: Record<string, InvoiceRecord[]> = {
  'memories': [
    {
      id: 'inv-2026-09-esp',
      invoiceNumber: 'ZATCA-INV-2026-0901',
      cafeSlug: 'memories',
      planId: 'print',
      amount: 600,
      taxAmount: 90,
      totalAmount: 690,
      currency: 'SAR',
      status: 'paid',
      date: '2026-09-01T08:30:00.000Z',
      periodStart: '2026-09-01T00:00:00.000Z',
      periodEnd: '2026-10-01T00:00:00.000Z',
      zatcaQr: true,
      billingInterval: 'monthly',
    },
    {
      id: 'inv-2026-08-esp',
      invoiceNumber: 'ZATCA-INV-2026-0801',
      cafeSlug: 'memories',
      planId: 'print',
      amount: 600,
      taxAmount: 90,
      totalAmount: 690,
      currency: 'SAR',
      status: 'paid',
      date: '2026-08-01T08:30:00.000Z',
      periodStart: '2026-08-01T00:00:00.000Z',
      periodEnd: '2026-09-01T00:00:00.000Z',
      zatcaQr: true,
      billingInterval: 'monthly',
    },
  ],
  'roaster-co': [
    {
      id: 'inv-2026-08-roa',
      invoiceNumber: 'ZATCA-INV-2026-0815',
      cafeSlug: 'roaster-co',
      planId: 'print',
      amount: 5739.13,
      taxAmount: 860.87,
      totalAmount: 6600,
      currency: 'SAR',
      status: 'paid',
      date: '2026-08-15T11:00:00.000Z',
      periodStart: '2026-08-15T00:00:00.000Z',
      periodEnd: '2027-08-15T00:00:00.000Z',
      zatcaQr: true,
      billingInterval: 'annually',
    },
  ],
  'artisan-cairo': [
    {
      id: 'inv-2026-09-art',
      invoiceNumber: 'ZATCA-INV-2026-0905',
      cafeSlug: 'artisan-cairo',
      planId: 'digital',
      amount: 339.13,
      taxAmount: 50.87,
      totalAmount: 390,
      currency: 'SAR',
      status: 'paid',
      date: '2026-09-05T09:15:00.000Z',
      periodStart: '2026-09-05T00:00:00.000Z',
      periodEnd: '2026-10-05T00:00:00.000Z',
      zatcaQr: true,
      billingInterval: 'monthly',
    },
  ],
};

export class SubscriptionBillingService {
  private static getStoredSubscriptions(): Record<string, TenantSubscription> {
    if (typeof window === 'undefined') return INITIAL_SUBSCRIPTIONS;
    try {
      const stored = localStorage.getItem(SUBSCRIPTIONS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_SUBSCRIPTIONS;
    } catch {
      return INITIAL_SUBSCRIPTIONS;
    }
  }

  private static saveSubscriptions(subs: Record<string, TenantSubscription>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subs));
      window.dispatchEvent(new CustomEvent('memories-subscription-updated', { detail: subs }));
    } catch (err) {
      console.error('Failed to save subscriptions', err);
    }
  }

  private static getStoredInvoices(): Record<string, InvoiceRecord[]> {
    if (typeof window === 'undefined') return INITIAL_INVOICES;
    try {
      const stored = localStorage.getItem(INVOICES_KEY);
      return stored ? JSON.parse(stored) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  }

  private static saveInvoices(invoices: Record<string, InvoiceRecord[]>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
      window.dispatchEvent(new CustomEvent('memories-invoices-updated', { detail: invoices }));
    } catch (err) {
      console.error('Failed to save invoices', err);
    }
  }

  static getPlans(): SubscriptionPlan[] {
    return SAAS_PLANS;
  }

  static getPlan(planId: SubscriptionPlanId): SubscriptionPlan {
    const found = SAAS_PLANS.find((p) => p.id === planId);
    return found || SAAS_PLANS[0];
  }

  static getSubscription(cafeSlug: string): TenantSubscription {
    const subs = this.getStoredSubscriptions();
    if (subs[cafeSlug]) {
      return subs[cafeSlug];
    }

    // Default subscription for any newly signed up cafe
    const defaultSub: TenantSubscription = {
      id: `sub-${cafeSlug}`,
      cafeSlug,
      planId: 'digital',
      billingInterval: 'monthly',
      status: 'trialing',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 14 * 86400000).toISOString(),
      trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      paymentMethod: {
        brand: 'mada',
        last4: '0000',
        expiryMonth: 12,
        expiryYear: 2029,
        cardHolderName: cafeSlug,
      },
      usage: {
        currentMonthVisits: 0,
        activeTvScreens: 0,
        currentMonthPrints: 0,
        cycleStartDate: new Date().toISOString(),
      },
    };

    subs[cafeSlug] = defaultSub;
    this.saveSubscriptions(subs);
    return defaultSub;
  }

  static changePlan(
    cafeSlug: string,
    newPlanId: SubscriptionPlanId,
    interval?: BillingInterval
  ): TenantSubscription {
    const subs = this.getStoredSubscriptions();
    const current = this.getSubscription(cafeSlug);
    const plan = this.getPlan(newPlanId);

    const now = new Date();
    const nextMonth = new Date(now.getTime() + (interval === 'annually' ? 365 : 30) * 86400000);

    const updated: TenantSubscription = {
      ...current,
      planId: newPlanId,
      billingInterval: interval || current.billingInterval,
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: nextMonth.toISOString(),
    };

    subs[cafeSlug] = updated;
    this.saveSubscriptions(subs);

    // Create corresponding ZATCA invoice for the plan change
    const price = updated.billingInterval === 'annually' ? plan.annualPricePerMonth * 12 : plan.monthlyPrice;
    const baseAmount = parseFloat((price / 1.15).toFixed(2));
    const taxAmount = parseFloat((price - baseAmount).toFixed(2));

    const invoice: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `ZATCA-INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(Math.floor(100 + Math.random() * 900))}`,
      cafeSlug,
      planId: newPlanId,
      amount: baseAmount,
      taxAmount: taxAmount,
      totalAmount: price,
      currency: 'SAR',
      status: 'paid',
      date: now.toISOString(),
      periodStart: now.toISOString(),
      periodEnd: nextMonth.toISOString(),
      zatcaQr: true,
      billingInterval: updated.billingInterval,
    };

    const allInvoices = this.getStoredInvoices();
    const cafeInvoices = allInvoices[cafeSlug] || [];
    allInvoices[cafeSlug] = [invoice, ...cafeInvoices];
    this.saveInvoices(allInvoices);

    return updated;
  }

  static toggleBillingInterval(cafeSlug: string): TenantSubscription {
    const current = this.getSubscription(cafeSlug);
    const newInterval: BillingInterval = current.billingInterval === 'monthly' ? 'annually' : 'monthly';
    return this.changePlan(cafeSlug, current.planId, newInterval);
  }

  static cancelSubscription(cafeSlug: string): TenantSubscription {
    const subs = this.getStoredSubscriptions();
    const current = this.getSubscription(cafeSlug);

    const updated: TenantSubscription = {
      ...current,
      cancelAtPeriodEnd: true,
    };

    subs[cafeSlug] = updated;
    this.saveSubscriptions(subs);
    return updated;
  }

  static reactivateSubscription(cafeSlug: string): TenantSubscription {
    const subs = this.getStoredSubscriptions();
    const current = this.getSubscription(cafeSlug);

    const updated: TenantSubscription = {
      ...current,
      cancelAtPeriodEnd: false,
      status: 'active',
    };

    subs[cafeSlug] = updated;
    this.saveSubscriptions(subs);
    return updated;
  }

  static updatePaymentMethod(
    cafeSlug: string,
    paymentMethod: PaymentMethodInfo
  ): TenantSubscription {
    const subs = this.getStoredSubscriptions();
    const current = this.getSubscription(cafeSlug);

    const updated: TenantSubscription = {
      ...current,
      paymentMethod,
    };

    subs[cafeSlug] = updated;
    this.saveSubscriptions(subs);
    return updated;
  }

  static getInvoices(cafeSlug: string): InvoiceRecord[] {
    const invoices = this.getStoredInvoices();
    return invoices[cafeSlug] || [];
  }

  static getAllSubscriptions(): Record<string, TenantSubscription> {
    return this.getStoredSubscriptions();
  }

  static getPlatformSaaSMetrics(): SaaSPlatformMetrics {
    const subs = this.getStoredSubscriptions();
    const list = Object.values(subs);

    let mrr = 0;
    let activeCount = 0;
    let trialingCount = 0;

    for (const sub of list) {
      if (sub.status === 'active') {
        activeCount++;
        const plan = this.getPlan(sub.planId);
        const monthlyEquivalent = sub.billingInterval === 'annually' ? plan.annualPricePerMonth : plan.monthlyPrice;
        mrr += monthlyEquivalent;
      } else if (sub.status === 'trialing') {
        trialingCount++;
      }
    }

    const arr = mrr * 12;
    const arpu = activeCount > 0 ? Math.round(mrr / activeCount) : 0;

    return {
      totalMrr: mrr,
      totalArr: arr,
      activeSubscriptionsCount: activeCount,
      trialingCount: trialingCount,
      churnRatePercent: 1.2,
      averageRevenuePerUser: arpu,
    };
  }

  static adminSetTenantPlan(
    cafeSlug: string,
    planId: SubscriptionPlanId,
    status: SubscriptionStatus = 'active'
  ): TenantSubscription {
    const subs = this.getStoredSubscriptions();
    const current = this.getSubscription(cafeSlug);

    const updated: TenantSubscription = {
      ...current,
      planId,
      status,
      cancelAtPeriodEnd: false,
    };

    subs[cafeSlug] = updated;
    this.saveSubscriptions(subs);
    return updated;
  }
}

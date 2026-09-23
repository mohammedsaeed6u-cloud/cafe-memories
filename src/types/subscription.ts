export type SubscriptionPlanId = 'digital' | 'print' | 'multi_location' | 'enterprise';

export type BillingInterval = 'monthly' | 'annually';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export interface PlanLimits {
  maxVisitsPerMonth: number | 'unlimited';
  maxTvScreens: number | 'unlimited';
  maxPrintsPerMonth: number | 'unlimited';
  maxBranches: number | 'unlimited';
  customBranding: boolean;
  dedicatedSupport: boolean;
  apiAccess: boolean;
  zatcaInvoicing: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  nameEn: string;
  monthlyPrice: number;
  annualPricePerMonth: number;
  currency: string;
  description: string;
  badge?: string;
  popular?: boolean;
  limits: PlanLimits;
  features: string[];
}

export interface PaymentMethodInfo {
  brand: 'mada' | 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  cardHolderName?: string;
}

export interface SubscriptionUsage {
  currentMonthVisits: number;
  activeTvScreens: number;
  currentMonthPrints: number;
  cycleStartDate: string;
}

export interface TenantSubscription {
  id: string;
  cafeSlug: string;
  planId: SubscriptionPlanId;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: string;
  paymentMethod: PaymentMethodInfo;
  usage: SubscriptionUsage;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  cafeSlug: string;
  planId: SubscriptionPlanId;
  amount: number;
  taxAmount: number; // 15% ZATCA VAT
  totalAmount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  periodStart: string;
  periodEnd: string;
  zatcaQr: boolean;
  billingInterval: BillingInterval;
}

export interface SaaSPlatformMetrics {
  totalMrr: number;
  totalArr: number;
  activeSubscriptionsCount: number;
  trialingCount: number;
  churnRatePercent: number;
  averageRevenuePerUser: number;
}

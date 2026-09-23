import { describe, it, expect, beforeEach } from 'vitest';
import { SubscriptionBillingService, SAAS_PLANS } from '@/lib/services/subscription-billing.service';

describe('SubscriptionBillingService - SaaS Tier Management', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('retrieves all 4 defined SaaS plans matching marketing tiers', () => {
    const plans = SubscriptionBillingService.getPlans();
    expect(plans).toHaveLength(4);
    const planIds = plans.map(p => p.id);
    expect(planIds).toEqual(['digital', 'print', 'multi_location', 'enterprise']);
  });

  it('gets correct pricing and features for the Print plan', () => {
    const plan = SubscriptionBillingService.getPlan('print');
    expect(plan.id).toBe('print');
    expect(plan.monthlyPrice).toBe(690);
    expect(plan.annualPricePerMonth).toBe(550);
    expect(plan.limits.maxPrintsPerMonth).toBe(500);
    expect(plan.limits.maxTvScreens).toBe(3);
    expect(plan.popular).toBe(true);
  });

  it('retrieves initial subscription for Espresso Lab correctly', () => {
    const sub = SubscriptionBillingService.getSubscription('espresso-lab');
    expect(sub.cafeSlug).toBe('espresso-lab');
    expect(sub.planId).toBe('print');
    expect(sub.status).toBe('active');
    expect(sub.paymentMethod.brand).toBe('mada');
    expect(sub.usage.currentMonthPrints).toBe(285);
  });

  it('allows seamless plan upgrade and creates ZATCA invoice', () => {
    const updated = SubscriptionBillingService.changePlan('espresso-lab', 'multi_location', 'annually');
    expect(updated.planId).toBe('multi_location');
    expect(updated.billingInterval).toBe('annually');
    expect(updated.status).toBe('active');

    const invoices = SubscriptionBillingService.getInvoices('espresso-lab');
    expect(invoices.length).toBeGreaterThan(0);
    const latest = invoices[0];
    expect(latest.planId).toBe('multi_location');
    expect(latest.totalAmount).toBe(950 * 12);
    expect(latest.taxAmount).toBeGreaterThan(0);
    expect(latest.status).toBe('paid');
  });

  it('handles cancellation and reactivation lifecycle correctly', () => {
    const cancelled = SubscriptionBillingService.cancelSubscription('espresso-lab');
    expect(cancelled.cancelAtPeriodEnd).toBe(true);

    const reactivated = SubscriptionBillingService.reactivateSubscription('espresso-lab');
    expect(reactivated.cancelAtPeriodEnd).toBe(false);
    expect(reactivated.status).toBe('active');
  });

  it('calculates platform-wide SaaS metrics (MRR, ARR, active counts)', () => {
    const metrics = SubscriptionBillingService.getPlatformSaaSMetrics();
    expect(metrics.totalMrr).toBeGreaterThan(0);
    expect(metrics.totalArr).toBe(metrics.totalMrr * 12);
    expect(metrics.activeSubscriptionsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.averageRevenuePerUser).toBeGreaterThan(0);
  });

  it('allows super-admin plan and status override', () => {
    const sub = SubscriptionBillingService.adminSetTenantPlan('bloom-cafe', 'enterprise', 'active');
    expect(sub.planId).toBe('enterprise');
    expect(sub.status).toBe('active');
  });
});

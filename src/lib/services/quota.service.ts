'use client';

export interface TenantTierQuota {
  tier: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  maxVisitsPerMonth: number;
  maxStorageMb: number;
  maxActiveScreens: number;
  maxMonthlyPrints: number;
}

export const TIER_QUOTAS: Record<string, TenantTierQuota> = {
  STARTER: {
    tier: 'STARTER',
    maxVisitsPerMonth: 500,
    maxStorageMb: 2000,
    maxActiveScreens: 1,
    maxMonthlyPrints: 200,
  },
  GROWTH: {
    tier: 'GROWTH',
    maxVisitsPerMonth: 3000,
    maxStorageMb: 10000,
    maxActiveScreens: 3,
    maxMonthlyPrints: 1000,
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    maxVisitsPerMonth: 100000,
    maxStorageMb: 100000,
    maxActiveScreens: 20,
    maxMonthlyPrints: 50000,
  },
};

export class QuotaService {
  private static tenantUsage = new Map<string, { visits: number; storageMb: number; prints: number; screens: number }>();

  public static getUsage(tenantId: string) {
    return this.tenantUsage.get(tenantId) || { visits: 120, storageMb: 350, prints: 45, screens: 1 };
  }

  public static checkQuota(
    tenantId: string,
    metric: 'visits' | 'storageMb' | 'prints' | 'screens',
    tier: 'STARTER' | 'GROWTH' | 'ENTERPRISE' = 'STARTER'
  ): { allowed: boolean; percentage: number; alertLevel: 'OK' | 'WARNING_80' | 'EXCEEDED_100' } {
    const quota = TIER_QUOTAS[tier] || TIER_QUOTAS.STARTER;
    const usage = this.getUsage(tenantId);

    const limits = {
      visits: quota.maxVisitsPerMonth,
      storageMb: quota.maxStorageMb,
      prints: quota.maxMonthlyPrints,
      screens: quota.maxActiveScreens,
    };

    const current = usage[metric];
    const max = limits[metric];
    const percentage = Math.min(100, Math.round((current / max) * 100));

    if (percentage >= 100) {
      return { allowed: false, percentage, alertLevel: 'EXCEEDED_100' };
    }
    if (percentage >= 80) {
      return { allowed: true, percentage, alertLevel: 'WARNING_80' };
    }
    return { allowed: true, percentage, alertLevel: 'OK' };
  }
}

import { reportIgnoredError } from '@/lib/services/diagnostics';
import { createClient } from '@/lib/supabase/client';
import { TenantSummary, SystemTelemetry, TenantFeatureFlags, TenantWalletConfig } from '@/types/super-admin';

const TENANTS_STORAGE_KEY = 'memories_saas_tenants_v1';

function getNextMonthReset(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getDefaultWalletConfigForTier(tier: string): TenantWalletConfig {
  switch (tier) {
    case 'enterprise':
      return { monthlyPassQuota: 5000, usedPassesThisMonth: 342, quotaResetDate: getNextMonthReset(), usePlatformKey: true, allowOverQuota: false };
    case 'pro':
      return { monthlyPassQuota: 2000, usedPassesThisMonth: 215, quotaResetDate: getNextMonthReset(), usePlatformKey: true, allowOverQuota: false };
    case 'multi_location':
      return { monthlyPassQuota: 2500, usedPassesThisMonth: 180, quotaResetDate: getNextMonthReset(), usePlatformKey: true, allowOverQuota: false };
    case 'digital':
    case 'print':
      return { monthlyPassQuota: 500, usedPassesThisMonth: 65, quotaResetDate: getNextMonthReset(), usePlatformKey: true, allowOverQuota: false };
    case 'free':
    default:
      return { monthlyPassQuota: 100, usedPassesThisMonth: 45, quotaResetDate: getNextMonthReset(), usePlatformKey: true, allowOverQuota: false };
  }
}

export const INITIAL_TENANTS: TenantSummary[] = [
  {
    id: 'ten-1',
    name: 'استوديو الذكريات • Memories Flagship',
    slug: 'memories',
    tier: 'enterprise',
    status: 'active',
    features: {
      printing: true,
      tvWall: true,
      storySharing: true,
      loyaltyCard: true,
    },
    walletConfig: {
      monthlyPassQuota: 5000,
      usedPassesThisMonth: 342,
      quotaResetDate: getNextMonthReset(),
      usePlatformKey: true,
      allowOverQuota: false,
    },
    dailyPhotos: 342,
    totalCustomers: 1840,
    storageUsedMb: 680,
    joinedAt: '2026-08-10',
  },
  {
    id: 'ten-2',
    name: 'Roaster & Co • محامص الرياض',
    slug: 'roaster-co',
    tier: 'pro',
    status: 'active',
    features: {
      printing: true,
      tvWall: true,
      storySharing: true,
      loyaltyCard: true,
    },
    walletConfig: {
      monthlyPassQuota: 2000,
      usedPassesThisMonth: 215,
      quotaResetDate: getNextMonthReset(),
      usePlatformKey: true,
      allowOverQuota: false,
    },
    dailyPhotos: 215,
    totalCustomers: 920,
    storageUsedMb: 410,
    joinedAt: '2026-08-25',
  },
  {
    id: 'ten-3',
    name: 'Artisan Cairo • أرتيزان المعادي',
    slug: 'artisan-cairo',
    tier: 'pro',
    status: 'active',
    features: {
      printing: false, // Turned off as testable feature flag
      tvWall: true,
      storySharing: true,
      loyaltyCard: true,
    },
    walletConfig: {
      monthlyPassQuota: 1000,
      usedPassesThisMonth: 128,
      quotaResetDate: getNextMonthReset(),
      usePlatformKey: true,
      allowOverQuota: false,
    },
    dailyPhotos: 128,
    totalCustomers: 540,
    storageUsedMb: 240,
    joinedAt: '2026-09-01',
  },
  {
    id: 'ten-4',
    name: 'Bloom Coffee & Bakery',
    slug: 'bloom-cafe',
    tier: 'free',
    status: 'trial',
    features: {
      printing: false,
      tvWall: false, // Free tier without TV wall
      storySharing: true,
      loyaltyCard: false,
    },
    walletConfig: {
      monthlyPassQuota: 100,
      usedPassesThisMonth: 45,
      quotaResetDate: getNextMonthReset(),
      usePlatformKey: true,
      allowOverQuota: false,
    },
    dailyPhotos: 45,
    totalCustomers: 180,
    storageUsedMb: 75,
    joinedAt: '2026-09-15',
  },
];

export class SuperAdminService {
  private static inMemoryTenants: TenantSummary[] | null = null;

  private static getStoredTenants(): TenantSummary[] {
    if (typeof window === 'undefined') {
      return this.inMemoryTenants || INITIAL_TENANTS;
    }
    try {
      const stored = localStorage.getItem(TENANTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure walletConfig exists on all tenants
        return parsed.map((t: TenantSummary) => ({
          ...t,
          walletConfig: t.walletConfig || getDefaultWalletConfigForTier(t.tier),
        }));
      }
      return INITIAL_TENANTS;
    } catch {
      return INITIAL_TENANTS;
    }
  }

  private static saveTenants(tenants: TenantSummary[]): void {
    if (typeof window === 'undefined') {
      this.inMemoryTenants = tenants;
      return;
    }
    try {
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
      window.dispatchEvent(
        new CustomEvent('memories-tenants-updated', { detail: tenants })
      );
    } catch (err) {
      console.error('Failed to save tenants', err);
    }
  }

  static getTenants(): TenantSummary[] {
    return this.getStoredTenants();
  }

  static getTenant(tenantIdOrSlug: string): TenantSummary | undefined {
    const tenants = this.getStoredTenants();
    return tenants.find((t) => t.id === tenantIdOrSlug || t.slug === tenantIdOrSlug);
  }

  static getTenantWalletConfig(tenantIdOrSlug: string): TenantWalletConfig {
    const tenant = this.getTenant(tenantIdOrSlug);
    if (!tenant) {
      return {
        monthlyPassQuota: 500,
        usedPassesThisMonth: 0,
        quotaResetDate: getNextMonthReset(),
        usePlatformKey: true,
        allowOverQuota: false,
      };
    }
    return tenant.walletConfig || getDefaultWalletConfigForTier(tenant.tier);
  }

  static updateTenantWalletConfig(
    tenantIdOrSlug: string,
    config: Partial<TenantWalletConfig>
  ): TenantSummary[] {
    const tenants = this.getStoredTenants();
    const updated = tenants.map((t) => {
      if (t.id === tenantIdOrSlug || t.slug === tenantIdOrSlug) {
        const current = t.walletConfig || getDefaultWalletConfigForTier(t.tier);
        return {
          ...t,
          walletConfig: {
            ...current,
            ...config,
          },
        };
      }
      return t;
    });

    this.saveTenants(updated);
    return updated;
  }

  static checkTenantQuota(cafeSlug: string): {
    allowed: boolean;
    remaining: number;
    quota: number;
    used: number;
    isByok: boolean;
    reason?: string;
  } {
    const config = this.getTenantWalletConfig(cafeSlug);
    const isByok = Boolean(config.walletWalletApiKey && !config.usePlatformKey);
    if (isByok) {
      return {
        allowed: true,
        remaining: 999999,
        quota: 999999,
        used: config.usedPassesThisMonth,
        isByok: true,
      };
    }

    const remaining = Math.max(0, config.monthlyPassQuota - config.usedPassesThisMonth);
    const isOver = config.usedPassesThisMonth >= config.monthlyPassQuota;
    const allowed = !isOver || config.allowOverQuota;

    return {
      allowed,
      remaining,
      quota: config.monthlyPassQuota,
      used: config.usedPassesThisMonth,
      isByok: false,
      reason: isOver && !config.allowOverQuota
        ? `تجاوز المتجر الكوتا الشهرية المسموحة لكروت المحفظة (${config.usedPassesThisMonth}/${config.monthlyPassQuota} كارت). يرجى ترقية الباقة أو تزويد مفتاح API خاص به.`
        : undefined,
    };
  }

  static recordPassUsage(cafeSlug: string, count: number = 1): void {
    const tenants = this.getStoredTenants();
    let found = false;
    const updated = tenants.map((t) => {
      if (t.slug === cafeSlug || t.id === cafeSlug) {
        found = true;
        const current = t.walletConfig || getDefaultWalletConfigForTier(t.tier);
        return {
          ...t,
          walletConfig: {
            ...current,
            usedPassesThisMonth: current.usedPassesThisMonth + count,
          },
        };
      }
      return t;
    });

    if (found) {
      this.saveTenants(updated);
    }
  }

  static getEffectiveApiKey(cafeSlug?: string): string {
    if (cafeSlug) {
      const config = this.getTenantWalletConfig(cafeSlug);
      if (config.walletWalletApiKey && !config.usePlatformKey) {
        return config.walletWalletApiKey;
      }
    }
    return (
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_WALLETWALLET_API_KEY) ||
      (typeof process !== 'undefined' && process.env?.WALLETWALLET_API_KEY) ||
      ''
    );
  }

  static toggleFeature(
    tenantId: string,
    feature: keyof TenantFeatureFlags,
    enabled: boolean
  ): TenantSummary[] {
    const tenants = this.getStoredTenants();
    const updated = tenants.map((t) => {
      if (t.id === tenantId) {
        return {
          ...t,
          features: {
            ...t.features,
            [feature]: enabled,
          },
        };
      }
      return t;
    });

    this.saveTenants(updated);
    return updated;
  }

  static resetForTesting(): void {
    this.inMemoryTenants = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(TENANTS_STORAGE_KEY);
      } catch (e) {
        reportIgnoredError('super-admin/resetForTesting', e);
      }
    }
  }

  static getTelemetry(): SystemTelemetry {
    const tenants = this.getStoredTenants();
    const totalPhotos = tenants.reduce((acc, t) => acc + t.dailyPhotos, 0) * 30;
    const totalMb = tenants.reduce((acc, t) => acc + t.storageUsedMb, 0);

    return {
      totalUsersCapacity: '1,000,000+ متزامن',
      activeTenantsCount: tenants.filter((t) => t.status === 'active').length,
      totalPhotosStored: totalPhotos + 12840,
      storageUsedGb: parseFloat(((totalMb + 3200) / 1024).toFixed(2)),
      edgeCacheHitRatio: '99.4%',
      activeCloudflarePops: 330,
      globalLatencyMs: 24,
      supabasePoolStatus: 'healthy',
    };
  }

  public static isSupabaseConfigured(): boolean {
    return Boolean(
      typeof process !== 'undefined' &&
      process.env?.NEXT_PUBLIC_SUPABASE_URL &&
      process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  /**
   * Fetches tenant wallet configuration from Supabase tenant_wallet_quotas table.
   * Falls back to localStorage and tier defaults if offline or table uninitialized.
   */
  static async getTenantWalletConfigAsync(tenantIdOrSlug: string): Promise<TenantWalletConfig> {
    const local = this.getTenantWalletConfig(tenantIdOrSlug);
    if (!this.isSupabaseConfigured()) return local;

    try {
      const supabase = createClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantIdOrSlug);
      const cleanSlug = tenantIdOrSlug.replace(/[^a-zA-Z0-9_-]/g, '');
      const orgQuery = isUuid
        ? supabase.from('organizations').select('id, slug').eq('id', tenantIdOrSlug).maybeSingle()
        : supabase.from('organizations').select('id, slug').eq('slug', cleanSlug).maybeSingle();
      const { data: org } = await orgQuery;

      if (org?.id) {
        const { data: quotaRow, error } = await supabase
          .from('tenant_wallet_quotas')
          .select('*')
          .eq('organization_id', org.id)
          .maybeSingle();

        if (quotaRow && !error) {
          const config: TenantWalletConfig = {
            monthlyPassQuota: quotaRow.monthly_pass_quota ?? local.monthlyPassQuota,
            usedPassesThisMonth: quotaRow.used_passes_this_month ?? local.usedPassesThisMonth,
            quotaResetDate: quotaRow.quota_reset_date || local.quotaResetDate,
            usePlatformKey: quotaRow.use_platform_key ?? local.usePlatformKey,
            walletWalletApiKey: quotaRow.wallet_api_key || local.walletWalletApiKey,
            allowOverQuota: quotaRow.allow_over_quota ?? local.allowOverQuota,
          };
          this.updateTenantWalletConfig(tenantIdOrSlug, config);
          return config;
        }
      }
    } catch (err) {
      reportIgnoredError('services/super-admin#getTenantWalletConfigAsync', err);
    }
    return local;
  }

  /**
   * Persists tenant wallet configuration to both local state and Supabase cloud.
   */
  static async updateTenantWalletConfigAsync(
    tenantIdOrSlug: string,
    config: Partial<TenantWalletConfig>
  ): Promise<TenantSummary[]> {
    const updated = this.updateTenantWalletConfig(tenantIdOrSlug, config);
    if (!this.isSupabaseConfigured()) return updated;

    try {
      const supabase = createClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantIdOrSlug);
      const cleanSlug = tenantIdOrSlug.replace(/[^a-zA-Z0-9_-]/g, '');
      const orgQuery = isUuid
        ? supabase.from('organizations').select('id').eq('id', tenantIdOrSlug).maybeSingle()
        : supabase.from('organizations').select('id').eq('slug', cleanSlug).maybeSingle();
      const { data: org } = await orgQuery;

      if (org?.id) {
        const fullConfig = this.getTenantWalletConfig(tenantIdOrSlug);
        await supabase
          .from('tenant_wallet_quotas')
          .upsert(
            {
              organization_id: org.id,
              monthly_pass_quota: fullConfig.monthlyPassQuota,
              used_passes_this_month: fullConfig.usedPassesThisMonth,
              quota_reset_date: fullConfig.quotaResetDate,
              use_platform_key: fullConfig.usePlatformKey,
              wallet_api_key: fullConfig.walletWalletApiKey || null,
              allow_over_quota: fullConfig.allowOverQuota,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id' }
          );
      }
    } catch (err) {
      reportIgnoredError('services/super-admin#updateTenantWalletConfigAsync', err);
    }
    return updated;
  }

  /**
   * Records pass usage in Supabase tenant_wallet_quotas and local state.
   */
  static async recordPassUsageAsync(cafeSlug: string, count: number = 1): Promise<void> {
    this.recordPassUsage(cafeSlug, count);
    if (!this.isSupabaseConfigured()) return;

    try {
      const supabase = createClient();
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', cafeSlug)
        .maybeSingle();

      if (org?.id) {
        const { data: current } = await supabase
          .from('tenant_wallet_quotas')
          .select('used_passes_this_month')
          .eq('organization_id', org.id)
          .maybeSingle();

        const newUsed = (current?.used_passes_this_month || 0) + count;
        await supabase
          .from('tenant_wallet_quotas')
          .upsert(
            {
              organization_id: org.id,
              used_passes_this_month: newUsed,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id' }
          );
      }
    } catch (err) {
      reportIgnoredError('services/super-admin#recordPassUsageAsync', err);
    }
  }

  /**
   * Discovers organizations in Supabase and synchronizes them into the tenant registry.
   */
  static async syncTenantsFromCloudAsync(): Promise<TenantSummary[]> {
    if (!this.isSupabaseConfigured()) return this.getStoredTenants();

    try {
      const supabase = createClient();
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, slug, status, created_at');

      if (orgs && orgs.length > 0) {
        const currentTenants = this.getStoredTenants();
        const merged = [...currentTenants];

        for (const org of orgs) {
          const idx = merged.findIndex((t) => t.slug === org.slug || t.id === org.id);
          if (idx >= 0) {
            merged[idx] = {
              ...merged[idx],
              name: org.name || merged[idx].name,
              status: org.status === 'active' ? 'active' : merged[idx].status,
            };
          } else {
            merged.push({
              id: org.id,
              name: org.name,
              slug: org.slug,
              tier: 'pro',
              status: 'active',
              features: {
                printing: true,
                tvWall: true,
                storySharing: true,
                loyaltyCard: true,
              },
              walletConfig: getDefaultWalletConfigForTier('pro'),
              dailyPhotos: 0,
              totalCustomers: 0,
              storageUsedMb: 0,
              joinedAt: org.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            });
          }
        }

        this.saveTenants(merged);
        return merged;
      }
    } catch (err) {
      reportIgnoredError('services/super-admin#syncTenantsFromCloudAsync', err);
    }

    return this.getStoredTenants();
  }

}

import { TenantSummary, SystemTelemetry, TenantFeatureFlags } from '@/types/super-admin';

const TENANTS_STORAGE_KEY = 'memories_saas_tenants_v1';

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
    dailyPhotos: 45,
    totalCustomers: 180,
    storageUsedMb: 75,
    joinedAt: '2026-09-15',
  },
];

export class SuperAdminService {
  private static getStoredTenants(): TenantSummary[] {
    if (typeof window === 'undefined') return INITIAL_TENANTS;
    try {
      const stored = localStorage.getItem(TENANTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_TENANTS;
    } catch {
      return INITIAL_TENANTS;
    }
  }

  private static saveTenants(tenants: TenantSummary[]): void {
    if (typeof window === 'undefined') return;
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
}

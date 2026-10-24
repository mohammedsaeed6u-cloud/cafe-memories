import { describe, it, expect, beforeEach } from 'vitest';
import { SuperAdminService } from '@/lib/services/super-admin.service';

describe('SaaS SuperAdmin Cloud Sync & Tenant Quota Persistence', () => {
  beforeEach(() => {
    SuperAdminService.resetForTesting();
  });

  it('provides safe Supabase configuration detector without stderr pollution', () => {
    const isConfigured = SuperAdminService.isSupabaseConfigured();
    expect(typeof isConfigured).toBe('boolean');
  });

  it('retrieves tenant wallet config asynchronously with offline fallback', async () => {
    const config = await SuperAdminService.getTenantWalletConfigAsync('memories');
    expect(config).toBeDefined();
    expect(config.monthlyPassQuota).toBeGreaterThanOrEqual(100);
    expect(typeof config.usePlatformKey).toBe('boolean');
  });

  it('updates tenant wallet config asynchronously and updates memory state immediately', async () => {
    const tenantSlug = 'artisan-cairo';
    const updatedTenants = await SuperAdminService.updateTenantWalletConfigAsync(tenantSlug, {
      monthlyPassQuota: 1500,
      allowOverQuota: true,
      usePlatformKey: false,
      walletWalletApiKey: 'ww_live_custom_tenant_key_444',
    });

    expect(updatedTenants.length).toBeGreaterThan(0);
    const updated = SuperAdminService.getTenantWalletConfig(tenantSlug);
    expect(updated.monthlyPassQuota).toBe(1500);
    expect(updated.allowOverQuota).toBe(true);
    expect(updated.walletWalletApiKey).toBe('ww_live_custom_tenant_key_444');
    expect(SuperAdminService.getEffectiveApiKey(tenantSlug)).toBe('ww_live_custom_tenant_key_444');
  });

  it('records pass usage asynchronously and updates local count immediately', async () => {
    const tenantSlug = 'roaster-co';
    const initialUsed = SuperAdminService.getTenantWalletConfig(tenantSlug).usedPassesThisMonth;

    await SuperAdminService.recordPassUsageAsync(tenantSlug, 3);
    const afterCount = SuperAdminService.getTenantWalletConfig(tenantSlug).usedPassesThisMonth;
    expect(afterCount).toBe(initialUsed + 3);
  });

  it('synchronizes cloud tenants and prevents duplicate slug records', async () => {
    const synced = await SuperAdminService.syncTenantsFromCloudAsync();
    expect(synced.length).toBeGreaterThanOrEqual(4);

    const slugs = synced.map((t) => t.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });
});

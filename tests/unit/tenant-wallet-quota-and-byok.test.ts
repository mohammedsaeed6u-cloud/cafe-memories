import { describe, it, expect, beforeEach } from 'vitest';
import { SuperAdminService } from '@/lib/services/super-admin.service';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';

describe('SaaS Admin Wallet Quota & BYOK Control (walletwallet.dev)', () => {
  beforeEach(() => {
    SuperAdminService.resetForTesting();
  });

  it('assigns tiered default pass quotas based on tenant subscription plan', () => {
    const enterprise = SuperAdminService.getTenantWalletConfig('memories');
    expect(enterprise.monthlyPassQuota).toBe(5000);
    expect(enterprise.usePlatformKey).toBe(true);

    const pro = SuperAdminService.getTenantWalletConfig('roaster-co');
    expect(pro.monthlyPassQuota).toBe(2000);

    const free = SuperAdminService.getTenantWalletConfig('bloom-cafe');
    expect(free.monthlyPassQuota).toBe(100);
  });

  it('allows SaaS Admin to update tenant quota and over-quota policy', () => {
    const tenantSlug = 'artisan-cairo';
    SuperAdminService.updateTenantWalletConfig(tenantSlug, {
      monthlyPassQuota: 750,
      allowOverQuota: true,
    });

    const updated = SuperAdminService.getTenantWalletConfig(tenantSlug);
    expect(updated.monthlyPassQuota).toBe(750);
    expect(updated.allowOverQuota).toBe(true);
  });

  it('allows SaaS Admin to configure custom BYOK API key for a client', () => {
    const tenantSlug = 'roaster-co';
    const clientCustomKey = 'ww_live_client_special_key_999';

    SuperAdminService.updateTenantWalletConfig(tenantSlug, {
      walletWalletApiKey: clientCustomKey,
      usePlatformKey: false,
    });

    // Effective key for this client must be their custom BYOK key
    const effectiveKey = SuperAdminService.getEffectiveApiKey(tenantSlug);
    expect(effectiveKey).toBe(clientCustomKey);

    // Other tenants still receive the platform master key
    const platformKey = SuperAdminService.getEffectiveApiKey('memories');
    expect(platformKey).not.toBe(clientCustomKey);

    // DigitalWalletService honors tenant custom key
    expect(DigitalWalletService.getWalletWalletApiKey(tenantSlug)).toBe(clientCustomKey);
  });

  it('enforces quota when passes limit is reached and allowOverQuota is false', () => {
    const tenantSlug = 'bloom-cafe'; // quota 100, used 45
    
    // Simulate consuming quota to 100
    SuperAdminService.updateTenantWalletConfig(tenantSlug, {
      monthlyPassQuota: 100,
      usedPassesThisMonth: 100,
      allowOverQuota: false,
      usePlatformKey: true,
    });

    const check = SuperAdminService.checkTenantQuota(tenantSlug);
    expect(check.allowed).toBe(false);
    expect(check.remaining).toBe(0);
    expect(check.reason).toContain('تجاوز المتجر الكوتا الشهرية');
  });

  it('allows issuance when allowOverQuota is true even if quota is exceeded', () => {
    const tenantSlug = 'bloom-cafe';
    SuperAdminService.updateTenantWalletConfig(tenantSlug, {
      monthlyPassQuota: 50,
      usedPassesThisMonth: 60,
      allowOverQuota: true,
      usePlatformKey: true,
    });

    const check = SuperAdminService.checkTenantQuota(tenantSlug);
    expect(check.allowed).toBe(true);
    expect(check.remaining).toBe(0);
  });

  it('bypasses platform quota when merchant is using their own BYOK key', () => {
    const tenantSlug = 'memories';
    SuperAdminService.updateTenantWalletConfig(tenantSlug, {
      walletWalletApiKey: 'ww_live_enterprise_direct_key',
      usePlatformKey: false,
      monthlyPassQuota: 10,
      usedPassesThisMonth: 500, // Way over
    });

    const check = SuperAdminService.checkTenantQuota(tenantSlug);
    expect(check.isByok).toBe(true);
    expect(check.allowed).toBe(true);
    expect(check.remaining).toBe(999999);
  });

  it('records pass usage and allows resetting usage for the new billing cycle', () => {
    const tenantSlug = 'roaster-co';
    const initialUsed = SuperAdminService.getTenantWalletConfig(tenantSlug).usedPassesThisMonth;

    SuperAdminService.recordPassUsage(tenantSlug, 5);
    expect(SuperAdminService.getTenantWalletConfig(tenantSlug).usedPassesThisMonth).toBe(initialUsed + 5);

    // Reset usage
    SuperAdminService.updateTenantWalletConfig(tenantSlug, { usedPassesThisMonth: 0 });
    expect(SuperAdminService.getTenantWalletConfig(tenantSlug).usedPassesThisMonth).toBe(0);
  });
});

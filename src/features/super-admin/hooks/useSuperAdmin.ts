'use client';

import { useState, useEffect } from 'react';
import { SuperAdminService } from '@/lib/services/super-admin.service';
import { SubscriptionBillingService } from '@/lib/services/subscription-billing.service';
import { TenantSummary, SystemTelemetry, TenantFeatureFlags } from '@/types/super-admin';
import { SubscriptionPlanId, SaaSPlatformMetrics, TenantSubscription } from '@/types/subscription';
import { SuperAdminState, WalletQuotaEditState } from '../types';

export function useSuperAdmin(): SuperAdminState {
  const [tenants, setTenants] = useState<TenantSummary[]>(() =>
    SuperAdminService.getTenants()
  );
  const [telemetry, setTelemetry] = useState<SystemTelemetry>(() =>
    SuperAdminService.getTelemetry()
  );
  const [saasMetrics, setSaasMetrics] = useState<SaaSPlatformMetrics>(() =>
    SubscriptionBillingService.getPlatformSaaSMetrics()
  );
  const [subscriptions, setSubscriptions] = useState<Record<string, TenantSubscription>>(() =>
    SubscriptionBillingService.getAllSubscriptions()
  );
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleTenantsUpdate = (e: any) => {
      if (e.detail) {
        setTenants(e.detail);
        setTelemetry(SuperAdminService.getTelemetry());
      }
    };

    const handleSubsUpdate = () => {
      setSubscriptions(SubscriptionBillingService.getAllSubscriptions());
      setSaasMetrics(SubscriptionBillingService.getPlatformSaaSMetrics());
    };

    window.addEventListener('memories-tenants-updated', handleTenantsUpdate);
    window.addEventListener('memories-subscription-updated', handleSubsUpdate);
    return () => {
      window.removeEventListener('memories-tenants-updated', handleTenantsUpdate);
      window.removeEventListener('memories-subscription-updated', handleSubsUpdate);
    };
  }, []);

  const handleToggleFeature = (
    tenantId: string,
    feature: keyof TenantFeatureFlags,
    currentValue: boolean
  ) => {
    const updated = SuperAdminService.toggleFeature(tenantId, feature, !currentValue);
    setTenants(updated);
    setTelemetry(SuperAdminService.getTelemetry());

    const tenant = updated.find((t) => t.id === tenantId);
    const featureName = feature === 'printing' ? 'محطة الطباعة 2x6' : 'شاشة العرض الحية (TV Wall)';
    setNotice(
      `تم ${!currentValue ? 'تفعيل' : 'تعطيل'} ${featureName} للفرع (${tenant?.name}) بنجاح!`
    );
    setTimeout(() => setNotice(null), 3500);
  };

  const handleAdminChangePlan = (cafeSlug: string, newPlanId: SubscriptionPlanId) => {
    SubscriptionBillingService.adminSetTenantPlan(cafeSlug, newPlanId, 'active');
    setSubscriptions(SubscriptionBillingService.getAllSubscriptions());
    setSaasMetrics(SubscriptionBillingService.getPlatformSaaSMetrics());
    const plan = SubscriptionBillingService.getPlan(newPlanId);
    setNotice(`تم تعديل باقة الاشتراك للفرع (${cafeSlug}) بنجاح إلى "${plan.name}"!`);
    setTimeout(() => setNotice(null), 3500);
  };

  const [selectedWalletTenant, setSelectedWalletTenant] = useState<TenantSummary | null>(null);
  const [quotaEditData, setQuotaEditData] = useState<WalletQuotaEditState>({
    monthlyPassQuota: 500,
    walletWalletApiKey: '',
    usePlatformKey: true,
    allowOverQuota: false,
  });

  const handleOpenWalletModal = (tenant: TenantSummary) => {
    const config = SuperAdminService.getTenantWalletConfig(tenant.id);
    setSelectedWalletTenant(tenant);
    setQuotaEditData({
      monthlyPassQuota: config.monthlyPassQuota,
      walletWalletApiKey: config.walletWalletApiKey || '',
      usePlatformKey: config.usePlatformKey !== false,
      allowOverQuota: Boolean(config.allowOverQuota),
    });
  };

  const handleCloseWalletModal = () => {
    setSelectedWalletTenant(null);
  };

  const handleSaveWalletConfig = () => {
    if (!selectedWalletTenant) return;
    const updated = SuperAdminService.updateTenantWalletConfig(selectedWalletTenant.id, {
      monthlyPassQuota: Number(quotaEditData.monthlyPassQuota) || 100,
      walletWalletApiKey: quotaEditData.walletWalletApiKey.trim() || undefined,
      usePlatformKey: quotaEditData.usePlatformKey,
      allowOverQuota: quotaEditData.allowOverQuota,
    });
    setTenants(updated);
    setNotice(`تم تحديث كوتا ومفتاح WalletWallet للفرع (${selectedWalletTenant.name}) بنجاح!`);
    setSelectedWalletTenant(null);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleResetUsage = (tenantId: string) => {
    const updated = SuperAdminService.updateTenantWalletConfig(tenantId, {
      usedPassesThisMonth: 0,
    });
    setTenants(updated);
    setNotice('تم تصفير عداد استهلاك الكروت لهذا الشهر بنجاح!');
    setTimeout(() => setNotice(null), 3500);
  };

  return {
    tenants,
    telemetry,
    saasMetrics,
    subscriptions,
    notice,
    selectedWalletTenant,
    quotaEditData,
    handleToggleFeature,
    handleAdminChangePlan,
    handleOpenWalletModal,
    handleCloseWalletModal,
    setQuotaEditData,
    handleSaveWalletConfig,
    handleResetUsage,
  };
}

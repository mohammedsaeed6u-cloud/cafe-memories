'use client';

import { TenantSummary, SystemTelemetry, TenantFeatureFlags } from '@/types/super-admin';
import { SubscriptionPlanId, SaaSPlatformMetrics, TenantSubscription } from '@/types/subscription';

export interface WalletQuotaEditState {
  monthlyPassQuota: number;
  walletWalletApiKey: string;
  usePlatformKey: boolean;
  allowOverQuota: boolean;
}

export interface SuperAdminState {
  tenants: TenantSummary[];
  telemetry: SystemTelemetry;
  saasMetrics: SaaSPlatformMetrics;
  subscriptions: Record<string, TenantSubscription>;
  notice: string | null;
  selectedWalletTenant: TenantSummary | null;
  quotaEditData: WalletQuotaEditState;
  handleToggleFeature: (tenantId: string, feature: keyof TenantFeatureFlags, currentValue: boolean) => void;
  handleAdminChangePlan: (cafeSlug: string, newPlanId: SubscriptionPlanId) => void;
  handleOpenWalletModal: (tenant: TenantSummary) => void;
  handleCloseWalletModal: () => void;
  setQuotaEditData: React.Dispatch<React.SetStateAction<WalletQuotaEditState>>;
  handleSaveWalletConfig: () => void;
  handleResetUsage: (tenantId: string) => void;
}

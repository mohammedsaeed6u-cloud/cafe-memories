'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useSuperAdmin } from '../hooks/useSuperAdmin';
import { AdminHeader } from './AdminHeader';
import { AdminFinancialMetrics } from './AdminFinancialMetrics';
import { AdminSubscriptionsTable } from './AdminSubscriptionsTable';
import { AdminTelemetrySection } from './AdminTelemetrySection';
import { AdminFeatureFlagsTable } from './AdminFeatureFlagsTable';
import { AdminWalletQuotaModal } from './AdminWalletQuotaModal';
import { WalletConnectorsPanel } from '@/components/admin/WalletConnectorsPanel';

export function SuperAdminContent() {
  const {
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
  } = useSuperAdmin();

  return (
    <div className="min-h-screen bg-[#141313] text-[#FBF9F5] flex flex-col selection:bg-[#682025] selection:text-white font-sans">
      <AdminHeader saasMetrics={saasMetrics} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {notice && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <AdminFinancialMetrics saasMetrics={saasMetrics} />

        <AdminSubscriptionsTable
          tenants={tenants}
          subscriptions={subscriptions}
          onAdminChangePlan={handleAdminChangePlan}
          onOpenWalletModal={handleOpenWalletModal}
        />

        <AdminTelemetrySection telemetry={telemetry} />

        <AdminFeatureFlagsTable
          tenants={tenants}
          onToggleFeature={handleToggleFeature}
        />

        <WalletConnectorsPanel />

        <AdminWalletQuotaModal
          tenant={selectedWalletTenant}
          quotaEditData={quotaEditData}
          onClose={handleCloseWalletModal}
          onResetUsage={handleResetUsage}
          onSetQuotaEditData={setQuotaEditData}
          onSave={handleSaveWalletConfig}
        />
      </main>
    </div>
  );
}

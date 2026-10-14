'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { DashboardTab } from '@/components/dashboard/DashboardNavBar';
import { DashboardOverviewTab } from '@/components/dashboard/DashboardOverviewTab';
import { TappyMerchantDashboard } from './TappyMerchantDashboard';
import { DashboardMemoriesTab } from '@/components/dashboard/DashboardMemoriesTab';
import { DashboardCustomersTab } from '@/components/dashboard/DashboardCustomersTab';
import { DashboardWallTab } from '@/components/dashboard/DashboardWallTab';
import { DashboardRewardsTab } from '@/components/dashboard/DashboardRewardsTab';
import { DashboardQrTab } from '@/components/dashboard/DashboardQrTab';
import { DashboardSettingsTab } from '@/components/dashboard/DashboardSettingsTab';
import { DashboardWalletCommandCenter } from '@/components/dashboard/DashboardWalletCommandCenter';
import { DashboardShellState } from '../types';

// Lazy Loaded Heavy Tabs
const PrintStationTab = dynamic(
  () => import('@/components/dashboard/PrintStationTab').then((m) => ({ default: m.PrintStationTab })),
  { loading: () => <div className="p-12 text-center text-stone-400 font-bold text-xs">جاري تحميل محطة الطباعة...</div> }
);
const FrameStudioTab = dynamic(
  () => import('@/components/dashboard/FrameStudioTab').then((m) => ({ default: m.FrameStudioTab })),
  { loading: () => <div className="p-12 text-center text-stone-400 font-bold text-xs">جاري تحميل استوديو الإطارات...</div> }
);
const RetentionAnalyticsTab = dynamic(
  () => import('@/components/dashboard/RetentionAnalyticsTab').then((m) => ({ default: m.RetentionAnalyticsTab })),
  { loading: () => <div className="p-12 text-center text-stone-400 font-bold text-xs">جاري تحميل التحليلات...</div> }
);
const SubscriptionBillingTab = dynamic(
  () => import('@/components/dashboard/SubscriptionBillingTab').then((m) => ({ default: m.SubscriptionBillingTab })),
  { loading: () => <div className="p-12 text-center text-stone-400 font-bold text-xs">جاري تحميل الباقة والاشتراك...</div> }
);

interface DashboardTabRendererProps {
  state: DashboardShellState;
}

export function DashboardTabRenderer({ state }: DashboardTabRendererProps) {
  const {
    activeTab,
    setActiveTab,
    settings,
    handleSettingsUpdated,
    metrics,
    isLoadingMetrics,
    fetchMetrics,
    memories,
    isLoadingMemories,
    fetchMemories,
    customers,
    isLoadingCustomers,
    fetchCustomers,
    screens,
    printQueue,
    batchActionMsg,
    copiedUrl,
    handleCopyUrl,
    isTvBlackout,
    tvSlideDuration,
    tvSyncNotice,
    isPairingScreen,
    pairScreenSuccess,
    pairScreenError,
    isSavingRewards,
    saveRewardsSuccess,
    autoApproveWall,
    customerLiveUrl,
    setIsQuickSetupOpen,
    handleModerateMemory,
    handleToggleAutoApprove,
    handleBatchApprovePending,
    handleBatchHideAll,
    handleDeleteMemory,
    handleAddDirectStamp,
    handleExportCsv,
    handleToggleBlackout,
    handleChangeSlideDuration,
    handleForceRefreshTv,
    handleUnpairScreen,
    handlePairScreenSubmit,
    handleSaveRewards,
  } = state;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
      {activeTab === 'overview' && (
        <TappyMerchantDashboard
          settings={settings}
          onOpenPhotoboothStudio={() => setActiveTab('frames')}
          onOpenLiveWall={() => setActiveTab('wall')}
          onOpenCashierTerminal={() => window.open('/terminal', '_blank')}
        />
      )}


      {activeTab === 'wallet' && (
        <DashboardWalletCommandCenter
          settings={settings}
          onSettingsUpdated={handleSettingsUpdated}
        />
      )}

      {activeTab === 'print' && (
        <PrintStationTab
          queue={printQueue}
          brandName={settings.branding?.name}
        />
      )}

      {activeTab === 'memories' && (
        <DashboardMemoriesTab
          memories={memories}
          isLoadingMemories={isLoadingMemories}
          autoApproveWall={autoApproveWall}
          onToggleAutoApprove={handleToggleAutoApprove}
          onModerateMemory={handleModerateMemory}
          onDeleteMemory={handleDeleteMemory}
          onBatchApprove={handleBatchApprovePending}
          onBatchHideAll={handleBatchHideAll}
          onRefresh={fetchMemories}
          batchActionMsg={batchActionMsg}
        />
      )}

      {activeTab === 'customers' && (
        <DashboardCustomersTab
          customers={customers}
          isLoadingCustomers={isLoadingCustomers}
          onAddDirectStamp={handleAddDirectStamp}
          onExportCsv={handleExportCsv}
          onRefresh={fetchCustomers}
          cafeSlug={settings.cafeSlug}
          requiredVisits={settings.defaultShotCount || 5}
          brandName={settings.branding?.name}
          cafeLogoUrl={settings.branding?.logoUrl}
        />
      )}

      {activeTab === 'wall' && (
        <DashboardWallTab
          screens={screens}
          isTvBlackout={isTvBlackout}
          tvSlideDuration={tvSlideDuration}
          onToggleBlackout={handleToggleBlackout}
          onChangeSlideDuration={handleChangeSlideDuration}
          onForceRefresh={handleForceRefreshTv}
          onUnpairScreen={handleUnpairScreen}
          onPairScreenSubmit={handlePairScreenSubmit}
          isPairingScreen={isPairingScreen}
          pairScreenSuccess={pairScreenSuccess}
          pairScreenError={pairScreenError}
          tvSyncNotice={tvSyncNotice}
          cafeSlug={settings.cafeSlug}
        />
      )}

      {activeTab === 'rewards' && (
        <DashboardRewardsTab
          settings={settings}
          onSaveRewards={handleSaveRewards}
          isSavingRewards={isSavingRewards}
          saveRewardsSuccess={saveRewardsSuccess}
        />
      )}

      {activeTab === 'qrcodes' && (
        <DashboardQrTab
          settings={settings}
          customerLiveUrl={customerLiveUrl}
          onOpenQuickSetup={() => setIsQuickSetupOpen(true)}
        />
      )}

      {activeTab === 'frames' && (
        <FrameStudioTab
          settings={settings}
          onSettingsUpdated={handleSettingsUpdated}
        />
      )}

      {activeTab === 'analytics' && (
        <RetentionAnalyticsTab
          cafeSlug={settings.cafeSlug}
          cafeName={settings.branding?.name}
        />
      )}

      {activeTab === 'settings' && (
        <DashboardSettingsTab
          settings={settings}
          onSettingsUpdated={handleSettingsUpdated}
          onOpenQuickSetup={() => setIsQuickSetupOpen(true)}
        />
      )}

      {activeTab === 'billing' && (
        <SubscriptionBillingTab
          cafeSlug={settings.cafeSlug || 'memories'}
        />
      )}
    </main>
  );
}

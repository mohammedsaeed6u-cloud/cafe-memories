'use client';

import React from 'react';
import { DashboardNavBar } from '@/components/dashboard/DashboardNavBar';
import { useDashboardShell } from '../hooks/useDashboardShell';
import { DashboardTabRenderer } from './DashboardTabRenderer';
import { DashboardModals } from './DashboardModals';

export function DashboardShellContent() {
  const state = useDashboardShell();
  const {
    settings,
    activeTab,
    setActiveTab,
    activeStaff,
    setActiveStaff,
    isStaffModalOpen,
    setIsStaffModalOpen,
    isQuickSetupOpen,
    setIsQuickSetupOpen,
    isBaristaRedeemOpen,
    setIsBaristaRedeemOpen,
    handleSettingsUpdated,
    handleSignOut,
    printQueue,
    memories,
  } = state;

  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex flex-col font-sans selection:bg-[#c92a54] selection:text-white relative">
      {/* Top Navbar Component */}
      <DashboardNavBar
        settings={settings}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeStaff={activeStaff}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onOpenQuickSetup={() => setIsQuickSetupOpen(true)}
        onOpenBaristaRedeem={() => setIsBaristaRedeemOpen(true)}
        onSignOut={handleSignOut}
        printQueueCount={printQueue.length}
        pendingMemoriesCount={memories.filter((m) => m.status === 'pending').length}
      />

      {/* Real-time B2B Notification & Activity Banner */}
      {state.batchActionMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 w-full">
          <div className="p-3.5 rounded-2xl bg-[#1C1B1B] border border-[#c92a54]/60 text-[#FBF9F5] text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c92a54] animate-ping" />
              <span>{state.batchActionMsg}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab View */}
      <DashboardTabRenderer state={state} />

      {/* Global Modals */}
      <DashboardModals
        isStaffModalOpen={isStaffModalOpen}
        onCloseStaffModal={() => setIsStaffModalOpen(false)}
        onStaffLoginSuccess={(member) => {
          setActiveStaff(member);
          setIsStaffModalOpen(false);
        }}
        isQuickSetupOpen={isQuickSetupOpen}
        onCloseQuickSetup={() => setIsQuickSetupOpen(false)}
        settings={settings}
        onSettingsSaved={handleSettingsUpdated}
        isBaristaRedeemOpen={isBaristaRedeemOpen}
        onCloseBaristaRedeem={() => setIsBaristaRedeemOpen(false)}
        activeStaff={activeStaff}
      />
    </div>
  );
}

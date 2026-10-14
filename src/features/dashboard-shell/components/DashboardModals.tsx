'use client';

import React from 'react';
import { StaffMember } from '@/types/staff';
import { BusinessSettings } from '@/types/photobooth';
import { StaffPinModal } from '@/components/dashboard/StaffPinModal';
import { MerchantQuickSetupModal } from '@/components/dashboard/MerchantQuickSetupModal';
import { BaristaRedeemModal } from '@/components/dashboard/BaristaRedeemModal';

interface DashboardModalsProps {
  isStaffModalOpen: boolean;
  onCloseStaffModal: () => void;
  onStaffLoginSuccess: (member: StaffMember) => void;
  isQuickSetupOpen: boolean;
  onCloseQuickSetup: () => void;
  settings: BusinessSettings;
  onSettingsSaved: (newSettings: BusinessSettings) => void;
  isBaristaRedeemOpen: boolean;
  onCloseBaristaRedeem: () => void;
  activeStaff: StaffMember | null;
}

export function DashboardModals({
  isStaffModalOpen,
  onCloseStaffModal,
  onStaffLoginSuccess,
  isQuickSetupOpen,
  onCloseQuickSetup,
  settings,
  onSettingsSaved,
  isBaristaRedeemOpen,
  onCloseBaristaRedeem,
  activeStaff,
}: DashboardModalsProps) {
  return (
    <>
      <StaffPinModal
        open={isStaffModalOpen}
        onClose={onCloseStaffModal}
        onSuccess={onStaffLoginSuccess}
      />

      <MerchantQuickSetupModal
        isOpen={isQuickSetupOpen}
        onClose={onCloseQuickSetup}
        currentSettings={settings}
        onSettingsSaved={onSettingsSaved}
      />

      <BaristaRedeemModal
        isOpen={isBaristaRedeemOpen}
        onClose={onCloseBaristaRedeem}
        settings={settings}
        activeStaff={activeStaff}
      />
    </>
  );
}

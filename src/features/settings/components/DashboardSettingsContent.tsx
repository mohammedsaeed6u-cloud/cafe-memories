'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { UseDashboardSettingsReturn } from '../types';
import { SettingsHeaderBanner } from './SettingsHeaderBanner';
import { SettingsIndustrySection } from './SettingsIndustrySection';
import { SettingsBrandSection } from './SettingsBrandSection';
import { SettingsLoyaltySection } from './SettingsLoyaltySection';
import { SettingsStampStudioSection } from './SettingsStampStudioSection';
import { SettingsBroadcastSection } from './SettingsBroadcastSection';
import { SettingsCardPreviewSection } from './SettingsCardPreviewSection';
import { StaffManagementSection } from '@/components/dashboard/StaffManagementSection';

interface Props {
  vm: UseDashboardSettingsReturn;
  onOpenQuickSetup: () => void;
}

export const DashboardSettingsContent: React.FC<Props> = ({ vm, onOpenQuickSetup }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200 text-[#FBF9F5]">
      <SettingsHeaderBanner
        onOpenQuickSetup={onOpenQuickSetup}
        saveSuccess={vm.saveSuccess}
      />
      <SettingsIndustrySection vm={vm} />
      <SettingsBrandSection vm={vm} />
      {/* Dedicated Staff Management with Anti-Brute-Force PIN Provisioning */}
      <StaffManagementSection cafeSlug={vm.settings.cafeSlug || 'memories'} />
      <SettingsLoyaltySection vm={vm} />
      <SettingsStampStudioSection vm={vm} />
      <SettingsBroadcastSection vm={vm} />
      <SettingsCardPreviewSection vm={vm} />

      {/* Primary Save Action */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-6">
        <button
          type="button"
          onClick={vm.handleSave}
          className="px-8 py-3.5 rounded-2xl bg-[#FBF9F5] hover:bg-[#382D27] text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Save className="w-4 h-4 text-amber-300" />
          <span>حفظ وتطبيق إعدادات المنشأة والختم المخصص</span>
        </button>
      </div>
    </div>
  );
};

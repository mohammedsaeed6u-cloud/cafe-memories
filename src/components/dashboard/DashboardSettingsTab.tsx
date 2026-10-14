'use client';

import React from 'react';
import {
  DashboardSettingsTabProps,
  useDashboardSettings,
  DashboardSettingsContent,
} from '@/features/settings';

export type { DashboardSettingsTabProps };

export function DashboardSettingsTab({
  settings,
  onSettingsUpdated,
  onOpenQuickSetup,
}: DashboardSettingsTabProps) {
  const vm = useDashboardSettings(settings, onSettingsUpdated);

  return (
    <DashboardSettingsContent
      vm={vm}
      onOpenQuickSetup={onOpenQuickSetup}
    />
  );
}

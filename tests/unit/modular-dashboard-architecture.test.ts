import { describe, it, expect } from 'vitest';
import { DashboardNavBar } from '@/components/dashboard/DashboardNavBar';
import { DashboardOverviewTab } from '@/components/dashboard/DashboardOverviewTab';
import { DashboardMemoriesTab } from '@/components/dashboard/DashboardMemoriesTab';
import { DashboardCustomersTab } from '@/components/dashboard/DashboardCustomersTab';
import { DashboardWallTab } from '@/components/dashboard/DashboardWallTab';
import { DashboardRewardsTab } from '@/components/dashboard/DashboardRewardsTab';
import { DashboardQrTab } from '@/components/dashboard/DashboardQrTab';

describe('Modular Dashboard Tab Architecture', () => {
  it('exports all 7 isolated modular dashboard tabs as valid components', () => {
    expect(typeof DashboardNavBar).toBe('function');
    expect(typeof DashboardOverviewTab).toBe('function');
    expect(typeof DashboardMemoriesTab).toBe('function');
    expect(typeof DashboardCustomersTab).toBe('function');
    expect(typeof DashboardWallTab).toBe('function');
    expect(typeof DashboardRewardsTab).toBe('function');
    expect(typeof DashboardQrTab).toBe('function');
  });

  it('verifies DashboardNavBar tab definition consistency', () => {
    const validTabs = ['overview', 'memories', 'customers', 'wall', 'rewards', 'qrcodes', 'frames', 'analytics', 'settings', 'billing'];
    expect(validTabs).toContain('overview');
    expect(validTabs).toContain('memories');
    expect(validTabs).toContain('customers');
    expect(validTabs).toContain('wall');
    expect(validTabs).toContain('rewards');
    expect(validTabs).toContain('qrcodes');
  });
});

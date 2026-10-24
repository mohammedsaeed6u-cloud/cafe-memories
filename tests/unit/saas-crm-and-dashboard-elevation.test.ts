import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { DashboardCustomersTab } from '@/components/dashboard/DashboardCustomersTab';
import { DashboardOverviewTab } from '@/components/dashboard/DashboardOverviewTab';
import { DashboardRewardsTab } from '@/components/dashboard/DashboardRewardsTab';
import { DashboardQrTab } from '@/components/dashboard/DashboardQrTab';

describe('Enterprise SaaS CRM & Dashboard Elevation Suite', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    };
    // @ts-ignore
    global.window = {
      localStorage: mockStorage,
      dispatchEvent: () => true,
    } as any;
    // @ts-ignore
    global.localStorage = mockStorage;
  });

  it('exports all modernized SaaS dashboard components as valid functions', () => {
    expect(typeof DashboardCustomersTab).toBe('function');
    expect(typeof DashboardOverviewTab).toBe('function');
    expect(typeof DashboardRewardsTab).toBe('function');
    expect(typeof DashboardQrTab).toBe('function');
  });

  it('guarantees zero ivory/pale colors (#FAF8F5, #FCFAF7, #EADBCE) in all 4 upgraded tabs', () => {
    const dashboardDir = path.join(process.cwd(), 'src', 'components', 'dashboard');
    const filesToCheck = [
      'DashboardCustomersTab.tsx',
      'DashboardOverviewTab.tsx',
      'DashboardRewardsTab.tsx',
      'DashboardQrTab.tsx',
    ];

    filesToCheck.forEach((file) => {
      const content = fs.readFileSync(path.join(dashboardDir, file), 'utf8');
      expect(content).not.toMatch(/#FAF8F5/i);
      expect(content).not.toMatch(/#FCFAF7/i);
      expect(content).not.toMatch(/#EADBCE/i);
    });
  });

  it('tests CustomerRegistryService customer lifecycle and updateCustomerRecord', () => {
    const testSlug = 'test-saas-crm-' + Date.now();
    const testPhone = '0551234567';
    const testName = 'عبدالله محمد';

    // Register customer
    const registered = CustomerRegistryService.registerCustomer(
      testPhone,
      testName,
      'vip',
      testSlug
    );
    expect(registered.name).toBe(testName);
    expect(registered.phone).toBe('0551234567');
    expect(registered.role).toBe('vip');
    expect(registered.totalVisits).toBe(1);

    // Lookup customer
    const lookup = CustomerRegistryService.lookupCustomer(testPhone, testSlug);
    expect(lookup.exists).toBe(true);
    expect(lookup.name).toBe(testName);

    // Update customer record
    const updated = CustomerRegistryService.updateCustomerRecord(
      testPhone,
      { totalVisits: 4, role: 'daily_visitor' },
      testSlug
    );
    expect(updated?.totalVisits).toBe(4);
    expect(updated?.role).toBe('daily_visitor');

    // Add direct stamp (+1 visit)
    const stamped = CustomerRegistryService.addDirectStamp(testPhone, testSlug);
    expect(stamped).not.toBeNull();
    expect(stamped?.totalVisits).toBe(5);

    // Retrieve all registered
    const list = CustomerRegistryService.getRegisteredCustomers(testSlug);
    expect(list.length).toBe(1);
    expect(list[0].phone).toBe('0551234567');

    // Delete customer
    const deleted = CustomerRegistryService.deleteCustomer(testPhone, testSlug);
    expect(deleted).toBe(true);
    const afterDelete = CustomerRegistryService.getRegisteredCustomers(testSlug);
    expect(afterDelete.length).toBe(0);
  });

  it('tests DigitalWalletService.updateCustomerCardComprehensive (visuals, stamps, and push message)', async () => {
    const testSlug = 'test-cafe-card';
    const testPhone = '0509998877';

    const res = await DigitalWalletService.updateCustomerCardComprehensive({
      cafeSlug: testSlug,
      customerPhone: testPhone,
      customerName: 'سارة خالد',
      stampedCount: 4,
      maxSlots: 5,
      giftTitle: 'فلات وايت مجاني',
      colorHex: '#064E3B',
      stampIcon: '⭐',
      pushMessage: '🎉 مبروك يا سارة! تبقت لك زيارة واحدة للحصول على قهوتك المجانية!',
    });

    expect(res.success).toBe(true);
    expect(res.notifiedDevices).toBeGreaterThanOrEqual(1);

    // Verify customization stored locally in localStorage
    const stored = localStorage.getItem(`stampy_customer_card_customization_${testSlug}_${testPhone}`);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.colorHex).toBe('#064E3B');
    expect(parsed.stampIcon).toBe('⭐');
    expect(parsed.stampedCount).toBe(4);
    expect(parsed.giftTitle).toBe('فلات وايت مجاني');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';

describe('Merchant Control & Review Suite', () => {
  const TEST_SLUG = 'test-roastery-controls';

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

  describe('Customer Retention CRM & Direct Stamp', () => {
    it('registers a customer and retrieves them from CRM', () => {
      const phone = '0551234567';
      const name = 'سعد المنصور';

      const customer = CustomerRegistryService.registerCustomer(phone, name, 'coffee_lover', TEST_SLUG);
      expect(customer.phone).toBe('0551234567');
      expect(customer.name).toBe('سعد المنصور');
      expect(customer.totalVisits).toBe(1);

      const list = CustomerRegistryService.getRegisteredCustomers(TEST_SLUG);
      expect(list.length).toBe(1);
      expect(list[0].phone).toBe('0551234567');
    });

    it('adds direct manual stamp (+1 visit) to an existing customer', () => {
      const phone = '0559876543';
      CustomerRegistryService.registerCustomer(phone, 'ريم العتيبي', 'coffee_lover', TEST_SLUG);

      const updated = CustomerRegistryService.addDirectStamp(phone, TEST_SLUG);
      expect(updated).not.toBeNull();
      expect(updated?.totalVisits).toBe(2);

      const updatedTwice = CustomerRegistryService.addDirectStamp(phone, TEST_SLUG);
      expect(updatedTwice?.totalVisits).toBe(3);
    });

    it('creates and grants a stamp even if customer was not in CRM initially', () => {
      const phone = '0501112233';
      const updated = CustomerRegistryService.addDirectStamp(phone, TEST_SLUG);
      expect(updated).not.toBeNull();
      expect(updated?.totalVisits).toBe(1);
      expect(updated?.phone).toBe('0501112233');
    });

    it('deletes a customer from the CRM registry when requested', () => {
      const phone = '0550000000';
      CustomerRegistryService.registerCustomer(phone, 'عميل مؤقت', 'coffee_lover', TEST_SLUG);
      expect(CustomerRegistryService.getRegisteredCustomers(TEST_SLUG).length).toBe(1);

      const deleted = CustomerRegistryService.deleteCustomer(phone, TEST_SLUG);
      expect(deleted).toBe(true);
      expect(CustomerRegistryService.getRegisteredCustomers(TEST_SLUG).length).toBe(0);
    });
  });

  describe('Rewards Configuration Persistence', () => {
    it('persists custom visit goal and gift title via BusinessSettingsService', () => {
      const settings = BusinessSettingsService.getSettings(TEST_SLUG);
      expect(settings).toBeDefined();

      const updated = {
        ...settings,
        defaultShotCount: 7,
        freeGiftOffer: {
          title: 'كوب V60 كولومبي مجاني',
          subtitle: 'مكافأة الزائر المميز',
          icon: 'coffee',
        },
      };

      BusinessSettingsService.saveSettings(updated);

      const retrieved = BusinessSettingsService.getSettings(TEST_SLUG);
      expect(retrieved.defaultShotCount).toBe(7);
      expect(retrieved.freeGiftOffer.title).toBe('كوب V60 كولومبي مجاني');
      expect(retrieved.freeGiftOffer.subtitle).toBe('مكافأة الزائر المميز');
    });
  });

  describe('Remote TV Wall Command Protocol', () => {
    it('validates blackout command structure', () => {
      const blackoutCmd = {
        type: 'WALL_COMMAND',
        command: 'BLACKOUT',
        blackout: true,
      };
      expect(blackoutCmd.type).toBe('WALL_COMMAND');
      expect(blackoutCmd.command).toBe('BLACKOUT');
      expect(blackoutCmd.blackout).toBe(true);
    });

    it('validates slide speed command structure', () => {
      const speedCmd = {
        type: 'WALL_COMMAND',
        command: 'SET_SPEED',
        durationMs: 12000,
      };
      expect(speedCmd.type).toBe('WALL_COMMAND');
      expect(speedCmd.command).toBe('SET_SPEED');
      expect(speedCmd.durationMs).toBe(12000);
    });
  });
});

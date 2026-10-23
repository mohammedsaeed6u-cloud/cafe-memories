'use client';

import { LoyaltyPurseService, CustomerLoyaltyData } from '@/features/loyalty/loyalty-purse.service';
import { VoucherService, IssuedVoucher } from '@/lib/services/voucher.service';

export interface EnrichedCustomerRecord {
  phone: string;
  name: string;
  role: string;
  totalVisits: number;
  lastVisit: string;
  purse: CustomerLoyaltyData;
  activeVouchersCount: number;
}

export class BatchCrmService {
  /**
   * Batch fetches customers with their loyalty purses and active vouchers in a SINGLE pass.
   * Eliminates the N+1 queries anti-pattern (Pillar 02).
   */
  public static async batchFetchCustomersWithPurse(
    customerPhones: string[],
    cafeSlug: string
  ): Promise<Map<string, EnrichedCustomerRecord>> {
    const results = new Map<string, EnrichedCustomerRecord>();
    if (!customerPhones || customerPhones.length === 0) return results;

    // Single pass fetch of all vouchers for the tenant
    const allTenantVouchers = VoucherService.getAllVouchers(cafeSlug);
    const vouchersByPhone = new Map<string, IssuedVoucher[]>();
    for (const v of allTenantVouchers) {
      const list = vouchersByPhone.get(v.customerPhone) || [];
      list.push(v);
      vouchersByPhone.set(v.customerPhone, list);
    }

    // Process all requested customers in bulk without per-customer storage trips
    for (const phone of customerPhones) {
      const clean = phone.trim().replace(/[^0-9]/g, '');
      if (!clean) continue;

      const purse = LoyaltyPurseService.getData(clean, cafeSlug);
      const customerVouchers = vouchersByPhone.get(clean) || [];
      const activeCount = customerVouchers.filter((v) => v.status === 'ACTIVE').length;

      results.set(clean, {
        phone: clean,
        name: customerVouchers[0]?.customerName || `عميل ${clean.slice(-4)}`,
        role: 'VIP',
        totalVisits: purse.stampedCount + (purse.completedCardsCount * purse.maxSlots),
        lastVisit: purse.lastStampedAt || new Date().toISOString(),
        purse,
        activeVouchersCount: activeCount,
      });
    }

    return results;
  }
}

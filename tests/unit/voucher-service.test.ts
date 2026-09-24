import { describe, it, expect, beforeEach } from 'vitest';
import { VoucherService } from '../../src/lib/services/voucher.service';

describe('VoucherService SaaS Operational Engine', () => {
  const cafeSlug = 'test_boutique';

  beforeEach(() => {
    // Clear storage for test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('issues a voucher with unique code and active status', () => {
    const v = VoucherService.issueVoucher({
      cafeSlug,
      customerPhone: '0501234567',
      customerName: 'سارة أحمد',
      giftTitle: 'جلسة عناية مجانية',
    });

    expect(v.code).toMatch(/^GIFT-\d{4}$/);
    expect(v.status).toBe('ACTIVE');
    expect(v.customerPhone).toBe('0501234567');
    expect(v.customerName).toBe('سارة أحمد');
  });

  it('looks up a voucher by code, case-insensitively and with shorthand digits', () => {
    const v = VoucherService.issueVoucher({
      cafeSlug,
      customerPhone: '0509876543',
      customerName: 'محمد علي',
      giftTitle: 'كوب قهوة مختصة أو حلى مجاني',
      forceCode: 'GIFT-8822',
    });

    // Exact lookup
    const res1 = VoucherService.lookupVoucher('GIFT-8822', cafeSlug);
    expect(res1.found).toBe(true);
    expect(res1.voucher?.customerName).toBe('محمد علي');

    // Lowercase lookup
    const res2 = VoucherService.lookupVoucher('gift-8822', cafeSlug);
    expect(res2.found).toBe(true);

    // Digits only lookup
    const res3 = VoucherService.lookupVoucher('8822', cafeSlug);
    expect(res3.found).toBe(true);
  });

  it('successfully redeems an active voucher with audit tracking', () => {
    VoucherService.issueVoucher({
      cafeSlug,
      customerPhone: '0505555555',
      customerName: 'فاطمة خالد',
      giftTitle: 'خصم 25% على المشتريات',
      forceCode: 'GIFT-3311',
    });

    const redeemRes = VoucherService.redeemVoucher('GIFT-3311', cafeSlug, 'أحمد الكاشير');
    expect(redeemRes.success).toBe(true);
    expect(redeemRes.voucher?.status).toBe('REDEEMED');
    expect(redeemRes.voucher?.redeemedByStaffName).toBe('أحمد الكاشير');
  });

  it('prevents double redemption (idempotency guard)', () => {
    VoucherService.issueVoucher({
      cafeSlug,
      customerPhone: '0501112233',
      customerName: 'كريم محمود',
      giftTitle: 'ساعة لعب مجانية',
      forceCode: 'GIFT-9944',
    });

    const firstRedeem = VoucherService.redeemVoucher('GIFT-9944', cafeSlug, 'مسؤول الصالة');
    expect(firstRedeem.success).toBe(true);

    // Second redemption attempt must fail
    const secondRedeem = VoucherService.redeemVoucher('GIFT-9944', cafeSlug, 'مسؤول آخر');
    expect(secondRedeem.success).toBe(false);
    expect(secondRedeem.error).toContain('تم استبدال هذه الهدية مسبقاً');
  });
});

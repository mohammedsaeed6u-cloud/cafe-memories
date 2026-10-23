'use client';

export interface IssuedVoucher {
  code: string; // e.g. "GIFT-5421"
  cafeSlug: string;
  customerPhone: string;
  customerName: string;
  giftTitle: string;
  giftSubtitle?: string;
  issuedAt: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED';
  redeemedAt?: string;
  redeemedByStaffName?: string;
  version: number;
}

const STORAGE_PREFIX = 'stampy_vouchers_';
const AUDIT_PREFIX = 'stampy_redemption_audit_';

export class VoucherService {
  private static inMemoryStore = new Map<string, string>();
  // In-memory Mutex to prevent Race Conditions (Pillar 01)
  private static activeLocks = new Set<string>();

  private static getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const val = localStorage.getItem(key);
        if (val) return val;
        const legacy = localStorage.getItem(key.replace('stampy_', 'memories_'));
        if (legacy) return legacy;
      } catch {
        return this.inMemoryStore.get(key) || null;
      }
    }
    return this.inMemoryStore.get(key) || null;
  }

  private static setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(key, value);
      } catch {}
    }
    this.inMemoryStore.set(key, value);
  }

  private static getStorageKey(cafeSlug: string): string {
    return `${STORAGE_PREFIX}${cafeSlug || 'stampy'}`;
  }

  public static generateCode(): string {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `GIFT-${num}`;
  }

  public static getAllVouchers(cafeSlug: string): IssuedVoucher[] {
    const raw = this.getItem(this.getStorageKey(cafeSlug));
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static issueVoucher(params: {
    cafeSlug: string;
    customerPhone: string;
    customerName: string;
    giftTitle: string;
    giftSubtitle?: string;
    forceCode?: string;
  }): IssuedVoucher {
    const { cafeSlug, customerPhone, customerName, giftTitle, giftSubtitle, forceCode } = params;
    const cleanPhone = (customerPhone || 'guest').trim().replace(/[^0-9]/g, '') || 'guest';
    const vouchers = this.getAllVouchers(cafeSlug);

    const existingActive = vouchers.find(
      (v) => v.customerPhone === cleanPhone && v.status === 'ACTIVE' && v.giftTitle === giftTitle
    );
    if (existingActive) {
      return existingActive;
    }

    const code = forceCode || this.generateCode();
    const newVoucher: IssuedVoucher = {
      code,
      cafeSlug: cafeSlug || 'stampy',
      customerPhone: cleanPhone,
      customerName: customerName || 'عميل استامبي المميز',
      giftTitle: giftTitle || 'مكافأة وهدية خاصة',
      giftSubtitle,
      issuedAt: new Date().toISOString(),
      status: 'ACTIVE',
      version: 1,
    };

    vouchers.unshift(newVoucher);
    this.setItem(this.getStorageKey(cafeSlug), JSON.stringify(vouchers.slice(0, 250)));
    return newVoucher;
  }

  public static normalizeCode(input: string): string {
    const trimmed = input.trim().toUpperCase();
    if (trimmed.startsWith('GIFT-')) return trimmed;
    const digitsOnly = trimmed.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 4) return `GIFT-${digitsOnly}`;
    return trimmed;
  }

  public static lookupVoucher(
    codeOrQuery: string,
    cafeSlug: string
  ): { found: boolean; voucher?: IssuedVoucher; error?: string } {
    if (!codeOrQuery || !codeOrQuery.trim()) {
      return { found: false, error: 'الرجاء إدخال رمز الهدية أو رقم العميل.' };
    }

    const normalized = this.normalizeCode(codeOrQuery);
    const vouchers = this.getAllVouchers(cafeSlug);

    let match = vouchers.find((v) => v.code.toUpperCase() === normalized);
    if (!match && normalized.length >= 4) {
      match = vouchers.find((v) => v.code.endsWith(normalized.replace(/[^0-9]/g, '')));
    }
    if (!match) {
      const cleanPhone = codeOrQuery.replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 6) {
        match = vouchers.find((v) => v.customerPhone.includes(cleanPhone));
      }
    }

    if (!match) {
      return { found: false, error: 'رمز الهدية غير صالح أو غير موجود في النظام.' };
    }

    return { found: true, voucher: match };
  }

  public static redeemVoucher(
    code: string,
    cafeSlug: string,
    staffName?: string
  ): { success: boolean; voucher?: IssuedVoucher; error?: string } {
    const normalized = this.normalizeCode(code);
    const lockKey = `${cafeSlug}:${normalized}`;

    // Concurrency Mutex Lock (Pillar 01: Race Conditions)
    if (this.activeLocks.has(lockKey)) {
      return {
        success: false,
        error: 'عذراً! يوجد طلب استبدال قيد المعالجة حالياً لنفس الرمز. يرجى الانتظار لتفادي الصرف المزدوج.',
      };
    }

    this.activeLocks.add(lockKey);

    try {
      const lookup = this.lookupVoucher(normalized, cafeSlug);
      if (!lookup.found || !lookup.voucher) {
        return { success: false, error: lookup.error || 'الرمز غير موجود.' };
      }

      const v = lookup.voucher;
      if (v.status === 'REDEEMED') {
        return {
          success: false,
          voucher: v,
          error: `تم استبدال هذه الهدية مسبقاً بتاريخ ${new Date(v.redeemedAt || '').toLocaleDateString('ar-EG')} بواسطة (${v.redeemedByStaffName || 'طاقم العمل'}).`,
        };
      }

      v.status = 'REDEEMED';
      v.redeemedAt = new Date().toISOString();
      v.redeemedByStaffName = staffName || 'طاقم الخدمة المناوب';
      v.version = (v.version || 1) + 1;

      const vouchers = this.getAllVouchers(cafeSlug);
      const idx = vouchers.findIndex((item) => item.code === v.code);
      if (idx !== -1) {
        vouchers[idx] = v;
        this.setItem(this.getStorageKey(cafeSlug), JSON.stringify(vouchers));
      }

      const redKey = `stampy_redemptions_${cafeSlug}_${v.customerPhone}`;
      const prevCount = Number(this.getItem(redKey) || '0');
      this.setItem(redKey, String(prevCount + 1));

      const auditKey = `${AUDIT_PREFIX}${cafeSlug}`;
      const rawAudit = this.getItem(auditKey);
      const audits = rawAudit ? JSON.parse(rawAudit) : [];
      audits.unshift({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        voucherCode: v.code,
        phone: v.customerPhone,
        customerName: v.customerName,
        rewardTitle: v.giftTitle,
        redeemedAt: v.redeemedAt,
        staffName: v.redeemedByStaffName,
        version: v.version,
      });
      this.setItem(auditKey, JSON.stringify(audits.slice(0, 100)));

      return { success: true, voucher: v };
    } finally {
      this.activeLocks.delete(lockKey);
    }
  }

  public static getCustomerVouchers(customerPhone: string, cafeSlug: string): IssuedVoucher[] {
    const cleanPhone = (customerPhone || '').trim().replace(/[^0-9]/g, '');
    if (!cleanPhone) return [];
    return this.getAllVouchers(cafeSlug).filter((v) => v.customerPhone === cleanPhone);
  }
}

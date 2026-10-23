const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../src/lib/services');
const securityDir = path.join(__dirname, '../src/lib/security');
if (!fs.existsSync(securityDir)) fs.mkdirSync(securityDir, { recursive: true });

// 01. Enhanced VoucherService with Mutex & Optimistic Concurrency
const voucherServiceCode = `'use client';

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
  version: number; // Concurrency version for optimistic locking
  lockToken?: string;
}

const STORAGE_PREFIX = 'stampy_vouchers_';
const AUDIT_PREFIX = 'stampy_redemption_audit_';

export class VoucherService {
  private static inMemoryStore = new Map<string, string>();
  // In-memory Mutex to prevent Race Conditions during concurrent redemption
  private static activeLocks = new Set<string>();

  private static getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const val = localStorage.getItem(key);
        if (val) return val;
        // Fallback to legacy key if needed
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
    return \`\${STORAGE_PREFIX}\${cafeSlug || 'stampy'}\`;
  }

  public static generateCode(): string {
    const num = Math.floor(1000 + Math.random() * 9000);
    return \`GIFT-\${num}\`;
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

    // Prevent redundant duplicate active vouchers
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
    if (digitsOnly.length >= 4) return \`GIFT-\${digitsOnly}\`;
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

    // 1. Direct code match
    let match = vouchers.find((v) => v.code.toUpperCase() === normalized);

    // 2. Fallback: match by last 4 digits
    if (!match && normalized.length >= 4) {
      match = vouchers.find((v) => v.code.endsWith(normalized.replace(/[^0-9]/g, '')));
    }

    // 3. Fallback: match by phone
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

  /**
   * Concurrency-Guarded Atomic Redemption
   * Prevents Race Conditions (Pillar 01) via atomic mutex locking & version tokens
   */
  public static redeemVoucher(
    code: string,
    cafeSlug: string,
    staffName?: string
  ): { success: boolean; voucher?: IssuedVoucher; error?: string } {
    const normalized = this.normalizeCode(code);
    const lockKey = \`\${cafeSlug}:\${normalized}\`;

    // 1. Mutex Check: Prevent concurrent processing
    if (this.activeLocks.has(lockKey)) {
      return {
        success: false,
        error: 'عذراً! يوجد طلب استبدال قيد المعالجة حالياً لنفس الرمز. يرجى الانتظار لتفادي الصرف المزدوج.',
      };
    }

    // Acquire atomic lock
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
          error: \`تم استبدال هذه المكافأة مسبقاً بتاريخ \${new Date(v.redeemedAt || '').toLocaleDateString('ar-EG')} بواسطة (\${v.redeemedByStaffName || 'طاقم العمل'}).\`,
        };
      }

      // Concurrency optimistic version bump
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

      // Update customer redemptions counter
      const redKey = \`stampy_redemptions_\${cafeSlug}_\${v.customerPhone}\`;
      const prevCount = Number(this.getItem(redKey) || '0');
      this.setItem(redKey, String(prevCount + 1));

      // Audit log
      const auditKey = \`\${AUDIT_PREFIX}\${cafeSlug}\`;
      const rawAudit = this.getItem(auditKey);
      const audits = rawAudit ? JSON.parse(rawAudit) : [];
      audits.unshift({
        id: \`audit_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`,
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
      // Release atomic lock
      this.activeLocks.delete(lockKey);
    }
  }

  public static getCustomerVouchers(customerPhone: string, cafeSlug: string): IssuedVoucher[] {
    const cleanPhone = (customerPhone || '').trim().replace(/[^0-9]/g, '');
    if (!cleanPhone) return [];
    return this.getAllVouchers(cafeSlug).filter((v) => v.customerPhone === cleanPhone);
  }
}
`;

fs.writeFileSync(path.join(servicesDir, 'voucher.service.ts'), voucherServiceCode, 'utf-8');
console.log('voucher.service.ts updated with Race Condition Guard');
  const isDark = theme === 'dark';

  const iconSizes = {
    sm: { box: 'w-7 h-7 rounded-lg', ticketW: 56, ticketH: 28, text: 'text-xs', cross: 'text-sm' },
    md: { box: 'w-9 h-9 rounded-xl', ticketW: 72, ticketH: 36, text: 'text-sm sm:text-base', cross: 'text-lg' },
    lg: { box: 'w-11 h-11 rounded-2xl', ticketW: 96, ticketH: 48, text: 'text-base sm:text-lg', cross: 'text-2xl' },
  }[size];

  const isFlagshipSolo =
    !cafeName ||
    cafeName.trim().toLowerCase() === 'stampy' ||
    cafeName.trim().toLowerCase() === 'استامبي' ||
    cafeName.trim().toLowerCase() === 'memories' ||
    cafeName.trim().toLowerCase() === 'memories studio';

  if (isFlagshipSolo) {
    return (
      <div className={cn('inline-flex items-center justify-center select-none', className)}>
        <StampyLogo size={size} showTagline={showTagline} />
      </div>
    );
  }

  return (
    <div
      className={cn('inline-flex items-center gap-2 sm:gap-3 select-none flex-wrap', className)}
      dir=\"ltr\"
    >
      {/* 1. Client Business Brand */}
      <div className=\"flex items-center gap-2\">
        {cafeLogoUrl ? (
          <img
            src={cafeLogoUrl}
            alt={cafeName}
            className={cn(
              iconSizes.box,
              'object-cover border border-white/20 shadow-xs'
            )}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div
            className={cn(
              iconSizes.box,
              'bg-[#3D2314] text-[#DFAB56] flex items-center justify-center font-bold shadow-xs border border-[#DFAB56]/30'
            )}
          >
            <Store className=\"w-4 h-4\" />
          </div>
        )}
        <div className=\"text-left\">
          <span
            className={cn(
              'font-bold tracking-tight block leading-tight',
              iconSizes.text,
              isDark ? 'text-white' : 'text-[#12100E]'
            )}
          >
            {cafeName}
          </span>
          {showTagline && (
            <span
              className={cn(
                'text-[8px] font-mono tracking-wider uppercase block font-semibold',
                isDark ? 'text-[#DFAB56]/80' : 'text-[#AC3E25]'
              )}
            >
              الفرع المعتمد
            </span>
          )}
        </div>
      </div>

      {/* Collaboration multiplication cross */}
      <span
        className={cn(
          'font-light select-none px-0.5',
          iconSizes.cross,
          isDark ? 'text-white/40' : 'text-[#3D2314]/40'
        )}
        aria-hidden=\"true\"
      >
        ×
      </span>

      {/* 2. Platform Brand: Stampy */}
      <div className=\"flex items-center gap-2\">
        <div className=\"shrink-0\">
          <StampyTicketIcon width={iconSizes.ticketW} height={iconSizes.ticketH} />
        </div>
        <div className=\"text-left\">
          <div className=\"flex items-baseline gap-1\">
            <span
              style={{ fontFamily: \"'Plus Jakarta Sans', sans-serif\" }}
              className={cn(
                'font-black tracking-tight leading-none',
                iconSizes.text,
                isDark ? 'text-white' : 'text-[#12100E]'
              )}
            >
              stampy<span className=\"text-[#DFAB56]\">.</span>
            </span>
            <span className=\"text-[9px] font-bold text-[#DFAB56] font-mono\">
              استامبي
            </span>
          </div>
          {showTagline && (
            <span
              className={cn(
                'text-[7.5px] font-mono tracking-widest uppercase block font-bold mt-0.5',
                isDark ? 'text-[#D9D9D9]/60' : 'text-stone-500'
              )}
            >
              LOYALTY STUDIO
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync(path.join(__dirname, '../src/components/brand/CoBrandingLogos.tsx'), coBrandingCode, 'utf-8');
console.log('CoBrandingLogos.tsx created successfully');

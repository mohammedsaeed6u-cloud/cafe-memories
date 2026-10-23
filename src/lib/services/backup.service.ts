'use client';

import { VoucherService } from '@/lib/services/voucher.service';

export interface TenantSnapshot {
  tenantId: string;
  brand: string;
  timestamp: string;
  vouchers: unknown[];
  checksum: string;
  version: string;
}

export class BackupService {
  public static generateChecksum(dataString: string): string {
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      hash = ((hash << 5) - hash) + dataString.charCodeAt(i);
      hash |= 0;
    }
    return `sha_${Math.abs(hash).toString(16)}`;
  }

  public static createSnapshot(tenantId: string): TenantSnapshot {
    const vouchers = VoucherService.getAllVouchers(tenantId);
    const rawData = JSON.stringify({ tenantId, vouchers });
    const checksum = this.generateChecksum(rawData);

    return {
      tenantId,
      brand: 'Stampy',
      timestamp: new Date().toISOString(),
      vouchers,
      checksum,
      version: '2.5.0',
    };
  }

  public static verifyAndRestore(snapshot: TenantSnapshot): { success: boolean; error?: string } {
    const rawData = JSON.stringify({ tenantId: snapshot.tenantId, vouchers: snapshot.vouchers });
    const expectedChecksum = this.generateChecksum(rawData);

    if (expectedChecksum !== snapshot.checksum) {
      return { success: false, error: 'فشل استعادة النسخة الاحتياطية: عدم تطابق رمز التحقق من السلامة (Checksum Mismatch).' };
    }

    return { success: true };
  }
}

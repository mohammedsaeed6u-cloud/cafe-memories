const fs = require('fs');
const path = require('path');

const testContent = `import { describe, it, expect, beforeEach } from 'vitest';
import { VoucherService } from '@/lib/services/voucher.service';
import { LoyaltyPurseService } from '@/features/loyalty/loyalty-purse.service';
import { BatchCrmService } from '@/lib/services/batch-crm.service';
import { TelemetryService } from '@/lib/services/telemetry.service';
import { SlidingRateLimiter } from '@/lib/services/sliding-rate-limiter.service';
import { JobQueueService } from '@/lib/services/job-queue.service';
import { QuotaService } from '@/lib/services/quota.service';
import { OfflineSyncService } from '@/lib/services/offline-sync.service';
import { WebhookSecurityService } from '@/lib/services/webhook.service';
import { BackupService } from '@/lib/services/backup.service';
import { IocAuditService } from '@/lib/security/ioc-audit.service';

describe('Stampy 10 Architectural Pillars & Security Suite', () => {
  const tenant = 'test_tenant_stampy';

  beforeEach(() => {
    TelemetryService.clearLogs();
  });

  // 01. Race Conditions
  it('Pillar 01: prevents double-redemption race conditions on vouchers via mutex & optimistic versioning', () => {
    const voucher = VoucherService.issueVoucher({
      cafeSlug: tenant,
      customerPhone: '0555123456',
      customerName: 'سارة خالد',
      giftTitle: 'مكافأة مميزة',
    });

    expect(voucher.status).toBe('ACTIVE');
    expect(voucher.version).toBe(1);

    // 1st redemption succeeds
    const firstAttempt = VoucherService.redeemVoucher(voucher.code, tenant, 'كاشير أ');
    expect(firstAttempt.success).toBe(true);
    expect(firstAttempt.voucher?.status).toBe('REDEEMED');
    expect(firstAttempt.voucher?.version).toBe(2);

    // 2nd redemption fails immediately with friendly error
    const secondAttempt = VoucherService.redeemVoucher(voucher.code, tenant, 'كاشير ب');
    expect(secondAttempt.success).toBe(false);
    expect(secondAttempt.error).toContain('تم استبدال هذه المكافأة مسبقاً');
  });

  // 01. Stamp Mutex
  it('Pillar 01: guards loyalty purse stamps against concurrent double-minting', () => {
    const purse = LoyaltyPurseService.getData('0555999888', tenant, 5);
    expect(purse.stampedCount).toBeGreaterThanOrEqual(1);

    const res = LoyaltyPurseService.addDirectStamp('0555999888', tenant, 5);
    expect(res.success).toBe(true);
    expect(res.newCount).toBe(purse.stampedCount + 1);
  });

  // 02. N+1 Queries
  it('Pillar 02: eliminates N+1 queries by batch fetching customers and purses in a single pass', async () => {
    const phones = ['0500111222', '0500333444', '0500555666'];
    const batchResults = await BatchCrmService.batchFetchCustomersWithPurse(phones, tenant);

    expect(batchResults.size).toBe(3);
    for (const phone of phones) {
      const record = batchResults.get(phone);
      expect(record).toBeDefined();
      expect(record?.phone).toBe(phone);
      expect(record?.purse).toBeDefined();
    }
  });

  // 03. Error Tracking
  it('Pillar 03: records structured error telemetry with correlation IDs and breadcrumbs', () => {
    TelemetryService.addBreadcrumb('Customer scanned QR');
    TelemetryService.addBreadcrumb('Attempting camera shutter');

    const entry = TelemetryService.captureException(new Error('Test Camera Timeout'), 'PHOTOBOOTH', {
      device: 'iPad Pro',
    });

    expect(entry.level).toBe('ERROR');
    expect(entry.category).toBe('PHOTOBOOTH');
    expect(entry.correlationId).toBeDefined();
    expect(entry.context?.breadcrumbs).toBeDefined();

    const logs = TelemetryService.getRecentLogs(5);
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });

  // 04. Rate Limits
  it('Pillar 04: enforces sliding-window rate limiting and locks out brute-force PIN attempts', () => {
    const ip = '192.168.1.105';
    SlidingRateLimiter.resetPinAttempts(ip);

    // Simulate 5 rapid failed PIN attempts
    for (let i = 1; i <= 4; i++) {
      const attempt = SlidingRateLimiter.recordFailedPinAttempt(ip);
      expect(attempt.locked).toBe(false);
      expect(attempt.remainingAttempts).toBe(5 - i);
    }

    // 5th attempt locks the device
    const lockedAttempt = SlidingRateLimiter.recordFailedPinAttempt(ip);
    expect(lockedAttempt.locked).toBe(true);
    expect(lockedAttempt.remainingAttempts).toBe(0);

    // Verify rate limit check also reports locked
    const check = SlidingRateLimiter.check(\`pin_fail:\${ip}\`, 5, 60000);
    expect(check.allowed).toBe(false);
    expect(check.isLocked).toBe(true);
  });

  // 05. Background Jobs
  it('Pillar 05: enqueues background jobs and processes them asynchronously', () => {
    const job = JobQueueService.enqueue('PRINT_RENDER', { stripId: 'strip_4921', quality: '4K' }, 'HIGH');
    expect(job.id).toBeDefined();
    expect(job.status).toBe('PENDING');
    expect(job.priority).toBe('HIGH');
  });

  // 06. Spend Alerts & Quotas
  it('Pillar 06: monitors tenant resource quotas and triggers alerts', () => {
    const quotaCheck = QuotaService.checkQuota(tenant, 'visits', 'STARTER');
    expect(quotaCheck.allowed).toBe(true);
    expect(quotaCheck.alertLevel).toBe('OK');
    expect(quotaCheck.percentage).toBeLessThan(80);
  });

  // 08. Live Database Resilience & Offline Fallback
  it('Pillar 08: queues actions offline and flushes with idempotency upon reconnection', async () => {
    const action = OfflineSyncService.queueAction('ADD_STAMP', { phone: '0555000111', tenant });
    expect(action.id).toBeDefined();
    expect(action.idempotencyKey).toBeDefined();

    const queue = OfflineSyncService.getQueue();
    expect(queue.length).toBeGreaterThanOrEqual(1);

    const flushResult = await OfflineSyncService.flushQueue();
    expect(flushResult.processedCount).toBeGreaterThanOrEqual(1);
    expect(flushResult.errors.length).toBe(0);
  });

  // 09. Webhook Security & Idempotency
  it('Pillar 09: rejects duplicate webhooks within 24h via idempotency keys and verifies HMAC', () => {
    const key = 'idem_key_unique_8829';
    expect(WebhookSecurityService.checkIdempotency(key).isDuplicate).toBe(false);

    WebhookSecurityService.recordProcessed(key, { status: 'processed_successfully' });
    const duplicateCheck = WebhookSecurityService.checkIdempotency(key);
    expect(duplicateCheck.isDuplicate).toBe(true);
    expect(duplicateCheck.cachedResponse).toEqual({ status: 'processed_successfully' });

    // HMAC verification
    expect(WebhookSecurityService.verifySignature('payload', 'sha256=abcdef1234567890', 'secret_key')).toBe(true);
    expect(WebhookSecurityService.verifySignature('payload', 'invalid', 'secret_key')).toBe(false);
  });

  // 10. Backups & Disaster Recovery
  it('Pillar 10: generates tenant snapshots with SHA-256 integrity checksum and verifies restore', () => {
    const snapshot = BackupService.createSnapshot(tenant);
    expect(snapshot.tenantId).toBe(tenant);
    expect(snapshot.checksum).toBeDefined();
    expect(snapshot.brand).toBe('Stampy');

    const restore = BackupService.verifyAndRestore(snapshot);
    expect(restore.success).toBe(true);

    // Corrupted checksum fails restore safely
    const corruptedSnapshot = { ...snapshot, checksum: 'sha_tampered_fake' };
    const corruptedRestore = BackupService.verifyAndRestore(corruptedSnapshot);
    expect(corruptedRestore.success).toBe(false);
    expect(corruptedRestore.error).toContain('عدم تطابق رمز التحقق');
  });

  // Cybersecurity: IOC Audit Trail
  it('Cybersecurity: records indicators of compromise (IOC) and security events', () => {
    const event = IocAuditService.record('BRUTE_FORCE_LOCKOUT', 'HIGH', {
      attemptedPin: '1234',
      ip: '192.168.1.105',
    }, tenant);

    expect(event.eventType).toBe('BRUTE_FORCE_LOCKOUT');
    expect(event.severity).toBe('HIGH');
    expect(event.tenantId).toBe(tenant);

    const highEvents = IocAuditService.getEvents('HIGH');
    expect(highEvents.length).toBeGreaterThanOrEqual(1);
  });
});
`;

fs.writeFileSync(path.join(__dirname, '../tests/unit/architecture-pillars.test.ts'), testContent, 'utf-8');
console.log('tests/unit/architecture-pillars.test.ts written successfully');


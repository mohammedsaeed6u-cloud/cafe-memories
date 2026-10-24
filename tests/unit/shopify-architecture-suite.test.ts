import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { IdempotencyService } from '@/lib/services/idempotency.service';
import { RateLimiterService } from '@/lib/services/rate-limiter.service';
import { WebhookDispatcherService } from '@/lib/services/webhook-dispatcher.service';
import { TimelineAuditService } from '@/lib/services/timeline-audit.service';
import { TappyAccountingEngine } from '@/lib/services/tappy-accounting-engine.service';
import { POST as tapRoute } from '@/app/api/v1/tappy/tap/route';
import { POST as redeemRoute } from '@/app/api/v1/tappy/redeem/route';

describe('Shopify-Grade Architecture & Philosophy Suite', () => {
  beforeEach(() => {
    IdempotencyService._resetForTesting();
    RateLimiterService._resetForTesting();
    WebhookDispatcherService._resetForTesting();
    TimelineAuditService._resetForTesting();
    TappyAccountingEngine._resetForTesting();
  });

  describe('1. Idempotency Engine (Mutations Safety)', () => {
    it('executes operation once and returns cached response for duplicate requests', async () => {
      let executionCount = 0;
      const key = IdempotencyService.buildScopedKey('brand-1', 'req-abc-123');

      const operation = async () => {
        executionCount++;
        return { status: 200, body: { success: true, count: executionCount } };
      };

      // Call 1: First attempt
      const res1 = await IdempotencyService.executeIdempotent(key, operation);
      expect(res1.isCached).toBe(false);
      expect(res1.body.count).toBe(1);
      expect(executionCount).toBe(1);

      // Call 2: Retry with identical key (simulating network retry / double scan)
      const res2 = await IdempotencyService.executeIdempotent(key, operation);
      expect(res2.isCached).toBe(true);
      expect(res2.status).toBe(200);
      expect(res2.body.count).toBe(1); // returned cached body!
      expect(executionCount).toBe(1); // operation NOT re-executed!
    });

    it('rejects concurrent in-flight requests on the same key with 409 conflict', async () => {
      const key = IdempotencyService.buildScopedKey('brand-1', 'req-concurrent-999');

      // Acquire lock manually to simulate active in-flight request
      const lock = IdempotencyService.acquireLock(key);
      expect(lock.acquired).toBe(true);

      // Second request comes in before first completes
      const res = await IdempotencyService.executeIdempotent(key, async () => {
        return { status: 200, body: { done: true } };
      });

      expect(res.conflict).toBe(true);
      expect(res.status).toBe(409);
    });
  });

  describe('2. Leaky Bucket Rate Limiter (Shopify Standard)', () => {
    it('allows requests within capacity and tracks call limit headers', () => {
      const config = { capacity: 5, leakRatePerSec: 1 };
      const id = 'ip_192_168_1_1';

      // 5 requests allowed
      for (let i = 1; i <= 5; i++) {
        const res = RateLimiterService.consume(id, 1, config);
        expect(res.allowed).toBe(true);
        expect(res.currentLevel).toBe(i);
        expect(res.headerString).toBe(`${i}/5`);
      }

      // 6th request exceeds bucket capacity
      const excessRes = RateLimiterService.consume(id, 1, config);
      expect(excessRes.allowed).toBe(false);
      expect(excessRes.retryAfterSeconds).toBeGreaterThanOrEqual(1);

      const headers = RateLimiterService.getHttpHeaders(excessRes);
      expect(headers['Retry-After']).toBeDefined();
      expect(headers['X-Stampy-Call-Limit']).toBe('5/5');
    });
  });

  describe('3. Signed Webhook & Outbox Dispatcher', () => {
    it('signs payloads with HMAC-SHA256 and verifies correctly', () => {
      const secret = 'shpss_sec_99482938472918';
      const payload = JSON.stringify({ event: 'loyalty.stamp_awarded', customer: '01011112222' });

      const sig = WebhookDispatcherService.computeSignature(payload, secret);
      expect(sig).toBeDefined();
      expect(sig.length).toBeGreaterThan(10);

      const isValid = WebhookDispatcherService.verifySignature(payload, secret, sig);
      expect(isValid).toBe(true);

      const isInvalid = WebhookDispatcherService.verifySignature(payload, 'wrong-secret', sig);
      expect(isInvalid).toBe(false);
    });

    it('dispatches events to registered subscriptions into the outbox', async () => {
      WebhookDispatcherService.registerSubscription({
        brandId: 'stampy',
        targetUrl: 'https://api.foodics.com/v1/webhook',
        topics: ['loyalty.stamp_awarded', 'loyalty.reward_redeemed'],
        secret: 'foodics_wh_sec_123',
        active: true,
      });

      const jobs = await WebhookDispatcherService.dispatchEvent('stampy', 'loyalty.stamp_awarded', {
        stamps: 1,
        phone: '01055556666',
      });

      expect(jobs.length).toBe(1);
      expect(jobs[0].topic).toBe('loyalty.stamp_awarded');
      expect(jobs[0].status).toBe('pending');
      expect(jobs[0].signature).toBeDefined();

      const outbox = WebhookDispatcherService.getOutbox();
      expect(outbox.length).toBe(1);
    });
  });

  describe('4. Timeline & Audit Trail', () => {
    it('records immutable chronological timeline events for customers and store', () => {
      const phone = '01099887766';

      TimelineAuditService.recordEvent({
        brandId: 'stampy',
        customerPhone: phone,
        actorType: 'staff',
        action: 'stamp.awarded',
        titleEn: 'Awarded 2 stamps during happy hour',
        titleAr: 'تم منح ختمين خلال ساعة السعادة',
        metadata: { stamps: 2 },
      });

      TimelineAuditService.recordEvent({
        brandId: 'stampy',
        customerPhone: phone,
        actorType: 'customer',
        action: 'reward.claimed',
        titleEn: 'Claimed free flat white',
        titleAr: 'تم استرداد فلات وايت مجاني',
      });

      const customerTimeline = TimelineAuditService.getCustomerTimeline('stampy', phone);
      expect(customerTimeline.length).toBe(2);
      expect(customerTimeline[0].action).toBe('reward.claimed'); // newest first
      expect(customerTimeline[1].action).toBe('stamp.awarded');

      const storeTimeline = TimelineAuditService.getStoreTimeline('stampy');
      expect(storeTimeline.length).toBe(2);
    });
  });

  describe('5. End-to-End API Integration with Idempotency & Webhooks', () => {
    it('prevents double stamping when POST /api/v1/tappy/tap receives duplicate Idempotency-Key', async () => {
      const phone = '01033445566';
      const idemKey = 'idemp_unique_tx_7718';

      const createReq = () =>
        new NextRequest('http://localhost:3000/api/v1/tappy/tap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idemKey,
          },
          body: JSON.stringify({
            token: 'hardware_reader_valid_nonce',
            branchSlug: 'zamalek',
            customerPhone: phone,
            forceBypassCooldown: true,
          }),
        });

      // Request 1: Fresh execution
      const res1 = await tapRoute(createReq());
      const json1 = await res1.json();

      expect(res1.status).toBe(200);
      expect(json1.ok).toBe(true);
      expect(res1.headers.get('X-Cache-Lookup')).toBe('MISS');
      const initialActiveStamps = json1.newActiveStamps;

      // Request 2: Duplicate HTTP call with exact same Idempotency-Key
      const res2 = await tapRoute(createReq());
      const json2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(json2.ok).toBe(true);
      expect(res2.headers.get('X-Cache-Lookup')).toBe('HIT');
      expect(json2.newActiveStamps).toBe(initialActiveStamps); // NO duplicate stamp added!
    });
  });
});

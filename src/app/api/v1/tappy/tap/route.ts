import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { TappyAccountingEngine } from '@/lib/services/tappy-accounting-engine.service';
import { ApplePassKitEngine } from '@/lib/services/apple-passkit-engine.service';
import { IdempotencyService } from '@/lib/services/idempotency.service';
import { RateLimiterService } from '@/lib/services/rate-limiter.service';
import { WebhookDispatcherService } from '@/lib/services/webhook-dispatcher.service';
import { TimelineAuditService } from '@/lib/services/timeline-audit.service';

export async function POST(request: NextRequest) {
  try {
    // 1. Shopify-Grade Leaky Bucket Rate Limiting
    const clientIdentifier =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'client_counter';
    const rateLimit = RateLimiterService.consume(`tap:${clientIdentifier}`);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Rate limit exceeded. Too many tap requests.',
          retryAfter: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: RateLimiterService.getHttpHeaders(rateLimit),
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { token, branchSlug, customerPhone, customerName, forceBypassCooldown } = body;

    const phone = (customerPhone || '').replace(/\D/g, '');
    if (!phone || phone.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'Valid customer phone is required' },
        { status: 400, headers: RateLimiterService.getHttpHeaders(rateLimit) }
      );
    }

    // 2. Shopify-Grade Idempotency Execution
    const rawIdempotencyKey =
      request.headers.get('idempotency-key') ||
      request.headers.get('x-stampy-idempotency-key') ||
      request.headers.get('x-idempotency-key');

    const brandId = 'stampy';

    const executeOperation = async (): Promise<{ status: number; body: Record<string, unknown> }> => {
      const branchId = branchSlug || 'zamalek';
      const isVerified = Boolean(token && token.length >= 6);

      const result = TappyAccountingEngine.processTap({
        customerPhone: phone,
        customerName,
        branchId,
        brandId,
        isVerified,
        forceBypassCooldown: Boolean(forceBypassCooldown),
      });

      if (!result.success) {
        return {
          status: 400,
          body: {
            ok: false,
            rejectionReason: result.rejectionReason,
            message: result.message,
          },
        };
      }

      // Background notifications
      ApplePassKitEngine.dispatchPassUpdatePush('pass.com.stampy.loyalty', `pass-${phone}`).catch(() => {});

      // Record in Shopify-style Immutable Timeline Audit
      TimelineAuditService.recordEvent({
        brandId,
        customerPhone: phone,
        actorType: 'staff',
        action: 'stamp.awarded',
        titleEn: `Awarded ${result.stampsAwarded} stamp(s) at branch ${branchId}`,
        titleAr: `تم منح ${result.stampsAwarded} ختم في فرع ${branchId}`,
        metadata: {
          stampsAwarded: result.stampsAwarded,
          newActiveStamps: result.newActiveStamps,
          isRewardUnlocked: result.isRewardUnlocked,
        },
      });

      // Dispatch Outbox Webhook with HMAC-SHA256 signature
      WebhookDispatcherService.dispatchEvent(brandId, 'loyalty.stamp_awarded', {
        customerPhone: phone,
        customerName,
        branchId,
        stampsAwarded: result.stampsAwarded,
        newActiveStamps: result.newActiveStamps,
        isRewardUnlocked: result.isRewardUnlocked,
      }).catch(() => {});

      if (result.isRewardUnlocked) {
        WebhookDispatcherService.dispatchEvent(brandId, 'loyalty.reward_unlocked', {
          customerPhone: phone,
          customerName,
          branchId,
          activeStamps: result.newActiveStamps,
        }).catch(() => {});
      }

      return {
        status: 200,
        body: {
          ok: true,
          stampsAwarded: result.stampsAwarded,
          newActiveStamps: result.newActiveStamps,
          newLifetimeStamps: result.newLifetimeStamps,
          requiredStamps: result.requiredStamps,
          isRewardUnlocked: result.isRewardUnlocked,
          message: result.message,
          liveReceiptToken: `rcpt_${Date.now()}_${phone.slice(-4)}`,
        },
      };
    };

    if (rawIdempotencyKey) {
      const scopedKey = IdempotencyService.buildScopedKey(brandId, rawIdempotencyKey);
      const execution = await IdempotencyService.executeIdempotent(scopedKey, executeOperation);

      const res = NextResponse.json(execution.body, {
        status: execution.status,
        headers: {
          ...RateLimiterService.getHttpHeaders(rateLimit),
          'X-Cache-Lookup': execution.isCached ? 'HIT' : 'MISS',
          'Idempotency-Key': rawIdempotencyKey,
        },
      });
      return res;
    }

    // Direct execution without idempotency key
    const op = await executeOperation();
    return NextResponse.json(op.body, {
      status: op.status,
      headers: RateLimiterService.getHttpHeaders(rateLimit),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

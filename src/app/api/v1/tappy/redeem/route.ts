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
    // 1. Shopify-Grade Rate Limiting
    const clientIdentifier =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'client_counter';
    const rateLimit = RateLimiterService.consume(`redeem:${clientIdentifier}`);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Rate limit exceeded. Please wait before redeeming again.',
          retryAfter: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: RateLimiterService.getHttpHeaders(rateLimit),
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { customerPhone, branchSlug, rewardTitle } = body;

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
      const redeemResult = TappyAccountingEngine.redeemReward(brandId, phone);
      if (!redeemResult.success) {
        return {
          status: 400,
          body: {
            ok: false,
            error: redeemResult.message,
            remainingStamps: redeemResult.remainingStamps,
          },
        };
      }

      const effectiveReward = rewardTitle || 'Free Specialty Coffee';
      const effectiveBranch = branchSlug || 'zamalek';

      const liveReceipt = {
        receiptId: `RCPT-${Date.now().toString(36).toUpperCase()}`,
        customerPhone: phone,
        rewardTitle: effectiveReward,
        branch: effectiveBranch,
        verifiedAt: new Date().toISOString(),
        securityNonce: Math.random().toString(36).slice(2, 10).toUpperCase(),
      };

      // Push to Apple Wallet
      ApplePassKitEngine.dispatchPassUpdatePush('pass.com.stampy.loyalty', `pass-${phone}`).catch(() => {});

      // Record in Shopify-Style Timeline
      TimelineAuditService.recordEvent({
        brandId,
        customerPhone: phone,
        actorType: 'staff',
        action: 'reward.claimed',
        titleEn: `Claimed reward "${effectiveReward}" at branch ${effectiveBranch}`,
        titleAr: `تم استرداد مكافأة "${effectiveReward}" في فرع ${effectiveBranch}`,
        metadata: {
          rewardTitle: effectiveReward,
          receiptId: liveReceipt.receiptId,
          remainingStamps: redeemResult.remainingStamps,
        },
      });

      // Dispatch Webhook to POS integrations (Foodics / Square / Odoo)
      WebhookDispatcherService.dispatchEvent(brandId, 'loyalty.reward_redeemed', {
        customerPhone: phone,
        rewardTitle: effectiveReward,
        branch: effectiveBranch,
        receiptId: liveReceipt.receiptId,
        remainingStamps: redeemResult.remainingStamps,
      }).catch(() => {});

      return {
        status: 200,
        body: {
          ok: true,
          message: redeemResult.message,
          remainingStamps: redeemResult.remainingStamps,
          liveReceipt,
        },
      };
    };

    if (rawIdempotencyKey) {
      const scopedKey = IdempotencyService.buildScopedKey(brandId, rawIdempotencyKey);
      const execution = await IdempotencyService.executeIdempotent(scopedKey, executeOperation);

      return NextResponse.json(execution.body, {
        status: execution.status,
        headers: {
          ...RateLimiterService.getHttpHeaders(rateLimit),
          'X-Cache-Lookup': execution.isCached ? 'HIT' : 'MISS',
          'Idempotency-Key': rawIdempotencyKey,
        },
      });
    }

    const op = await executeOperation();
    return NextResponse.json(op.body, {
      status: op.status,
      headers: RateLimiterService.getHttpHeaders(rateLimit),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

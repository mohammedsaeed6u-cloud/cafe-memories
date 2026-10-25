/**
 * POST /api/v1/taps/redeem
 *
 * Tap-to-redeem. The reader secret plus the signed customer session replace
 * the staff PIN: the customer is physically at the counter, holding the tag,
 * and the reward row is locked before it is marked redeemed.
 *
 * The request is idempotent per reader + key, so a double tap or a flaky
 * mobile network can never burn two rewards.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonError, jsonOk, readJson } from '@/lib/server/route-helpers';
import { ensureTapCustomer, readerHash, resolveTapReader } from '@/lib/server/tap-service';
import { hashIpAddress, hashUserAgent } from '@/lib/services/anti-fraud';
import { clientIp, consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';
import {
  CUSTOMER_SESSION_COOKIE,
  createCustomerSessionValue,
  customerSessionCookieOptions,
  readCustomerSession,
} from '@/lib/customer-session';
import { READER_PUBLIC_ID_PATTERN, READER_SECRET_PATTERN } from '@/lib/server/nfc';

export const runtime = 'nodejs';

const schema = z.object({
  publicId: z.string().regex(READER_PUBLIC_ID_PATTERN),
  secret: z.string().regex(READER_SECRET_PATTERN),
  rewardKind: z.enum(['card', 'voucher']),
  rewardId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const limit = await consumeRateLimit(rateLimitKey(request, 'nfc-redeem'), 20, 10 * 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid redemption request');

  const reader = await resolveTapReader(parsed.data.publicId, parsed.data.secret);
  if (!reader) {
    return jsonError(404, 'tag_not_recognized', 'This tag is no longer active');
  }

  let customer;
  try {
    customer = await ensureTapCustomer(request, reader.organizationId);
  } catch {
    return jsonError(503, 'redeem_unavailable', 'Redemption is temporarily unavailable');
  }
  const previousSession = await readCustomerSession(request);

  const { data, error } = await createAdminClient().rpc('redeem_at_reader', {
    p_reader_public_id: parsed.data.publicId,
    p_reader_secret_hash: readerHash(parsed.data.secret),
    p_customer_id: customer.customerId,
    p_reward_kind: parsed.data.rewardKind,
    p_reward_id: parsed.data.rewardId,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_ip_hash: hashIpAddress(clientIp(request)),
    p_user_agent_hash: hashUserAgent(request.headers.get('user-agent') ?? 'unknown'),
  });

  if (error) {
    if (error.code === '42501') {
      return jsonError(404, 'tag_not_recognized', 'This tag is no longer active');
    }
    if (error.code === '22023') {
      return jsonError(409, 'redeem_rejected', 'This reward cannot be redeemed here');
    }
    console.error('redeem_at_reader failed:', error.code ?? 'unknown');
    return jsonError(503, 'redeem_unavailable', 'Redemption is temporarily unavailable');
  }

  const result = (data ?? {}) as Record<string, unknown>;
  const response = jsonOk({
    status: typeof result.status === 'string' ? result.status : 'ok',
    replayed: Boolean(result.replayed),
    tapId: typeof result.tapId === 'string' ? result.tapId : null,
    rewardKind: result.rewardKind ?? parsed.data.rewardKind,
    rewardId: result.rewardId ?? parsed.data.rewardId,
    rewardName: typeof result.rewardName === 'string' ? result.rewardName : null,
    code: typeof result.code === 'string' ? result.code : null,
    redeemedAt: result.redeemedAt ?? null,
    message: typeof result.message === 'string' ? result.message : null,
    venue: {
      organizationName: reader.organizationName,
      organizationSlug: reader.organizationSlug,
      branchName: reader.branchName,
      branchSlug: reader.branchSlug,
    },
  });

  if (customer.minted || customer.activeCardChanged) {
    const value = await createCustomerSessionValue(
      customer.customerId,
      previousSession?.customerIds ?? []
    );
    response.cookies.set(CUSTOMER_SESSION_COOKIE, value, customerSessionCookieOptions());
  }

  return response;
}

/**
 * POST /api/v1/taps
 *
 * A customer taps a physical NFC tag. The URL fragment carries the reader
 * secret; this route verifies it against the stored hash, mints a signed
 * customer session on first contact, and lets `record_nfc_tap` apply the
 * cooldown, velocity, promotion, head start, and ladder rules in one
 * transaction.
 *
 * The secret is never stored, logged, or returned. Rotating a reader changes
 * the hash, which instantly invalidates every previously printed tag.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonError, jsonOk, readJson } from '@/lib/server/route-helpers';
import { ensureTapCustomer, readerHash, resolveTapReader } from '@/lib/server/tap-service';
import { loadCustomerCard } from '@/lib/server/customer-card';
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
  idempotencyKey: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const limit = await consumeRateLimit(rateLimitKey(request, 'nfc-tap'), 30, 10 * 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid tap request');

  const reader = await resolveTapReader(parsed.data.publicId, parsed.data.secret);
  if (!reader) {
    return jsonError(404, 'tag_not_recognized', 'This tag is no longer active');
  }

  let customer;
  try {
    customer = await ensureTapCustomer(request, reader.organizationId);
  } catch {
    return jsonError(503, 'tap_unavailable', 'Tap is temporarily unavailable');
  }
  const previousSession = await readCustomerSession(request);

  const ipHash = hashIpAddress(clientIp(request));
  const userAgentHash = hashUserAgent(request.headers.get('user-agent') ?? 'unknown');

  const { data, error } = await createAdminClient().rpc('record_nfc_tap', {
    p_reader_public_id: parsed.data.publicId,
    p_reader_secret_hash: readerHash(parsed.data.secret),
    p_customer_id: customer.customerId,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_ip_hash: ipHash,
    p_user_agent_hash: userAgentHash,
  });

  if (error) {
    if (error.code === '42501') {
      return jsonError(404, 'tag_not_recognized', 'This tag is no longer active');
    }
    if (error.code === '22023') {
      return jsonError(409, 'tap_rejected', 'This tap cannot be recorded');
    }
    console.error('record_nfc_tap failed:', error.code ?? 'unknown');
    return jsonError(503, 'tap_unavailable', 'Tap is temporarily unavailable');
  }

  const result = (data ?? {}) as Record<string, unknown>;
  const card = await loadCustomerCard(customer.customerId, reader.organizationId).catch(() => null);

  const response = jsonOk({
    status: typeof result.status === 'string' ? result.status : 'ok',
    replayed: Boolean(result.replayed),
    tapId: typeof result.tapId === 'string' ? result.tapId : null,
    stampsAwarded: Number(result.stampsAwarded ?? 0),
    multiplier: Number(result.multiplier ?? 1),
    headStart: Number(result.headStart ?? 0),
    promotion: result.promotion ?? null,
    message: typeof result.message === 'string' ? result.message : null,
    nextTapAt: result.nextTapAt ?? null,
    venue: {
      organizationName: reader.organizationName,
      organizationSlug: reader.organizationSlug,
      branchName: reader.branchName,
      branchSlug: reader.branchSlug,
    },
    card: card
      ? {
          customer: card.customer,
          loyalty: card.loyalty,
          rewards: card.rewards,
          vouchers: card.vouchers,
          ladder: card.ladder,
          promotion: card.promotion,
        }
      : null,
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

/** A tap page may probe the tag without creating a customer. */
export async function GET(request: NextRequest) {
  const publicId = request.nextUrl.searchParams.get('publicId') ?? '';
  if (!READER_PUBLIC_ID_PATTERN.test(publicId)) {
    return jsonError(400, 'invalid_reader', 'Invalid reader');
  }
  const { data } = await createAdminClient()
    .from('nfc_readers')
    .select('status,organizations(name,slug),branches(name,slug)')
    .eq('public_id', publicId)
    .maybeSingle();

  if (!data || data.status !== 'active') {
    return jsonError(404, 'tag_not_recognized', 'This tag is no longer active');
  }

  const organization = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  const branch = Array.isArray(data.branches) ? data.branches[0] : data.branches;

  return NextResponse.json(
    {
      ok: true,
      venue: {
        organizationName: organization?.name ?? '',
        organizationSlug: organization?.slug ?? '',
        branchName: branch?.name ?? '',
        branchSlug: branch?.slug ?? '',
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

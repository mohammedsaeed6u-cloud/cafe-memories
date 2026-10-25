/**
 * Customer identity for the public photobooth.
 *
 * POST   create or refresh the guest session. The server mints the customer
 *        UUID and signs it into an httpOnly cookie; a client-supplied id is
 *        never accepted as identity.
 * GET    return the signed-in guest's card for a venue.
 * DELETE clear the cookie (switch account).
 *
 * A phone number is optional contact data. It is unique per venue so staff can
 * find a card, but it is never used to authenticate or to restore a session on
 * another device — the wallet pass or a staff lookup does that.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  CUSTOMER_SESSION_COOKIE,
  createCustomerSessionValue,
  customerSessionCookieOptions,
  readCustomerSession,
} from '@/lib/customer-session';
import { loadPublicVenue } from '@/lib/server/public-venue';
import { loadCustomerCard } from '@/lib/server/customer-card';
import { canonicalizePhone, isValidPhone } from '@/lib/services/phone';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const sessionSchema = z.object({
  cafeSlug: z.string().trim().min(1).max(80),
  displayName: z.string().trim().max(80).optional().nullable(),
  phone: z.string().trim().max(24).optional().nullable(),
  persona: z.string().trim().max(40).optional().nullable(),
});

function noStore<T>(body: T, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function phoneOwner(
  organizationId: string,
  phone: string
): Promise<{ id: string } | null> {
  const { data } = await createAdminClient()
    .from('customers')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('phone', phone)
    .is('deleted_at', null)
    .maybeSingle();
  return data ?? null;
}

export async function POST(request: NextRequest) {
  const limit = await consumeRateLimit(rateLimitKey(request, 'customer-session'), 30, 60 * 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  const parsed = sessionSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return noStore({ ok: false, error: 'Invalid request' }, 400);
  }

  const { cafeSlug, persona } = parsed.data;
  const displayName = parsed.data.displayName?.trim() || null;
  const rawPhone = parsed.data.phone?.trim() || null;

  if (rawPhone && !isValidPhone(rawPhone)) {
    return noStore({ ok: false, code: 'invalid_phone', error: 'رقم الهاتف غير صالح' }, 400);
  }
  const phone = rawPhone ? canonicalizePhone(rawPhone) : null;

  let venue;
  try {
    venue = await loadPublicVenue(cafeSlug);
  } catch {
    return noStore({ ok: false, error: 'Venue lookup failed' }, 503);
  }
  if (!venue) {
    return noStore({ ok: false, code: 'venue_not_found', error: 'المنشأة غير متاحة' }, 404);
  }

  const organizationId = venue.organization.id;
  const admin = createAdminClient();
  const claims = await readCustomerSession(request);

  let customerId: string | null = null;
  let created = false;

  if (claims) {
    // A customer row is tenant-scoped. Reuse the card for this venue from any
    // card in the cookie, so switching venues never mints a duplicate.
    const { data: rows } = await admin
      .from('customers')
      .select('id,organization_id,phone')
      .in('id', claims.customerIds)
      .is('deleted_at', null);

    const existing = (rows ?? []).find(
      (row) => !row.organization_id || row.organization_id === organizationId
    );

    if (existing) {
      customerId = existing.id;

      if (phone && existing.phone && existing.phone !== phone) {
        const owner = await phoneOwner(organizationId, phone);
        if (owner && owner.id !== customerId) {
          return noStore(
            {
              ok: false,
              code: 'phone_in_use',
              error: 'هذا الرقم مرتبط ببطاقة أخرى. استخدم بطاقة المحفظة أو اطلب من الموظف.',
            },
            409
          );
        }
      }
    }
  }

  if (phone) {
    const owner = await phoneOwner(organizationId, phone);
    if (owner && owner.id !== customerId) {
      return noStore(
        {
          ok: false,
          code: 'phone_in_use',
          error: 'هذا الرقم مرتبط ببطاقة أخرى. استخدم بطاقة المحفظة أو اطلب من الموظف.',
        },
        409
      );
    }
  }

  if (!customerId) {
    const anonymousId = `guest_${crypto.randomUUID()}`;
    const { data: inserted, error } = await admin
      .from('customers')
      .insert({
        anonymous_id: anonymousId,
        organization_id: organizationId,
        display_name: displayName || 'ضيف مميز',
        phone,
        persona: persona || null,
      })
      .select('id')
      .single();

    if (error || !inserted) {
      // The partial unique index is the final authority on a phone race.
      if (error?.code === '23505') {
        return noStore(
          {
            ok: false,
            code: 'phone_in_use',
            error: 'هذا الرقم مرتبط ببطاقة أخرى. استخدم بطاقة المحفظة أو اطلب من الموظف.',
          },
          409
        );
      }
      console.error('customer/session insert failed:', error?.code ?? 'unknown');
      return noStore({ ok: false, error: 'تعذر إنشاء الجلسة' }, 500);
    }

    customerId = inserted.id;
    created = true;

    await admin.from('customer_identities').insert({
      customer_id: customerId,
      provider: 'anonymous',
      provider_subject: anonymousId,
    });
  } else {
    const updates: Record<string, unknown> = { last_seen_at: new Date().toISOString() };
    if (displayName) updates.display_name = displayName;
    if (phone) updates.phone = phone;
    if (persona) updates.persona = persona;
    const { error } = await admin.from('customers').update(updates).eq('id', customerId);
    if (error?.code === '23505') {
      return noStore(
        {
          ok: false,
          code: 'phone_in_use',
          error: 'هذا الرقم مرتبط ببطاقة أخرى. استخدم بطاقة المحفظة أو اطلب من الموظف.',
        },
        409
      );
    }
    if (error) return noStore({ ok: false, error: 'تعذر تحديث الجلسة' }, 500);
  }

  if (!customerId) return noStore({ ok: false, error: 'تعذر إنشاء الجلسة' }, 500);

  const card = await loadCustomerCard(customerId, organizationId);
  if (!card) return noStore({ ok: false, error: 'تعذر تحميل البطاقة' }, 500);

  const response = noStore({
    ok: true,
    created,
    customer: card.customer,
    loyalty: card.loyalty,
    rewards: card.rewards,
    stamps: card.stamps,
    vouchers: card.vouchers,
    ladder: card.ladder,
    promotion: card.promotion,
    memories: card.memories,
    walletPass: card.walletPass,
    venue,
  });

  const value = await createCustomerSessionValue(customerId, claims?.customerIds ?? []);
  response.cookies.set(CUSTOMER_SESSION_COOKIE, value, customerSessionCookieOptions());
  return response;
}

export async function GET(request: NextRequest) {
  const claims = await readCustomerSession(request);
  if (!claims) return noStore({ ok: false, code: 'no_session' }, 401);

  const cafeSlug = request.nextUrl.searchParams.get('cafeSlug') ?? '';
  let venue;
  try {
    venue = await loadPublicVenue(cafeSlug);
  } catch {
    return noStore({ ok: false, error: 'Venue lookup failed' }, 503);
  }
  if (!venue) {
    return noStore({ ok: false, code: 'venue_not_found', error: 'المنشأة غير متاحة' }, 404);
  }

  const card = await loadCustomerCard(claims.customerId, venue.organization.id);
  if (!card) {
    return noStore({ ok: false, code: 'no_session' }, 401);
  }

  return noStore({
    ok: true,
    customer: card.customer,
    loyalty: card.loyalty,
    rewards: card.rewards,
    stamps: card.stamps,
    vouchers: card.vouchers,
    ladder: card.ladder,
    promotion: card.promotion,
    memories: card.memories,
    walletPass: card.walletPass,
    venue,
  });
}

export async function DELETE() {
  const response = noStore({ ok: true });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, '', {
    ...customerSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}

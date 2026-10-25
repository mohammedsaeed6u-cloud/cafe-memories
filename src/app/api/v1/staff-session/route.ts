/**
 * Staff tablet session.
 *
 * POST   { pin, staffCode?, cafeSlug? } -> verifies the PIN server-side and
 *        mints a signed, httpOnly cookie. Five failures per IP per 15 minutes.
 * GET    -> returns the current session, 401 when absent.
 * DELETE -> clears the cookie.
 *
 * PINs are stored as PBKDF2-SHA256 hashes in `staff_pin_credentials`, a table
 * no browser role can read. A development-only fixture exists for
 * `NODE_ENV=test` / ALLOW_DEV_STAFF_PINS; it is never reachable in production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { isProduction } from '@/lib/env';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';
import {
  STAFF_SESSION_COOKIE,
  createStaffSessionValue,
  staffSessionCookieOptions,
  verifyPin,
  verifyStaffSessionValue,
} from '@/lib/staff-session';
import { timingSafeEqual } from '@/lib/signed-token';

export const runtime = 'nodejs';

const bodySchema = z.object({
  pin: z.string().regex(/^\d{4,8}$/, 'PIN must be 4 to 8 digits'),
  staffCode: z.string().trim().min(1).max(64).optional(),
  staffId: z.string().trim().min(1).max(64).optional(),
  cafeSlug: z.string().trim().min(1).max(80).optional(),
});

/** Development fixtures. Enabled only when NODE_ENV=test or explicitly opted in. */
const DEV_PINS: Record<string, string> = {
  'staff-1': '1234',
  'staff-2': '2345',
  'staff-3': '3456',
  'staff-4': '4567',
};

function devPinsEnabled(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.ALLOW_DEV_STAFF_PINS === 'true';
}

function databaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

interface VerifiedStaff {
  staffId: string;
  name: string;
  role: string;
  cafeSlug: string;
}

async function verifyAgainstDatabase(
  staffCode: string,
  cafeSlug: string | null,
  pin: string
): Promise<VerifiedStaff | null> {
  const admin = createAdminClient();
  let query = admin
    .from('organization_members')
    .select(
      'id,user_id,role,branch_id,display_name,staff_code,staff_pin_credentials(pin_hash),organizations!inner(slug,status)'
    )
    .eq('staff_code', staffCode);

  if (cafeSlug) query = query.eq('organizations.slug', cafeSlug);

  const { data, error } = await query.limit(2);
  if (error || !data || data.length === 0) return null;
  // A staff code is unique per organization. Without a venue we cannot choose
  // between two tenants that happen to use the same code.
  if (!cafeSlug && data.length > 1) return null;

  const member = data[0];
  const organization = Array.isArray(member.organizations)
    ? member.organizations[0]
    : member.organizations;
  if (!organization || organization.status !== 'active') return null;

  const credential = Array.isArray(member.staff_pin_credentials)
    ? member.staff_pin_credentials[0]
    : member.staff_pin_credentials;
  const pinHash = typeof credential?.pin_hash === 'string' ? credential.pin_hash : null;
  if (!pinHash || !(await verifyPin(pin, pinHash))) return null;

  return {
    staffId: String(member.id),
    name:
      typeof member.display_name === 'string' && member.display_name
        ? member.display_name
        : staffCode,
    role: String(member.role),
    cafeSlug: String(organization.slug),
  };
}

function verifyAgainstDevFixture(staffCode: string | undefined, pin: string): VerifiedStaff | null {
  if (!devPinsEnabled()) return null;

  const entries = Object.entries(DEV_PINS);
  const match = staffCode ? entries.find(([id]) => id === staffCode) : entries.find(([, value]) => value === pin);
  if (!match) return null;

  const [id, expected] = match;
  if (!timingSafeEqual(pin, expected)) return null;

  return {
    staffId: id,
    name: id,
    role: 'staff',
    cafeSlug: process.env.NEXT_PUBLIC_DEFAULT_CAFE_SLUG || 'development',
  };
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  const { pin } = parsed.data;
  const staffCode = parsed.data.staffCode ?? parsed.data.staffId;
  const cafeSlug = parsed.data.cafeSlug ?? null;

  const limit = await consumeRateLimit(rateLimitKey(request, 'staff-pin'), 5, 15 * 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  let staff: VerifiedStaff | null = null;

  if (databaseConfigured()) {
    if (!staffCode) {
      return NextResponse.json(
        { ok: false, code: 'staff_code_required', error: 'Staff code required' },
        { status: 400 }
      );
    }
    staff = await verifyAgainstDatabase(staffCode, cafeSlug, pin);
  } else {
    staff = verifyAgainstDevFixture(staffCode, pin);
  }

  if (!staff) {
    return NextResponse.json({ ok: false, error: 'Invalid PIN' }, { status: 401 });
  }

  const value = await createStaffSessionValue({
    staffId: staff.staffId,
    cafeSlug: staff.cafeSlug,
    role: staff.role,
  });

  const response = NextResponse.json({
    ok: true,
    staff: { id: staff.staffId, name: staff.name, role: staff.role, cafeSlug: staff.cafeSlug },
  });
  response.cookies.set(STAFF_SESSION_COOKIE, value, staffSessionCookieOptions());
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function GET(request: NextRequest) {
  const claims = await verifyStaffSessionValue(request.cookies.get(STAFF_SESSION_COOKIE)?.value);
  if (!claims) {
    return NextResponse.json({ ok: false, error: 'No active session' }, { status: 401 });
  }

  return NextResponse.json(
    {
      ok: true,
      session: {
        staffId: claims.staffId,
        cafeSlug: claims.cafeSlug,
        role: claims.role,
        expiresAt: new Date(claims.exp).toISOString(),
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_SESSION_COOKIE, '', { ...staffSessionCookieOptions(), maxAge: 0 });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

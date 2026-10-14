import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPinOnly } from '@/lib/services/staff-auth.service';
import { createStaffSessionValue, verifyStaffSessionValue, STAFF_SESSION_COOKIE } from '@/lib/staff-session';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ pin: z.string().min(3).max(12) });

export const BUILTIN_STAFF_UUID_MAP: Record<string, string> = {
  'staff-1': 'a0000000-0000-0000-0000-000000000001',
  'staff-2': 'a0000000-0000-0000-0000-000000000002',
  'staff-3': 'a0000000-0000-0000-0000-000000000003',
  'staff-4': 'a0000000-0000-0000-0000-000000000004',
};

/**
 * Brute-force shield (CWE-307): 5 failed PIN attempts per IP per 5 minutes.
 * In-memory bucket — per-instance in serverless, still raises the cost
 * massively and is upgradeable to a shared store without call-site changes.
 */
const SESSION_RATE_WINDOW_MS = 5 * 60 * 1000;
const SESSION_RATE_MAX_FAILURES = 5;
const failureBuckets = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = (failureBuckets.get(ip) || []).filter((t) => now - t < SESSION_RATE_WINDOW_MS);
  failureBuckets.set(ip, bucket);
  return bucket.length >= SESSION_RATE_MAX_FAILURES;
}

function recordFailure(ip: string): void {
  const bucket = failureBuckets.get(ip) || [];
  bucket.push(Date.now());
  failureBuckets.set(ip, bucket);
}

function clearFailures(ip: string): void {
  failureBuckets.delete(ip);
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * POST /api/v1/staff-session
 * Verifies the staff PIN server-side and issues a signed, httpOnly
 * staff session cookie (replaces the forgeable client-side
 * `memories_staff_session=1` cookie — CWE-308 / CWE-1004).
 *
 * DELETE clears the cookie (logout / shift end).
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'تم تجاوز عدد المحاولات المسموح. حاول بعد قليل.' },
      { status: 429, headers: { 'Retry-After': '300' } }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'pin is required' }, { status: 400 });
  }

  const result = await verifyPinOnly(parsed.data.pin);
  if (!result.success || !result.staff) {
    recordFailure(ip);
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Invalid PIN' },
      { status: 401 }
    );
  }

  clearFailures(ip);

  const staff = result.staff as { id: string; name?: string; role?: string };
  let resolvedCafeSlug = (staff as any).cafeSlug || 'memories';
  let verifiedStaffId = staff.id;

  // Authoritative DB verification for staff member (Fail-Closed)
  try {
    const admin = (await import('@/lib/supabase/admin')).createAdminClient();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let query = admin
      .from('organization_members')
      .select('id, user_id, role, organization_id, organizations!inner(slug, status)')
      .eq('organizations.status', 'active');

    const targetUuid = BUILTIN_STAFF_UUID_MAP[staff.id] || (uuidRegex.test(staff.id) ? staff.id : null);
    if (targetUuid) {
      query = query.or(`user_id.eq.${targetUuid},id.eq.${targetUuid}`);
    } else {
      // NEVER query a UUID column with a non-UUID string to prevent 22P02 type mismatch
      query = query.eq('organizations.slug', resolvedCafeSlug).eq('role', staff.role || 'staff');
    }

    const { data: member, error: memberErr } = await query.maybeSingle();
    if (memberErr || !member) {
      recordFailure(ip);
      return NextResponse.json(
        { ok: false, error: 'الموظف غير مسجل في أي منشأة نشطة' },
        { status: 403 }
      );
    }
    if (member && (member as any).organizations?.slug) {
      resolvedCafeSlug = (member as any).organizations.slug;
    }
    verifiedStaffId = member.user_id || member.id || staff.id;
  } catch {
    recordFailure(ip);
    return NextResponse.json(
      { ok: false, error: 'تعذر التحقق من عضوية الموظف' },
      { status: 403 }
    );
  }

  const value = await createStaffSessionValue({
    staffId: verifiedStaffId,
    cafeSlug: resolvedCafeSlug,
    role: staff.role || 'staff',
  });

  const res = NextResponse.json({
    ok: true,
    staff: { id: staff.id, name: staff.name ?? null, role: staff.role ?? null },
  });
  res.cookies.set(STAFF_SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STAFF_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}

export async function GET(request: NextRequest) {
  const claims = await verifyStaffSessionValue(request.cookies.get(STAFF_SESSION_COOKIE)?.value);
  if (!claims) {
    return NextResponse.json({ ok: false, error: 'no valid staff session' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, staffId: claims.staffId, role: claims.role, exp: claims.exp });
}

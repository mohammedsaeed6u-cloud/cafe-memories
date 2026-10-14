import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { syncWalletPassForCount } from '@/lib/services/wallet-pass-sync.service';
import { requireApiAuth, isAuthFailure } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  cafeSlug: z.string().min(1),
  phone: z.string().min(4).max(30),
});

/**
 * POST /api/v1/wallet/pass/update
 *
 * Recomputes the customer's loyalty stamp count (the same math as the
 * stamps route) and pushes it to their already-issued Wallet pass via
 * WalletWallet's PUT endpoint. Installed devices receive an APNs push and
 * refresh in place; the lock-screen banner comes from the header field's
 * changeMessage.
 *
 * Quietly succeeds when there is nothing to do (no pass, disabled
 * outsourcing, unchanged count) so callers can fire this freely.
 */
export async function POST(request: NextRequest) {
  // Pushing wallet updates is merchant/staff-only (CWE-306)
  const auth = await requireApiAuth(request, 'any-auth');
  if (isAuthFailure(auth)) return auth;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'cafeSlug and phone are required' },
      { status: 400 }
    );
  }

  try {
    const sync = await syncWalletPassForCount(parsed.data);
    return NextResponse.json({ ok: true, sync });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: 'pass_update_failed', details: error?.message },
      { status: 502 }
    );
  }
}

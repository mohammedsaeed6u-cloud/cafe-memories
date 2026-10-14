import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireMerchant } from '@/lib/server/context';
import { syncCustomerWalletAfterTransaction } from '@/lib/server/wallet-service';
import { verifyStaffSessionValue } from '@/lib/staff-session';

export const dynamic = 'force-dynamic';

const visitSchema = z.object({
  customerId: z.string().uuid(),
  branchId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});

/** Only a signed-in staff member or verified staff session can verify a physical purchase. */
export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = visitSchema.safeParse(raw);
  if (!parsed.success) return apiError('Invalid visit request', 400);

  // Check merchant authentication or signed staff terminal session
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/stampy_staff_session=([^;]+)/);
  const staffClaims = match ? await verifyStaffSessionValue(match[1]) : null;

  const auth = await requireMerchant({ branchId: parsed.data.branchId });
  if (auth.error && !staffClaims) return auth.error;

  const db = auth.context?.db || (await import('@/lib/supabase/admin')).createAdminClient();
  let orgId = auth.context?.membership?.organizationId;

  if (!orgId) {
    const { data: b } = await db
      .from('branches')
      .select('organization_id, organizations!inner(slug)')
      .eq('id', parsed.data.branchId)
      .maybeSingle();

    if (!b) return apiError('Branch not found', 404);
    if (staffClaims && (b as any).organizations?.slug !== staffClaims.cafeSlug) {
      return apiError('Staff session does not match branch', 403);
    }
    orgId = (b as { organization_id?: string } | null)?.organization_id;
  }

  const { data, error } = await db.rpc('record_verified_visit', {
    p_customer_id: parsed.data.customerId,
    p_branch_id: parsed.data.branchId,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) {
    if (error.code === '23514') return apiError('Visit cooldown active', 409);
    if (error.code === '42501') return apiError('Not authorized for this branch', 403);
    if (error.code === '22023') return apiError('Invalid visit', 400);
    console.error('Visit transaction failed:', error);
    return apiError('Visit could not be recorded', 503);
  }

  const walletSync = orgId
    ? await syncCustomerWalletAfterTransaction(orgId, parsed.data.customerId)
    : null;

  return NextResponse.json(
    { ...(data as Record<string, unknown>), walletSync },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

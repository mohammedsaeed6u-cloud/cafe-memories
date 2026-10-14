import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireMerchant } from '@/lib/server/context';

const visitSchema = z.object({
  customerId: z.uuid(), branchId: z.uuid(), idempotencyKey: z.uuid(),
});

/** Only a signed-in staff member can verify a physical purchase. */
export async function POST(request: Request) {
  const parsed = visitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid visit request', 400);
  const auth = await requireMerchant({ branchId: parsed.data.branchId });
  if (auth.error) return auth.error;
  const { data, error } = await auth.context.db.rpc('record_verified_visit', {
    p_customer_id: parsed.data.customerId, p_branch_id: parsed.data.branchId,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    if (error.code === '23514') return apiError('Visit cooldown active', 409);
    if (error.code === '42501') return apiError('Not authorized for this branch', 403);
    if (error.code === '22023') return apiError('Invalid visit', 400);
    console.error('Visit transaction failed:', error);
    return apiError('Visit could not be recorded', 503);
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

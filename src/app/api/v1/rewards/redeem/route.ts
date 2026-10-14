import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireMerchant } from '@/lib/server/context';

const redeemSchema = z.object({
  customerId: z.uuid(), branchId: z.uuid(), rewardRuleId: z.uuid(), idempotencyKey: z.uuid(),
});

/** Eligibility, idempotency and balance consumption are ONE DB transaction. */
export async function POST(request: Request) {
  const parsed = redeemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid reward request', 400);
  const auth = await requireMerchant({ branchId: parsed.data.branchId });
  if (auth.error) return auth.error;
  const { data, error } = await auth.context.db.rpc('redeem_customer_reward', {
    p_customer_id: parsed.data.customerId, p_branch_id: parsed.data.branchId,
    p_reward_rule_id: parsed.data.rewardRuleId, p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    if (error.code === '23514') return apiError('Insufficient verified visits', 409);
    if (error.code === '42501') return apiError('Not authorized to redeem', 403);
    if (error.code === '22023') return apiError('Invalid or inactive reward', 400);
    console.error('Reward transaction failed:', error);
    return apiError('Reward could not be redeemed', 503);
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

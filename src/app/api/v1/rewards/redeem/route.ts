/**
 * POST /api/v1/rewards/redeem
 *
 * A signed staff tablet (or merchant) consumes the customer's oldest earned
 * keepsake card. `redeem_customer_reward_service` locks the card, records the
 * reward event, and marks the card redeemed in one transaction.
 *
 * The organization and branch come from the operator session. The client only
 * names the customer, the active reward rule, and an idempotency key.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator, defaultBranchId } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';

export const runtime = 'nodejs';

const schema = z.object({
  customerId: z.string().uuid(),
  rewardRuleId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  branchId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid redemption payload');

  const result = await requireOperator(request, { branchId: parsed.data.branchId });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  if (!operator.memberId) {
    return jsonError(403, 'membership_required', 'A staff membership is required');
  }

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from('customers')
    .select('id,organization_id')
    .eq('id', parsed.data.customerId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!customer || customer.organization_id !== operator.organization.id) {
    return jsonError(404, 'customer_not_found', 'Customer not found');
  }

  const branchId = await defaultBranchId(
    operator.organization.id,
    parsed.data.branchId ?? operator.branchId
  );
  if (!branchId) return jsonError(409, 'branch_required', 'No active branch');

  const { data, error } = await admin.rpc('redeem_customer_reward_service', {
    p_customer_id: customer.id,
    p_branch_id: branchId,
    p_reward_rule_id: parsed.data.rewardRuleId,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_staff_member_id: operator.memberId,
  });

  if (error) {
    if (error.code === '42501') {
      return jsonError(403, 'not_authorized', 'Not authorized for this branch');
    }
    if (error.code === '23514') {
      return jsonError(409, 'insufficient_visits', 'العميل لا يمتلك زيارات كافية لصرف هذه المكافأة');
    }
    if (error.code === '22023') {
      return jsonError(409, 'redemption_rejected', 'The reward or idempotency key is not valid');
    }
    console.error('redeem_customer_reward_service failed:', error.code ?? 'unknown');
    return jsonError(503, 'redemption_unavailable', 'Redemption is temporarily unavailable');
  }

  const payload = (data ?? {}) as {
    rewardEventId?: string;
    keepsakeCardId?: string;
    replayed?: boolean;
    rewardName?: string;
    redeemedAt?: string;
  };

  if (!payload.replayed) {
    await writeAuditLog({
      actorId: operator.memberId,
      organizationId: operator.organization.id,
      action: 'reward.redeemed',
      entityType: 'reward_events',
      entityId: payload.rewardEventId ?? null,
      metadata: {
        customerId: customer.id,
        branchId,
        keepsakeCardId: payload.keepsakeCardId ?? null,
        source: operator.source,
      },
    });
  }

  return jsonOk({
    replayed: Boolean(payload.replayed),
    rewardEventId: payload.rewardEventId ?? null,
    keepsakeCardId: payload.keepsakeCardId ?? null,
    rewardName: payload.rewardName ?? null,
    redeemedAt: payload.redeemedAt ?? null,
  });
}

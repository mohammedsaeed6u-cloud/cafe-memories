/**
 * POST /api/v1/merchant/vouchers/redeem
 *
 * Conditional update: a voucher can move from `issued` to `redeemed` exactly
 * once. A double tap gets 409 instead of consuming two gifts.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';

export const runtime = 'nodejs';

const schema = z.object({
  code: z.string().trim().min(6).max(32).transform((value) => value.toUpperCase()),
});

export async function POST(request: NextRequest) {
  const result = await requireOperator(request);
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid voucher code');

  const admin = createAdminClient();
  const { data: voucher } = await admin
    .from('vouchers')
    .select('id,organization_id,branch_id,code,title,status,customer_id,expires_at')
    .eq('organization_id', operator.organization.id)
    .eq('code', parsed.data.code)
    .maybeSingle();

  if (!voucher) return jsonError(404, 'voucher_not_found', 'Voucher not found');
  if (operator.branchId && voucher.branch_id && voucher.branch_id !== operator.branchId) {
    return jsonError(403, 'branch_scope', 'Voucher belongs to another branch');
  }
  if (voucher.status !== 'issued') {
    return jsonError(409, 'voucher_not_redeemable', 'القسيمة مستخدمة أو غير صالحة');
  }
  if (voucher.expires_at && Date.parse(voucher.expires_at) <= Date.now()) {
    await admin.from('vouchers').update({ status: 'expired' }).eq('id', voucher.id);
    return jsonError(409, 'voucher_expired', 'انتهت صلاحية القسيمة');
  }

  const { data: redeemed, error } = await admin
    .from('vouchers')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
      redeemed_by: operator.userId,
    })
    .eq('id', voucher.id)
    .eq('status', 'issued')
    .select('id,code,title,customer_id,redeemed_at')
    .maybeSingle();

  if (error) return jsonError(503, 'voucher_redeem_failed', 'Could not redeem the voucher');
  if (!redeemed) {
    return jsonError(409, 'voucher_not_redeemable', 'القسيمة مستخدمة بالفعل');
  }

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'voucher.redeemed',
    entityType: 'vouchers',
    entityId: redeemed.id,
    metadata: { customerId: redeemed.customer_id, code: redeemed.code },
  });

  return jsonOk({
    voucherId: redeemed.id,
    code: redeemed.code,
    title: redeemed.title,
    customerId: redeemed.customer_id,
    redeemedAt: redeemed.redeemed_at,
  });
}

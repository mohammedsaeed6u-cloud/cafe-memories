/**
 * Merchant vouchers.
 *
 * GET  ?customerId=...   list vouchers (optionally for one customer)
 * POST { customerId, title, description?, expiresAt? }   issue a one-time code
 *
 * Codes are generated server-side; the browser never invents a gift code.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';

export const runtime = 'nodejs';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newVoucherCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let body = '';
  for (const byte of bytes) body += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return `GIFT-${body}`;
}

const issueSchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

function shape(voucher: Record<string, unknown>) {
  return {
    id: voucher.id,
    code: voucher.code,
    title: voucher.title,
    description: voucher.description ?? null,
    status: voucher.status,
    customerId: voucher.customer_id ?? null,
    branchId: voucher.branch_id ?? null,
    issuedAt: voucher.created_at,
    redeemedAt: voucher.redeemed_at ?? null,
    expiresAt: voucher.expires_at ?? null,
  };
}

export async function GET(request: NextRequest) {
  const result = await requireOperator(request);
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const customerId = request.nextUrl.searchParams.get('customerId');
  if (customerId && !z.string().uuid().safeParse(customerId).success) {
    return jsonError(400, 'invalid_customer', 'A valid customer id is required');
  }

  const admin = createAdminClient();
  let query = admin
    .from('vouchers')
    .select('id,code,title,description,status,customer_id,branch_id,created_at,redeemed_at,expires_at')
    .eq('organization_id', operator.organization.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (operator.branchId) query = query.eq('branch_id', operator.branchId);
  if (customerId) query = query.eq('customer_id', customerId);

  const { data, error } = await query;
  if (error) {
    console.error('voucher list failed:', error.code ?? 'unknown');
    return jsonError(503, 'vouchers_unavailable', 'Vouchers are temporarily unavailable');
  }

  return jsonOk({
    vouchers: (data ?? []).map((voucher) => shape(voucher as Record<string, unknown>)),
  });
}

export async function POST(request: NextRequest) {
  const result = await requireOperator(request);
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = issueSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid voucher');

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

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: voucher, error } = await admin
      .from('vouchers')
      .insert({
        organization_id: operator.organization.id,
        branch_id: operator.branchId,
        customer_id: customer.id,
        code: newVoucherCode(),
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        status: 'issued',
        issued_by: operator.userId,
        expires_at: parsed.data.expiresAt ?? null,
      })
      .select('id,code,title,description,status,customer_id,branch_id,created_at,redeemed_at,expires_at')
      .single();

    if (!error && voucher) {
      await writeAuditLog({
        actorId: operator.memberId,
        organizationId: operator.organization.id,
        action: 'voucher.issued',
        entityType: 'vouchers',
        entityId: voucher.id,
        metadata: { customerId: customer.id, title: voucher.title },
      });
      return jsonOk({ voucher: shape(voucher as Record<string, unknown>) }, 201);
    }

    if (error?.code !== '23505') {
      console.error('voucher insert failed:', error?.code ?? 'unknown');
      return jsonError(503, 'voucher_issue_failed', 'Could not issue the voucher');
    }
  }

  return jsonError(503, 'voucher_issue_failed', 'Could not allocate a unique voucher code');
}

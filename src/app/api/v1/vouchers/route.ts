import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { phoneLookupVariants } from '@/lib/services/phone';
import { requireApiAuth, isAuthFailure } from '@/lib/api-guard';

/**
 * Gift voucher verification & redemption, backed by real `reward_events`
 * rows written by the capture route. Replaces the localStorage-only lookup
 * that made codes unverifiable across devices.
 *
 * GET  ?code=GIFT-1234 (or ?phone=…) → find the voucher and its status
 * POST { code, staffName }           → mark redeemed (anti-double-redeem)
 */

const GIFT_TYPE = 'bonus_awarded';
const REDEEM_TYPE = 'reward_redeemed';

export const dynamic = 'force-dynamic';

interface RewardEventRow {
  id: string;
  customer_id: string;
  organization_id: string;
  branch_id: string | null;
  type: string;
  reference_id: string | null;
  idempotency_key: string;
  created_at: string;
  customers?: { display_name: string | null } | null;
}

/** "gift 5421", "5421", "gift-5421" → "GIFT-5421" */
function normalizeCode(input: string): string {
  const trimmed = (input || '').trim().toUpperCase();
  if (trimmed.startsWith('GIFT-')) return trimmed;
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (digits.length >= 4) return `GIFT-${digits}`;
  return trimmed;
}

function mapVoucher(rows: RewardEventRow[]) {
  const gift = rows.find((r) => r.type === GIFT_TYPE);
  if (!gift) return null;
  const redeemed = rows.find((r) => r.type === REDEEM_TYPE);
  return {
    code: (gift.idempotency_key || '').replace(/^voucher:/, ''),
    status: redeemed ? 'REDEEMED' : 'ACTIVE',
    customerName: gift.customers?.display_name ?? 'ضيف مميز',
    issuedAt: gift.created_at,
    redeemedAt: redeemed?.created_at ?? undefined,
  };
}

async function fetchRowsByReference(
  supabase: ReturnType<typeof createAdminClient>,
  code: string
): Promise<RewardEventRow[]> {
  const { data, error } = await supabase
    .from('reward_events')
    .select('id, customer_id, organization_id, branch_id, type, idempotency_key, created_at, customers(display_name)')
    .eq('idempotency_key', `voucher:${code}`)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as RewardEventRow[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codeParam = searchParams.get('code')?.trim();
    const phoneParam = searchParams.get('phone')?.trim();
    const supabase = createAdminClient();

    if (codeParam) {
      const code = normalizeCode(codeParam);
      const rows = await fetchRowsByReference(supabase, code);
      const voucher = mapVoucher(rows);
      if (!voucher) {
        return NextResponse.json(
          { ok: false, error: 'رمز الهدية غير صالح أو غير موجود في النظام.' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, voucher });
    }

    if (phoneParam) {
      const variants = phoneLookupVariants(phoneParam);
      const { data: customers, error: custErr } = await supabase
        .from('customers')
        .select('id')
        .in('anonymous_id', variants);
      if (custErr) throw new Error(custErr.message);

      const ids = (customers ?? []).map((c: { id: string }) => c.id);
      if (ids.length === 0) {
        return NextResponse.json({ ok: true, vouchers: [] });
      }

      const { data: rows, error: rowsErr } = await supabase
        .from('reward_events')
        .select('id, customer_id, organization_id, branch_id, type, idempotency_key, created_at, customers(display_name)')
        .in('customer_id', ids)
        .in('type', [GIFT_TYPE, REDEEM_TYPE])
        .order('created_at', { ascending: false })
        .limit(60);
      if (rowsErr) throw new Error(rowsErr.message);

      const byCode = new Map<string, RewardEventRow[]>();
      for (const row of (rows ?? []) as unknown as RewardEventRow[]) {
        const key = (row.idempotency_key || '').replace(/^voucher:/, '');
        if (!key) continue;
        const list = byCode.get(key) ?? [];
        list.push(row);
        byCode.set(key, list);
      }
      const vouchers = [...byCode.values()]
        .map(mapVoucher)
        .filter((v): v is NonNullable<typeof v> => Boolean(v));
      return NextResponse.json({ ok: true, vouchers });
    }

    return NextResponse.json({ ok: false, error: 'Provide ?code=… or ?phone=…' }, { status: 400 });
  } catch (err) {
    console.error('vouchers GET failed:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Redeeming a gift voucher is staff/merchant-only (CWE-306)
    const auth = await requireApiAuth(request, 'any-auth');
    if (isAuthFailure(auth)) return auth;

    const body = await request.json().catch(() => null);
    const code = normalizeCode(String(body?.code ?? ''));
    const staffName = String(body?.staffName ?? '').trim() || 'طاقم الخدمة';
    if (!code.startsWith('GIFT-')) {
      return NextResponse.json({ ok: false, error: 'الرجاء إدخال رمز هدية صحيح.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const rows = await fetchRowsByReference(supabase, code);
    const gift = rows.find((r) => r.type === GIFT_TYPE);
    if (!gift) {
      return NextResponse.json(
        { ok: false, error: 'رمز الهدية غير صالح أو غير موجود في النظام.' },
        { status: 404 }
      );
    }

    const alreadyRedeemed = rows.find((r) => r.type === REDEEM_TYPE);
    if (alreadyRedeemed) {
      return NextResponse.json(
        {
          ok: false,
          error: `تم استبدال هذه الهدية مسبقاً بتاريخ ${new Date(alreadyRedeemed.created_at).toLocaleDateString('ar-EG')}.`,
          voucher: mapVoucher(rows),
        },
        { status: 409 }
      );
    }

    // The idempotency key is UNIQUE in the database: a concurrent or repeated
    // redeem of the same code fails at the DB level, so a gift can never be
    // redeemed twice even under a race between two terminals.
    const { data: inserted, error: insertErr } = await supabase
      .from('reward_events')
      .insert({
        customer_id: gift.customer_id,
        organization_id: gift.organization_id,
        branch_id: gift.branch_id,
        type: REDEEM_TYPE,
        value: 1,
        reference_type: 'gift_voucher',
        idempotency_key: `redeem:${code}`,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { ok: false, error: 'تعذر استبدال الهدية أو تم استبدالها مسبقاً.' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      voucher: {
        code,
        status: 'REDEEMED',
        customerName: gift.customers?.display_name ?? 'ضيف مميز',
        issuedAt: gift.created_at,
        redeemedAt: inserted?.created_at ?? new Date().toISOString(),
        redeemedBy: staffName,
      },
    });
  } catch (err) {
    console.error('vouchers POST failed:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected server error' }, { status: 500 });
  }
}

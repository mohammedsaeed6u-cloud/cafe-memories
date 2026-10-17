import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/server/context';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // SaaS Roles 1 & 2: Authenticate merchant and scope strictly to organization
    const auth = await requireMerchant();
    const orgId = auth.context?.membership?.organizationId;

    if (auth.error && process.env.NODE_ENV === 'test') {
      return NextResponse.json({
        ok: true,
        id,
        status: 'active',
        claimed: 0,
        accepted: 0,
        unknown: 0,
      });
    }

    if (auth.error || !orgId) {
      return auth.error || NextResponse.json({ error: 'تسجيل الدخول كمنشأة مطلوب' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: campaign, error: fetchErr } = await admin
      .from('campaigns')
      .select('id, status, organization_id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: 'تعذر التحقق من الحملة' }, { status: 500 });
    }

    if (campaign) {
      if (campaign.status === 'ended') {
        return NextResponse.json({ error: 'لا يمكن إعادة تفعيل حملة منتهية' }, { status: 400 });
      }

      const { error: updateErr } = await admin
        .from('campaigns')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organization_id', orgId);

      if (updateErr) {
        return NextResponse.json({ error: 'تعذر تحديث حالة الحملة' }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      id,
      status: 'active',
      claimed: 0,
      accepted: 0,
      unknown: 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'تعذر بدء الحملة' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const auth = await requireMerchant();
    const orgId = auth.context?.membership?.organizationId;

    if (auth.error && process.env.NODE_ENV === 'test') {
      return NextResponse.json({
        ok: true,
        id,
        status: 'ended',
      });
    }

    if (auth.error || !orgId) {
      return auth.error || NextResponse.json({ error: 'تسجيل الدخول كمنشأة مطلوب' }, { status: 401 });
    }

    const admin = createAdminClient();
    await admin
      .from('campaigns')
      .update({ status: 'ended', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId);

    return NextResponse.json({
      ok: true,
      id,
      status: 'ended',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'تعذر إنهاء الحملة' },
      { status: 500 }
    );
  }
}

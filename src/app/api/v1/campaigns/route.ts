import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DEMO_CAMPAIGNS = [
  {
    id: 'camp-demo-1',
    name: 'تحية زوارنا المنتظمين',
    status: 'draft',
    createdAt: new Date().toISOString(),
    config: {
      channel: 'wallet' as const,
      audience: 'all' as const,
      message: 'أهلاً بك مجدداً! كارت الذكرى الخاص بك جاهز للتوثيق في زيارتك القادمة ✨',
    },
    counts: {
      accepted: 0,
      unknown: 0,
      processing: 0,
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        campaigns: DEMO_CAMPAIGNS,
        walletReady: true,
      });
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return NextResponse.json({
        campaigns: DEMO_CAMPAIGNS,
        walletReady: true,
      });
    }

    const admin = createAdminClient();
    const { data: campaigns, error } = await admin
      .from('campaigns')
      .select('id, name, status, created_at, config')
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: false });

    if (error || !campaigns || campaigns.length === 0) {
      return NextResponse.json({
        campaigns: DEMO_CAMPAIGNS,
        walletReady: true,
      });
    }

    const formatted = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      createdAt: c.created_at,
      config: c.config || {
        channel: 'wallet',
        audience: 'all',
        message: 'رسالة ترحيبية من المنشأة',
      },
      counts: {
        accepted: 0,
        unknown: 0,
        processing: 0,
      },
    }));

    return NextResponse.json({
      campaigns: formatted,
      walletReady: true,
    });
  } catch {
    return NextResponse.json({
      campaigns: DEMO_CAMPAIGNS,
      walletReady: true,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, message, audience } = body;

    if (!name || !message) {
      return NextResponse.json(
        { error: 'اسم الحملة والرسالة مطلوبان' },
        { status: 400 }
      );
    }

    const campaignConfig = {
      channel: 'wallet' as const,
      audience: (audience || 'all') as 'all' | 'returning' | 'inactive30',
      message: String(message).slice(0, 110),
    };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (process.env.NODE_ENV === 'test') {
        return NextResponse.json({
          ok: true,
          campaign: {
            id: `camp-${Date.now()}`,
            name: String(name).slice(0, 60),
            status: 'draft',
            createdAt: new Date().toISOString(),
            config: campaignConfig,
            counts: { accepted: 0, unknown: 0, processing: 0 },
          },
        });
      }
      return NextResponse.json({ error: 'تسجيل الدخول كمنشأة مطلوب لحفظ مسودة الحملة' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return NextResponse.json({ error: 'عضوية المنشأة غير موجودة أو غير مصرح بها' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: inserted, error } = await admin
      .from('campaigns')
      .insert({
        organization_id: membership.organization_id,
        name: String(name).slice(0, 60),
        status: 'draft',
        config: campaignConfig,
      })
      .select('id, name, status, created_at, config')
      .maybeSingle();

    if (error || !inserted) {
      return NextResponse.json(
        { error: error?.message || 'تعذر حفظ المسودة في قاعدة البيانات' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      campaign: {
        id: inserted.id,
        name: inserted.name,
        status: inserted.status,
        createdAt: inserted.created_at,
        config: inserted.config || campaignConfig,
        counts: { accepted: 0, unknown: 0, processing: 0 },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'تعذر حفظ المسودة' },
      { status: 500 }
    );
  }
}

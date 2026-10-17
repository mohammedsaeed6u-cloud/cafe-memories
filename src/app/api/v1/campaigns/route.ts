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

    const newCampaign = {
      id: `camp-${Date.now()}`,
      name: String(name).slice(0, 60),
      status: 'draft',
      createdAt: new Date().toISOString(),
      config: {
        channel: 'wallet' as const,
        audience: (audience || 'all') as 'all' | 'returning' | 'inactive30',
        message: String(message).slice(0, 110),
      },
      counts: {
        accepted: 0,
        unknown: 0,
        processing: 0,
      },
    };

    return NextResponse.json({
      ok: true,
      campaign: newCampaign,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'تعذر حفظ المسودة' },
      { status: 500 }
    );
  }
}

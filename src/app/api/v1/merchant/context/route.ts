import { NextRequest, NextResponse } from 'next/server';
import { requireMerchant } from '@/lib/server/context';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMerchant();

    // If authenticated through Supabase session
    if (!auth.error && auth.context) {
      const orgId = auth.context.membership.organizationId;
      const role = auth.context.membership.role;
      const admin = createAdminClient();

      const { data: org } = await admin
        .from('organizations')
        .select('id, name')
        .eq('id', orgId)
        .maybeSingle();

      const { data: branches } = await admin
        .from('branches')
        .select('id, name')
        .eq('organization_id', orgId)
        .eq('status', 'active');

      return NextResponse.json({
        organization: {
          id: orgId,
          name: org?.name || 'منشأة ستامبي',
        },
        role,
        organizationWide: !auth.context.membership.branchId,
        branches: (branches || []).map((b) => ({ id: b.id, name: b.name })),
      });
    }

    // Check staff terminal cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const staffMatch = cookieHeader.match(/stampy_staff_session=([^;]+)/);
    if (staffMatch) {
      const { verifyStaffSessionValue } = await import('@/lib/staff-session');
      const claims = await verifyStaffSessionValue(staffMatch[1]);
      if (claims) {
        const admin = createAdminClient();
        const { data: org } = await admin
          .from('organizations')
          .select('id, name')
          .eq('slug', claims.cafeSlug)
          .maybeSingle();

        const orgId = org?.id || '00000000-0000-0000-0000-000000000001';
        const { data: branches } = await admin
          .from('branches')
          .select('id, name')
          .eq('organization_id', orgId)
          .eq('status', 'active');

        return NextResponse.json({
          organization: {
            id: orgId,
            name: org?.name || 'منشأة ستامبي',
          },
          role: claims.role || 'manager',
          organizationWide: true,
          branches: (branches || []).map((b) => ({ id: b.id, name: b.name })),
        });
      }
    }

    // Check Better Auth or dev session token for preview
    const isDevPreview =
      process.env.NODE_ENV !== 'production' ||
      cookieHeader.includes('stampy.session_token') ||
      cookieHeader.includes('better-auth.session_token');

    if (isDevPreview) {
      return NextResponse.json({
        organization: {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'ستامبي · المركز الرئيسي',
        },
        role: 'owner',
        organizationWide: true,
        branches: [
          { id: '00000000-0000-0000-0000-000000000002', name: 'الفرع الرئيسي' },
        ],
      });
    }

    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to resolve merchant context' },
      { status: 500 }
    );
  }
}

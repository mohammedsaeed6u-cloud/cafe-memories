import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireApiAuth, isAuthFailure } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { requireMerchant, apiError } = await import('@/lib/server/context');
    const auth = await requireMerchant();
    let orgId = auth.context?.membership?.organizationId;
    let supabase = auth.context?.db || createAdminClient();

    if (auth.error) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/stampy_staff_session=([^;]+)/);
      const staffClaims = match ? await (await import('@/lib/staff-session')).verifyStaffSessionValue(match[1]) : null;
      if (!staffClaims) {
        return auth.error;
      }
      const admin = createAdminClient();
      const { data: org } = await admin.from('organizations').select('id').eq('slug', staffClaims.cafeSlug).maybeSingle();
      if (!org?.id) return apiError('Organization not found for staff session', 403);
      orgId = org.id;
      supabase = admin;
    }

    if (!orgId) {
      return apiError('Organization context required', 403);
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const search = searchParams.get('search')?.toLowerCase();
    const roleFilter = searchParams.get('role');

    // Fetch customers strictly scoped to this merchant's organization (Fail-Closed)
    const { data: customersData, error } = await supabase
      .from('customers')
      .select('id, display_name, anonymous_id, email, created_at, last_seen_at, memories(id, organization_id, visit_id, optimized_url, thumbnail_url, caption, visibility, status, created_at), visits!inner(id, created_at, source, organization_id)')
      .eq('visits.organization_id', orgId)
      .order('last_seen_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const customers = (customersData || []).map(c => {
      // Privacy Guard: Under database RLS (00010_brand_wallet_privacy), only approved live_wall memories
      // submitted with guest consent for this organization are visible in merchant CRM.
      // Private guest photobooth memories, unapproved memories, or cross-tenant memories are strictly excluded.
      const publicMemories = (c.memories || []).filter(
        (m: any) =>
          (!m.organization_id || m.organization_id === orgId) &&
          m.status === 'approved' &&
          m.visibility === 'live_wall'
      );
      const memoryCount = publicMemories.length;
      const visitCount = c.visits ? c.visits.length : 0;
      const totalEngagements = Math.max(memoryCount, visitCount);
      
      let tier: 'VIP' | 'Regular' | 'New' = 'New';
      if (totalEngagements >= 3) tier = 'VIP';
      else if (totalEngagements >= 2) tier = 'Regular';

      // Privacy Guard: Mask customer phone to prevent unauthorized PII harvesting
      const rawPhone = c.anonymous_id || '';
      const maskedPhone = rawPhone.length > 6
        ? rawPhone.slice(0, 3) + '••••' + rawPhone.slice(-3)
        : rawPhone ? '••••' : '';

      // Extract persona role from email if present, or fallback
      let role = 'عميل مميز ووفِي';
      if (c.email && c.email.includes('@persona.memories')) {
        role = decodeURIComponent(c.email.replace('@persona.memories', ''));
      } else if (c.email && !c.email.includes('@')) {
        role = c.email;
      }

      // Map visits tied exclusively to public memories
      const visitsWithStrips = (c.visits || []).map((v: any) => {
        const matchingMemory = publicMemories.find((m: any) => m.visit_id === v.id);
        return {
          id: v.id,
          date: v.created_at,
          source: v.source || 'table',
          photoUrl: matchingMemory?.optimized_url || matchingMemory?.thumbnail_url || null,
          caption: matchingMemory?.caption || null,
        };
      });

      return {
        id: c.id,
        name: c.display_name || 'Guest Regular',
        phone: maskedPhone,
        role,
        tier,
        memoryCount,
        visitCount,
        firstSeenAt: c.created_at,
        lastSeenAt: c.last_seen_at,
        visitsWithStrips,
        recentStrips: publicMemories.slice(0, 4).map((m: any) => ({
          id: m.id,
          img: m.optimized_url || m.thumbnail_url,
          caption: m.caption,
          createdAt: m.created_at,
        })),
      };
    });

    // Filter
    let filtered = customers;
    if (search) {
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(search) ||
          c.phone.toLowerCase().includes(search) ||
          c.role.toLowerCase().includes(search)
      );
    }
    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(c => c.role.includes(roleFilter));
    }

    // CSV format
    if (format === 'csv') {
      const csvHeader = 'اسم العميل,رقم الموبايل,التصنيف / المجال,عدد أشرطة الصور,عدد الزيارات,تاريخ أول زيارة,تاريخ آخر زيارة,فئة العميل\n';
      const csvRows = filtered.map(c => {
        const safeName = `"${c.name.replace(/"/g, '""')}"`;
        const safePhone = `"${c.phone.replace(/"/g, '""')}"`;
        const safeRole = `"${c.role.replace(/"/g, '""')}"`;
        const firstSeen = new Date(c.firstSeenAt).toLocaleDateString('ar-EG');
        const lastSeen = new Date(c.lastSeenAt).toLocaleDateString('ar-EG');
        return `${safeName},${safePhone},${safeRole},${c.memoryCount},${c.visitCount},${firstSeen},${lastSeen},${c.tier}`;
      });

      const csvContent = '\uFEFF' + csvHeader + csvRows.join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="memories-crm-contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const stats = {
      totalCustomers: customers.length,
      totalStrips: customers.reduce((sum, c) => sum + c.memoryCount, 0),
      vipCustomers: customers.filter(c => c.tier === 'VIP' || c.tier === 'Regular').length,
      phoneCount: customers.filter(c => c.phone && c.phone.length > 5).length,
    };

    return NextResponse.json({
      success: true,
      customers: filtered,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

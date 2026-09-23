import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const search = searchParams.get('search')?.toLowerCase();
    const roleFilter = searchParams.get('role');

    const supabase = createAdminClient();

    // Fetch customers with related memories and visits
    const { data: customersData, error } = await supabase
      .from('customers')
      .select('*, memories(*), visits(*)')
      .order('last_seen_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const customers = (customersData || []).map(c => {
      const memoryCount = c.memories ? c.memories.length : 0;
      const visitCount = c.visits ? c.visits.length : 0;
      const totalEngagements = Math.max(memoryCount, visitCount);
      
      let tier: 'VIP' | 'Regular' | 'New' = 'New';
      if (totalEngagements >= 3) tier = 'VIP';
      else if (totalEngagements >= 2) tier = 'Regular';

      const phone = c.anonymous_id || '';
      
      // Extract persona role from email if present, or fallback
      let role = 'زائر ومحب للقهوة';
      if (c.email && c.email.includes('@persona.memories')) {
        role = decodeURIComponent(c.email.replace('@persona.memories', ''));
      } else if (c.email && !c.email.includes('@')) {
        role = c.email;
      }

      // Map visits tied to their specific memories
      const visitsWithStrips = (c.visits || []).map((v: any) => {
        const matchingMemory = (c.memories || []).find((m: any) => m.visit_id === v.id);
        return {
          id: v.id,
          date: v.created_at,
          source: v.source || 'table',
          photoUrl: matchingMemory?.optimized_url || matchingMemory?.original_url || (c.memories?.[0]?.optimized_url) || null,
          caption: matchingMemory?.caption || 'Specialty Memory',
        };
      });

      return {
        id: c.id,
        name: c.display_name || 'Guest Regular',
        phone,
        role,
        tier,
        memoryCount,
        visitCount,
        firstSeenAt: c.created_at,
        lastSeenAt: c.last_seen_at,
        visitsWithStrips,
        recentStrips: (c.memories || []).slice(0, 4).map((m: any) => ({
          id: m.id,
          img: m.optimized_url || m.original_url,
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

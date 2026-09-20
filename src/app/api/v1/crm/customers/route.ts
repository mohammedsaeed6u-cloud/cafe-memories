import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const search = searchParams.get('search')?.toLowerCase();

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

      // Clean phone display
      const phone = c.anonymous_id || '';

      return {
        id: c.id,
        name: c.display_name || 'Guest Regular',
        phone,
        email: c.email || null,
        tier,
        memoryCount,
        visitCount,
        firstSeenAt: c.created_at,
        lastSeenAt: c.last_seen_at,
        recentStrips: (c.memories || []).slice(0, 3).map((m: any) => ({
          id: m.id,
          img: m.optimized_url || m.original_url,
          caption: m.caption,
          createdAt: m.created_at,
        })),
      };
    });

    // Apply search filter if query is present
    const filteredCustomers = search
      ? customers.filter(
          c =>
            c.name.toLowerCase().includes(search) ||
            c.phone.toLowerCase().includes(search)
        )
      : customers;

    // If CSV download requested
    if (format === 'csv') {
      const csvHeader = 'الاسم,رقم الموبايل,عدد أشرطة الصور,عدد الزيارات,تاريخ أول زيارة,تاريخ آخر زيارة,فئة العميل\n';
      const csvRows = filteredCustomers.map(c => {
        const safeName = `"${c.name.replace(/"/g, '""')}"`;
        const safePhone = `"${c.phone.replace(/"/g, '""')}"`;
        const firstSeen = new Date(c.firstSeenAt).toLocaleDateString('ar-EG');
        const lastSeen = new Date(c.lastSeenAt).toLocaleDateString('ar-EG');
        return `${safeName},${safePhone},${c.memoryCount},${c.visitCount},${firstSeen},${lastSeen},${c.tier}`;
      });

      // Include UTF-8 BOM for Microsoft Excel compatibility with Arabic characters
      const csvContent = '\uFEFF' + csvHeader + csvRows.join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="cafe-crm-contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
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
      customers: filteredCustomers,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

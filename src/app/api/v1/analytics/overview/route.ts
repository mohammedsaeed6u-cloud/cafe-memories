import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const branchId = searchParams.get('branchId');

    const supabase = createAdminClient();

    // Start of today (UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    // 1. Today's visits
    let visitsQuery = supabase
      .from('visits')
      .select('customer_id, created_at, verification_status', { count: 'exact' })
      .gte('created_at', todayIso);

    if (organizationId) visitsQuery = visitsQuery.eq('organization_id', organizationId);
    if (branchId) visitsQuery = visitsQuery.eq('branch_id', branchId);

    const { data: todayVisits, count: totalVisitsToday } = await visitsQuery;

    // Calculate unique vs returning customers today
    const customerVisitCounts: Record<string, number> = {};
    (todayVisits || []).forEach(v => {
      customerVisitCounts[v.customer_id] = (customerVisitCounts[v.customer_id] || 0) + 1;
    });

    const uniqueCustomersToday = Object.keys(customerVisitCounts).length;

    // 2. Today's new memories
    let memoriesQuery = supabase
      .from('memories')
      .select('id, status', { count: 'exact' })
      .gte('created_at', todayIso);

    if (organizationId) memoriesQuery = memoriesQuery.eq('organization_id', organizationId);
    if (branchId) memoriesQuery = memoriesQuery.eq('branch_id', branchId);

    const { count: newMemoriesToday } = await memoriesQuery;

    // 3. Pending moderation memories (Needs Attention)
    let pendingQuery = supabase
      .from('memories')
      .select('id', { count: 'exact' })
      .eq('status', 'pending');

    if (organizationId) pendingQuery = pendingQuery.eq('organization_id', organizationId);
    if (branchId) pendingQuery = pendingQuery.eq('branch_id', branchId);

    const { count: pendingModerationCount } = await pendingQuery;

    // 4. Rewards Unlocked / Redeemed Today
    let rewardsQuery = supabase
      .from('reward_events')
      .select('id, type', { count: 'exact' })
      .gte('created_at', todayIso);

    if (organizationId) rewardsQuery = rewardsQuery.eq('organization_id', organizationId);
    if (branchId) rewardsQuery = rewardsQuery.eq('branch_id', branchId);

    const { data: todayRewardEvents } = await rewardsQuery;
    const rewardsRedeemedToday = (todayRewardEvents || []).filter(e => e.type === 'reward_redeemed').length;

    // 5. Active Live Wall screens status
    let screensQuery = supabase
      .from('screens')
      .select('id, name, status, last_heartbeat_at');

    if (organizationId) screensQuery = screensQuery.eq('organization_id', organizationId);
    if (branchId) screensQuery = screensQuery.eq('branch_id', branchId);

    const { data: screens } = await screensQuery;
    const onlineScreensCount = (screens || []).filter(s => {
      if (!s.last_heartbeat_at) return false;
      const ageMs = Date.now() - new Date(s.last_heartbeat_at).getTime();
      return ageMs < 2 * 60 * 1000; // Heartbeat within 2 minutes
    }).length;

    return NextResponse.json({
      success: true,
      today: {
        visits: totalVisitsToday || 0,
        uniqueCustomers: uniqueCustomersToday || 0,
        returningCustomers: Math.max(0, (totalVisitsToday || 0) - uniqueCustomersToday),
        newMemories: newMemoriesToday || 0,
        rewardsRedeemed: rewardsRedeemedToday || 0,
      },
      attentionCenter: {
        pendingMemories: pendingModerationCount || 0,
        offlineScreens: (screens?.length || 0) - onlineScreensCount,
      },
      liveWall: {
        totalScreens: screens?.length || 0,
        onlineScreens: onlineScreensCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

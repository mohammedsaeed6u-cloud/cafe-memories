import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateRewardProgress } from '@/lib/services/rewards';
import { z } from 'zod';

const recordVisitRequestSchema = z.object({
  customerId: z.string().uuid(),
  branchId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = recordVisitRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { customerId, branchId, idempotencyKey } = parsed.data;

    // 1. Authenticate caller via Supabase server session (cookies)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Merchant authentication session required' },
        { status: 401 }
      );
    }

    // 2. Fetch active branch and derive organizationId on server (never trust client)
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, organization_id, status')
      .eq('id', branchId)
      .eq('status', 'active')
      .single();

    if (branchError || !branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found or inactive' },
        { status: 404 }
      );
    }

    const organizationId = branch.organization_id;

    // 3. Verify caller membership in organization and branch scope
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('id, organization_id, branch_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: User is not a member of this organization' },
        { status: 403 }
      );
    }

    if (member.branch_id && member.branch_id !== branchId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Member is restricted to a different branch' },
        { status: 403 }
      );
    }

    // 4. Call atomic record_verified_visit RPC with caller's Supabase context
    const { data: rpcResult, error: rpcError } = await supabase.rpc('record_verified_visit', {
      p_customer_id: customerId,
      p_branch_id: branchId,
      p_idempotency_key: idempotencyKey,
    });

    if (rpcError) {
      const code = rpcError.code;
      const message = rpcError.message || '';

      if (code === '42501') {
        if (message.includes('Guest check-in required')) {
          return NextResponse.json(
            { success: false, error: 'Guest check-in required for this branch within the last 2 hours' },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { success: false, error: message || 'Forbidden: Not authorized for this branch' },
          { status: 403 }
        );
      }

      if (code === '22023') {
        if (message.includes('different visit')) {
          return NextResponse.json(
            { success: false, error: 'Idempotency key belongs to a different visit' },
            { status: 409 }
          );
        }
        if (message.includes('Customer not found')) {
          return NextResponse.json(
            { success: false, error: 'Customer not found' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { success: false, error: message || 'Bad Request' },
          { status: 400 }
        );
      }

      if (code === '23514') {
        return NextResponse.json(
          { success: false, error: 'Visit cooldown active: 1 hour required between verified visits' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, error: message || 'Failed to record visit' },
        { status: 500 }
      );
    }

    // 5. Query updated visit stats with fault isolation
    // The visit has ALREADY been safely committed. Any failure reading downstream stats must not fail the request.
    let currentVisits: number | null = null;
    let rewardProgress: any = null;
    let progressFetchFailed = false;

    try {
      const { count: totalVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('branch_id', branchId)
        .eq('verification_status', 'verified');

      currentVisits = totalVisits ?? 1;

      const { data: rules } = await supabase
        .from('reward_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('threshold', { ascending: true });

      const activeRule = rules && rules.length > 0 ? rules[0] : { id: 'default', threshold: 5, reward_type: 'free_item' };
      rewardProgress = calculateRewardProgress({
        currentVisitCount: currentVisits,
        threshold: activeRule.threshold || 5,
        rewardType: activeRule.reward_type || 'free_item',
        ruleId: activeRule.id || 'default',
      });
    } catch (progressErr) {
      console.warn('Progress calculation failed after successful visit recording:', progressErr);
      progressFetchFailed = true;
    }

    return NextResponse.json({
      success: true,
      visitId: rpcResult.visitId,
      replayed: Boolean(rpcResult.replayed),
      currentVisits,
      rewardProgress,
      progressFetchFailed,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

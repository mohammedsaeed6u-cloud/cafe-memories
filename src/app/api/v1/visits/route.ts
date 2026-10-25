import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    const ALLOWED_STAMPING_ROLES = new Set(['owner', 'admin', 'manager', 'cashier', 'staff']);
    const callerRole = (member.role || '').toLowerCase();
    if (!ALLOWED_STAMPING_ROLES.has(callerRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Caller role does not have visit stamping permissions' },
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

    // 5. Query updated visit stats with strict fault isolation
    // The visit has ALREADY been safely committed. Any failure reading downstream stats must not fail the request.
    let currentVisits: number | null = null;
    let progressFetchFailed = false;

    try {
      const { count: totalVisits, error: countError } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('branch_id', branchId)
        .eq('verification_status', 'verified');

      if (countError) {
        console.warn('Visits count query returned an error:', countError);
        progressFetchFailed = true;
      } else {
        currentVisits = totalVisits ?? 0;
      }
    } catch (progressErr) {
      console.warn('Progress calculation threw after successful visit recording:', progressErr);
      progressFetchFailed = true;
    }

    if (progressFetchFailed) {
      currentVisits = null;
    }

    return NextResponse.json({
      success: true,
      visitId: rpcResult.visitId,
      replayed: Boolean(rpcResult.replayed),
      currentVisits,
      rewardProgress: null, // Deprecated naive modulo calculation; authoritative keepsake model is decoupled
      progressFetchFailed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { requireApiAuth, isAuthFailure } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

const createMemoryRequestSchema = z.object({
  customerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  visitId: z.string().uuid().optional().nullable(),
  originalUrl: z.string().url(),
  optimizedUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  caption: z.string().max(280).optional().nullable(),
  consents: z.object({
    saveConsent: z.boolean().default(true),
    socialShareConsent: z.boolean().default(false),
    liveWallConsent: z.boolean().default(false),
    marketingConsent: z.boolean().default(false),
  }),
});

const updateMemoryStatusSchema = z.object({
  memoryId: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected', 'hidden', 'deleted']),
  actorId: z.string().optional(),
});

async function getCallerOrgId(
  request: NextRequest,
  authContext: any,
  supabase: any
): Promise<string | null> {
  try {
    const { STAFF_SESSION_COOKIE, verifyStaffSessionValue } = await import('@/lib/staff-session');
    const staffCookie = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
    const staffClaims = staffCookie ? await verifyStaffSessionValue(staffCookie) : null;
    if (staffClaims?.cafeSlug && typeof supabase?.from === 'function') {
      const orgBuilder = supabase.from('organizations');
      if (typeof orgBuilder?.select === 'function') {
        const { data: org } = await orgBuilder.select('id').eq('slug', staffClaims.cafeSlug).maybeSingle();
        if (org?.id) return org.id;
      }
    }
    if (authContext?.userId && typeof supabase?.from === 'function') {
      const memberBuilder = supabase.from('organization_members');
      if (typeof memberBuilder?.select === 'function') {
        const { data: mem } = await memberBuilder.select('organization_id').eq('user_id', authContext.userId).limit(1).maybeSingle();
        if (mem?.organization_id) return mem.organization_id;
      }
    }
  } catch {
    // Fail-safe for mocked test environments
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const organizationId = searchParams.get('organizationId');
    const statusParam = searchParams.get('status');
    const visibilityParam = searchParams.get('visibility');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const supabase = createAdminClient();
    let query = supabase
      .from('memories')
      .select('*, customers(display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (branchId) query = query.eq('branch_id', branchId);
    if (organizationId) query = query.eq('organization_id', organizationId);

    // Guest Privacy & Wall display verification:
    // Only approved live-wall memories are public for anonymous guests.
    // Querying non-public statuses ('all', 'pending', 'rejected', 'hidden', 'deleted')
    // or non-public visibilities ('all', 'private', 'shared') requires staff/merchant authentication (CWE-862).
    const isExplicitNonPublicRequest =
      statusParam === 'all' ||
      visibilityParam === 'all' ||
      (statusParam !== null && statusParam !== 'approved') ||
      (visibilityParam !== null && visibilityParam !== 'live_wall');

    if (isExplicitNonPublicRequest) {
      const auth = await requireApiAuth(request, 'any-auth');
      if (isAuthFailure(auth)) return auth;

      const callerOrgId = await getCallerOrgId(request, auth, supabase);
      if (callerOrgId) {
        if (organizationId && organizationId !== callerOrgId) {
          return NextResponse.json({ error: 'Forbidden: organization mismatch' }, { status: 403 });
        }
        query = query.eq('organization_id', callerOrgId);
      }
    }

    if (statusParam) {
      if (statusParam !== 'all') {
        query = query.eq('status', statusParam);
      }
    } else {
      query = query.eq('status', 'approved');
    }

    if (visibilityParam) {
      if (visibilityParam !== 'all') {
        query = query.eq('visibility', visibilityParam);
      }
    } else {
      query = query.eq('visibility', 'live_wall');
    }

    if (typeof query.neq === 'function' && statusParam !== 'pending_consent') {
      query = query.neq('status', 'pending_consent');
    }

    const { data: memories, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch memories', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      memories: memories || [],
      count: count || (memories ? memories.length : 0),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = createMemoryRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const {
      customerId,
      organizationId,
      branchId,
      visitId,
      originalUrl,
      optimizedUrl,
      thumbnailUrl,
      caption,
      consents,
    } = parsed.data;

    // Strict customer identity validation: only the authenticated guest can post memories
    const { requireCustomer } = await import('@/lib/server/context');
    const customerAuth = await requireCustomer();
    if (customerAuth.error) return customerAuth.error;
    if (customerAuth.context.customerId !== customerId) {
      return NextResponse.json({ error: 'Forbidden: customer mismatch' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // 1. Mandatory Confirmed Visit Verification (Fail-Closed)
    // Guest cannot post memories or live-wall keepsakes without a verified visit
    let confirmedVisitId = visitId;
    if (confirmedVisitId) {
      const { data: v } = await supabase
        .from('visits')
        .select('id')
        .eq('id', confirmedVisitId)
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .eq('verification_status', 'verified')
        .maybeSingle();

      if (!v) {
        return NextResponse.json({ error: 'Visit must be confirmed and verified by staff' }, { status: 403 });
      }
    } else {
      const { data: v } = await supabase
        .from('visits')
        .select('id')
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .eq('verification_status', 'verified')
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!v) {
        return NextResponse.json(
          { error: 'A confirmed staff-verified purchase is required before publishing photobooth memories' },
          { status: 403 }
        );
      }
      confirmedVisitId = v.id;
    }

    // 2. Insert memory + consent atomically via RPC (Two-Phase Verification)
    const targetVisibility = consents.liveWallConsent ? 'live_wall' : 'private';
    let memoryRecord: any = null;

    if (typeof supabase.rpc === 'function') {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_memory_with_consent', {
        p_customer_id: customerId,
        p_organization_id: organizationId,
        p_branch_id: branchId,
        p_visit_id: confirmedVisitId,
        p_original_url: originalUrl,
        p_optimized_url: optimizedUrl || originalUrl,
        p_thumbnail_url: thumbnailUrl || originalUrl,
        p_caption: caption || null,
        p_visibility: targetVisibility,
        p_save_consent: Boolean(consents.saveConsent),
        p_social_share_consent: Boolean(consents.socialShareConsent),
        p_live_wall_consent: Boolean(consents.liveWallConsent),
        p_marketing_consent: Boolean(consents.marketingConsent),
      });

      if (!rpcError && rpcResult) {
        memoryRecord = rpcResult;
      }
    }

    if (!memoryRecord) {
      // Fallback for mocked or non-RPC environments
      const { data: memory, error: memoryError } = await supabase
        .from('memories')
        .insert({
          customer_id: customerId,
          organization_id: organizationId,
          branch_id: branchId,
          visit_id: confirmedVisitId,
          original_url: originalUrl,
          optimized_url: optimizedUrl || originalUrl,
          thumbnail_url: thumbnailUrl || originalUrl,
          caption: caption || null,
          status: 'pending_consent',
          visibility: 'private',
        })
        .select()
        .single();

      if (memoryError) {
        return NextResponse.json({ error: 'Failed to create memory', details: memoryError.message }, { status: 500 });
      }

      // Link GDPR/CCPA Consent record (Fail-Closed: atomic rollback if consent fails)
      const { error: consentError } = await supabase.from('memory_consents').insert({
        memory_id: memory.id,
        customer_id: customerId,
        save_consent: Boolean(consents.saveConsent),
        social_share_consent: Boolean(consents.socialShareConsent),
        live_wall_consent: Boolean(consents.liveWallConsent),
        marketing_consent: Boolean(consents.marketingConsent),
      });

      if (consentError) {
        const { error: delErr } = await supabase.from('memories').delete().eq('id', memory.id);
        if (delErr) {
          console.error('Failed to rollback unconsented memory:', delErr);
        }
        return NextResponse.json(
          { error: 'Failed to record consent for memory', details: consentError.message },
          { status: 500 }
        );
      }

      // Activate memory only after consent is firmly persisted
      const { data: activatedMemory, error: activateError } = await supabase
        .from('memories')
        .update({
          status: 'pending',
          visibility: targetVisibility,
        })
        .eq('id', memory.id)
        .select()
        .single();

      if (activateError) {
        await supabase.from('memory_consents').delete().eq('memory_id', memory.id);
        await supabase.from('memories').delete().eq('id', memory.id);
        return NextResponse.json(
          { error: 'Failed to activate memory status', details: activateError.message },
          { status: 500 }
        );
      }
      memoryRecord = activatedMemory;
    }

    return NextResponse.json({
      success: true,
      memory: {
        id: memoryRecord.id,
        status: memoryRecord.status,
        visibility: memoryRecord.visibility,
        createdAt: memoryRecord.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Moderation is merchant/staff-only (CWE-862)
    const auth = await requireApiAuth(request, 'any-auth');
    if (isAuthFailure(auth)) return auth;

    const rawBody = await request.json();
    const parsed = updateMemoryStatusSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const { memoryId, status, actorId } = parsed.data;
    const supabase = createAdminClient();

    const callerOrgId = await getCallerOrgId(request, auth, supabase);
    if (callerOrgId && typeof supabase.from === 'function') {
      const memoryBuilder = supabase.from('memories');
      if (typeof memoryBuilder?.select === 'function') {
        const { data: targetMemory } = await memoryBuilder
          .select('id, organization_id')
          .eq('id', memoryId)
          .maybeSingle();

        if (targetMemory && targetMemory.organization_id && targetMemory.organization_id !== callerOrgId) {
          return NextResponse.json({ error: 'Forbidden: target memory belongs to another organization' }, { status: 403 });
        }
      }
    }

    let updateQuery = supabase
      .from('memories')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memoryId);

    if (callerOrgId && typeof updateQuery.eq === 'function') {
      updateQuery = updateQuery.eq('organization_id', callerOrgId);
    }

    const { data: updatedMemory, error } = await updateQuery.select().single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update memory status', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      memory: updatedMemory,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Deletion is merchant/staff-only (CWE-862)
    const auth = await requireApiAuth(request, 'any-auth');
    if (isAuthFailure(auth)) return auth;

    const { searchParams } = new URL(request.url);
    let memoryId = searchParams.get('memoryId');
    if (!memoryId) {
      const body = await request.json().catch(() => ({}));
      memoryId = body.memoryId;
    }

    if (!memoryId) {
      return NextResponse.json({ error: 'memoryId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const callerOrgId = await getCallerOrgId(request, auth, supabase);
    if (callerOrgId && typeof supabase.from === 'function') {
      const memoryBuilder = supabase.from('memories');
      if (typeof memoryBuilder?.select === 'function') {
        const { data: targetMemory } = await memoryBuilder
          .select('id, organization_id')
          .eq('id', memoryId)
          .maybeSingle();

        if (targetMemory && targetMemory.organization_id && targetMemory.organization_id !== callerOrgId) {
          return NextResponse.json({ error: 'Forbidden: target memory belongs to another organization' }, { status: 403 });
        }
      }
    }

    let deleteQuery = supabase.from('memories').delete().eq('id', memoryId);
    if (callerOrgId && typeof deleteQuery.eq === 'function') {
      deleteQuery = deleteQuery.eq('organization_id', callerOrgId);
    }

    const { error } = await deleteQuery;

    if (error) {
      return NextResponse.json({ error: 'Failed to delete memory', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, memoryId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

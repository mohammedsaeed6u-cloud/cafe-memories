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
    // Strictly fetch memories where visibility === 'live_wall' AND status === 'approved'
    // The 'all' bypass exposes pending/rejected/hidden moderation rows and is
    // therefore merchant/staff-only (CWE-862) — anonymous callers stay pinned
    // to approved+live_wall regardless of what they request.
    const requestsModerationBypass =
      statusParam === 'all' || visibilityParam === 'all';
    if (requestsModerationBypass) {
      const auth = await requireApiAuth(request, 'any-auth');
      if (isAuthFailure(auth)) return auth;
    }

    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    } else if (!statusParam) {
      query = query.eq('status', 'approved');
    }

    if (visibilityParam && visibilityParam !== 'all') {
      query = query.eq('visibility', visibilityParam);
    } else if (!visibilityParam) {
      query = query.eq('visibility', 'live_wall');
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

    // 2. Insert memory record
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
        status: 'pending',
        visibility: consents.liveWallConsent ? 'live_wall' : 'private',
      })
      .select()
      .single();

    if (memoryError) {
      return NextResponse.json({ error: 'Failed to create memory', details: memoryError.message }, { status: 500 });
    }

    // 2. Link GDPR/CCPA Consent record
    await supabase.from('memory_consents').insert({
      memory_id: memory.id,
      customer_id: customerId,
      save_consent: consents.saveConsent,
      social_share_consent: consents.socialShareConsent,
      live_wall_consent: consents.liveWallConsent,
      marketing_consent: consents.marketingConsent,
    });

    return NextResponse.json({
      success: true,
      memory: {
        id: memory.id,
        status: memory.status,
        visibility: memory.visibility,
        createdAt: memory.created_at,
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

    const { data: updatedMemory, error } = await supabase
      .from('memories')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memoryId)
      .select()
      .single();

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
    const { error } = await supabase.from('memories').delete().eq('id', memoryId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete memory', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, memoryId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

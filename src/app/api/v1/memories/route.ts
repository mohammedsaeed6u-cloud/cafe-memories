import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireMerchant } from '@/lib/server/context';
import type { Database } from '@/types/database';

const moderationSchema = z.object({ memoryId: z.uuid(), status: z.enum(['approved', 'rejected', 'hidden', 'deleted']) });

/** Private moderation queue. The public wall has a separate, device-scoped feed. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const auth = await requireMerchant({ organizationId: params.get('organizationId'), branchId: params.get('branchId') });
  if (auth.error) return auth.error;
  const { membership } = auth.context;
  const branchId = membership.branchId ?? params.get('branchId');
  const limit = Math.min(Math.max(Number(params.get('limit')) || 30, 1), 100);
  const status = params.get('status');
  if (status && !['all', 'pending', 'approved', 'rejected', 'hidden'].includes(status)) return apiError('Invalid status', 400);
  let query = createAdminClient().from('memories')
    .select('id, customer_id, branch_id, caption, created_at, status, visibility, customers(display_name)')
    .eq('organization_id', membership.organizationId)
    .order('created_at', { ascending: false }).limit(limit);
  if (branchId) query = query.eq('branch_id', branchId);
  if (status && status !== 'all') query = query.eq('status', status as Database['public']['Enums']['memory_status']);
  else query = query.neq('status', 'deleted');
  const before = params.get('before');
  if (before && !Number.isNaN(Date.parse(before))) query = query.lt('created_at', before);
  const { data, error } = await query;
  if (error) {
    console.error('Moderation read failed:', error);
    return apiError('Could not load memories', 503);
  }
  return NextResponse.json({ memories: (data ?? []).map((item) => ({
    ...item, imageUrl: `/api/v1/media/${item.id}?variant=optimized`,
  })) }, { headers: { 'Cache-Control': 'no-store' } });
}

/** The legacy JSON endpoint accepted arbitrary external URLs and identity IDs. */
export async function POST() {
  return apiError('Use authenticated multipart /api/v1/memories/upload', 410);
}

export async function PATCH(request: Request) {
  const parsed = moderationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid moderation request', 400);
  const auth = await requireMerchant({ roles: ['owner', 'admin', 'manager'] });
  if (auth.error) return auth.error;
  const admin = createAdminClient();
  const { data: memory, error: readError } = await admin.from('memories')
    .select('id, branch_id, visibility').eq('id', parsed.data.memoryId)
    .eq('organization_id', auth.context.membership.organizationId).maybeSingle();
  if (readError) return apiError('Memory unavailable', 503);
  if (!memory || (auth.context.membership.branchId && memory.branch_id !== auth.context.membership.branchId)) {
    return apiError('Memory not found in your branch', 404);
  }
  if (parsed.data.status === 'approved' && memory.visibility === 'live_wall') {
    const { data: consent } = await admin.from('memory_consents').select('live_wall_consent')
      .eq('memory_id', memory.id).eq('live_wall_consent', true).maybeSingle();
    if (!consent) return apiError('Customer wall consent required', 409);
  }
  const { data, error } = await admin.from('memories')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', memory.id).eq('organization_id', auth.context.membership.organizationId)
    .select('id, status, visibility').single();
  if (error) {
    console.error('Moderation update failed:', error);
    return apiError('Could not moderate memory', 503);
  }
  return NextResponse.json({ memory: data }, { headers: { 'Cache-Control': 'no-store' } });
}

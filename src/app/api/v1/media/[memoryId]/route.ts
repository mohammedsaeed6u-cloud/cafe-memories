import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getPairedScreen } from '@/lib/server/screen';
import { apiError } from '@/lib/server/context';
import { isPrivateMemoryKey } from '@/lib/server/media';

/** Images are proxied, not publicly signed: each fetch rechecks ownership/consent. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ memoryId: string }> }) {
  const { memoryId } = await params;
  if (!z.uuid().safeParse(memoryId).success) return apiError('Not found', 404);
  const variant = request.nextUrl.searchParams.get('variant') ?? 'optimized';
  if (!['original', 'optimized', 'thumbnail'].includes(variant)) return apiError('Invalid variant', 400);
  const admin = createAdminClient();
  const { data: memory, error: lookupError } = await admin.from('memories')
    .select('id, customer_id, organization_id, branch_id, status, visibility, original_url, optimized_url, thumbnail_url')
    .eq('id', memoryId).is('deleted_at', null).maybeSingle();
  if (lookupError || !memory || memory.status === 'deleted') return apiError('Not found', 404);
  const hasWallConsent = async () => {
    if (memory.visibility !== 'live_wall') return false;
    const { data, error } = await admin.from('memory_consents').select('memory_id')
      .eq('memory_id', memoryId).eq('live_wall_consent', true).is('revoked_at', null).maybeSingle();
    return !error && Boolean(data);
  };
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  let allowed = false;
  if (user) {
    const [{ data: customer }, { data: member }] = await Promise.all([
      db.from('customers').select('id').eq('id', memory.customer_id).eq('auth_user_id', user.id).maybeSingle(),
      db.from('organization_members').select('branch_id').eq('organization_id', memory.organization_id)
        .eq('user_id', user.id).maybeSingle(),
    ]);
    allowed = Boolean(customer);
    if (!allowed && member && (!member.branch_id || member.branch_id === memory.branch_id) &&
        await hasWallConsent()) {
      const [org, branch] = await Promise.all([
        db.from('organizations').select('id').eq('id', memory.organization_id).eq('status', 'active').maybeSingle(),
        db.from('branches').select('id').eq('id', memory.branch_id).eq('status', 'active').maybeSingle(),
      ]);
      allowed = Boolean(org.data && branch.data);
    }
  }
  const screenId = request.nextUrl.searchParams.get('screenId');
  if (!allowed && screenId) {
    const screen = await getPairedScreen(screenId);
    if (screen && screen.organization_id === memory.organization_id && screen.branch_id === memory.branch_id &&
        memory.status === 'approved') allowed = await hasWallConsent();
  }
  if (!allowed) return apiError('Not found', 404);

  const stored = variant === 'original' ? memory.original_url :
    variant === 'thumbnail' ? memory.thumbnail_url : memory.optimized_url;
  if (!stored) return apiError('Image unavailable', 404);
  if (!isPrivateMemoryKey(stored, memory.organization_id, memory.customer_id)) {
    return apiError('Image unavailable; legacy media needs a private-object migration', 404);
  }
  const { data: blob, error } = await admin.storage.from('memories').download(stored);
  if (error || !blob) return apiError('Image unavailable', 404);
  return new NextResponse(await blob.arrayBuffer(), { headers: {
    'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  } });
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireMerchant } from '@/lib/server/context';

/** Revocation immediately invalidates the cookie/token and media access. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ screenId: string }> }) {
  const { screenId } = await params;
  const auth = await requireMerchant({ roles: ['owner', 'admin', 'manager'] });
  if (auth.error) return auth.error;
  const member = auth.context.membership;
  let query = createAdminClient().from('screens')
    .update({ device_token: null, status: 'paused', updated_at: new Date().toISOString() })
    .eq('id', screenId).eq('organization_id', member.organizationId);
  if (member.branchId) query = query.eq('branch_id', member.branchId);
  const { data, error } = await query.select('id').maybeSingle();
  if (error) return apiError('Could not unpair screen', 503);
  if (!data) return apiError('Screen not found', 404);
  return NextResponse.json({ screenId, revoked: true }, { headers: { 'Cache-Control': 'no-store' } });
}

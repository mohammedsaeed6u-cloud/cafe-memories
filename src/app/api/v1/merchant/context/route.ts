import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireMerchant } from '@/lib/server/context';

export async function GET() {
  const auth = await requireMerchant();
  if (auth.error) return auth.error;
  const member = auth.context.membership;
  const admin = createAdminClient();
  const [org, branches, rules, screens, qr] = await Promise.all([
    admin.from('organizations').select('id, name, slug').eq('id', member.organizationId).single(),
    admin.from('branches').select('id, name, slug').eq('organization_id', member.organizationId)
      .eq('status', 'active').order('created_at'),
    admin.from('reward_rules').select('id, name, threshold, reward_description, is_active')
      .eq('organization_id', member.organizationId).eq('trigger_type', 'visit_count')
      .eq('is_active', true).lte('starts_at', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: true }).limit(10),
    admin.from('screens').select('id, name, branch_id, last_heartbeat_at, status')
      .eq('organization_id', member.organizationId).limit(50),
    admin.from('qr_codes').select('id, slug, branch_id').eq('organization_id', member.organizationId)
      .eq('is_active', true).limit(50),
  ]);
  if (org.error || branches.error || rules.error || screens.error || qr.error) return apiError('Could not load merchant data', 503);
  return NextResponse.json({ organization: org.data, role: member.role,
    organizationWide: member.branchId === null,
    branches: (branches.data ?? []).filter((b) => !member.branchId || b.id === member.branchId),
    rules: rules.data ?? [],
    screens: (screens.data ?? []).filter((s) => !member.branchId || s.branch_id === member.branchId),
    qrCodes: (qr.data ?? []).filter((q) => !member.branchId || q.branch_id === member.branchId),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

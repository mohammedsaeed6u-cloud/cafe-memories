import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError } from '@/lib/server/context';

export async function GET() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return apiError('Sign in required', 401);
  const { data: profile, error: profileError } = await db.from('users')
    .select('role').eq('id', user.id).maybeSingle();
  if (profileError || profile?.role !== 'admin') return apiError('Platform admin required', 403);
  const admin = createAdminClient();
  const [orgs, branches] = await Promise.all([
    admin.from('organizations').select('id, name, slug, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false }).limit(50),
    admin.from('branches').select('*', { count: 'exact', head: true }),
  ]);
  if (orgs.error || branches.error) return apiError('Platform data unavailable', 503);
  return NextResponse.json({ organizations: orgs.data ?? [], organizationCount: orgs.count ?? 0,
    branchCount: branches.count ?? 0, billingEnabled: false }, { headers: { 'Cache-Control': 'no-store' } });
}

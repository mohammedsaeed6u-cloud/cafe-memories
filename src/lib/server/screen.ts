import crypto from 'node:crypto';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export const screenCookieName = (screenId: string) => `memories_screen_${screenId}`;
export function hashScreenToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function getPairedScreen(screenId: string) {
  if (!z.uuid().safeParse(screenId).success) return null;
  const token = (await cookies()).get(screenCookieName(screenId))?.value;
  if (!token || !/^scr_[0-9a-f]{64}$/.test(token)) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.from('screens')
    .select('id, branch_id, organization_id, status, name')
    .eq('id', screenId).eq('device_token', hashScreenToken(token)).neq('status', 'paused').maybeSingle();
  if (error || !data) {
    if (error) console.error('Screen lookup failed:', error);
    return null;
  }
  const [branch, org] = await Promise.all([
    admin.from('branches').select('id').eq('id', data.branch_id)
      .eq('organization_id', data.organization_id).eq('status', 'active').maybeSingle(),
    admin.from('organizations').select('id').eq('id', data.organization_id).eq('status', 'active').maybeSingle(),
  ]);
  if (branch.error || org.error || !branch.data || !org.data) return null;
  return data;
}

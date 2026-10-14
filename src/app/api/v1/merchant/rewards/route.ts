import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireMerchant } from '@/lib/server/context';

const schema = z.object({ name: z.string().trim().min(2).max(100), threshold: z.number().int().min(2).max(30) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid reward configuration', 400);
  const auth = await requireMerchant({ roles: ['owner', 'admin', 'manager'] });
  if (auth.error) return auth.error;
  const { data, error } = await auth.context.db.rpc('configure_visit_reward', {
    p_organization_id: auth.context.membership.organizationId,
    p_name: parsed.data.name, p_threshold: parsed.data.threshold,
  });
  if (error) {
    console.error('Reward configuration failed:', error);
    return apiError('Could not save reward rule', 503);
  }
  return NextResponse.json({ ruleId: data }, { headers: { 'Cache-Control': 'no-store' } });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError } from '@/lib/server/context';
import { getPairedScreen } from '@/lib/server/screen';

const schema = z.object({ screenId: z.uuid() });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid screen ID', 400);
  const screen = await getPairedScreen(parsed.data.screenId);
  if (!screen) return apiError('Device not paired or revoked', 401);
  const { error } = await createAdminClient().from('screens')
    .update({ status: 'online', last_heartbeat_at: new Date().toISOString() }).eq('id', screen.id);
  if (error) return apiError('Heartbeat unavailable', 503);
  return NextResponse.json({ online: true }, { headers: { 'Cache-Control': 'no-store' } });
}

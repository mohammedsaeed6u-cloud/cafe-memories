import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const heartbeatSchema = z.object({
  screenId: z.string().uuid(),
  currentMemoryId: z.string().uuid().optional().nullable(),
  batteryLevel: z.number().min(0).max(100).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = heartbeatSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { screenId } = parsed.data;
    const supabase = createAdminClient();

    const { data: updatedScreen, error } = await supabase
      .from('screens')
      .update({
        status: 'online',
        last_heartbeat_at: new Date().toISOString(),
      })
      .eq('id', screenId)
      .select('id, status, orientation')
      .single();

    if (error || !updatedScreen) {
      return NextResponse.json({ error: 'Screen not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      screenId: updatedScreen.id,
      status: updatedScreen.status,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

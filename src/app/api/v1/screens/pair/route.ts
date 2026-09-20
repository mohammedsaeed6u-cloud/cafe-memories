import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const pairScreenSchema = z.object({
  pairingCode: z.string().length(6, 'Pairing code must be 6 digits'),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  screenName: z.string().min(1).max(100),
  resolution: z.string().default('1920x1080'),
  orientation: z.enum(['landscape', 'portrait']).default('landscape'),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = pairScreenSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const { pairingCode, organizationId, branchId, screenName, resolution, orientation } = parsed.data;
    const supabase = createAdminClient();

    // 1. Find or create screen for this pairing code
    const { data: screen, error } = await supabase
      .from('screens')
      .insert({
        organization_id: organizationId,
        branch_id: branchId,
        name: screenName,
        pairing_code: pairingCode,
        status: 'online',
        last_heartbeat_at: new Date().toISOString(),
        resolution,
        orientation,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to pair screen', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      screenId: screen.id,
      screenName: screen.name,
      status: screen.status,
      pairedAt: screen.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

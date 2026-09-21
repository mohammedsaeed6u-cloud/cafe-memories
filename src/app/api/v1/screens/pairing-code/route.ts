import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const generateCodeSchema = z.object({
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  screenName: z.string().max(100).optional().default('Main Live Wall'),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = generateCodeSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const { organizationId, branchId, screenName } = parsed.data;
    const supabase = createAdminClient();

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store in screen_pairing_codes
    const { data: pairingRecord, error } = await supabase
      .from('screen_pairing_codes')
      .insert({
        organization_id: organizationId,
        branch_id: branchId,
        code,
        screen_name: screenName,
        expires_at: expiresAt,
        is_used: false,
        attempts: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to generate pairing code', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
      screenName,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

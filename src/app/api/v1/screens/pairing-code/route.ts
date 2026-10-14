import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { requireApiAuth, isAuthFailure } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

const generateCodeSchema = z.object({
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  screenName: z.string().max(100).optional().default('Main Live Wall'),
});

export async function POST(request: NextRequest) {
  try {
    // Pairing codes grant wall access — merchant-only (CWE-306)
    const auth = await requireApiAuth(request, 'any-auth');
    if (isAuthFailure(auth)) return auth;

    const rawBody = await request.json();
    const parsed = generateCodeSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const { organizationId, branchId, screenName } = parsed.data;
    const supabase = createAdminClient();

    // Generate random 6-digit code
    const cryptoMod = await import('crypto');
    const code = cryptoMod.randomInt(100000, 1000000).toString();
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

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import crypto from 'crypto';

const pairScreenSchema = z.object({
  pairingCode: z.string().length(6, 'Pairing code must be 6 digits'),
  screenName: z.string().min(1).max(100).optional(),
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

    const { pairingCode, screenName, resolution, orientation } = parsed.data;
    const supabase = createAdminClient();

    // 1. Look up valid, unexpired, unused pairing code
    const { data: codeRecord, error: codeError } = await supabase
      .from('screen_pairing_codes')
      .select('*')
      .eq('code', pairingCode)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (codeError || !codeRecord) {
      return NextResponse.json({ error: 'كود الاقتران غير صالح أو منتهي الصلاحية' }, { status: 400 });
    }

    // Rate limiting check on attempts
    if (codeRecord.attempts >= 5) {
      return NextResponse.json({ error: 'تم تجاوز عدد محاولات الاقتران المسموح بها لهذا الكود' }, { status: 429 });
    }

    // Mark code as used
    await supabase
      .from('screen_pairing_codes')
      .update({ is_used: true, attempts: codeRecord.attempts + 1 })
      .eq('id', codeRecord.id);

    // 2. Generate permanent screen device token
    const deviceToken = 'scrtok_' + crypto.randomBytes(24).toString('hex');
    const finalScreenName = screenName || codeRecord.screen_name || 'شاشة الصالة الحية';

    // 3. Insert or update paired screen record
    const { data: screen, error: screenError } = await supabase
      .from('screens')
      .insert({
        organization_id: codeRecord.organization_id,
        branch_id: codeRecord.branch_id,
        name: finalScreenName,
        pairing_code: pairingCode,
        device_token: deviceToken,
        status: 'online',
        last_heartbeat_at: new Date().toISOString(),
        resolution,
        orientation,
      })
      .select()
      .single();

    if (screenError) {
      return NextResponse.json({ error: 'Failed to pair screen in registry', details: screenError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      screenId: screen.id,
      deviceToken,
      branchId: screen.branch_id,
      organizationId: screen.organization_id,
      screenName: screen.name,
      status: screen.status,
      pairedAt: screen.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

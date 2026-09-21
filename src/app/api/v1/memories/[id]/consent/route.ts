import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const updateConsentSchema = z.object({
  liveWallConsent: z.boolean().optional(),
  socialShareConsent: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memoryId } = await params;
    const rawBody = await request.json();
    const parsed = updateConsentSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const { liveWallConsent, socialShareConsent, marketingConsent } = parsed.data;
    const supabase = createAdminClient();

    // 1. Update memory_consents record
    const updates: any = {};
    if (liveWallConsent !== undefined) updates.live_wall_consent = liveWallConsent;
    if (socialShareConsent !== undefined) updates.social_share_consent = socialShareConsent;
    if (marketingConsent !== undefined) updates.marketing_consent = marketingConsent;

    const { data: consent, error: consentError } = await supabase
      .from('memory_consents')
      .update(updates)
      .eq('memory_id', memoryId)
      .select()
      .single();

    if (consentError) {
      return NextResponse.json({ error: 'Failed to update consent', details: consentError.message }, { status: 500 });
    }

    // 2. If Live Wall consent is false, immediately set memory visibility to private
    if (liveWallConsent === false) {
      await supabase
        .from('memories')
        .update({ visibility: 'private', updated_at: new Date().toISOString() })
        .eq('id', memoryId);
    } else if (liveWallConsent === true) {
      await supabase
        .from('memories')
        .update({ visibility: 'live_wall', updated_at: new Date().toISOString() })
        .eq('id', memoryId);
    }

    return NextResponse.json({
      success: true,
      memoryId,
      consent,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

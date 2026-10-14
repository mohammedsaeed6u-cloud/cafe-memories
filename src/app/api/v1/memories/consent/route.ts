import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateConsentSchema = z.object({
  memoryId: z.string().uuid(),
  liveWallConsent: z.boolean().optional(),
  socialShareConsent: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Mandatory customer authentication (CWE-306)
    const { requireCustomer } = await import('@/lib/server/context');
    const auth = await requireCustomer();
    if (auth.error) {
      return auth.error;
    }
    const authenticatedCustomerId = auth.context.customerId;

    const rawBody = await request.json();
    const parsed = updateConsentSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const { memoryId, liveWallConsent, socialShareConsent, marketingConsent } = parsed.data;
    const supabase = createAdminClient();

    // 2. Ownership verification: ensure memory belongs to authenticated customer
    const { data: memory, error: memErr } = await supabase
      .from('memories')
      .select('id, customer_id, visibility, status')
      .eq('id', memoryId)
      .maybeSingle();

    if (memErr || !memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    if (memory.customer_id !== authenticatedCustomerId) {
      return NextResponse.json({ error: 'Forbidden: customer mismatch' }, { status: 403 });
    }

    // 3. Update consent and track revocation
    const updates: any = {};
    if (liveWallConsent !== undefined) updates.live_wall_consent = liveWallConsent;
    if (socialShareConsent !== undefined) updates.social_share_consent = socialShareConsent;
    if (marketingConsent !== undefined) updates.marketing_consent = marketingConsent;

    if (liveWallConsent === false) {
      updates.revoked_at = new Date().toISOString();
    } else if (liveWallConsent === true) {
      updates.revoked_at = null;
    }

    const { data: consent, error: consentError } = await supabase
      .from('memory_consents')
      .update(updates)
      .eq('memory_id', memoryId)
      .select()
      .single();

    if (consentError) {
      return NextResponse.json({ error: 'Failed to update consent', details: consentError.message }, { status: 500 });
    }

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

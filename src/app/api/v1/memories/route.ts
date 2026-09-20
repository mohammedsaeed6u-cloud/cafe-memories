import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const createMemoryRequestSchema = z.object({
  customerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  visitId: z.string().uuid().optional().nullable(),
  originalUrl: z.string().url(),
  optimizedUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  caption: z.string().max(280).optional().nullable(),
  consents: z.object({
    saveConsent: z.boolean().default(true),
    socialShareConsent: z.boolean().default(false),
    liveWallConsent: z.boolean().default(false),
    marketingConsent: z.boolean().default(false),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = createMemoryRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const {
      customerId,
      organizationId,
      branchId,
      visitId,
      originalUrl,
      optimizedUrl,
      thumbnailUrl,
      caption,
      consents,
    } = parsed.data;

    const supabase = createAdminClient();

    // 1. Insert memory record
    const { data: memory, error: memoryError } = await supabase
      .from('memories')
      .insert({
        customer_id: customerId,
        organization_id: organizationId,
        branch_id: branchId,
        visit_id: visitId || null,
        original_url: originalUrl,
        optimized_url: optimizedUrl || originalUrl,
        thumbnail_url: thumbnailUrl || originalUrl,
        caption: caption || null,
        status: 'pending',
        visibility: consents.liveWallConsent ? 'live_wall' : 'private',
      })
      .select()
      .single();

    if (memoryError) {
      return NextResponse.json({ error: 'Failed to create memory', details: memoryError.message }, { status: 500 });
    }

    // 2. Link GDPR/CCPA Consent record
    await supabase.from('memory_consents').insert({
      memory_id: memory.id,
      customer_id: customerId,
      save_consent: consents.saveConsent,
      social_share_consent: consents.socialShareConsent,
      live_wall_consent: consents.liveWallConsent,
      marketing_consent: consents.marketingConsent,
    });

    return NextResponse.json({
      success: true,
      memory: {
        id: memory.id,
        status: memory.status,
        visibility: memory.visibility,
        createdAt: memory.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

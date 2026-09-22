import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { invalidateLoyaltyStampsCache } from '@/lib/services/loyalty-stamps';
import { z } from 'zod';

export const captureSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(4).max(30).optional(),
  role: z.string().max(100).optional().default('زائر ومحب للقهوة'),
  customer: z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(4).optional(),
    role: z.string().optional(),
  }).optional(),
  originalUrl: z.string().optional(),
  photos: z.array(z.string()).optional(),
  caption: z.string().max(280).optional().nullable(),
  frameId: z.string().optional().default('ivory'),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  cafeSlug: z.string().optional(),
  giftCode: z.string().optional(),
  liveWallConsent: z.boolean().optional().default(true),
});

export function normalizePhoneNumber(raw: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let cleaned = (raw || '').trim();
  arabicDigits.forEach((digit, index) => {
    cleaned = cleaned.replaceAll(digit, index.toString());
  });
  const hasPlus = cleaned.startsWith('+');
  const digitsOnly = cleaned.replace(/\D/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = captureSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      name,
      phone,
      role,
      customer: customerPayload,
      originalUrl,
      photos,
      caption,
      frameId,
      organizationId,
      branchId,
      cafeSlug,
      liveWallConsent,
    } = parsed.data;

    const finalName = (name || customerPayload?.name || 'زائر مميز').trim();
    const rawPhone = phone || customerPayload?.phone || '01000000000';
    const finalRole = role || customerPayload?.role || 'زائر ومحب للقهوة';
    const finalPhoto = originalUrl || (photos && photos.length > 0 ? photos[0] : '') || '';

    const cleanPhone = normalizePhoneNumber(rawPhone);
    const supabase = createAdminClient();

    // 0. Resolve Organization & Branch
    let resolvedOrgId = organizationId;
    let resolvedBranchId = branchId;

    if (!resolvedOrgId || !resolvedBranchId) {
      // Find branch by slug if possible
      if (cafeSlug) {
        const { data: branchBySlug } = await supabase
          .from('branches')
          .select('id, organization_id')
          .eq('slug', cafeSlug)
          .maybeSingle();

        if (branchBySlug) {
          resolvedBranchId = branchBySlug.id;
          resolvedOrgId = branchBySlug.organization_id;
        }
      }

      if (!resolvedOrgId) {
        const { data: defaultOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .maybeSingle();
        if (defaultOrg) resolvedOrgId = defaultOrg.id;
      }

      if (!resolvedBranchId && resolvedOrgId) {
        const { data: defaultBranch } = await supabase
          .from('branches')
          .select('id')
          .eq('organization_id', resolvedOrgId)
          .limit(1)
          .maybeSingle();
        if (defaultBranch) resolvedBranchId = defaultBranch.id;
      }
    }

    // 1. Resolve or Create Customer
    let customer: any = null;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('anonymous_id', cleanPhone)
      .maybeSingle();

    if (existingCustomer) {
      const { data: updatedCustomer } = await supabase
        .from('customers')
        .update({
          display_name: finalName,
          email: finalRole ? `${finalRole}@persona.memories` : existingCustomer.email,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();

      customer = updatedCustomer || existingCustomer;
    } else {
      const { data: newCustomer, error: insertErr } = await supabase
        .from('customers')
        .insert({
          display_name: finalName,
          anonymous_id: cleanPhone,
          email: finalRole ? `${finalRole}@persona.memories` : null,
          last_seen_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr || !newCustomer) {
        return NextResponse.json(
          { error: 'Failed to create customer profile', details: insertErr?.message },
          { status: 500 }
        );
      }
      customer = newCustomer;
    }

    // 2. Record Visit if org and branch are available
    let visit: any = null;
    if (resolvedOrgId && resolvedBranchId) {
      const { data: newVisit } = await supabase
        .from('visits')
        .insert({
          customer_id: customer.id,
          organization_id: resolvedOrgId,
          branch_id: resolvedBranchId,
          source: 'table',
          verification_status: 'verified',
        })
        .select()
        .single();
      visit = newVisit;
    }

    // 3. Count total visits for customer
    const { count: totalVisits } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id);

    const visitCount = (totalVisits && totalVisits > 0) ? totalVisits : 1;

    // 4. Create Memory record if photo is provided (Guest Privacy & Consent calibrated)
    let memory: any = null;
    if (finalPhoto && resolvedOrgId && resolvedBranchId) {
      const formattedCaption = caption || `ذكريات موميريز • ${finalRole}`;
      // When liveWallConsent is false, visibility must strictly be 'private' and status must NOT be 'live_wall'
      const hasLiveWallConsent = Boolean(liveWallConsent);
      const memoryVisibility = hasLiveWallConsent ? 'live_wall' : 'private';
      const memoryStatus = 'approved';

      const { data: newMemory } = await supabase
        .from('memories')
        .insert({
          customer_id: customer.id,
          organization_id: resolvedOrgId,
          branch_id: resolvedBranchId,
          visit_id: visit?.id || null,
          original_url: finalPhoto,
          optimized_url: finalPhoto,
          thumbnail_url: finalPhoto,
          caption: formattedCaption,
          status: memoryStatus,
          visibility: memoryVisibility,
        })
        .select()
        .single();
      memory = newMemory;

      // Fresh stamp must show up immediately: drop the customer's cached
      // card so the next stamps read hits the database (TTL is a safety net).
      if (cafeSlug) invalidateLoyaltyStampsCache(cafeSlug, cleanPhone);
    }

    // Generate Instant Free Gift Voucher Code
    const voucherNumber = Math.floor(1000 + Math.random() * 9000);
    const voucherCode = `GIFT-${voucherNumber}`;

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.display_name,
        phone: customer.anonymous_id,
        role: finalRole,
        visitsCount: visitCount,
        createdAt: customer.created_at,
      },
      visit: visit ? { id: visit.id, createdAt: visit.created_at } : null,
      memory: memory ? {
        id: memory.id,
        status: memory.status,
        visibility: memory.visibility,
        caption: memory.caption,
        createdAt: memory.created_at,
      } : null,
      freeGift: {
        code: voucherCode,
        title: 'قطعة كوكيز أو حلى مجانية مع شريط صورك ',
        description: 'استلم هديتك المجانية من الكاونتر عند إبراز كود الهدية مع طباعة الشريط!',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

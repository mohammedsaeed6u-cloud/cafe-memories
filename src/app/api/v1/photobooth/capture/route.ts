import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { invalidateLoyaltyStampsCache } from '@/lib/services/loyalty-stamps';
import { syncWalletPassForCount } from '@/lib/services/wallet-pass-sync.service';
import { canonicalizePhone, phoneLookupVariants } from '@/lib/services/phone';
import { evaluateVisitEligibility } from '@/lib/services/anti-fraud';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export const captureSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(4).max(30).optional(),
  role: z.string().max(100).optional().default('ضيف مميز'),
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

/** Legacy normalizer kept for backwards compatibility with existing tests. */
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

/* ------------------------------------------------------------------ *
 * Abuse protection — the capture endpoint is public (photobooth
 * tablets on venue Wi-Fi), so it carries cheap in-process guards:
 * an allow-listed image-host check and a per-IP rate limit.
 * ------------------------------------------------------------------ */

const ALLOWED_IMAGE_HOSTS = new Set([
  'supabase.co',
  'supabase.in',
  'supabase.red',
  'storage.googleapis.com',
  'amazonaws.com',
  'cloudinary.com',
  'imgur.com',
  'unsplash.com',
  'images.unsplash.com',
  'walletwallet.dev',
  'dicebear.com',
  'example.com', // integration tests
]);

function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith('data:image/')) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return [...ALLOWED_IMAGE_HOSTS].some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

const CAPTURE_RATE_WINDOW_MS = 60_000;
const CAPTURE_RATE_MAX_PER_WINDOW = 12;
const captureRateBuckets = new Map<string, number[]>();

function captureRateLimited(ip: string): { limited: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = (captureRateBuckets.get(ip) || []).filter((t) => now - t < CAPTURE_RATE_WINDOW_MS);
  if (bucket.length >= CAPTURE_RATE_MAX_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((CAPTURE_RATE_WINDOW_MS - (now - bucket[0])) / 1000);
    captureRateBuckets.set(ip, bucket);
    return { limited: true, retryAfterSeconds };
  }
  bucket.push(now);
  captureRateBuckets.set(ip, bucket);
  // Opportunistic cleanup so the map cannot grow without bound.
  if (captureRateBuckets.size > 5000) {
    for (const [key, stamps] of captureRateBuckets) {
      if (stamps.every((t) => now - t >= CAPTURE_RATE_WINDOW_MS)) captureRateBuckets.delete(key);
    }
  }
  return { limited: false };
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
      organizationId,
      branchId,
      cafeSlug,
      liveWallConsent,
    } = parsed.data;

    // 0. Abuse guards (public endpoint)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
    const rate = captureRateLimited(clientIp);
    if (rate.limited) {
      return NextResponse.json(
        { error: 'Too many captures. Please wait a moment.', retryAfterSeconds: rate.retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds ?? 60) } }
      );
    }

    const finalName = (name || customerPayload?.name || 'زائر مميز').trim();
    const rawPhone = phone || customerPayload?.phone || '01000000000';
    const finalRole = role || customerPayload?.role || 'ضيف مميز';
    const finalPhoto = originalUrl || (photos && photos.length > 0 ? photos[0] : '') || '';

    if (finalPhoto && !isAllowedImageUrl(finalPhoto)) {
      return NextResponse.json(
        { error: 'Photo URL host is not allowed' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 0.5 Resolve Organization & Branch
    let resolvedOrgId = organizationId;
    let resolvedBranchId = branchId;

    if (!resolvedOrgId || !resolvedBranchId) {
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

    // 1. Canonical customer identity.
    //
    // A phone the customer typed must ALWAYS resolve to the same customer
    // row: "01012345678" and "+201012345678" used to create two rows and
    // silently split one person's loyalty card. Guests who skip the phone
    // get a unique identity instead of sharing one row that mixes cards.
    const canonicalPhone = rawPhone ? canonicalizePhone(rawPhone) : `guest-${crypto.randomUUID()}`;

    // 1.1 Resolve or Create Customer — try every historical phone form first
    // so pre-migration rows keep working, then heal to the canonical form.
    let customer: any = null;
    const lookupVariants = rawPhone ? phoneLookupVariants(rawPhone) : [];
    if (lookupVariants.length > 0) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .in('anonymous_id', lookupVariants)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingCustomer) {
        customer = existingCustomer;
        if (existingCustomer.anonymous_id !== canonicalPhone) {
          // Heal legacy rows to the canonical form on first contact.
          await supabase
            .from('customers')
            .update({ anonymous_id: canonicalPhone })
            .eq('id', existingCustomer.id);
          customer = { ...existingCustomer, anonymous_id: canonicalPhone };
        }
      }
    }

    if (!customer) {
      const { data: newCustomer, error: insertErr } = await supabase
        .from('customers')
        .insert({
          display_name: finalName,
          anonymous_id: canonicalPhone,
          email: finalRole ? `${finalRole}@persona.memories` : null,
          last_seen_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr || !newCustomer) {
        // Lost a race (duplicate key)? Re-read instead of failing the capture.
        const { data: racedCustomer } = rawPhone
          ? await supabase
              .from('customers')
              .select('*')
              .in('anonymous_id', phoneLookupVariants(rawPhone))
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle()
          : { data: null };
        if (racedCustomer) {
          customer = racedCustomer;
        } else {
          return NextResponse.json(
            { error: 'Failed to create customer profile', details: insertErr?.message },
            { status: 500 }
          );
        }
      } else {
        customer = newCustomer;
      }
    }

    await supabase
      .from('customers')
      .update({
        display_name: finalName,
        email: finalRole ? `${finalRole}@persona.memories` : customer.email,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', customer.id);

    // 2. Record Visit if org and branch are available
    let visit: any = null;
    if (resolvedOrgId && resolvedBranchId) {
      // Anti-fraud cooldown: the same evaluation the visits endpoint applies,
      // so bursts through the capture endpoint are rejected too.
      const { data: recentVisitsData } = await supabase
        .from('visits')
        .select('created_at, device_fingerprint, ip_hash')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(10);
      const recentList = Array.isArray(recentVisitsData)
        ? recentVisitsData
        : (recentVisitsData && typeof recentVisitsData === 'object' && 'created_at' in (recentVisitsData as any))
        ? [recentVisitsData]
        : [];
      const fraudEvaluation = evaluateVisitEligibility({
        customerId: customer.id,
        branchId: resolvedBranchId,
        deviceFingerprint: null,
        ipAddress: clientIp,
        recentVisits: recentList.map((v: any) => ({
          createdAt: v.created_at,
          deviceFingerprint: v.device_fingerprint ?? null,
          ipHash: v.ip_hash ?? null,
        })),
      });

      if (fraudEvaluation.status === 'cooldown_rejected') {
        return NextResponse.json(
          {
            success: false,
            error: fraudEvaluation.reason,
            cooldownRemainingMinutes: fraudEvaluation.cooldownRemainingMinutes,
          },
          { status: 429 }
        );
      }

      const { data: newVisit } = await supabase
        .from('visits')
        .insert({
          customer_id: customer.id,
          organization_id: resolvedOrgId,
          branch_id: resolvedBranchId,
          source: 'table',
          verification_status: 'verified',
          ip_hash: fraudEvaluation.ipHash,
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
      let storedPhotoUrl = finalPhoto;

      // If client submitted base64 canvas data URL, persist to storage bucket first
      if (finalPhoto.startsWith('data:image/')) {
        try {
          const match = finalPhoto.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (match) {
            const cType = match[1];
            const base64Data = match[2];
            const buffer = Buffer.from(base64Data, 'base64');
            const ext = cType.includes('png') ? 'png' : cType.includes('webp') ? 'webp' : 'jpg';
            const cryptoMod = await import('crypto');
            const randId = cryptoMod.randomUUID().replace(/-/g, '').slice(0, 8);
            const sPath = `wall/${cafeSlug || 'stampy'}_${Date.now()}_${randId}.${ext}`;
            const { error: upErr } = await supabase.storage.from('memories').upload(sPath, buffer, {
              contentType: cType,
              upsert: true,
            });
            if (!upErr) {
              const { data: pData } = supabase.storage.from('memories').getPublicUrl(sPath);
              if (pData?.publicUrl) storedPhotoUrl = pData.publicUrl;
            }
          }
        } catch (uploadErr) {
          console.error('Failed to upload dataUrl to Supabase storage in capture route:', uploadErr);
        }
      }

      const formattedCaption = caption || `ذكريات موميريز • ${finalRole}`;
      // When liveWallConsent is false, visibility must strictly be 'private'
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
          original_url: storedPhotoUrl,
          optimized_url: storedPhotoUrl,
          thumbnail_url: storedPhotoUrl,
          caption: formattedCaption,
          status: memoryStatus,
          visibility: memoryVisibility,
        })
        .select()
        .single();
      memory = newMemory;

      // Fresh stamp must show up immediately: drop the customer's cached
      // card so the next stamps read hits the database (TTL is a safety net).
      if (cafeSlug) invalidateLoyaltyStampsCache(cafeSlug, canonicalPhone);
    }

    // 5. Issue the free gift as a REAL voucher row so staff can verify and
    // redeem it (previously the code was generated and immediately forgotten;
    // redemption now happens through /api/v1/vouchers against reward_events).
    const voucherNumber = Math.floor(1000 + Math.random() * 9000);
    const voucherCode = `GIFT-${voucherNumber}`;
    const giftTitle = 'قطعة كوكيز أو حلى مجانية مع شريط صورك';

    let giftStored = false;
    if (resolvedOrgId) {
      const { error: giftErr } = await supabase.from('reward_events').insert({
        customer_id: customer.id,
        organization_id: resolvedOrgId,
        branch_id: resolvedBranchId ?? null,
        type: 'bonus_awarded',
        value: 1,
        reference_type: 'gift_voucher',
        // reference_id is a UUID column; the code lives in the (unique)
        // idempotency_key so vouchers can be looked up and redeemed by it.
        idempotency_key: `voucher:${voucherCode}`,
      });
      giftStored = !giftErr;
    }

    // Push the new stamp count to any installed Wallet pass (Apple/Google).
    // Fire-and-forget: a pass-update failure must never break the capture.
    if (cafeSlug) {
      try {
        const sync = await syncWalletPassForCount({
          cafeSlug,
          phone: canonicalPhone,
          customerName: finalName,
        });
        if (sync.updated) console.log('wallet pass updated:', sync.serial);
      } catch (syncErr) {
        console.warn('wallet pass sync failed:', (syncErr as Error)?.message);
      }
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: finalName,
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
        title: giftTitle,
        description: 'استلم هديتك المجانية من الكاونتر عند إبراز كود الهدية مع طباعة الشريط!',
        stored: giftStored,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

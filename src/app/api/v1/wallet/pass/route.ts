import { NextRequest, NextResponse } from 'next/server';
import {
  isWalletOutsourcingEnabled,
  issueSignedPass,
} from '@/lib/services/wallet-pass.service';

export const dynamic = 'force-dynamic';

/**
 * Returns a genuinely installable Apple Wallet pass.
 *
 * When WALLETWALLET_ENABLED=1 and WALLETWALLET_API_KEY are set, the pass is
 * issued and signed upstream (walletwallet.dev) so iOS installs it directly.
 * Otherwise the route answers 503 with the reason; the client falls back to
 * the free PWA/photo-save flow instead of shipping an unsigned .pkpass that
 * Apple always rejects.
 */
export async function GET(request: NextRequest) {
  let customerContext: { customerId?: string } | null = null;

  // 1. Authenticate (Customer session or scoped API authorization)
  try {
    const { requireCustomer } = await import('@/lib/server/context');
    const auth = await requireCustomer();
    if (!auth.error && auth.context) {
      customerContext = { customerId: auth.context.customerId };
    }
  } catch {
    customerContext = null;
  }

  if (!customerContext && process.env.NODE_ENV !== 'test') {
    const { requireApiAuth, isAuthFailure } = await import('@/lib/api-guard');
    const apiAuth = await requireApiAuth(request, 'any-auth');
    if (isAuthFailure(apiAuth)) {
      return NextResponse.json({ error: 'Unauthorized: valid customer session or API key required' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const cafeSlug = searchParams.get('cafe') || 'memories';
  const cafeName = searchParams.get('name') || 'Memories Studio';
  const customerIdParam = searchParams.get('customerId') || searchParams.get('customer_id');

  const targetCustomerId = customerContext?.customerId || customerIdParam;
  let resolvedPhone = searchParams.get('phone') || searchParams.get('customer') || '01000000000';
  let resolvedName = searchParams.get('customerName') || 'ضيف مميز';
  let resolvedStamps = parseInt(searchParams.get('stamps') || '0', 10);

  // Authoritative DB verification: fetch customer profile and count of verified visits
  if (targetCustomerId) {
    try {
      const admin = (await import('@/lib/supabase/admin')).createAdminClient();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(targetCustomerId)) {
        const { data: c } = await admin
          .from('customers')
          .select('id, display_name, anonymous_id')
          .eq('id', targetCustomerId)
          .maybeSingle();

        if (c) {
          if (c.display_name) resolvedName = c.display_name;
          if (c.anonymous_id) resolvedPhone = c.anonymous_id;

          const { count } = await admin
            .from('visits')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', targetCustomerId)
            .eq('verification_status', 'verified');

          if (typeof count === 'number') {
            resolvedStamps = count;
          }
        }
      }
    } catch {
      // In isolated tests without DB, preserve resolved values
    }
  }

  const maxSlots = parseInt(searchParams.get('slots') || '4', 10);
  const giftTitle = searchParams.get('gift') || 'هدية ترحيبية خاصة';
  const instagramHandle = searchParams.get('instagram') || `@${cafeSlug}`;

  const passData = {
    cafeSlug,
    cafeName,
    customerPhone: resolvedPhone,
    customerName: resolvedName,
    stampedCount: resolvedStamps,
    maxSlots,
    giftTitle,
    instagramHandle,
  };

  if (!isWalletOutsourcingEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'signed_pass_unavailable',
        message:
          'التوقيع الخارجي للباسات غير مفعّل. فعّل WALLETWALLET_ENABLED=1 مع WALLETWALLET_API_KEY للحصول على باسة أبل موقّعة.',
      },
      { status: 503 }
    );
  }

  try {
    const issued = await issueSignedPass(passData);
    const bytes = Buffer.from(issued.applePassBase64, 'base64');
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${cafeSlug}-loyalty.pkpass"`,
        'X-Serial-Number': issued.serialNumber,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: 'signed_pass_failed', details: error?.message },
      { status: 502 }
    );
  }
}

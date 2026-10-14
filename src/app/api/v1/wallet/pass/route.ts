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

  if (!targetCustomerId && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
  }

  // Authoritative DB verification: fetch customer profile and count of verified visits scoped to venue (Fail-Closed)
  if (targetCustomerId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetCustomerId)) {
      return NextResponse.json({ error: 'Invalid customer ID format' }, { status: 400 });
    }

    try {
      const admin = (await import('@/lib/supabase/admin')).createAdminClient();
      const { data: c, error: customerErr } = await admin
        .from('customers')
        .select('id, display_name, anonymous_id')
        .eq('id', targetCustomerId)
        .maybeSingle();

      if (customerErr) {
        return NextResponse.json({ error: 'Database error fetching customer', details: customerErr.message }, { status: 500 });
      }
      if (!c) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      resolvedName = c.display_name || 'ضيف مميز';
      resolvedPhone = c.anonymous_id || '01000000000';

      // Scoped venue/organization lookup (Fail-Closed)
      const { data: org, error: orgErr } = await admin
        .from('organizations')
        .select('id, name')
        .eq('slug', cafeSlug)
        .maybeSingle();

      if (orgErr) {
        return NextResponse.json({ error: 'Database error fetching organization', details: orgErr.message }, { status: 500 });
      }
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      // Check customer_wallet_preferences (Fail-Closed if opted out)
      const { data: pref, error: prefErr } = await admin
        .from('customer_wallet_preferences')
        .select('wallet_opt_in')
        .eq('customer_id', targetCustomerId)
        .eq('organization_id', org.id)
        .maybeSingle();

      if (prefErr) {
        return NextResponse.json({ error: 'Database error checking wallet preferences', details: prefErr.message }, { status: 500 });
      }
      if (pref && pref.wallet_opt_in === false) {
        return NextResponse.json({ error: 'Wallet pass generation declined: customer opted out' }, { status: 403 });
      }

      const { count, error: countErr } = await admin
        .from('visits')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', targetCustomerId)
        .eq('organization_id', org.id)
        .eq('verification_status', 'verified');

      if (countErr) {
        return NextResponse.json({ error: 'Database error counting verified visits', details: countErr.message }, { status: 500 });
      }
      resolvedStamps = count || 0;
    } catch (err: any) {
      return NextResponse.json({ error: 'Database verification failed', details: err?.message }, { status: 500 });
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

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
  const { searchParams } = new URL(request.url);
  const cafeSlug = searchParams.get('cafe') || 'memories';
  const cafeName = searchParams.get('name') || 'Memories Studio';
  const customerPhone = searchParams.get('phone') || searchParams.get('customer') || '01000000000';
  const customerName = searchParams.get('customerName') || 'ضيف مميز';
  const stampedCount = parseInt(searchParams.get('stamps') || '3', 10);
  const maxSlots = parseInt(searchParams.get('slots') || '4', 10);
  const giftTitle = searchParams.get('gift') || 'هدية ترحيبية خاصة';
  const instagramHandle = searchParams.get('instagram') || `@${cafeSlug}`;

  const passData = {
    cafeSlug,
    cafeName,
    customerPhone,
    customerName,
    stampedCount,
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

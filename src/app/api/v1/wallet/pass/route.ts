import { NextRequest, NextResponse } from 'next/server';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';

export async function GET(request: NextRequest) {
  try {
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

    const blob = DigitalWalletService.createApplePassBlob(passData);
    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${cafeSlug}-loyalty.pkpass"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate Apple Wallet pass', details: error?.message },
      { status: 500 }
    );
  }
}

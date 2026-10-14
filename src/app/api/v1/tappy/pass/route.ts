import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { TappyAccountingEngine } from '@/lib/services/tappy-accounting-engine.service';
import { GoogleWalletEngine } from '@/lib/services/google-wallet-engine.service';
import type { DigitalWalletPassData } from '@/lib/services/digital-wallet.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = (searchParams.get('phone') || '').replace(/\D/g, '');
    const brandId = searchParams.get('brandId') || 'stampy';

    const config = TappyAccountingEngine.getBrandConfig(brandId);
    const metrics = TappyAccountingEngine.computeDashboardMetrics(brandId, 'week');
    const customer = metrics.topCustomers.find((c) => c.phone.replace(/\D/g, '') === phone);

    const activeStamps = customer ? customer.stamps % config.requiredStamps : 0;
    const isCompleted = activeStamps >= config.requiredStamps;

    const passData: DigitalWalletPassData = {
      cafeSlug: 'stampy',
      cafeName: config.brandName,
      customerPhone: phone || 'guest',
      customerName: customer?.name || 'ضيف مميز',
      stampedCount: activeStamps,
      maxSlots: config.requiredStamps,
      giftTitle: 'Free Specialty Coffee',
    };

    const googleWalletUrl = GoogleWalletEngine.generateSaveUrl(
      passData,
      process.env.GOOGLE_ISSUER_ID || 'stampy_issuer'
    );

    return NextResponse.json({
      ok: true,
      brandName: config.brandName,
      customerPhone: phone,
      customerName: customer?.name || 'ضيف مميز',
      activeStamps,
      requiredStamps: config.requiredStamps,
      isRewardUnlocked: isCompleted,
      appleWalletUrl: `/api/v1/apple-pass-service/v1/passes/pass.com.stampy.loyalty/pass-${phone || 'demo'}`,
      googleWalletUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

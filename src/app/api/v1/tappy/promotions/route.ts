import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { TappyAccountingEngine } from '@/lib/services/tappy-accounting-engine.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branch') || undefined;

    const promos = TappyAccountingEngine.getActivePromotions(branchId);
    return NextResponse.json({
      ok: true,
      activePromotions: promos,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, multiplier, startDate, endDate, applicableBranches, activeHours } = body;

    if (!name || !multiplier || multiplier < 1) {
      return NextResponse.json({ ok: false, error: 'Valid promotion name and multiplier are required' }, { status: 400 });
    }

    const newPromo = {
      id: `promo_${Date.now()}`,
      name,
      multiplier: Number(multiplier),
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      applicableBranches,
      activeHours,
    };

    TappyAccountingEngine.addPromotion(newPromo);

    return NextResponse.json({
      ok: true,
      message: `تم تفعيل عرض مضاعفة الأختام (×${multiplier}) بنجاح!`,
      promotion: newPromo,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

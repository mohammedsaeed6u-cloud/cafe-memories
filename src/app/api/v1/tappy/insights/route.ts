import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { TappyAccountingEngine } from '@/lib/services/tappy-accounting-engine.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || 'week') as 'today' | 'week' | 'month';
    const brandId = searchParams.get('brandId') || 'stampy';

    const metrics = TappyAccountingEngine.computeDashboardMetrics(brandId, range);

    return NextResponse.json({
      ok: true,
      brandId,
      timeRange: range,
      metrics,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

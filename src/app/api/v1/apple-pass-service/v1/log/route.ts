import { NextRequest, NextResponse } from 'next/server';
import { ApplePassKitEngine } from '@/lib/services/apple-passkit-engine.service';

export const dynamic = 'force-dynamic';

/**
 * POST /v1/log
 * Captures diagnostics and error logs sent by Apple devices.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const logs = body?.logs || [];

  ApplePassKitEngine.logClientDiagnostics(logs);
  return new NextResponse(null, { status: 200 });
}

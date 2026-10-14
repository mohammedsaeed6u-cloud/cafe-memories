import { NextRequest, NextResponse } from 'next/server';
import { ApplePassKitEngine } from '@/lib/services/apple-passkit-engine.service';

export const dynamic = 'force-dynamic';

/**
 * GET /v1/passes/{passTypeIdentifier}/{serialNumber}
 * Delivers the latest signed .pkpass bundle to the iOS device.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ passTypeIdentifier: string; serialNumber: string }> }
) {
  const { passTypeIdentifier, serialNumber } = await context.params;
  const authHeader = request.headers.get('authorization');
  const ifModifiedSince = request.headers.get('if-modified-since');

  const result = await ApplePassKitEngine.getLatestPass(
    passTypeIdentifier,
    serialNumber,
    authHeader,
    ifModifiedSince
  );

  if (result.status === 401) {
    return new NextResponse(null, { status: 401 });
  }

  if (result.status === 304) {
    return new NextResponse(null, { status: 304 });
  }

  if (result.status === 404 || !result.pkpassBytes) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(Buffer.from(result.pkpassBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Last-Modified': result.lastModified || new Date().toUTCString(),
      'Cache-Control': 'no-cache, must-revalidate',
    },
  });
}

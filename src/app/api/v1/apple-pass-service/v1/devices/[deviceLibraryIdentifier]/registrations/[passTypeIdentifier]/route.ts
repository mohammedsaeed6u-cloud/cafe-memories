import { NextRequest, NextResponse } from 'next/server';
import { ApplePassKitEngine } from '@/lib/services/apple-passkit-engine.service';

export const dynamic = 'force-dynamic';

/**
 * GET /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}?passesUpdatedSince={tag}
 * Returns serial numbers of passes that have updated since the given timestamp.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string }> }
) {
  const { deviceLibraryIdentifier, passTypeIdentifier } = await context.params;
  const { searchParams } = new URL(request.url);
  const passesUpdatedSince = searchParams.get('passesUpdatedSince');

  const result = ApplePassKitEngine.getSerialNumbersForDevice(
    deviceLibraryIdentifier,
    passTypeIdentifier,
    passesUpdatedSince
  );

  if (result.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(result.data, { status: 200 });
}

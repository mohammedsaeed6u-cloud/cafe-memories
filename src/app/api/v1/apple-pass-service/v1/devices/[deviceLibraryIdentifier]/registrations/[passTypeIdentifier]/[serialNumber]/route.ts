import { NextRequest, NextResponse } from 'next/server';
import { ApplePassKitEngine } from '@/lib/services/apple-passkit-engine.service';

export const dynamic = 'force-dynamic';

/**
 * POST /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 * Registers an Apple device to receive silent APNs push notifications for a pass.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }> }
) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await context.params;
  const authHeader = request.headers.get('authorization');

  const body = await request.json().catch(() => ({}));
  const pushToken = body?.pushToken || '';

  if (!pushToken) {
    return NextResponse.json({ error: 'pushToken is required' }, { status: 400 });
  }

  const result = ApplePassKitEngine.registerDevice(
    deviceLibraryIdentifier,
    passTypeIdentifier,
    serialNumber,
    pushToken,
    authHeader
  );

  if (result.status === 401) {
    return new NextResponse(null, { status: 401 });
  }

  return new NextResponse(null, { status: result.status });
}

/**
 * DELETE /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 * Unregisters an Apple device when a pass is removed from Apple Wallet.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }> }
) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await context.params;
  const authHeader = request.headers.get('authorization');

  const result = ApplePassKitEngine.unregisterDevice(
    deviceLibraryIdentifier,
    passTypeIdentifier,
    serialNumber,
    authHeader
  );

  return new NextResponse(null, { status: result.status });
}

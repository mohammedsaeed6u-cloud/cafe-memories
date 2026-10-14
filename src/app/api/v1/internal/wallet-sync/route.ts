import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { apiError } from '@/lib/server/context';
import { processWalletSync } from '@/lib/server/wallet-service';

export const runtime = 'nodejs';

/** Call from an authenticated scheduled job; no user/merchant may drain the outbox. */
export async function POST(request: Request) {
  const secret = process.env.WALLET_SYNC_CRON_SECRET;
  if (!secret || secret.length < 32) return apiError('Wallet worker unavailable', 503);
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  const expected = Buffer.from(secret);
  const received = Buffer.from(supplied);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return apiError('Unauthorized', 401);
  }
  let processed = 0;
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = await processWalletSync(null, 1);
      if (result.state === 'idle') break;
      if (result.state === 'failed') return NextResponse.json({ processed, retryPending: true },
        { headers: { 'Cache-Control': 'no-store' } });
      processed += result.processed;
    }
    return NextResponse.json({ processed }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return apiError('Wallet worker failed; retry later', 503);
  }
}

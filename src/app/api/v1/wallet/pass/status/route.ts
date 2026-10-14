import { NextResponse } from 'next/server';
import { isWalletOutsourcingEnabled } from '@/lib/services/wallet-pass.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/wallet/pass/status
 *
 * Public, key-free signal for the client: is outsourced Apple Wallet
 * signing live right now? Lets the UI offer the one-tap install path
 * without leaking or embedding any secret at build time.
 */
export async function GET() {
  return NextResponse.json({ ok: true, enabled: isWalletOutsourcingEnabled() });
}

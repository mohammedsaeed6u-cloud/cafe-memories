import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/server/platform';
import { apiError } from '@/lib/server/context';
import { openWalletKey, walletEncryptionReady } from '@/lib/server/wallet-crypto';
import { checkWalletUsage } from '@/lib/server/walletwallet';

export const runtime = 'nodejs';
export async function POST(_request: Request, { params }: { params: Promise<{ connectorId: string }> }) {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;
  const { connectorId } = await params;
  if (!z.uuid().safeParse(connectorId).success) return apiError('Invalid connection', 400);
  if (!walletEncryptionReady()) return apiError('Wallet encryption is not configured', 503);
  const admin = createAdminClient();
  const { data, error } = await admin.from('wallet_connectors').select('sealed_key')
    .eq('id', connectorId).maybeSingle();
  if (error || !data) return apiError('Wallet connection unavailable', 404);
  try {
    const usage = await checkWalletUsage(openWalletKey(data.sealed_key));
    const plan = usage.plan === 'pro' ? 'pro' : ['business','enterprise'].includes(usage.plan)
      ? 'business' : 'free';
    const { error: saveError } = await admin.from('wallet_connectors').update({ plan,
      verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', connectorId);
    if (saveError) return apiError('Verified, but could not save connection state', 503);
    return NextResponse.json({ tested: true, plan: usage.plan, remaining: usage.remaining,
      limit: usage.limit, resetDate: usage.resetDate ?? null },
    { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (cause) {
    // Provider response and API key are deliberately never logged or returned.
    return apiError(cause instanceof Error && cause.message === 'WalletWallet credentials rejected'
      ? 'WalletWallet rejected this key' : 'WalletWallet test unavailable; check the provider and retry', 503);
  }
}

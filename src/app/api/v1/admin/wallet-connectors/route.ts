import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/server/platform';
import { apiError } from '@/lib/server/context';
import { sealWalletKey, walletEncryptionReady } from '@/lib/server/wallet-crypto';

export const runtime = 'nodejs';
const createSchema = z.object({ label: z.string().trim().min(2).max(60),
  apiKey: z.string().regex(/^ww_live_[0-9a-f]{32}$/) }).strict();
const changeSchema = z.object({ id: z.uuid(), label: z.string().trim().min(2).max(60).optional(),
  enabled: z.boolean().optional(), apiKey: z.string().regex(/^ww_live_[0-9a-f]{32}$/).optional() })
  .strict().refine((value) => value.label !== undefined || value.enabled !== undefined || value.apiKey !== undefined);
const assignSchema = z.object({ organizationId: z.uuid(), connectorId: z.uuid().nullable() }).strict();

/** Platform operators only. Never send even a masked version of the key to the browser. */
export async function GET() {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;
  const admin = createAdminClient();
  const [connections, organizations, health] = await Promise.all([
    admin.from('wallet_connectors').select('id,provider,label,plan,enabled,verified_at,created_at')
      .order('created_at', { ascending: false }).limit(100),
    admin.from('organizations').select('id,name,status,wallet_connector_id')
      .order('created_at', { ascending: false }).limit(100),
    admin.rpc('wallet_health_stats'),
  ]);
  if (connections.error || organizations.error || health.error) return apiError('Could not list wallet connections', 503);
  return NextResponse.json({ encryptionReady: walletEncryptionReady(),
    health: health.data, connectors: connections.data ?? [], organizations: organizations.data ?? [] },
    { headers: { 'Cache-Control': 'private, no-store' } });
}

/** Seal each key using AES-GCM with a dedicated server-side deployment key. */
export async function POST(request: Request) {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;
  if (!walletEncryptionReady()) return apiError('Wallet encryption is not configured on server', 503);
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Enter a WalletWallet API key and a label', 400);
  const { error } = await createAdminClient().from('wallet_connectors').insert({
    provider: 'walletwallet', label: parsed.data.label, sealed_key: sealWalletKey(parsed.data.apiKey),
  });
  if (error) {
    console.error('Wallet connector could not be saved:', { code: error.code });
    return apiError('Could not save wallet connection', 503);
  }
  return NextResponse.json({ saved: true, tested: false },
    { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: Request) {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;
  const parsed = changeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid connection change', 400);
  const { id, apiKey, ...changes } = parsed.data;
  if (apiKey && !walletEncryptionReady()) return apiError('Wallet encryption is not configured',503);
  // Rotation must use a new key for the SAME provider team: existing passes
  // remain bound to this connector ID, and the operator must re-test it.
  const { data, error } = await createAdminClient().from('wallet_connectors')
    .update({ ...changes, ...(apiKey ? {sealed_key:sealWalletKey(apiKey),verified_at:null} : {}),
      updated_at: new Date().toISOString() }).eq('id', id).select('id').maybeSingle();
  if (error) return apiError('Could not change connection', 503);
  if (!data) return apiError('Wallet connection not found',404);
  return NextResponse.json({ saved: true, requiresTest: Boolean(apiKey) },
    { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PUT(request: Request) {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;
  const parsed = assignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid assignment', 400);
  const admin = createAdminClient();
  if (parsed.data.connectorId) {
    const { data, error } = await admin.from('wallet_connectors').select('id')
      .eq('id', parsed.data.connectorId).eq('enabled', true).maybeSingle();
    if (error || !data) return apiError('Wallet connection unavailable', 409);
  }
  const { data, error } = await admin.from('organizations')
    .update({ wallet_connector_id: parsed.data.connectorId, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.organizationId).neq('status','deleted').select('id').maybeSingle();
  if (error) return apiError('Could not assign wallet connection', 503);
  if (!data) return apiError('Business not found', 404);
  return NextResponse.json({ saved: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}

import 'server-only';
import { z } from 'zod';

const BASE = 'https://api.walletwallet.dev';
const serialSchema = z.string().regex(/^[A-Za-z0-9-]{6,128}$/);
const createResponse = z.object({ serialNumber: serialSchema,
  shareUrl: z.string().url(), googleSaveUrl: z.string().url().optional().nullable() });
const usageResponse = z.object({ plan: z.enum(['free','trial','pro','business','enterprise']),
  count: z.number().int(), remaining: z.number().int(), limit: z.number().int(),
  resetDate: z.string().optional() });

/** No caller-controlled host/path, no redirects and no logging of provider bodies or secrets. */
export async function walletWalletRequest(apiKey: string, path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  payload?: object): Promise<unknown> {
  if (!/^ww_live_[0-9a-f]{32}$/.test(apiKey)) throw new Error('Wallet key unavailable');
  if (!/^\/api\/(auth\/usage|passes(?:\/[A-Za-z0-9-]{6,128})?)$/.test(path)) throw new Error('Invalid WalletWallet path');
  const response = await fetch(`${BASE}${path}`, { method, redirect: 'error', cache: 'no-store',
    signal: AbortSignal.timeout(8_000), headers: {
      Authorization: `Bearer ${apiKey}`, ...(payload ? { 'Content-Type': 'application/json' } : {}),
    }, ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403
    ? 'WalletWallet credentials rejected' : response.status === 429
      ? 'WalletWallet quota reached' : `WalletWallet returned ${response.status}`);
  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > 16 * 1024 * 1024) throw new Error('Wallet response too large');
  return response.json();
}

export async function checkWalletUsage(apiKey: string) {
  const parsed = usageResponse.safeParse(await walletWalletRequest(apiKey, '/api/auth/usage', 'GET'));
  if (!parsed.success) throw new Error('Unexpected WalletWallet usage response');
  return parsed.data;
}

export function validateInstallLink(url: string, serial: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.host !== 'pass.walletwallet.dev' ||
        parsed.username || parsed.password || parsed.pathname !== `/p/${serial}` ||
        parsed.search || parsed.hash) return null;
    return parsed.toString();
  } catch { return null; }
}
export async function issueWalletWalletPass(apiKey: string, payload: object) {
  const parsed = createResponse.safeParse(await walletWalletRequest(apiKey, '/api/passes', 'POST', payload));
  if (!parsed.success) throw new Error('Unexpected WalletWallet issue response');
  const safeUrl = validateInstallLink(parsed.data.shareUrl, parsed.data.serialNumber);
  if (!safeUrl) throw new Error('Unexpected wallet install URL');
  return { serialNumber: parsed.data.serialNumber, shareUrl: safeUrl };
}
export async function updateWalletWalletPass(apiKey: string, serial: string, payload: object) {
  if (!serialSchema.safeParse(serial).success) throw new Error('Invalid wallet serial');
  const result = await walletWalletRequest(apiKey, `/api/passes/${serial}`, 'PUT', payload);
  const parsed = z.object({ serialNumber: serialSchema, unchanged: z.boolean().optional(),
    notifiedDevices: z.number().int().optional() }).safeParse(result);
  if (!parsed.success || parsed.data.serialNumber !== serial) throw new Error('Unexpected wallet update response');
  return parsed.data;
}
export async function revokeWalletWalletPass(apiKey: string, serial: string) {
  if (!serialSchema.safeParse(serial).success) throw new Error('Invalid wallet serial');
  const parsed = z.object({ serialNumber: serialSchema, deleted: z.literal(true),
    googleRevoked: z.boolean().optional() })
    .safeParse(await walletWalletRequest(apiKey, `/api/passes/${serial}`, 'DELETE'));
  if (!parsed.success || parsed.data.serialNumber !== serial || parsed.data.googleRevoked === false) {
    throw new Error('Wallet revocation not confirmed on both wallets');
  }
}

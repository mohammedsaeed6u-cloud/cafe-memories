/**
 * Outsoueced Apple/Google Wallet pass issuance via the WalletWallet API.
 *
 * Apple eefuses to install any .pkpass that is not cryptographically signed
 * with a paid Pass Type ID certificate. Instead of shipping unsigned passes,
 * this service delegates issuance + signing to walletwallet.dev (free tier:
 * 1,000 passes/month, no Apple Developer account needed) and returns the
 * signed binary plus the Google Wallet save link for the same pass.
 */
import type { DigitalWalletPassData } from './digital-wallet.service';

export const WALLETWALLET_API_BASE = 'https://api.walletwallet.dev';

export interface IssuedPass {
  serialNumber: string;
  applePassBase64: string;
  googleSaveUrl: string | null;
  shareUrl: string | null;
}

interface WalletWalletRequestBody {
  barcodeValue: string;
  barcodeFormat: 'QR';
  barcodeAltText: string;
  logoText: string;
  description: string;
  organizationName: string;
  headerFields: { label: string; value: string; changeMessage?: string }[];
  primaryFields: { label: string; value: string; changeMessage?: string }[];
  secondaryFields: { label: string; value: string; changeMessage?: string }[];
  backFields: { label: string; value: string; changeMessage?: string }[];
  colorPreset?: string;
  color?: string;
  sharingProhibited: boolean;
  logoURL?: string;
  iconURL?: string;
}

/** Outsourcing is live the moment an API key exists — one env var, zero flags. */
export function isWalletOutsourcingEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NEXT_PUBLIC_WALLETWALLET_ENABLED === '1' && Boolean(env.WALLETWALLET_API_KEY);
}

/**
 * Lock-screen banner template: fired when the stamps header field changes
 * (WalletWallet PUT). iOS substitutes %@ with the new value.
 */
export const STAMP_CHANGE_MESSAGE = 'تم ختم زيارتك جديدة! أختامك الآن %@';

/** Maps our loyalty pass data onto the WalletWallet pass schema. */
export function buildWalletWalletRequest(
  data: DigitalWalletPassData,
  stampedCountOverride?: number
): WalletWalletRequestBody {
  const cleanPhone = (data.customerPhone || 'guest').trim().replace(/[^0-9]/g, '') || 'guest';
  const stampUrl = `https://memories-c9w.pages.dev/c/${data.cafeSlug}?action=stamp&customer=${cleanPhone}`;
  const stampedCount = stampedCountOverride ?? data.stampedCount;
  const isCompleted = stampedCount >= data.maxSlots;
  const effectiveLogo = data.logoUrl || data.iconUrl;
  const effectiveIcon = data.iconUrl || data.logoUrl;

  return {
    barcodeValue: stampUrl,
    barcodeFormat: 'QR',
    barcodeAltText: 'امسح عند الكاشير للختم الفوري',
    logoText: data.cafeName,
    description: `كارت ولاء وذكريات ${data.cafeName}`,
    organizationName: data.cafeName,
    headerFields: [
      {
        label: 'الأختام',
        value: `${stampedCount}/${data.maxSlots}`,
        changeMessage: STAMP_CHANGE_MESSAGE,
      },
    ],
    primaryFields: [
      {
        label: isCompleted ? 'المكافأة جاهزة للاستلام' : 'المكافأة القادمة',
        value: data.giftTitle || 'هدية خاصة مجانية',
      },
    ],
    secondaryFields: [
      { label: 'العميل', value: data.customerName || data.customerPhone || 'ضيف مميز' },
      { label: 'الحالة', value: isCompleted ? 'مكتمل - هدية جاهزة' : 'نشط' },
    ],
    backFields: [
      { label: 'حساب الإنستجرام', value: data.instagramHandle || `@${data.cafeSlug}` },
      { label: 'رابط الذكريات المباشر', value: `https://memories-c9w.pages.dev/c/${data.cafeSlug}` },
      {
        label: 'شروط استخدام كارت الذكريات',
        value:
          'كل زيارة وتوثيق للذكرى يمنحك ختماً في الكارت. عند إكمال جميع الخانات يحق لك استلام الهدية المقررة من المنشأة وطباعة ذكرياتك بجودة عالية.',
      },
    ],
    ...(effectiveLogo ? { logoURL: effectiveLogo } : {}),
    ...(effectiveIcon ? { iconURL: effectiveIcon } : {}),
    ...(data.color ? { color: data.color } : { colorPreset: data.colorPreset || 'red' }),
    sharingProhibited: true,
  };
}

/** Issues a signed pass upstream; throws with the upstream status on failure. */
export async function issueSignedPass(
  data: DigitalWalletPassData,
  fetchImpl: typeof fetch = fetch
): Promise<IssuedPass> {
  const apiKey = process.env.WALLETWALLET_API_KEY;
  if (!apiKey) throw new Error('WALLETWALLET_API_KEY is not configured');

  const res = await fetchImpl(`${WALLETWALLET_API_BASE}/api/passes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(buildWalletWalletRequest(data)),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`walletwallet issue failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    serialNumber?: string;
    applePass?: string;
    googleSaveUrl?: string;
    shareUrl?: string;
  };
  if (!json.serialNumber || !json.applePass) {
    throw new Error('walletwallet returned an incomplete pass envelope');
  }
  return {
    serialNumber: json.serialNumber,
    applePassBase64: json.applePass,
    googleSaveUrl: json.googleSaveUrl ?? null,
    shareUrl: json.shareUrl ?? null,
  };
}

/** Pushes a full pass-body update to an already-issued pass (both wallets). */
export async function updateIssuedPass(
  serial: string,
  data: DigitalWalletPassData,
  fetchImpl: typeof fetch = fetch
): Promise<{ unchanged: boolean }> {
  const apiKey = process.env.WALLETWALLET_API_KEY;
  if (!apiKey) throw new Error('WALLETWALLET_API_KEY is not configured');

  const url = WALLETWALLET_API_BASE + '/api/passes/' + encodeURIComponent(serial);
  const res = await fetchImpl(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify(buildWalletWalletRequest(data)),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error('walletwallet pass update failed (' + res.status + '): ' + detail.slice(0, 200));
  }
  const json = (await res.json().catch(() => ({}))) as { unchanged?: boolean };
  return { unchanged: json.unchanged === true };
}

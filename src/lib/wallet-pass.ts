import type { PublicBrand } from '@/lib/brand';

export type WalletBranch = { latitude: number | null; longitude: number | null };
export type WalletPassInput = {
  organizationId: string; organizationSlug: string; customerId: string;
  brand: PublicBrand; verifiedVisits: number; usedVisits: number;
  threshold: number | null; rewardName: string | null;
  marketingOptIn: boolean; nearbyOptIn: boolean; lastCampaignMessage: string;
  plan: 'free' | 'pro' | 'business'; verifiedAt: string | null;
  siteOrigin: string | null; branches: WalletBranch[];
};

/** A provider sees loyalty basics only: never customer photos, phone, or email. */
export function walletPassPayload(input: WalletPassInput) {
  const brandedName = `Café Memories × ${input.brand.name}`.slice(0, 64);
  const stamps = input.threshold
    ? `${Math.min(input.threshold, Math.max(0, input.verifiedVisits - input.usedVisits))}/${input.threshold}`
    : 'البرنامج قيد الإعداد';
  // The free plan has color presets, but custom logos/colors/locations require
  // an actually verified Pro/Business subscription in the provider account.
  const pro = input.plan !== 'free' && input.verifiedAt !== null &&
    Date.now() - new Date(input.verifiedAt).getTime() < 24 * 60 * 60_000;
  const origins = input.siteOrigin ? safeSiteOrigin(input.siteOrigin) : null;
  const logoRevision = input.brand.logoUrl?.split('?v=')[1];
  const logoURL = pro && input.brand.logoUrl && origins
    ? `${origins}/api/v1/brand/${input.organizationId}/wallet-mark${logoRevision ? `?v=${encodeURIComponent(logoRevision)}` : ''}`
    : undefined;
  const locations = pro && input.nearbyOptIn ? input.branches
    .filter((branch): branch is { latitude: number; longitude: number } =>
      branch.latitude !== null && branch.longitude !== null &&
      Number.isFinite(branch.latitude) && Number.isFinite(branch.longitude) &&
      branch.latitude >= -90 && branch.latitude <= 90 && branch.longitude >= -180 && branch.longitude <= 180)
    .slice(0, 10).map((branch) => ({ latitude: branch.latitude, longitude: branch.longitude,
      relevantText: `بطاقتك جاهزة عند ${input.brand.name}`.slice(0, 128) })) : [];
  return {
    barcodeValue: input.customerId, barcodeFormat: 'QR' as const, sharingProhibited: true,
    logoText: brandedName, organizationName: brandedName,
    description: `بطاقة ولاء ${input.brand.name} من Café Memories`.slice(0, 128),
    primaryFields: [{ label: 'بطاقة ولاء', value: input.brand.name.slice(0, 64) }],
    secondaryFields: [
      { label: 'الأختام', value: stamps },
      { label: 'المكافأة', value: input.rewardName?.slice(0, 72) ?? 'قيد الإعداد' },
    ],
    backFields: [
      { label: 'البرنامج', value: 'Café Memories × ' + input.brand.name.slice(0, 50) },
      // Seed the notification anchor at creation on Pro+, even for guests who
      // haven't opted in yet. Only change its value with marketing permission.
      ...(pro ? [{ label: 'الإشعارات', value: input.marketingOptIn ? input.lastCampaignMessage : ' ', changeMessage: '%@' }] : []),
      ...(origins ? [{ label: 'بطاقتي الرقمية', value: `${origins}/c/${input.organizationSlug}` }] : []),
    ],
    colorPreset: input.brand.walletColorPreset,
    ...(pro ? { color: input.brand.primaryColor } : {}),
    ...(logoURL ? { logoURL } : {}),
    ...(locations.length ? { locations } : {}),
  };
}

/** Public deployment origin only. Never derive provider-facing URLs from Host. */
export function safeSiteOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' ||
        url.search || url.hash || !url.hostname.includes('.') ||
        ['localhost','127.0.0.1'].includes(url.hostname) ||
        ['.example','.test','.invalid','.local'].some((suffix) => url.hostname.endsWith(suffix))) return null;
    return url.origin;
  } catch { return null; }
}

import { z } from 'zod';

export const DEFAULT_PRIMARY = '#183A32';
export const DEFAULT_ACCENT = '#F2C77F';
export const frameStyles = ['film', 'polaroid', 'editorial'] as const;
export const walletPresets = ['dark', 'blue', 'green', 'red', 'purple', 'orange'] as const;
export const socialPlatforms = ['instagram', 'facebook', 'tiktok', 'x', 'youtube', 'whatsapp', 'website'] as const;
export type SocialPlatform = typeof socialPlatforms[number];
export type SocialLinks = Partial<Record<SocialPlatform, string>>;

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
function whiteContrast(hexValue: string) {
  const rgb = [1, 3, 5].map((start) => {
    const value = parseInt(hexValue.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  return 1.05 / (luminance + .05);
}
const primary = hex.refine((value) => whiteContrast(value) >= 4.5,
  'اختار لونًا داكنًا يقرأ عليه النص الأبيض بوضوح');

/** All displayed links are navigations only: never fetch merchant-supplied URLs server-side. */
export function validBrandLink(platform: SocialPlatform | 'maps', raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port || raw.length > 350) return null;
    const host = url.hostname.toLowerCase();
    const allowed: Record<SocialPlatform | 'maps', string[]> = {
      instagram: ['instagram.com', 'www.instagram.com'],
      facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com'],
      tiktok: ['tiktok.com', 'www.tiktok.com'],
      x: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
      youtube: ['youtube.com', 'www.youtube.com', 'youtu.be'],
      whatsapp: ['wa.me'],
      maps: ['www.google.com', 'google.com', 'maps.google.com', 'maps.app.goo.gl'],
      website: [],
    };
    if (platform === 'website') {
      if (!host.includes('.') || host === 'localhost' || /^(\d+\.){3}\d+$/.test(host) ||
          host.endsWith('.localhost') || host.endsWith('.local')) return null;
    } else if (!allowed[platform].includes(host)) return null;
    if (platform === 'whatsapp' && !/^\/[1-9][0-9]{6,14}\/?$/.test(url.pathname)) return null;
    if (platform === 'maps' && host !== 'maps.app.goo.gl' && !url.pathname.startsWith('/maps')) return null;
    return url.toString();
  } catch { return null; }
}

const optionalLink = z.string().trim().max(350).nullable().optional();
export const brandSchema = z.object({
  name: z.string().trim().min(2).max(100),
  tagline: z.string().trim().max(100),
  primaryColor: primary,
  accentColor: hex,
  frameStyle: z.enum(frameStyles),
  walletColorPreset: z.enum(walletPresets),
  socialLinks: z.object({
    instagram: optionalLink, facebook: optionalLink, tiktok: optionalLink,
    x: optionalLink, youtube: optionalLink, whatsapp: optionalLink, website: optionalLink,
  }).strict(),
}).strict().superRefine((input, ctx) => {
  for (const platform of socialPlatforms) {
    const value = input.socialLinks[platform];
    if (value && !validBrandLink(platform, value)) ctx.addIssue({ code: 'custom',
      path: ['socialLinks', platform], message: 'رابط غير آمن أو ليس من هذه المنصة' });
  }
});

export function isBrandLogoKey(key: string | null | undefined, organizationId: string): boolean {
  return Boolean(key && new RegExp(`^${organizationId}/logo-[0-9a-f-]{36}\\.png$`).test(key));
}

export type PublicBrand = {
  name: string;
  tagline: string | null;
  primaryColor: string;
  accentColor: string;
  frameStyle: typeof frameStyles[number];
  walletColorPreset: typeof walletPresets[number];
  logoUrl: string | null;
  socialLinks: SocialLinks;
};

export function publicBrand(row: {
  id: string; name: string; logo_url: string | null; brand_tagline: string | null;
  primary_color: string | null; secondary_color: string | null;
  frame_style: string; wallet_color_preset: string; social_links: unknown;
}): PublicBrand {
  const socialLinks: SocialLinks = {};
  const rawLinks = row.social_links && typeof row.social_links === 'object' && !Array.isArray(row.social_links)
    ? row.social_links as Record<string, unknown> : {};
  for (const platform of socialPlatforms) {
    const link = rawLinks[platform];
    if (typeof link === 'string') {
      const safe = validBrandLink(platform, link);
      if (safe) socialLinks[platform] = safe;
    }
  }
  return {
    name: row.name, tagline: row.brand_tagline,
    primaryColor: hex.safeParse(row.primary_color).success ? row.primary_color! : DEFAULT_PRIMARY,
    accentColor: hex.safeParse(row.secondary_color).success ? row.secondary_color! : DEFAULT_ACCENT,
    frameStyle: frameStyles.find((style) => style === row.frame_style) ?? 'film',
    walletColorPreset: walletPresets.find((preset) => preset === row.wallet_color_preset) ?? 'green',
    logoUrl: isBrandLogoKey(row.logo_url, row.id)
      ? `/api/v1/brand/${row.id}/logo?v=${row.logo_url!.split('/').at(-1)}` : null,
    socialLinks,
  };
}

export function instagramMention(links: SocialLinks): string | null {
  const link = links.instagram;
  if (!link) return null;
  try {
    const handle = new URL(link).pathname.split('/')[1];
    return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `@${handle}` : null;
  } catch { return null; }
}

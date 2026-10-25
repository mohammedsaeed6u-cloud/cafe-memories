/**
 * Per-organization photobooth settings.
 *
 * The dashboard and the customer app used to keep this in localStorage, so a
 * merchant's configuration only existed in their own browser. It now lives in
 * `organizations.settings` (jsonb) with a strict server-side schema: unknown
 * keys are dropped, numbers are bounded, and colours must be hex.
 */

import { z } from 'zod';
import type { BusinessSettings } from '@/types/photobooth';

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const frameShapeSchema = z.enum(['rounded', 'sharp', 'polaroid', 'pill']);
export const orientationSchema = z.enum(['vertical', 'horizontal']);
export const businessTypeSchema = z.enum([
  'cafe',
  'restaurant',
  'retail',
  'salon',
  'entertainment',
  'events',
  'general',
]);

export const giftOfferSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(200),
  icon: z.string().trim().max(40),
});

export const frameSchema = z
  .object({
    id: z.string().trim().min(1).max(60),
    name: z.string().trim().min(1).max(80),
    nameAr: z.string().trim().min(1).max(80),
    bgColor: hex,
    textColor: hex,
    borderColor: hex,
    accentColor: hex.optional(),
    orientation: orientationSchema,
    shotCount: z.number().int().min(1).max(10),
  })
  .catchall(z.unknown());

export const wallSettingsSchema = z.object({
  mode: z.enum(['board', 'grid', 'slideshow']),
  slideIntervalSeconds: z.number().int().min(3).max(120),
  boardTheme: z.enum(['warm_cork', 'dark_slate', 'espresso_wood']).optional(),
  blackout: z.boolean().optional(),
});

/** Everything a merchant may change. All fields optional for PATCH. */
export const organizationSettingsSchema = z
  .object({
    shotCount: z.number().int().min(1).max(10),
    orientation: orientationSchema,
    frameShape: frameShapeSchema,
    borderRadius: z.number().min(0).max(200),
    dimensionsPreset: z.string().trim().max(40),
    cardMode: z.string().trim().max(60),
    templateId: z.string().trim().max(60),
    layoutType: z.string().trim().max(60),
    widthCm: z.number().min(1).max(100),
    heightCm: z.number().min(1).max(100),
    loyaltyMaxVisits: z.number().int().min(2).max(30),
    freeGiftOffer: giftOfferSchema,
    activeFrameId: z.string().trim().max(60),
    activeColorPaletteId: z.string().trim().max(60),
    allowCustomerColorChoice: z.boolean(),
    allowedColorIds: z.array(z.string().trim().max(60)).max(30),
    allowCustomerStickers: z.boolean(),
    allowCustomerModeChoice: z.boolean(),
    allowedModes: z.array(z.string().trim().max(60)).max(30),
    lockFrameForCustomers: z.boolean(),
    businessType: businessTypeSchema,
    frames: z.array(frameSchema).max(40),
    wallSettings: wallSettingsSchema,
  })
  .partial()
  .strict();

export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;

export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettingsInput = {
  shotCount: 3,
  orientation: 'vertical',
  frameShape: 'rounded',
  borderRadius: 16,
  dimensionsPreset: 'strip_2x6',
  cardMode: 'polaroid_vintage',
  loyaltyMaxVisits: 5,
  freeGiftOffer: {
    title: 'هدية ترحيبية خاصة',
    subtitle: 'أكمل بطاقتك واستلم هديتك من الكاونتر',
    icon: 'gift',
  },
  activeFrameId: 'polaroid-cream',
  activeColorPaletteId: 'memories-signature',
  allowCustomerColorChoice: true,
  allowedColorIds: [],
  allowCustomerStickers: true,
  allowCustomerModeChoice: false,
  allowedModes: [],
  lockFrameForCustomers: true,
  businessType: 'cafe',
  frames: [],
  wallSettings: { mode: 'slideshow', slideIntervalSeconds: 8, blackout: false },
};

/** Stored JSON is already validated on write; this only fills gaps. */
export function mergeOrganizationSettings(
  stored: Record<string, unknown> | null | undefined
): OrganizationSettingsInput {
  const parsed = organizationSettingsSchema.safeParse(stored ?? {});
  return { ...DEFAULT_ORGANIZATION_SETTINGS, ...(parsed.success ? parsed.data : {}) };
}

/** Shape expected by the existing `BusinessSettings` client type. */
export function businessSettingsFromOrganization(
  organization: {
    slug: string;
    name: string;
    logo_url?: string | null;
    brand_tagline?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
    settings?: Record<string, unknown> | null;
  }
): Partial<BusinessSettings> {
  const settings = mergeOrganizationSettings(organization.settings);
  return {
    cafeSlug: organization.slug,
    cafeName: organization.name,
    branding: {
      name: organization.name,
      logoUrl: organization.logo_url ?? undefined,
      tagline: organization.brand_tagline ?? undefined,
    },
    defaultShotCount: settings.shotCount,
    defaultOrientation: settings.orientation,
    defaultFrameShape: settings.frameShape,
    defaultBorderRadius: settings.borderRadius,
    defaultDimensionsPreset: settings.dimensionsPreset,
    defaultCardMode: settings.cardMode as BusinessSettings['defaultCardMode'],
    defaultTemplateId: settings.templateId,
    defaultWidthCm: settings.widthCm,
    defaultHeightCm: settings.heightCm,
    defaultLayoutType: settings.layoutType as BusinessSettings['defaultLayoutType'],
    freeGiftOffer: settings.freeGiftOffer ?? DEFAULT_ORGANIZATION_SETTINGS.freeGiftOffer!,
    loyaltyMaxVisits: settings.loyaltyMaxVisits,
    activeFrameId: settings.activeFrameId,
    activeColorPaletteId: settings.activeColorPaletteId,
    allowCustomerColorChoice: settings.allowCustomerColorChoice,
    allowedColorIds: settings.allowedColorIds,
    allowCustomerStickers: settings.allowCustomerStickers,
    allowCustomerModeChoice: settings.allowCustomerModeChoice,
    allowedModes: settings.allowedModes as BusinessSettings['allowedModes'],
    lockFrameForCustomers: settings.lockFrameForCustomers,
    businessType: settings.businessType,
    wallSettings: settings.wallSettings,
    frames: (settings.frames ?? []) as unknown as BusinessSettings['frames'],
  };
}

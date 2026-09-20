import { z } from 'zod';

export const cornerEmojiSchema = z.object({
  topRight: z.string().min(1).max(8),
  bottomLeft: z.string().min(1).max(8),
  enabled: z.boolean(),
});

export const businessBrandingSchema = z.object({
  name: z.string().min(1).max(100),
  logoUrl: z.string().optional(),
  tagline: z.string().max(200).optional(),
});

export const freeGiftOfferSchema = z.object({
  title: z.string().min(1).max(120),
  subtitle: z.string().max(300),
  icon: z.string().max(8),
});

export const photoboothFrameSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nameAr: z.string().min(1),
  bgColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/),
  textColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/),
  borderColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).optional(),
  cornerEmojis: cornerEmojiSchema,
  orientation: z.enum(['vertical', 'horizontal']),
  shotCount: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(6)]),
  badgeText: z.string().max(50).optional(),
  isCustom: z.boolean().optional(),
});

export const businessSettingsSchema = z.object({
  cafeSlug: z.string().min(1),
  cafeName: z.string().min(1),
  branding: businessBrandingSchema,
  defaultShotCount: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(6)]),
  defaultOrientation: z.enum(['vertical', 'horizontal']),
  freeGiftOffer: freeGiftOfferSchema,
  activeFrameId: z.string(),
  frames: z.array(photoboothFrameSchema),
});

export const customerPersonaSchema = z.enum([
  'tech_freelancer',
  'creator_creative',
  'student_researcher',
  'business_founder',
  'coffee_lover',
  'other',
]);

export const photoboothCaptureSchema = z.object({
  customer: z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    phone: z.string().min(8, 'رقم الهاتف غير صالح'),
    role: customerPersonaSchema.optional().default('coffee_lover'),
  }),
  photos: z.array(z.string().min(1)).min(1, 'يجب التقاط صورة واحدة على الأقل'),
  cafeSlug: z.string().min(1),
  frameId: z.string().min(1),
  giftCode: z.string().optional(),
  visitId: z.string().optional(),
});

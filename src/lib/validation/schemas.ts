import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

export const createBranchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100),
  organization_id: z.string().uuid(),
});

export const updateBrandingSchema = z.object({
  branch_id: z.string().uuid(),
  branding: z.record(z.string(), z.unknown()),
});

export const createRewardRuleSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().nullable().optional(),
  visits_required: z.number().int().positive(),
  reward_type: z.string().min(1, 'Reward type is required'),
});

export const createMemorySchema = z.object({
  branch_id: z.string().uuid(),
  image_url: z.string().url('Invalid image URL'),
  caption: z.string().nullable().optional(),
  agreed_to_terms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  agreed_to_marketing: z.boolean().default(false),
});

export const createVisitSchema = z.object({
  customer_id: z.string().uuid(),
  branch_id: z.string().uuid(),
});

export const moderateMemorySchema = z.object({
  memory_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export const pairScreenSchema = z.object({
  pairing_code: z.string().length(6, 'Pairing code must be 6 characters'),
  name: z.string().min(1, 'Name is required'),
  branch_id: z.string().uuid(),
});

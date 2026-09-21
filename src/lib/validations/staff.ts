import { z } from 'zod';

/**
 * Strict 4-digit numeric PIN.
 * Regex is authoritative: exactly 4 chars, digits 0-9, nothing else.
 */
export const staffPinSchema = z
  .string()
  .regex(/^[0-9]{4}$/, 'PIN must be exactly 4 digits (0-9)');

export const staffRoleSchema = z.enum(['barista', 'shift_lead', 'manager']);

export const staffMemberSchema = z.object({
  id: z.string().min(1, 'id is required'),
  name: z.string().min(2, 'name must be at least 2 characters').max(80),
  role: staffRoleSchema,
  avatarUrl: z.string().optional(),
});

/** Payload accepted when a staff member keys in their Quick PIN. */
export const staffPinVerifySchema = z.object({
  staffId: z.string().min(1, 'staffId is required'),
  pin: staffPinSchema,
});

export type StaffPinVerifyInput = z.infer<typeof staffPinVerifySchema>;

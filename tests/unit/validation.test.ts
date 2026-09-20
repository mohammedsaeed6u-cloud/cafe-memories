import { describe, it, expect } from 'vitest';
import {
  createOrganizationSchema,
  createBranchSchema,
  createMemorySchema,
  createVisitSchema,
} from '@/lib/validation/schemas';

describe('Zod Input Boundary Validation', () => {
  it('validates valid organization payload', () => {
    const valid = createOrganizationSchema.safeParse({ name: 'Blue Bottle Coffee' });
    expect(valid.success).toBe(true);
  });

  it('rejects empty organization name', () => {
    const invalid = createOrganizationSchema.safeParse({ name: '' });
    expect(invalid.success).toBe(false);
  });

  it('requires agreed_to_terms = true on memory creation', () => {
    const valid = createMemorySchema.safeParse({
      branch_id: '123e4567-e89b-42d3-a456-426614174000',
      image_url: 'https://example.com/photo.jpg',
      caption: 'Delicious flat white',
      agreed_to_terms: true,
      agreed_to_marketing: false,
    });
    expect(valid.success).toBe(true);

    const invalid = createMemorySchema.safeParse({
      branch_id: '123e4567-e89b-42d3-a456-426614174000',
      image_url: 'https://example.com/photo.jpg',
      agreed_to_terms: false,
    });
    expect(invalid.success).toBe(false);
  });

  it('enforces UUID format on visit customer_id and branch_id', () => {
    const invalid = createVisitSchema.safeParse({
      customer_id: 'not-a-uuid',
      branch_id: 'also-not-a-uuid',
    });
    expect(invalid.success).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { isPrivateMemoryKey } from '@/lib/server/media';

const org = 'a1923b57-3665-4cdc-b4ac-0075771c86df';
const customer = '54b83319-a10f-4a2d-8038-cd21a2237eb4';
const folder = '0f766bd3-bf73-4eb0-ae2f-951c951eea4c';

describe('private memory keys', () => {
  it('allows application-generated objects for the correct guest and organization', () => {
    for (const name of ['original', 'optimized', 'thumbnail']) {
      expect(isPrivateMemoryKey(`${org}/${customer}/${folder}/${name}.webp`, org, customer)).toBe(true);
    }
  });
  it('rejects public URLs, cross-tenant keys and path traversal', () => {
    const key = `${org}/${customer}/${folder}/optimized.webp`;
    expect(isPrivateMemoryKey(key, '123e4567-e89b-42d3-a456-426614174000', customer)).toBe(false);
    expect(isPrivateMemoryKey(key, org, '123e4567-e89b-42d3-a456-426614174000')).toBe(false);
    expect(isPrivateMemoryKey(`https://example.com/storage/v1/object/public/memories/${key}`, org, customer)).toBe(false);
    expect(isPrivateMemoryKey(`${org}/${customer}/../${folder}/optimized.webp`, org, customer)).toBe(false);
    expect(isPrivateMemoryKey(`${org}/${customer}/${folder}/invalid.png`, org, customer)).toBe(false);
  });
});

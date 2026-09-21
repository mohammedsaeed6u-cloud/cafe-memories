import { describe, it, expect } from 'vitest';
import {
  LOYALTY_TOTAL_SLOTS,
  getStampState,
  mapLocalPhotosToSlots,
  pickMemoryThumbnail,
  type LoyaltyStampSlot,
} from '@/lib/services/loyalty-stamps';

const slot = (takenAt: string, thumbnailUrl: string): LoyaltyStampSlot => ({
  takenAt,
  thumbnailUrl,
});

describe('Loyalty stamp card logic', () => {
  it('reports an empty card for zero photos', () => {
    const state = getStampState([]);

    expect(state.stampedCount).toBe(0);
    expect(state.remaining).toBe(LOYALTY_TOTAL_SLOTS);
    expect(state.isComplete).toBe(false);
    expect(state.nextSlotIndex).toBe(0);
    expect(state.latestStamp).toBeNull();
  });

  it('counts stamps and computes remaining visits', () => {
    const slots = Array.from({ length: 4 }, (_, i) => slot(`2026-09-0${i + 1}T10:00:00Z`, `photo-${i}`));
    const state = getStampState(slots);

    expect(state.stampedCount).toBe(4);
    expect(state.remaining).toBe(LOYALTY_TOTAL_SLOTS - 4);
    expect(state.isComplete).toBe(false);
    expect(state.nextSlotIndex).toBe(4);
    expect(state.latestStamp?.thumbnailUrl).toBe('photo-3');
  });

  it('marks the card complete at exactly 10 stamps and stops accepting more', () => {
    const slots = Array.from({ length: 12 }, (_, i) => slot(`2026-09-01T00:00:0${i % 10}Z`, `photo-${i}`));
    const state = getStampState(slots);

    expect(state.stampedCount).toBe(LOYALTY_TOTAL_SLOTS);
    expect(state.isComplete).toBe(true);
    expect(state.remaining).toBe(0);
    expect(state.nextSlotIndex).toBe(-1);
  });

  it('drops invalid slots (missing url or timestamp)', () => {
    const state = getStampState([
      slot('2026-09-01T10:00:00Z', ''),
      slot('', 'photo-x'),
      null,
      undefined,
      slot('2026-09-02T10:00:00Z', 'photo-ok'),
    ]);

    expect(state.stampedCount).toBe(1);
    expect(state.latestStamp?.thumbnailUrl).toBe('photo-ok');
  });

  it('maps local photos onto slots oldest-first with a cap at 10', () => {
    const photos = Array.from({ length: 14 }, (_, i) => `data:image/jpeg;base64,${i}`);
    const now = new Date('2026-09-21T12:00:00Z');
    const slots = mapLocalPhotosToSlots(photos, now);

    expect(slots).toHaveLength(LOYALTY_TOTAL_SLOTS);
    // Last 10 photos kept — oldest-first ordering preserved.
    expect(slots[0].thumbnailUrl).toBe(photos[4]);
    expect(slots[9].thumbnailUrl).toBe(photos[13]);
    // Approximated daily timestamps ascending.
    expect(new Date(slots[9].takenAt).getTime()).toBeGreaterThan(new Date(slots[0].takenAt).getTime());
  });

  it('returns empty mapping for non-array or empty input', () => {
    expect(mapLocalPhotosToSlots([])).toHaveLength(0);
    // @ts-expect-error defensive runtime check
    expect(mapLocalPhotosToSlots(null)).toHaveLength(0);
  });

  it('picks the best available memory thumbnail', () => {
    expect(pickMemoryThumbnail({ thumbnailUrl: 't', optimizedUrl: 'o', originalUrl: 'g' })).toBe('t');
    expect(pickMemoryThumbnail({ optimizedUrl: 'o', originalUrl: 'g' })).toBe('o');
    expect(pickMemoryThumbnail({ originalUrl: 'g' })).toBe('g');
    expect(pickMemoryThumbnail({})).toBe('');
  });
});

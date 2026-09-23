import { describe, it, expect, vi } from 'vitest';
import {
  LOYALTY_TOTAL_SLOTS,
  LOYALTY_STAMPS_CACHE_TTL_MS,
  LOYALTY_STAMPS_CACHE_MAX_ENTRIES,
  getStampState,
  mapLocalPhotosToSlots,
  pickMemoryThumbnail,
  getCachedLoyaltyStamps,
  setCachedLoyaltyStamps,
  invalidateLoyaltyStampsCache,
  type LoyaltyStampsCacheStore,
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

describe('Loyalty stamps cache', () => {
  it('serves a fresh entry and drops it after the TTL expires', () => {
    vi.useFakeTimers();
    try {
      const store: LoyaltyStampsCacheStore = new Map();
      setCachedLoyaltyStamps('espresso-lab', '+201000000000', [slot('2026-09-21T10:00:00Z', 'photo-a')], store);

      expect(getCachedLoyaltyStamps('espresso-lab', '+201000000000', store)).toHaveLength(1);

      vi.advanceTimersByTime(LOYALTY_STAMPS_CACHE_TTL_MS + 1);
      expect(getCachedLoyaltyStamps('espresso-lab', '+201000000000', store)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('explicit invalidation works even inside the TTL window', () => {
    const store: LoyaltyStampsCacheStore = new Map();
    setCachedLoyaltyStamps('espresso-lab', '+201000000000', [slot('2026-09-21T10:00:00Z', 'photo-a')], store);
    expect(getCachedLoyaltyStamps('espresso-lab', '+201000000000', store)).not.toBeNull();

    invalidateLoyaltyStampsCache('espresso-lab', '+201000000000', store);
    expect(getCachedLoyaltyStamps('espresso-lab', '+201000000000', store)).toBeNull();
  });

  it('keys entries by cafe + phone independently, canonicalizing the phone', () => {
    const store: LoyaltyStampsCacheStore = new Map();
    setCachedLoyaltyStamps('espresso-lab', '+201000000000', [slot('2026-09-21T10:00:00Z', 'photo-a')], store);

    expect(getCachedLoyaltyStamps('espresso-lab', '+201111111111', store)).toBeNull();
    expect(getCachedLoyaltyStamps('other-cafe', '+201000000000', store)).toBeNull();
    // The digits-only form and the "+"-prefixed form are the same customer.
    expect(getCachedLoyaltyStamps('espresso-lab', '201000000000', store)).not.toBeNull();
    expect(getCachedLoyaltyStamps('espresso-lab', '+201000000000', store)).not.toBeNull();
  });

  it('evicts the oldest entry when the cap is reached', () => {
    const store: LoyaltyStampsCacheStore = new Map();
    const oldestPhone = '201000000000';
    for (let i = 0; i < LOYALTY_STAMPS_CACHE_MAX_ENTRIES; i++) {
      setCachedLoyaltyStamps('cafe', `${20100000 + i}`, [], store);
    }
    expect(store.size).toBe(LOYALTY_STAMPS_CACHE_MAX_ENTRIES);

    setCachedLoyaltyStamps('cafe', '201999990001', [], store);

    expect(store.size).toBe(LOYALTY_STAMPS_CACHE_MAX_ENTRIES);
    expect(getCachedLoyaltyStamps('cafe', oldestPhone, store)).toBeNull();
    expect(getCachedLoyaltyStamps('cafe', '201999990001', store)).toEqual([]);
  });

  it('prunes expired entries before evicting live ones', () => {
    vi.useFakeTimers();
    try {
      const store: LoyaltyStampsCacheStore = new Map();
      for (let i = 0; i < LOYALTY_STAMPS_CACHE_MAX_ENTRIES; i++) {
        setCachedLoyaltyStamps('cafe', `p${i}`, [], store);
      }

      // Everything expires; a new write must not be rejected or evict live data.
      vi.advanceTimersByTime(LOYALTY_STAMPS_CACHE_TTL_MS + 1);
      setCachedLoyaltyStamps('cafe', '201999990001', [], store);

      expect(getCachedLoyaltyStamps('cafe', '201999990001', store)).toEqual([]);
      expect(getCachedLoyaltyStamps('cafe', '201000000000', store)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

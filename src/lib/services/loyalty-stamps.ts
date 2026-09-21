/**
 * Pure, testable logic for the loyalty stamp card.
 *
 * A customer's loyalty card has a fixed number of slots (LOYALTY_TOTAL_SLOTS).
 * Every photobooth capture = one stamp, and the stamp itself is the photo's
 * thumbnail rendered inside the slot. Slots fill in capture order (oldest
 * first) and the card is complete once every slot is stamped.
 */

export const LOYALTY_TOTAL_SLOTS = 10;

export interface LoyaltyStampSlot {
  /** ISO timestamp of when the photo was captured (memory created). */
  takenAt: string;
  /** Thumbnail/source URL for the stamp image. */
  thumbnailUrl: string;
}

export interface LoyaltyStampState {
  /** Slots that already carry a stamp. */
  stampedCount: number;
  /** How many more photos until the reward unlocks. */
  remaining: number;
  /** True when every slot is stamped and the gift can be claimed. */
  isComplete: boolean;
  /** Index (0-based) of the next slot to be stamped; -1 when complete. */
  nextSlotIndex: number;
  /** The newest stamp (for the "just stamped" animation). */
  latestStamp: LoyaltyStampSlot | null;
}

function sanitizeSlots(slots: readonly (LoyaltyStampSlot | null | undefined)[]): LoyaltyStampSlot[] {
  return slots
    .filter((slot): slot is LoyaltyStampSlot =>
      Boolean(slot) &&
      typeof slot!.takenAt === 'string' &&
      slot!.takenAt.length > 0 &&
      typeof slot!.thumbnailUrl === 'string' &&
      slot!.thumbnailUrl.length > 0
    )
    .slice(0, LOYALTY_TOTAL_SLOTS);
}

/** Computes the card state from real slot data (server or local fallback). */
export function getStampState(
  slots: readonly (LoyaltyStampSlot | null | undefined)[]
): LoyaltyStampState {
  const valid = sanitizeSlots(slots);
  const stampedCount = valid.length;
  const isComplete = stampedCount >= LOYALTY_TOTAL_SLOTS;

  return {
    stampedCount,
    remaining: Math.max(LOYALTY_TOTAL_SLOTS - stampedCount, 0),
    isComplete,
    nextSlotIndex: isComplete ? -1 : stampedCount,
    latestStamp: stampedCount > 0 ? valid[stampedCount - 1] : null,
  };
}

/**
 * Local fallback (demo / offline mode): maps locally stored photo data URLs
 * onto stamp slots. Photos arrive oldest-first from storage.
 */
export function mapLocalPhotosToSlots(
  photos: readonly string[],
  now: Date = new Date()
): LoyaltyStampSlot[] {
  if (!Array.isArray(photos)) return [];

  return photos
    .filter((photo): photo is string => typeof photo === 'string' && photo.length > 0)
    .slice(-LOYALTY_TOTAL_SLOTS)
    .map((thumbnailUrl, index) => ({
      // Storage does not persist timestamps; approximate oldest-first order.
      takenAt: new Date(now.getTime() - (photos.length - index) * 86_400_000).toISOString(),
      thumbnailUrl,
    }));
}

/** Picks the best available image URL for a memory row (server shape). */
export function pickMemoryThumbnail(memory: {
  thumbnailUrl?: string | null;
  optimizedUrl?: string | null;
  originalUrl?: string | null;
}): string {
  return (
    memory.thumbnailUrl ||
    memory.optimizedUrl ||
    memory.originalUrl ||
    ''
  );
}

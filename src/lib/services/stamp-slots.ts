/**
 * Photo-per-slot mapping for the loyalty card.
 *
 * The loyalty card is bound to the customer's real memories: every filled
 * slot IS a photo, and tapping it opens that photo. Extraction accepts the
 * server shape (snake_case DB rows from /api/v1/loyalty/stamps) or the
 * already-normalized shape (LoyaltyStampSlot), so the client can reuse the
 * same logic for its offline/local fallback.
 */
import type { LoyaltyStampSlot } from '@/lib/services/loyalty-stamps';

/** One photo-bound stamp slot on the loyalty card. */
export type PhotoStampSlot = LoyaltyStampSlot;

interface ServerMemoryRow {
  original_url?: string | null;
  optimized_url?: string | null;
  thumbnail_url?: string | null;
  created_at?: string | null;
  status?: string | null;
}

interface ServerStampRow {
  takenAt?: string | null;
  taken_at?: string | null;
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
  originalUrl?: string | null;
  original_url?: string | null;
  optimizedUrl?: string | null;
  optimized_url?: string | null;
}

/** Picks the best available image URL for a memory row (server shape). */
export function pickMemoryThumbnail(memory: {
  thumbnailUrl?: string | null;
  optimizedUrl?: string | null;
  originalUrl?: string | null;
}): string {
  return memory.thumbnailUrl || memory.optimizedUrl || memory.originalUrl || '';
}

function pickRowThumbnail(row: ServerMemoryRow | ServerStampRow): string {
  if ('thumbnail_url' in row || 'created_at' in row) {
    const m = row as ServerMemoryRow;
    return pickMemoryThumbnail({
      thumbnailUrl: m.thumbnail_url,
      optimizedUrl: m.optimized_url,
      originalUrl: m.original_url,
    });
  }
  const s = row as ServerStampRow;
  return pickMemoryThumbnail({
    thumbnailUrl: s.thumbnailUrl ?? s.thumbnail_url,
    optimizedUrl: s.optimizedUrl ?? s.optimized_url,
    originalUrl: s.originalUrl ?? s.original_url,
  });
}

function pickRowTakenAt(row: ServerMemoryRow | ServerStampRow): string {
  const raw = ('created_at' in row ? (row as ServerMemoryRow).created_at : (row as ServerStampRow).takenAt ?? (row as ServerStampRow).taken_at) ?? '';
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

/**
 * Normalizes raw rows into ordered, safe photo slots: non-deleted rows only,
 * oldest-first, valid URLs, capped at totalSlots.
 */
export function extractStampSlots(
  rows: readonly (ServerMemoryRow | ServerStampRow | LoyaltyStampSlot)[],
  totalSlots: number
): LoyaltyStampSlot[] {
  const cap = Math.max(1, totalSlots);
  const safeRows = Array.isArray(rows) ? rows : [];
  return safeRows
    .map((row) => ({ thumbnailUrl: pickRowThumbnail(row), takenAt: pickRowTakenAt(row) }))
    .filter((slot) => slot.thumbnailUrl.length > 0 && slot.takenAt.length > 0)
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt))
    .slice(0, cap);
}

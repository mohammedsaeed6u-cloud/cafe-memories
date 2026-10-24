import { describe, it, expect } from 'vitest';
import { extractStampSlots } from '@/lib/services/stamp-slots';

describe('extractStampSlots (photo-per-slot extraction)', () => {
  it('normalizes server memory rows into oldest-first photo slots', () => {
    const rows = [
      { original_url: 'https://example.com/b.jpg', created_at: '2026-09-02T10:00:00Z', status: 'approved' },
      { thumbnail_url: 'https://example.com/a.jpg', created_at: '2026-09-01T10:00:00Z', status: 'approved' },
    ];
    const slots = extractStampSlots(rows, 5);
    expect(slots).toHaveLength(2);
    expect(slots[0].thumbnailUrl).toBe('https://example.com/a.jpg');
    expect(slots[1].thumbnailUrl).toBe('https://example.com/b.jpg');
  });

  it('falls back thumbnail -> optimized -> original per row', () => {
    const slots = extractStampSlots(
      [{ optimized_url: 'https://example.com/opt.jpg', created_at: '2026-09-01T10:00:00Z' }],
      5
    );
    expect(slots[0].thumbnailUrl).toBe('https://example.com/opt.jpg');
  });

  it('drops rows without a usable URL or timestamp and caps at totalSlots', () => {
    const rows = [
      { thumbnail_url: '', created_at: '2026-09-01T10:00:00Z' },
      { thumbnail_url: 'https://example.com/x.jpg', created_at: 'bogus-date' },
      { thumbnail_url: 'https://example.com/1.jpg', created_at: '2026-09-01T10:00:00Z' },
      { thumbnail_url: 'https://example.com/2.jpg', created_at: '2026-09-02T10:00:00Z' },
      { thumbnail_url: 'https://example.com/3.jpg', created_at: '2026-09-03T10:00:00Z' },
    ];
    const slots = extractStampSlots(rows, 2);
    expect(slots).toHaveLength(2);
    expect(slots[0].thumbnailUrl).toBe('https://example.com/1.jpg');
    expect(slots[1].thumbnailUrl).toBe('https://example.com/2.jpg');
  });

  it('accepts already-normalized slots and the normalized stamps shape', () => {
    const normalized = [
      { takenAt: '2026-09-01T10:00:00Z', thumbnailUrl: 'https://example.com/n1.jpg' },
    ];
    expect(extractStampSlots(normalized, 5)[0].thumbnailUrl).toBe('https://example.com/n1.jpg');

    const stampsShape = [
      { thumbnail_url: 'https://example.com/n2.jpg', taken_at: '2026-09-02T10:00:00Z' },
    ];
    expect(extractStampSlots(stampsShape, 5)[0].thumbnailUrl).toBe('https://example.com/n2.jpg');
  });

  it('guards against non-array input and clamps the cap', () => {
    expect(extractStampSlots(null as any, 5)).toEqual([]);
    expect(extractStampSlots(undefined as any, 5)).toEqual([]);
    expect(extractStampSlots('nope' as any, 5)).toEqual([]);
    const one = extractStampSlots(
      [{ thumbnail_url: 'https://example.com/only.jpg', created_at: '2026-09-01T10:00:00Z' }],
      0
    );
    expect(one).toHaveLength(1);
  });
});

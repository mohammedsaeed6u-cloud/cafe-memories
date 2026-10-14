import { describe, expect, it } from 'vitest';
import { keepsakePages } from '@/lib/keepsakes';

describe('print-ready photobooth sheets', () => {
  it('includes every stamp, even if its optional photo is missing', () => {
    const visits = Array.from({ length: 30 }, (_, index) => ({
      id: index, photo: index % 2 ? null : 'private-photo',
    }));
    const pages = keepsakePages(visits);
    expect(pages.map((page) => page.length)).toEqual([6, 6, 6, 6, 6]);
    expect(pages.flat()).toEqual(visits);
  });
  it('makes a second sheet instead of truncating the seventh visit', () => {
    expect(keepsakePages([1, 2, 3, 4, 5, 6, 7])).toEqual([[1, 2, 3, 4, 5, 6], [7]]);
    expect(keepsakePages([])).toEqual([]);
    expect(() => keepsakePages([1], 0)).toThrow(/Invalid page size/);
  });
});

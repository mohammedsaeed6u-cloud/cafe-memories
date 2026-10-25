import { describe, expect, it } from 'vitest';
import {
  DISCOVERY_AMENITY_IDS,
  DISCOVERY_CATEGORY_IDS,
  OPENING_TIME_PATTERN,
  formatOpeningHours,
  isValidOpeningWindow,
  type OpeningHours,
} from '@/lib/discovery';

describe('discovery vocabulary', () => {
  it('uses the category ids the public directory filters on', () => {
    expect(DISCOVERY_CATEGORY_IDS).toContain('cafe');
    expect(DISCOVERY_CATEGORY_IDS).toContain('restaurant');
    expect(new Set(DISCOVERY_CATEGORY_IDS).size).toBe(DISCOVERY_CATEGORY_IDS.length);
  });

  it('keeps amenity ids unique and stable', () => {
    expect(DISCOVERY_AMENITY_IDS).toContain('wifi');
    expect(new Set(DISCOVERY_AMENITY_IDS).size).toBe(DISCOVERY_AMENITY_IDS.length);
  });

  it('accepts only 24-hour HH:MM times', () => {
    expect(OPENING_TIME_PATTERN.test('09:30')).toBe(true);
    expect(OPENING_TIME_PATTERN.test('23:59')).toBe(true);
    expect(OPENING_TIME_PATTERN.test('24:00')).toBe(false);
    expect(OPENING_TIME_PATTERN.test('9:30')).toBe(false);
    expect(OPENING_TIME_PATTERN.test('09:60')).toBe(false);
  });

  it('validates an opening window, including past-midnight closing', () => {
    expect(isValidOpeningWindow({ open: '18:00', close: '02:00' })).toBe(true);
    expect(isValidOpeningWindow(null)).toBe(true);
    expect(isValidOpeningWindow({ open: '09:00', close: '09:00' })).toBe(false);
    expect(isValidOpeningWindow({ open: '9:00', close: '17:00' })).toBe(false);
    expect(isValidOpeningWindow({ open: '09:00' })).toBe(false);
    expect(isValidOpeningWindow('09:00-17:00')).toBe(false);
  });

  it('summarises daily and partial schedules', () => {
    const daily: OpeningHours = {};
    for (const day of ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const) {
      daily[day] = { open: '09:00', close: '23:00' };
    }
    expect(formatOpeningHours(daily)).toBe('09:00 – 23:00 يوميًا');

    expect(formatOpeningHours({ mon: { open: '10:00', close: '18:00' } })).toBe('الاثنين');
    expect(formatOpeningHours({})).toBeNull();
  });
});

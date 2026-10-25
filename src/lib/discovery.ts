/**
 * Shared vocabulary for the public discovery directory.
 *
 * These identifiers are stored in `organizations.category`,
 * `branches.amenities`, and `branches.opening_hours`, so they are a data
 * contract: the API validates against them and the dashboard renders them.
 * Keep this module free of server imports so client components can use it.
 */

export const DISCOVERY_CATEGORIES = [
  { id: 'cafe', label: 'كافيه' },
  { id: 'restaurant', label: 'مطعم' },
  { id: 'retail', label: 'متجر' },
  { id: 'salon', label: 'صالون' },
  { id: 'entertainment', label: 'ترفيه' },
  { id: 'events', label: 'فعاليات' },
  { id: 'general', label: 'أخرى' },
] as const;

export type DiscoveryCategory = (typeof DISCOVERY_CATEGORIES)[number]['id'];
export const DISCOVERY_CATEGORY_IDS = DISCOVERY_CATEGORIES.map((item) => item.id) as [
  DiscoveryCategory,
  ...DiscoveryCategory[],
];

export const DISCOVERY_AMENITIES = [
  { id: 'wifi', label: 'واي فاي' },
  { id: 'parking', label: 'مواقف' },
  { id: 'outdoor', label: 'جلسات خارجية' },
  { id: 'wheelchair', label: 'دخول كراسي متحركة' },
  { id: 'pets', label: 'يسمح بالحيوانات' },
  { id: 'kids', label: 'مناسب للأطفال' },
  { id: 'quiet', label: 'هادئ للعمل' },
  { id: 'charging', label: 'شحن أجهزة' },
] as const;

export type DiscoveryAmenity = (typeof DISCOVERY_AMENITIES)[number]['id'];
export const DISCOVERY_AMENITY_IDS = DISCOVERY_AMENITIES.map((item) => item.id) as [
  DiscoveryAmenity,
  ...DiscoveryAmenity[],
];

export const WEEKDAYS = [
  { id: 'sun', label: 'الأحد' },
  { id: 'mon', label: 'الاثنين' },
  { id: 'tue', label: 'الثلاثاء' },
  { id: 'wed', label: 'الأربعاء' },
  { id: 'thu', label: 'الخميس' },
  { id: 'fri', label: 'الجمعة' },
  { id: 'sat', label: 'السبت' },
] as const;

export type WeekdayId = (typeof WEEKDAYS)[number]['id'];
export const WEEKDAY_IDS = WEEKDAYS.map((item) => item.id) as [WeekdayId, ...WeekdayId[]];

export const OPENING_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export type OpeningHours = Partial<
  Record<WeekdayId, { open: string; close: string }>
>;

/** Patch shape accepted from the dashboard: a day may be explicitly closed. */
export type OpeningHoursPatch = Partial<
  Record<WeekdayId, { open: string; close: string } | null>
>;

/** "HH:MM" pairs where closing may be earlier than opening (past midnight). */
export function isValidOpeningWindow(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value !== 'object' || value === undefined) return false;
  const window = value as { open?: unknown; close?: unknown };
  return (
    typeof window.open === 'string' &&
    typeof window.close === 'string' &&
    OPENING_TIME_PATTERN.test(window.open) &&
    OPENING_TIME_PATTERN.test(window.close) &&
    window.open !== window.close
  );
}

/** Human summary used by the directory card. */
export function formatOpeningHours(hours: OpeningHours): string | null {
  const open = WEEKDAYS.filter((day) => hours[day.id]);
  if (open.length === 0) return null;
  if (open.length === 7) {
    const first = hours[open[0].id]!;
    return `${first.open} – ${first.close} يوميًا`;
  }
  return `${open.map((day) => day.label).join('، ')}`;
}

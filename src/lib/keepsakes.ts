import type { PublicBrand } from '@/lib/brand';

export type KeepsakeVisit = {
  id: string;
  branchName: string;
  verifiedAt: string;
  photo: { id: string; caption: string | null; imageUrl: string } | null;
};

export type KeepsakeSummary = {
  id: string;
  rewardName: string;
  threshold: number;
  unlockedAt: string;
  redeemedAt: string | null;
};

export type KeepsakeStory = {
  organizationName: string;
  brand: PublicBrand;
  eligibleVisits: KeepsakeVisit[];
  cards: KeepsakeSummary[];
  cardsTotal: number;
  card: (KeepsakeSummary & { visits: KeepsakeVisit[] }) | null;
};

/** One A6 photobooth print per six confirmed visits, with no photos omitted. */
export function keepsakePages<T>(visits: T[], pageSize = 6): T[][] {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('Invalid page size');
  return Array.from({ length: Math.ceil(visits.length / pageSize) }, (_, index) =>
    visits.slice(index * pageSize, (index + 1) * pageSize));
}

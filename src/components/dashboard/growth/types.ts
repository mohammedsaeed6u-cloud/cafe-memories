export interface InsightMetric {
  taps: number;
  visits: number;
  stamps: number;
  customers: number;
  newCustomers: number;
  returningCustomers: number;
  rewardsClaimed: number;
  returnRate: number;
}

export interface InsightSeriesPoint {
  date: string;
  taps: number;
  visits: number;
  customers: number;
}

export interface InsightPeakCell {
  dow: number;
  hour: number;
  count: number;
}

export interface InsightBranch {
  id: string;
  name: string;
  taps: number;
  visits: number;
  customers: number;
  rewardsClaimed: number;
}

export interface InsightTopCustomer {
  id: string;
  name: string;
  phone: string | null;
  stamps: number;
  visits: number;
  rewardsClaimed: number;
  lastVisitAt: string | null;
}

export interface Insights {
  periodDays: number;
  timezone: string;
  current: InsightMetric;
  previous: InsightMetric;
  series: InsightSeriesPoint[];
  peakHours: InsightPeakCell[];
  branches: InsightBranch[];
  topCustomers: InsightTopCustomer[];
}

export interface LadderTier {
  id: string;
  threshold: number;
  title: string;
  description: string | null;
  rewardKind: 'voucher' | 'card';
  voucherValidDays: number;
  isActive: boolean;
}

export interface Promotion {
  id: string;
  branchId: string | null;
  branchName: string | null;
  title: string;
  description: string | null;
  multiplier: number;
  startsAt: string;
  endsAt: string;
  daysOfWeek: number[] | null;
  startHour: number | null;
  endHour: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface NfcReader {
  id: string;
  label: string;
  publicId: string;
  status: string;
  branchId: string;
  branchName: string;
  lastTapAt: string | null;
  createdAt: string;
}

export interface NudgeCampaign {
  id: string;
  name: string;
  status: string;
  audience: string | null;
  message: string | null;
  createdAt: string;
  /** Mirrors `wallet_campaign_deliveries.status` (processing | sent | unknown). */
  sent: number;
  unknown: number;
  processing: number;
}

export interface GrowthBranch {
  id: string;
  name: string;
}

export interface DiscoveryOrganization {
  category: string | null;
  isDiscoverable: boolean;
  headStartStamps: number;
}

export interface DiscoveryBranch {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isDiscoverable: boolean;
  description: string | null;
  phone: string | null;
  openingHours: Partial<
    Record<'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat', { open: string; close: string }>
  >;
  amenities: string[];
}

export type GrowthSection =
  | 'insights'
  | 'ladder'
  | 'promotions'
  | 'nudges'
  | 'readers'
  | 'discovery';

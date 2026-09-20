export interface TenantFeatureFlags {
  printing: boolean;
  tvWall: boolean;
  storySharing: boolean;
  loyaltyCard: boolean;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  features: TenantFeatureFlags;
  dailyPhotos: number;
  totalCustomers: number;
  storageUsedMb: number;
  joinedAt: string;
}

export interface SystemTelemetry {
  totalUsersCapacity: string;
  activeTenantsCount: number;
  totalPhotosStored: number;
  storageUsedGb: number;
  edgeCacheHitRatio: string;
  activeCloudflarePops: number;
  globalLatencyMs: number;
  supabasePoolStatus: 'healthy' | 'degraded';
}

export interface LoyaltyRewardMilestone {
  stampsRequired: number;
  title: string;
  icon: string;
}

export interface LoyaltyCardData {
  totalStamps: number;
  currentStamps: number;
  milestones: LoyaltyRewardMilestone[];
}

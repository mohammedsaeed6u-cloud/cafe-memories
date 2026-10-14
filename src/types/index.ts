export * from './database';
export * from './photobooth';
export * from './loyalty-card';
export * from './staff';
export * from './subscription';
export * from './super-admin';

// Unified Domain Model
export interface Customer {
  id: string;
  displayName: string;
  totalVisits: number;
  lastSeenAt: string;
  memoriesCount: number;
  rewardsCount: number;
  role?: string;
  phone?: string;
  registeredAt?: string;
  photoStripUrl?: string;
}

export type { CustomerRecord } from '@/features/customers/types';

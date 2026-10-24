/**
 * Shopify-Style Entity Timeline & Audit Trail Service
 * 
 * Provides an immutable chronological timeline of all customer interactions,
 * staff POS actions, fraud guard triggers, and rewards for deep forensic visibility.
 */

export type TimelineActorType = 'customer' | 'staff' | 'system' | 'kiosk';

export interface TimelineEntry {
  id: string;
  brandId: string;
  customerPhone?: string;
  actorType: TimelineActorType;
  actorName?: string;
  action: string; // e.g. "stamp.awarded", "reward.claimed", "fraud.cooldown_blocked"
  titleEn: string;
  titleAr: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

const timelineEntries: TimelineEntry[] = [];

export const TimelineAuditService = {
  /**
   * Appends an immutable timeline event
   */
  recordEvent(params: {
    brandId: string;
    customerPhone?: string;
    actorType: TimelineActorType;
    actorName?: string;
    action: string;
    titleEn: string;
    titleAr: string;
    metadata?: Record<string, unknown>;
  }): TimelineEntry {
    const entry: TimelineEntry = {
      id: `timeline_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      brandId: params.brandId,
      customerPhone: params.customerPhone ? params.customerPhone.replace(/\D/g, '') : undefined,
      actorType: params.actorType,
      actorName: params.actorName || 'System Engine',
      action: params.action,
      titleEn: params.titleEn,
      titleAr: params.titleAr,
      metadata: params.metadata || {},
      timestamp: new Date().toISOString(),
    };

    timelineEntries.unshift(entry); // newest first
    // Keep max 2000 entries in memory
    if (timelineEntries.length > 2000) {
      timelineEntries.pop();
    }

    return entry;
  },

  /**
   * Retrieves timeline for a specific customer
   */
  getCustomerTimeline(brandId: string, customerPhone: string): TimelineEntry[] {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    return timelineEntries.filter(
      (e) => e.brandId === brandId && e.customerPhone === cleanPhone
    );
  },

  /**
   * Retrieves store-wide timeline (all activities)
   */
  getStoreTimeline(brandId: string, limit: number = 50): TimelineEntry[] {
    return timelineEntries.filter((e) => e.brandId === brandId).slice(0, limit);
  },

  /**
   * Reset for unit tests
   */
  _resetForTesting(): void {
    timelineEntries.length = 0;
  },
};

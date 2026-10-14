'use client';

import { reportIgnoredError } from './diagnostics';

export type OrchestratedEventType =
  | 'PHOTO_CASTED'
  | 'STAMP_AWARDED'
  | 'REWARD_CLAIMED'
  | 'SCREEN_COMMAND'
  | 'HAPPY_HOUR_TRIGGERED'
  | 'WALLET_PASS_UPDATED';

export interface PhotoCastedPayload {
  memoryId: string;
  customerName: string;
  photoUrl: string;
  caption?: string;
  tableNumber?: string | null;
  visitNumber: number;
  cafeSlug: string;
  timestamp: string;
  source: 'customer_mobile' | 'kiosk_ipad' | 'terminal_pos';
}

export interface StampAwardedPayload {
  customerPhone: string;
  customerName: string;
  cafeSlug: string;
  newStampCount: number;
  maxSlots: number;
  isCardComplete: boolean;
  rewardTitle?: string;
  staffPin?: string;
  timestamp: string;
  source: 'customer_action' | 'pos_tap' | 'kiosk_auto';
}

export interface RewardClaimedPayload {
  customerPhone: string;
  customerName: string;
  cafeSlug: string;
  rewardTitle: string;
  voucherCode: string;
  timestamp: string;
}

export interface ScreenCommandPayload {
  screenId: string;
  command: 'BLACKOUT' | 'UNPAIR' | 'SET_SPEED' | 'FORCE_REFRESH';
  payload?: any;
}

export interface HappyHourPayload {
  cafeSlug: string;
  multiplier: number;
  expiresAt: string;
}

export interface WalletPassUpdatedPayload {
  cafeSlug: string;
  customerPhone: string;
  stampedCount: number;
  maxSlots: number;
  pushMessage?: string;
}

export type EventPayloadMap = {
  PHOTO_CASTED: PhotoCastedPayload;
  STAMP_AWARDED: StampAwardedPayload;
  REWARD_CLAIMED: RewardClaimedPayload;
  SCREEN_COMMAND: ScreenCommandPayload;
  HAPPY_HOUR_TRIGGERED: HappyHourPayload;
  WALLET_PASS_UPDATED: WalletPassUpdatedPayload;
};

export type OrchestratedEvent<T extends OrchestratedEventType = OrchestratedEventType> = {
  id: string;
  type: T;
  payload: EventPayloadMap[T];
  timestamp: string;
  cafeSlug: string;
};

export type EventListener<T extends OrchestratedEventType> = (event: OrchestratedEvent<T>) => void;

/**
 * EventOrchestratorService:
 * The single authoritative Event Bus & State Orchestrator governing real-time
 * communication across Customer Mobile, 4K Live Wall Signage, Cashier POS, and Merchant Dashboard.
 */
export class EventOrchestratorService {
  private static readonly BROADCAST_CHANNEL_NAME = 'memories_orchestrator_bus';
  private static broadcastChannel: BroadcastChannel | null = null;
  private static listeners: Map<OrchestratedEventType, Set<EventListener<any>>> = new Map();
  private static memoryAuditLog: Map<string, OrchestratedEvent[]> = new Map();
  private static isInitialized = false;

  private static init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    try {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(this.BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (e) => {
          if (e.data && e.data.type && e.data.payload) {
            this.notifyLocalListeners(e.data);
          }
        };
      }
    } catch (e) {
      reportIgnoredError('orchestrator/init_broadcast', e);
    }

    // Storage event fallback for cross-tab sync in older contexts
    window.addEventListener('storage', (e) => {
      if (e.key === 'memories_orchestrator_latest' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.type && parsed.payload) {
            this.notifyLocalListeners(parsed);
          }
        } catch (err) {
          reportIgnoredError('orchestrator/storage_sync', err);
        }
      }
    });
  }

  /** Generates unique event tracking ID */
  public static createEventId(): string {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Dispatches an event across the entire system.
   */
  public static dispatch<T extends OrchestratedEventType>(
    type: T,
    payload: EventPayloadMap[T],
    cafeSlug: string
  ): OrchestratedEvent<T> {
    this.init();

    const event: OrchestratedEvent<T> = {
      id: this.createEventId(),
      type,
      payload,
      timestamp: new Date().toISOString(),
      cafeSlug,
    };

    // 1. Notify local in-memory listeners
    this.notifyLocalListeners(event);

    // 2. Broadcast to other tabs / windows (e.g. Wall screen or POS)
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(event);
      }
    } catch (e) {
      reportIgnoredError('orchestrator/broadcast_post', e);
    }

    // 3. In-memory audit trail update (works in both browser and headless environments)
    const memList = this.memoryAuditLog.get(cafeSlug) || [];
    this.memoryAuditLog.set(cafeSlug, [event, ...memList].slice(0, 20));

    // 4. Persist to storage bus for reactive listeners across tabs
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('memories_orchestrator_latest', JSON.stringify(event));
        // Keep a circular ring buffer of the last 20 events for forensic audit
        const key = 'memories_audit_log_' + cafeSlug;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = [event, ...existing].slice(0, 20);
        localStorage.setItem(key, JSON.stringify(updated));
      }
    } catch (e) {
      reportIgnoredError('orchestrator/storage_write', e);
    }

    return event;
  }

  /**
   * Subscribe to a specific event type. Returns an unsubscribe function.
   */
  public static subscribe<T extends OrchestratedEventType>(
    type: T,
    listener: EventListener<T>
  ): () => void {
    this.init();

    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    return () => {
      const set = this.listeners.get(type);
      if (set) {
        set.delete(listener);
      }
    };
  }

  private static notifyLocalListeners(event: OrchestratedEvent<any>) {
    const set = this.listeners.get(event.type);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(event);
        } catch (e) {
          reportIgnoredError('orchestrator/listener_exec', e);
        }
      });
    }
  }

  /** Forensic inspection: returns recent event audit trail */
  public static getRecentEvents(cafeSlug: string): OrchestratedEvent[] {
    if (typeof window !== 'undefined') {
      try {
        const key = 'memories_audit_log_' + cafeSlug;
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
      } catch {
        // fallback to memory
      }
    }
    return this.memoryAuditLog.get(cafeSlug) || [];
  }

  /** Testing helper to reset all in-memory listeners and audit logs */
  public static resetForTesting(): void {
    this.listeners.clear();
    this.memoryAuditLog.clear();
    this.isInitialized = false;
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
      this.broadcastChannel = null;
    }
  }
}

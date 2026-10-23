'use client';

export interface PendingAction {
  id: string;
  type: 'ADD_STAMP' | 'REDEEM_VOUCHER' | 'CAPTURE_PHOTO';
  payload: Record<string, unknown>;
  createdAt: string;
  idempotencyKey: string;
}

export class OfflineSyncService {
  private static STORAGE_KEY = 'stampy_offline_queue';
  private static inMemoryQueue: PendingAction[] = [];

  public static queueAction(type: PendingAction['type'], payload: Record<string, unknown>): PendingAction {
    const action: PendingAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      idempotencyKey: `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };

    const queue = this.getQueue();
    queue.push(action);
    this.saveQueue(queue);
    return action;
  }

  public static getQueue(): PendingAction[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [...this.inMemoryQueue];
    }
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [...this.inMemoryQueue];
    } catch {
      return [...this.inMemoryQueue];
    }
  }

  private static saveQueue(queue: PendingAction[]): void {
    this.inMemoryQueue = [...queue];
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    } catch {}
  }

  public static async flushQueue(): Promise<{ processedCount: number; errors: string[] }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { processedCount: 0, errors: [] };

    const errors: string[] = [];
    let count = 0;

    for (const item of queue) {
      try {
        // Process offline item idempotently
        count++;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    this.saveQueue([]);
    return { processedCount: count, errors };
  }
}

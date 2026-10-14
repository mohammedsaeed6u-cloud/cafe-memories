import { reportIgnoredError } from './diagnostics';
import { EventOrchestratorService } from './event-orchestrator.service';

export interface WallFeedItem {
  id: string;
  customerName: string;
  photoUrl: string;
  caption: string;
  timeFormatted: string;
  visitNumber: number;
  createdAt: string;
  visibility: string;
  status: string;
}

/**
 * Publishes a customer photo to the venue's live wall feed (localStorage +
 * BroadcastChannel so connected TV screens update instantly).
 * Extracted from CustomerClient's handleWallConsent.
 */
export class WallFeedService {
  /** Builds the tracked id used for wall items and other tracked records. */
  static createTrackedId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  static publishWallItem(cafeSlug: string, item: Omit<WallFeedItem, 'id'>): void {
    const wallItem: WallFeedItem = { id: this.createTrackedId('wall'), ...item };
    try {
      const existingFeed = JSON.parse(
        localStorage.getItem(`memories_wall_feed_${cafeSlug}`) || '[]'
      );
      const newFeed = [wallItem, ...existingFeed].slice(0, 20);
      localStorage.setItem(`memories_wall_feed_${cafeSlug}`, JSON.stringify(newFeed));
      localStorage.setItem('memories_wall_cache_screen-1', JSON.stringify(newFeed));
      window.dispatchEvent(new CustomEvent('memories-wall-updated', { detail: newFeed }));

      // Authoritative State Orchestrator Dispatch
      EventOrchestratorService.dispatch(
        'PHOTO_CASTED',
        {
          memoryId: wallItem.id,
          customerName: wallItem.customerName,
          photoUrl: wallItem.photoUrl,
          caption: wallItem.caption,
          visitNumber: wallItem.visitNumber,
          cafeSlug,
          timestamp: wallItem.createdAt,
          source: 'customer_mobile',
        },
        cafeSlug
      );

      try {
        const channel = new BroadcastChannel('memories_screens_channel');
        channel.postMessage({ type: 'WALL_NEW_PHOTO', item: wallItem, feed: newFeed });
        channel.close();
      } catch (e) {
        reportIgnoredError('wall/publish-broadcast', e);
      }
    } catch (e) {
      reportIgnoredError('wall/publish', e);
    }
  }
}


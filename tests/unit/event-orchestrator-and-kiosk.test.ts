// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventOrchestratorService } from '@/lib/services/event-orchestrator.service';

describe('EventOrchestratorService (System-Wide Real-Time State Bus)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('dispatches and subscribes to PHOTO_CASTED event', () => {
    const listener = vi.fn();
    const unsub = EventOrchestratorService.subscribe('PHOTO_CASTED', listener);

    const event = EventOrchestratorService.dispatch(
      'PHOTO_CASTED',
      {
        memoryId: 'mem-101',
        customerName: 'Sarah Al-Otaibi',
        photoUrl: 'https://example.com/photo.jpg',
        caption: 'Great coffee! ✨',
        visitNumber: 4,
        cafeSlug: 'brew-lab',
        timestamp: new Date().toISOString(),
        source: 'customer_mobile',
      },
      'brew-lab'
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(event);
    expect(event.type).toBe('PHOTO_CASTED');
    expect(event.payload.customerName).toBe('Sarah Al-Otaibi');

    unsub();
  });

  it('dispatches and subscribes to STAMP_AWARDED event', () => {
    const listener = vi.fn();
    const unsub = EventOrchestratorService.subscribe('STAMP_AWARDED', listener);

    const event = EventOrchestratorService.dispatch(
      'STAMP_AWARDED',
      {
        customerPhone: '+966500000000',
        customerName: 'Mohammed Saeed',
        cafeSlug: 'flagship',
        newStampCount: 8,
        maxSlots: 8,
        isCardComplete: true,
        rewardTitle: 'Free Specialty Coffee',
        timestamp: new Date().toISOString(),
        source: 'pos_tap',
      },
      'flagship'
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect(event.payload.isCardComplete).toBe(true);
    expect(event.payload.newStampCount).toBe(8);

    unsub();
  });

  it('records events in the forensic audit trail buffer', () => {
    EventOrchestratorService.dispatch(
      'SCREEN_COMMAND',
      {
        screenId: 'screen-1',
        command: 'BLACKOUT',
        payload: true,
      },
      'roastery'
    );

    const recent = EventOrchestratorService.getRecentEvents('roastery');
    expect(recent.length).toBeGreaterThan(0);
    expect(recent[0].type).toBe('SCREEN_COMMAND');
    expect(recent[0].payload.command).toBe('BLACKOUT');
  });

  it('unsubscribes listeners cleanly without leaking memory', () => {
    const listener = vi.fn();
    const unsub = EventOrchestratorService.subscribe('REWARD_CLAIMED', listener);

    unsub();

    EventOrchestratorService.dispatch(
      'REWARD_CLAIMED',
      {
        customerPhone: '+966511111111',
        customerName: 'Khaled',
        cafeSlug: 'specialty',
        rewardTitle: 'Free V60',
        voucherCode: 'VCH-999',
        timestamp: new Date().toISOString(),
      },
      'specialty'
    );

    expect(listener).not.toHaveBeenCalled();
  });
});

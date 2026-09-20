import { describe, it, expect } from 'vitest';
import { calculateRewardProgress, generateIdempotencyKey } from '@/lib/services/rewards';

describe('Loyalty Progression & Reward Calculation Engine', () => {
  const ruleId = 'rule_5_visits_free_coffee';
  const threshold = 5;

  it('reports unlocked=false and 2 visits until next reward when customer has 3 visits', () => {
    const progress = calculateRewardProgress({
      currentVisitCount: 3,
      threshold,
      rewardType: 'free_item',
      ruleId,
    });

    expect(progress.unlocked).toBe(false);
    expect(progress.visitsUntilNext).toBe(2);
    expect(progress.progressPercent).toBe(60);
    expect(progress.currentStreak).toBe(3);
  });

  it('reports unlocked=true and threshold reset when customer reaches exactly 5 visits', () => {
    const progress = calculateRewardProgress({
      currentVisitCount: 5,
      threshold,
      rewardType: 'free_item',
      ruleId,
    });

    expect(progress.unlocked).toBe(true);
    expect(progress.visitsUntilNext).toBe(5);
    expect(progress.progressPercent).toBe(0);
    expect(progress.currentStreak).toBe(5);
  });

  it('correctly handles multi-cycle visit thresholds (visit 10)', () => {
    const progress = calculateRewardProgress({
      currentVisitCount: 10,
      threshold,
      rewardType: 'free_item',
      ruleId,
    });

    expect(progress.unlocked).toBe(true);
    expect(progress.visitsUntilNext).toBe(5);
    expect(progress.currentStreak).toBe(10);
  });

  it('throws an error if threshold is zero or negative', () => {
    expect(() =>
      calculateRewardProgress({
        currentVisitCount: 1,
        threshold: 0,
        rewardType: 'free_item',
        ruleId,
      })
    ).toThrow('Threshold must be a positive integer');
  });

  it('generates unique idempotency keys with customer prefix and timestamp', () => {
    const key1 = generateIdempotencyKey('redeem', 'cust_123', 1);
    const key2 = generateIdempotencyKey('redeem', 'cust_123', 2);

    expect(key1).toContain('redeem_cust_123_1');
    expect(key2).toContain('redeem_cust_123_2');
    expect(key1).not.toBe(key2);
  });
});

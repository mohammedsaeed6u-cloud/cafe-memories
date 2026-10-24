import { describe, it, expect, beforeEach } from 'vitest';
import { TappyAccountingEngine } from '@/lib/services/tappy-accounting-engine.service';

describe('Tappy Accounting & Business Intelligence Engine', () => {
  beforeEach(() => {
    TappyAccountingEngine._resetForTesting();
  });

  describe('Multi-Branch Brand Ledger & Pooling', () => {
    it('pools stamps at the brand level across multiple different branches', () => {
      const phone = '01099887766';

      // Visit 1 at Zamalek branch (first visit gets 1 base + 1 headStart = 2)
      const res1 = TappyAccountingEngine.processTap({
        customerPhone: phone,
        customerName: 'Kareem T.',
        branchId: 'zamalek',
        brandId: 'stampy',
        isVerified: true,
        forceBypassCooldown: true,
      });

      expect(res1.success).toBe(true);
      expect(res1.stampsAwarded).toBe(2); // 1 + 1 head start
      expect(res1.newActiveStamps).toBe(2);

      // Visit 2 at Maadi branch
      const res2 = TappyAccountingEngine.processTap({
        customerPhone: phone,
        customerName: 'Kareem T.',
        branchId: 'maadi',
        brandId: 'stampy',
        isVerified: true,
        forceBypassCooldown: true,
      });

      expect(res2.success).toBe(true);
      expect(res2.stampsAwarded).toBe(1);
      expect(res2.newActiveStamps).toBe(3); // 2 + 1 = 3 across different branches!
    });
  });

  describe('Anti-Fraud Velocity & Token Verification', () => {
    it('rejects an unverified tap attempt that lacks hardware reader cryptographic token', () => {
      const res = TappyAccountingEngine.processTap({
        customerPhone: '01012345678',
        branchId: 'zamalek',
        brandId: 'stampy',
        isVerified: false, // FAKE or COPIED URL/READER PHOTO
      });

      expect(res.success).toBe(false);
      expect(res.rejectionReason).toBe('unverified_tap');
      expect(res.stampsAwarded).toBe(0);
    });

    it('enforces anti-fraud cooldown interval between taps for the same customer', () => {
      const phone = '01055551111';

      // First tap succeeds
      const tap1 = TappyAccountingEngine.processTap({
        customerPhone: phone,
        branchId: 'zamalek',
        brandId: 'stampy',
        isVerified: true,
      });
      expect(tap1.success).toBe(true);

      // Second tap immediately after fails due to cooldown
      const tap2 = TappyAccountingEngine.processTap({
        customerPhone: phone,
        branchId: 'zamalek',
        brandId: 'stampy',
        isVerified: true,
      });
      expect(tap2.success).toBe(false);
      expect(tap2.rejectionReason).toBe('cooldown_active');
    });

    it('enforces maximum daily stamps cap across all branches', () => {
      const phone = '01044442222';
      const now = Date.now();

      // Tap 1
      const tap1 = TappyAccountingEngine.processTap({
        customerPhone: phone,
        branchId: 'zamalek',
        isVerified: true,
        forceBypassCooldown: true,
        timestamp: new Date(now - 10 * 3600 * 1000).toISOString(),
      });
      expect(tap1.success).toBe(true);

      // Tap 2
      const tap2 = TappyAccountingEngine.processTap({
        customerPhone: phone,
        branchId: 'maadi',
        isVerified: true,
        forceBypassCooldown: true,
        timestamp: new Date(now - 5 * 3600 * 1000).toISOString(),
      });
      expect(tap2.success).toBe(true);

      // Tap 3 exceeds daily cap of 2 stamps per 24 hours
      const tap3 = TappyAccountingEngine.processTap({
        customerPhone: phone,
        branchId: 'new-cairo',
        isVerified: true,
        forceBypassCooldown: true,
        timestamp: new Date(now).toISOString(),
      });
      expect(tap3.success).toBe(false);
      expect(tap3.rejectionReason).toBe('daily_limit_exceeded');
    });
  });

  describe('Promotional Multipliers & Head-Start Bonus', () => {
    it('applies head-start bonus on the brand-new customer first visit only', () => {
      const phone = '01088880000';

      const visit1 = TappyAccountingEngine.processTap({
        customerPhone: phone,
        branchId: 'zamalek',
        isVerified: true,
      });
      expect(visit1.stampsAwarded).toBe(2); // 1 base + 1 head start

      const visit2 = TappyAccountingEngine.processTap({
        customerPhone: phone,
        branchId: 'zamalek',
        isVerified: true,
        forceBypassCooldown: true,
      });
      expect(visit2.stampsAwarded).toBe(1); // Regular 1 stamp
    });

    it('multiplies stamps during active x2 / x3 promotional campaigns', () => {
      // Register a x2 Happy Hour promotion
      TappyAccountingEngine.addPromotion({
        id: 'happy-hour-x2',
        name: 'Double Stamps Happy Hour',
        multiplier: 2,
        startDate: new Date(Date.now() - 3600000).toISOString(),
        endDate: new Date(Date.now() + 3600000).toISOString(),
      });

      const phone = '01033331111';

      // Repeat visitor during promo gets 1 * 2 = 2 stamps
      TappyAccountingEngine.processTap({
        customerPhone: phone,
        branchId: 'zamalek',
        isVerified: true,
        forceBypassCooldown: true,
      }); // first visit: (1+1)*2 = 4

      const visit2 = TappyAccountingEngine.processTap({
        customerPhone: phone,
        branchId: 'zamalek',
        isVerified: true,
        forceBypassCooldown: true,
      });

      expect(visit2.stampsAwarded).toBe(2); // 1 base * 2 multiplier = 2 stamps
    });
  });

  describe('Reward Milestone & Redemption Accounting', () => {
    it('unlocks reward at threshold and deducts balance upon cashier redemption', () => {
      const phone = '01077773333';
      TappyAccountingEngine.setBrandConfig({
        brandId: 'stampy',
        brandName: 'Test Cafe',
        requiredStamps: 4,
        headStartStamps: 0,
        cooldownMinutes: 0,
        maxStampsPerDay: 10,
        pricingTier: 'pro',
      });

      // Earn 4 stamps
      for (let i = 0; i < 4; i++) {
        TappyAccountingEngine.processTap({
          customerPhone: phone,
          branchId: 'zamalek',
          isVerified: true,
          forceBypassCooldown: true,
        });
      }

      const metrics = TappyAccountingEngine.getBrandConfig('stampy');
      expect(metrics.requiredStamps).toBe(4);

      // Redeem reward
      const redeem = TappyAccountingEngine.redeemReward('stampy', phone);
      expect(redeem.success).toBe(true);
      expect(redeem.remainingStamps).toBe(0);

      // Attempting to redeem again fails
      const redeemAgain = TappyAccountingEngine.redeemReward('stampy', phone);
      expect(redeemAgain.success).toBe(false);
    });
  });

  describe('Merchant Business Telemetry & Heatmap Calculations', () => {
    it('computes accurate return rate %, peak hours heatmap, and top customer leaderboard', () => {
      const metrics = TappyAccountingEngine.computeDashboardMetrics('stampy', 'week');

      expect(metrics.totalTaps).toBeGreaterThan(0);
      expect(metrics.returnRatePercent).toBeGreaterThan(0);
      expect(metrics.returnRatePercent).toBeLessThanOrEqual(100);

      // 7-day taps array
      expect(metrics.tapsOverTime).toHaveLength(7);
      expect(metrics.tapsOverTime[0]).toHaveProperty('day');
      expect(metrics.tapsOverTime[0]).toHaveProperty('count');

      // 7x6 Peak Hours Heatmap
      expect(metrics.peakHours).toHaveLength(7);
      expect(metrics.peakHours[0]).toHaveLength(6);

      // Branches comparison
      expect(metrics.branches.length).toBeGreaterThanOrEqual(2);
      expect(metrics.branches[0]).toHaveProperty('taps');
      expect(metrics.branches[0]).toHaveProperty('customers');

      // Top Customers Leaderboard
      expect(metrics.topCustomers.length).toBeGreaterThan(0);
      expect(metrics.topCustomers[0].rank).toBe(1);
      expect(metrics.topCustomers[0].badgeTier).toBe('gold');
      expect(metrics.topCustomers[1].badgeTier).toBe('silver');
      expect(metrics.topCustomers[2].badgeTier).toBe('bronze');
    });
  });
});

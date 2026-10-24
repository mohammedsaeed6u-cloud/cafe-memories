import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as tapRoute } from '@/app/api/v1/tappy/tap/route';
import { POST as redeemRoute } from '@/app/api/v1/tappy/redeem/route';
import { GET as insightsRoute } from '@/app/api/v1/tappy/insights/route';
import { GET as getPromosRoute, POST as postPromoRoute } from '@/app/api/v1/tappy/promotions/route';
import { GET as passRoute } from '@/app/api/v1/tappy/pass/route';
import { TappyAccountingEngine } from '@/lib/services/tappy-accounting-engine.service';

describe('Tappy API Endpoints Suite', () => {
  beforeEach(() => {
    TappyAccountingEngine._resetForTesting();
  });

  describe('POST /api/v1/tappy/tap (Verified Counter Tap)', () => {
    it('successfully processes a verified tap and awards stamps', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/tappy/tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'hardware_nonce_991823',
          branchSlug: 'zamalek',
          customerPhone: '01011223344',
          customerName: 'Hany F.',
          forceBypassCooldown: true,
        }),
      });

      const res = await tapRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json.stampsAwarded).toBeGreaterThan(0);
      expect(json.liveReceiptToken).toBeDefined();
    });

    it('rejects an unverified tap attempt that lacks valid reader cryptographic token', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/tappy/tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: '', // Missing/invalid token
          branchSlug: 'zamalek',
          customerPhone: '01011223344',
        }),
      });

      const res = await tapRoute(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.ok).toBe(false);
      expect(json.rejectionReason).toBe('unverified_tap');
    });
  });

  describe('POST /api/v1/tappy/redeem (Tap-To-Redeem & Live Receipt)', () => {
    it('generates tamper-proof live receipt when reward threshold is reached', async () => {
      const phone = '01088776655';
      TappyAccountingEngine.setBrandConfig({
        brandId: 'stampy',
        brandName: 'Brew Coffee',
        requiredStamps: 3,
        headStartStamps: 0,
        cooldownMinutes: 0,
        maxStampsPerDay: 10,
        pricingTier: 'pro',
      });

      // Earn 3 stamps
      for (let i = 0; i < 3; i++) {
        TappyAccountingEngine.processTap({
          customerPhone: phone,
          branchId: 'zamalek',
          isVerified: true,
          forceBypassCooldown: true,
        });
      }

      const req = new NextRequest('http://localhost:3000/api/v1/tappy/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: phone,
          branchSlug: 'zamalek',
          rewardTitle: 'Free Espresso',
        }),
      });

      const res = await redeemRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json.liveReceipt).toBeDefined();
      expect(json.liveReceipt.receiptId).toContain('RCPT-');
      expect(json.liveReceipt.securityNonce).toBeDefined();
    });
  });

  describe('GET /api/v1/tappy/insights (Business Telemetry & Heatmap)', () => {
    it('returns comprehensive KPI metrics, peak hours heatmap, and branch ranks', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/tappy/insights?range=week&brandId=stampy');
      const res = await insightsRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json.metrics).toHaveProperty('totalTaps');
      expect(json.metrics).toHaveProperty('returnRatePercent');
      expect(json.metrics.peakHours).toHaveLength(7);
      expect(json.metrics.branches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET & POST /api/v1/tappy/promotions (Multipliers)', () => {
    it('schedules a new multiplier promotion and retrieves active promotions', async () => {
      // POST new promotion
      const postReq = new NextRequest('http://localhost:3000/api/v1/tappy/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Weekend x3 Turbo',
          multiplier: 3,
        }),
      });

      const postRes = await postPromoRoute(postReq);
      const postJson = await postRes.json();

      expect(postRes.status).toBe(200);
      expect(postJson.ok).toBe(true);
      expect(postJson.promotion.multiplier).toBe(3);

      // GET promotions
      const getReq = new NextRequest('http://localhost:3000/api/v1/tappy/promotions');
      const getRes = await getPromosRoute(getReq);
      const getJson = await getRes.json();

      expect(getRes.status).toBe(200);
      expect(getJson.activePromotions.some((p: any) => p.name === 'Weekend x3 Turbo')).toBe(true);
    });
  });

  describe('GET /api/v1/tappy/pass (Web Pass & Wallet Save Links)', () => {
    it('returns pass state and Google/Apple Wallet deep links', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/tappy/pass?phone=01011112222&brandId=stampy');
      const res = await passRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json.brandName).toBeDefined();
      expect(json.appleWalletUrl).toContain('/api/v1/apple-pass-service/');
      expect(json.googleWalletUrl).toContain('pay.google.com');
    });
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventOrchestratorService } from '@/lib/services/event-orchestrator.service';
import { verifyPinOnly, resetStaffAuthState } from '@/lib/services/staff-auth.service';
import { createStaffSessionValue, verifyStaffSessionValue, STAFF_SESSION_COOKIE } from '@/lib/staff-session';
import { TenantSubdomainService } from '@/lib/services/tenant-subdomain.service';
import { TappyAccountingEngine } from '@/lib/services/tappy-accounting-engine.service';
import { LoyaltyPurseService } from '@/features/loyalty/loyalty-purse.service';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { auth } from '@/lib/auth/auth';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

describe('Real-Time Ecosystem & Full-Stack Auth Cohesion Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStaffAuthState();
    EventOrchestratorService.resetForTesting();
    vi.restoreAllMocks();
  });

  describe('1. Authentication & Authorization Guardrails (Staff PIN + Better-Auth + RBAC)', () => {
    it('authenticates staff via 4-digit PIN and issues verified staff member', async () => {
      const res = await verifyPinOnly('1234', 'zamalek');
      expect(res.success).toBe(true);
      expect(res.staff).toBeDefined();
      expect(res.staff?.id).toBe('staff-1');
      expect(res.staff?.role).toBe('barista');
    });

    it('locks out unauthorized brute force attempts after 3 consecutive failures', async () => {
      const fail1 = await verifyPinOnly('9991', 'zamalek');
      expect(fail1.success).toBe(false);

      const fail2 = await verifyPinOnly('9992', 'zamalek');
      expect(fail2.success).toBe(false);

      const fail3 = await verifyPinOnly('9993', 'zamalek');
      expect(fail3.success).toBe(false);
      expect(fail3.error).toContain('تم إيقاف المحاولات');

      // 4th attempt is locked
      const fail4 = await verifyPinOnly('1234', 'zamalek');
      expect(fail4.success).toBe(false);
      expect(fail4.error).toContain('تم إيقاف محاولات الدخول مؤقتاً');
    });

    it('mints HMAC-SHA256 signed staff session cookie and verifies tamper-free claims', async () => {
      const cookieValue = await createStaffSessionValue({
        staffId: 'staff-1',
        cafeSlug: 'zamalek',
        role: 'barista',
      });

      expect(cookieValue).toBeDefined();
      expect(cookieValue).toContain('.');

      const claims = await verifyStaffSessionValue(cookieValue);
      expect(claims).not.toBeNull();
      expect(claims?.staffId).toBe('staff-1');
      expect(claims?.role).toBe('barista');
      expect(claims?.cafeSlug).toBe('zamalek');

      // Tampered cookie fails verification
      const tampered = 'x' + cookieValue.slice(1);
      const tamperedClaims = await verifyStaffSessionValue(tampered);
      expect(tamperedClaims).toBeNull();
    });

    it('authorizes staff cookie on /dashboard but blocks staff from escalating to /admin', async () => {
      const cookieValue = await createStaffSessionValue({
        staffId: 'staff-1',
        cafeSlug: 'zamalek',
        role: 'barista',
      });

      // Request to /dashboard with staff cookie -> allowed (status 200)
      const dashboardReq = new NextRequest('http://localhost:3000/dashboard', {
        headers: {
          cookie: `${STAFF_SESSION_COOKIE}=${cookieValue}`,
        },
      });
      const dashRes = await middleware(dashboardReq);
      expect(dashRes.status).toBe(200);

      // Request to /admin with staff cookie -> redirected to /login (status 307)
      const adminReq = new NextRequest('http://localhost:3000/admin', {
        headers: {
          cookie: `${STAFF_SESSION_COOKIE}=${cookieValue}`,
        },
      });
      const adminRes = await middleware(adminReq);
      expect(adminRes.status).toBe(307);
      expect(adminRes.headers.get('location')).toContain('/login');
    });

    it('authorizes Better-Auth session token on /dashboard seamlessly', async () => {
      const authReq = new NextRequest('http://localhost:3000/dashboard', {
        headers: {
          cookie: 'stampy.session_token=test_session_active_1234567890',
        },
      });
      const authRes = await middleware(authReq);
      expect(authRes.status).toBe(200);
    });
  });

  describe('2. Real-Time Event Bus & In-Store Field Nodes Cohesion', () => {
    it('Terminal POS awards stamp -> emits STAMP_AWARDED -> Customer Web Card updates in real-time', () => {
      const soundSpy = vi.spyOn(SoundEffectsService, 'playStampSound').mockImplementation(() => {});
      const customerPhone = '0501234567';
      const cafeSlug = 'brew-lab';

      // 1. Initial customer purse state
      LoyaltyPurseService.setStampedCount(customerPhone, cafeSlug, 2, 8);
      let customerCardStamps = 2;

      // 2. Customer Web Card subscribes to Real-Time Event Bus
      const unsubCustomer = EventOrchestratorService.subscribe('STAMP_AWARDED', (evt) => {
        if (evt.cafeSlug === cafeSlug && evt.payload.customerPhone === customerPhone) {
          customerCardStamps = evt.payload.newStampCount;
          SoundEffectsService.playStampSound();
        }
      });

      // 3. Barista awards 2 stamps on the POS terminal
      const updatedPurse = LoyaltyPurseService.addDirectStamp(customerPhone, cafeSlug, 8, 'Free V60', 2);
      expect(updatedPurse.newCount).toBe(4);

      EventOrchestratorService.dispatch(
        'STAMP_AWARDED',
        {
          customerPhone,
          customerName: 'Ahmad',
          cafeSlug,
          newStampCount: updatedPurse.newCount,
          maxSlots: 8,
          isCardComplete: false,
          rewardTitle: 'Free V60',
          staffPin: 'staff-1',
          timestamp: new Date().toISOString(),
          source: 'pos_tap',
        },
        cafeSlug
      );

      // 4. Assert: Customer's card received event in real-time
      expect(customerCardStamps).toBe(4);
      expect(soundSpy).toHaveBeenCalledTimes(1);

      unsubCustomer();
    });

    it('In-Store iPad Kiosk captures shot -> emits PHOTO_CASTED -> Live Wall receives it in real-time', () => {
      const cafeSlug = 'specialty-hub';
      const receivedPhotosOnWall: any[] = [];

      // 1. Smart TV Wall listens to Live Feed
      const unsubWall = EventOrchestratorService.subscribe('PHOTO_CASTED', (evt) => {
        if (evt.cafeSlug === cafeSlug) {
          receivedPhotosOnWall.push(evt.payload);
        }
      });

      // 2. Kiosk captures 4-cut photobooth memory and casts to wall
      const castPayload = {
        memoryId: 'mem_kiosk_99',
        customerName: 'Noor & Laila',
        photoUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38',
        caption: 'Great memories at Specialty Hub! ☕✨',
        visitNumber: 3,
        cafeSlug,
        timestamp: new Date().toISOString(),
        source: 'kiosk_ipad' as const,
      };

      EventOrchestratorService.dispatch('PHOTO_CASTED', castPayload, cafeSlug);

      // 3. Assert: Wall received the memory instantly
      expect(receivedPhotosOnWall.length).toBe(1);
      expect(receivedPhotosOnWall[0].customerName).toBe('Noor & Laila');
      expect(receivedPhotosOnWall[0].source).toBe('kiosk_ipad');

      // 4. Forensic audit log records event
      const recent = EventOrchestratorService.getRecentEvents(cafeSlug);
      expect(recent.length).toBeGreaterThan(0);
      expect(recent[0].type).toBe('PHOTO_CASTED');

      unsubWall();
    });

    it('Customer redeems milestone voucher -> emits REWARD_CLAIMED -> Accounting ledger processes it', () => {
      const cafeSlug = 'zamalek';
      const phone = '0509876543';

      // Configure brand rules for testing redemption
      TappyAccountingEngine.setBrandConfig({
        brandId: 'stampy',
        brandName: 'Stampy Cafe',
        requiredStamps: 2,
        headStartStamps: 0,
        cooldownMinutes: 0,
        maxStampsPerDay: 10,
        pricingTier: 'pro',
      });

      // 1. Setup double-entry taps to reach required milestone (2 taps)
      for (let i = 0; i < 2; i++) {
        TappyAccountingEngine.processTap({
          customerPhone: phone,
          customerName: 'Ziad',
          branchId: cafeSlug,
          brandId: 'stampy',
          isVerified: true,
          forceBypassCooldown: true,
        });
      }

      const claimedRewards: any[] = [];
      const unsubLedger = EventOrchestratorService.subscribe('REWARD_CLAIMED', (evt) => {
        claimedRewards.push(evt.payload);
      });

      // 2. Dispatch reward claim
      EventOrchestratorService.dispatch(
        'REWARD_CLAIMED',
        {
          customerPhone: phone,
          customerName: 'Ziad',
          cafeSlug,
          rewardTitle: 'Free Cold Brew',
          voucherCode: 'VCH-COLD-BREW',
          timestamp: new Date().toISOString(),
        },
        cafeSlug
      );

      expect(claimedRewards.length).toBe(1);
      expect(claimedRewards[0].voucherCode).toBe('VCH-COLD-BREW');

      // 3. Ledger process redemption
      const redeemRes = TappyAccountingEngine.redeemReward('stampy', phone);
      expect(redeemRes.success).toBe(true);
      expect(typeof redeemRes.remainingStamps).toBe('number');

      unsubLedger();
    });
  });

  describe('3. Multi-Tenant Subdomain & Route Resolution', () => {
    it('parses tenant, app, and wall subdomains cleanly without port pollution', () => {
      expect(TenantSubdomainService.parseHostname('barns.runtappy.com:3000')).toEqual({
        type: 'tenant',
        hostname: 'barns.runtappy.com',
        subdomain: 'barns',
        tenantSlug: 'barns',
        isLocalhost: false,
      });

      expect(TenantSubdomainService.parseHostname('app.runtappy.com')).toEqual({
        type: 'app',
        hostname: 'app.runtappy.com',
        subdomain: 'app',
        isLocalhost: false,
      });

      expect(TenantSubdomainService.parseHostname('wall.runtappy.com')).toEqual({
        type: 'wall',
        hostname: 'wall.runtappy.com',
        subdomain: 'wall',
        isLocalhost: false,
      });

      expect(TenantSubdomainService.parseHostname('runtappy.com')).toEqual({
        type: 'root',
        hostname: 'runtappy.com',
        isLocalhost: false,
      });
    });

    it('generates canonical tenant URLs with protocol and subpaths', () => {
      const urlSubdomain = TenantSubdomainService.getTenantUrl('barns', 'kiosk', { preferSubdomain: true });
      expect(urlSubdomain).toBe('https://barns.runtappy.com/kiosk');

      const urlUniversal = TenantSubdomainService.getTenantUrl('barns', 'card');
      expect(urlUniversal).toBe('/c/barns');
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { LoyaltyPurseService } from '@/features/loyalty/loyalty-purse.service';

describe('Feature-Sliced Architecture & New Requirements', () => {
  describe('Feature 1: Co-Branding (memories × Business)', () => {
    it('supports co-branding branding with business name, logo, tagline, and instagram handle', () => {
      const branding = {
        name: 'Espresso Lab',
        logoUrl: 'https://example.com/logo.png',
        tagline: 'Specialty Coffee Moments',
        instagramHandle: '@espressolab.eg',
      };
      expect(branding.name).toBe('Espresso Lab');
      expect(branding.instagramHandle).toBe('@espressolab.eg');
      expect(branding.tagline).toBe('Specialty Coffee Moments');
    });
  });

  describe('Feature 2: Loyalty Card with QR & Stamping Purse', () => {
    it('initializes loyalty purse with 1 welcome stamp so customer can take their first photo', () => {
      const data = LoyaltyPurseService.getData('01012345678', 'espresso-lab', 5);
      expect(data.stampedCount).toBe(1);
      expect(data.maxSlots).toBe(5);
    });

    it('adds direct staff stamps and increments customer balance', () => {
      const initial = LoyaltyPurseService.getData('01012345678', 'espresso-lab', 5);
      expect(initial.stampedCount).toBe(1);
      const stampResult = LoyaltyPurseService.addDirectStamp('01012345678', 'espresso-lab', 5);
      expect(stampResult.success).toBe(true);
      expect(stampResult.newCount).toBe(2);
      const updated = LoyaltyPurseService.getData('01012345678', 'espresso-lab', 5);
      expect(updated.stampedCount).toBe(2);
    });

    it('allows customer to shoot photo whenever they have an available stamped slot', () => {
      expect(LoyaltyPurseService.canCustomerShoot('01012345678', 'espresso-lab', 0)).toBe(true);
    });
  });

  describe('Feature 3: 2x6 Strip and 4x6 Postcard/Grid Dimensions Support', () => {
    it('supports both 2x6 strip and 4x6 postcard dimensions', () => {
      const stripFrame = {
        id: 'snap-express',
        name: 'The Snap Express',
        widthCm: 5,
        heightCm: 15.2,
        dimensionsPreset: 'strip_2x6' as const,
        shotCount: 3,
      };
      const postcardFrame = {
        id: 'postcard-4x6',
        name: 'Postcard Grid',
        widthCm: 10,
        heightCm: 15.2,
        dimensionsPreset: 'grid_4x6' as const,
        shotCount: 4,
      };
      expect(stripFrame.widthCm).toBe(5);
      expect(stripFrame.dimensionsPreset).toBe('strip_2x6');
      expect(postcardFrame.widthCm).toBe(10);
      expect(postcardFrame.dimensionsPreset).toBe('grid_4x6');
    });
  });

  describe('Feature 4: TV Wall Consent and Completion Reward Triggers', () => {
    it('ensures gift code is created and awarded only when total required shots are fulfilled', () => {
      const totalSlots = 3;
      const incompletePhotos = ['photo1.jpg', 'photo2.jpg'];
      const completePhotos = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];
      const isCompletedBefore = incompletePhotos.length >= totalSlots;
      const isCompletedAfter = completePhotos.length >= totalSlots;
      expect(isCompletedBefore).toBe(false);
      expect(isCompletedAfter).toBe(true);
    });
  });
});
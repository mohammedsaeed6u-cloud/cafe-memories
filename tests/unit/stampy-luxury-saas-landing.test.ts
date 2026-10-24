import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

describe('Stampy Luxury SaaS Brand & Landing Page Architecture', () => {
  const ROOT = path.resolve(__dirname, '../..');
  const readSrc = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

  it('MarketingHero follows luxury Stampy identity with iPhone 16 Pro simulator and zero craft elements', () => {
    const hero = readSrc('src/features/marketing/components/MarketingHero.tsx');
    expect(hero).toContain('STAMPY • WALLET & LOYALTY SAAS');
    expect(hero).toContain('مثل شوبيفاي لمحافظ Apple & Google');
    expect(hero).toContain('Apple Wallet');
    expect(hero).toContain('/login?tab=signup');
    expect(hero).toContain('/login?tab=signin');
    expect(hero).toContain('/c/stampy');

    // Zero scrapbook or craft atelier relics
    expect(hero).not.toContain('cutting-mat-grid');
    expect(hero).not.toContain('push-pin');
    expect(hero).not.toContain('washi-tape');
    expect(hero).not.toContain('diecut-sticker');
    expect(hero).not.toContain('Seoul 4-Cuts // 35MM');
  });

  it('MarketingVisualSteps defines 4 modern SaaS steps without pins or tape', () => {
    const steps = readSrc('src/features/marketing/components/MarketingVisualSteps.tsx');
    expect(steps).toContain('THE SAAS JOURNEY');
    expect(steps).toContain('مسح QR الطاولة السريع');
    expect(steps).toContain('Apple & Google Wallet');
    expect(steps).toContain('ختم الكاونتر وربط الذكرى');
    expect(steps).toContain('APNs Push Notifications');

    expect(steps).not.toContain('push-pin');
    expect(steps).not.toContain('washi-tape');
  });

  it('MarketingRetentionLoop highlights 6 modern cloud SaaS pillars', () => {
    const loop = readSrc('src/features/marketing/components/MarketingRetentionLoop.tsx');
    expect(loop).toContain('OPERATIONAL EXCELLENCE');
    expect(loop).toContain('NATIVE WALLET');
    expect(loop).toContain('4K LIVE WALL');
    expect(loop).toContain('APNs PUSH');
    expect(loop).toContain('ROI ANALYTICS');

    expect(loop).not.toContain('push-pin');
    expect(loop).not.toContain('washi-tape');
  });

  it('MarketingPricing provides pure SaaS tiers with zero device selling claims', () => {
    const pricing = readSrc('src/features/marketing/components/MarketingPricing.tsx');
    expect(pricing).toContain('Cloud Starter');
    expect(pricing).toContain('199');
    expect(pricing).toContain('Growth & Loyalty');
    expect(pricing).toContain('390');
    expect(pricing).toContain('Enterprise Chains');

    expect(pricing).not.toContain('push-pin');
    expect(pricing).not.toContain('washi-tape');
    expect(pricing).not.toContain('استلم جهازك');
    expect(pricing).not.toContain('شراء كابينة');
  });

  it('StampyRoiCalculator exists and is embedded into page.tsx', () => {
    expect(existsSync(path.join(ROOT, 'src/features/marketing/components/StampyRoiCalculator.tsx'))).toBe(true);
    const page = readSrc('src/app/page.tsx');
    expect(page).toContain('StampyRoiCalculator');
    expect(page).not.toContain('scrapbook-bg');
  });
});

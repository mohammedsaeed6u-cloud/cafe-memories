import { describe, it, expect } from 'vitest';
import { TenantSubdomainService } from '@/lib/services/tenant-subdomain.service';

describe('TenantSubdomainService (Vercel Platforms & Dub.co Open-Source Standard)', () => {
  describe('Root Domain & Localhost Resolution', () => {
    it('identifies apex runtappy.com as root', () => {
      const parsed = TenantSubdomainService.parseHostname('runtappy.com');
      expect(parsed.type).toBe('root');
      expect(parsed.isLocalhost).toBe(false);
    });

    it('identifies www.runtappy.com as root', () => {
      const parsed = TenantSubdomainService.parseHostname('www.runtappy.com');
      expect(parsed.type).toBe('root');
    });

    it('identifies localhost and localhost with port as root', () => {
      const p1 = TenantSubdomainService.parseHostname('localhost');
      expect(p1.type).toBe('root');
      expect(p1.isLocalhost).toBe(true);

      const p2 = TenantSubdomainService.parseHostname('localhost:3000');
      expect(p2.type).toBe('root');
      expect(p2.isLocalhost).toBe(true);
    });

    it('identifies Cloudflare Pages domain as root', () => {
      const parsed = TenantSubdomainService.parseHostname('memories-c9w.pages.dev');
      expect(parsed.type).toBe('root');
    });
  });

  describe('App & Wall Subdomains Resolution', () => {
    it('identifies app and dashboard subdomains', () => {
      const p1 = TenantSubdomainService.parseHostname('app.runtappy.com');
      expect(p1.type).toBe('app');
      expect(p1.subdomain).toBe('app');

      const p2 = TenantSubdomainService.parseHostname('dashboard.runtappy.com');
      expect(p2.type).toBe('app');
      expect(p2.subdomain).toBe('dashboard');

      const p3 = TenantSubdomainService.parseHostname('app.localhost:3000');
      expect(p3.type).toBe('app');
      expect(p3.isLocalhost).toBe(true);
    });

    it('identifies wall live signage subdomain', () => {
      const p1 = TenantSubdomainService.parseHostname('wall.runtappy.com');
      expect(p1.type).toBe('wall');
      expect(p1.subdomain).toBe('wall');

      const p2 = TenantSubdomainService.parseHostname('wall.localhost:3000');
      expect(p2.type).toBe('wall');
      expect(p2.isLocalhost).toBe(true);
    });
  });

  describe('Tenant Subdomains Resolution', () => {
    it('correctly extracts tenant slug from production subdomain', () => {
      const p1 = TenantSubdomainService.parseHostname('barns.runtappy.com');
      expect(p1.type).toBe('tenant');
      expect(p1.tenantSlug).toBe('barns');

      const p2 = TenantSubdomainService.parseHostname('espresso-lab.runtappy.com');
      expect(p2.type).toBe('tenant');
      expect(p2.tenantSlug).toBe('espresso-lab');
    });

    it('correctly extracts tenant slug from local development subdomain with port', () => {
      const parsed = TenantSubdomainService.parseHostname('soil-roastery.localhost:3000');
      expect(parsed.type).toBe('tenant');
      expect(parsed.tenantSlug).toBe('soil-roastery');
      expect(parsed.isLocalhost).toBe(true);
    });

    it('filters reserved infrastructure subdomains from becoming tenant slugs', () => {
      expect(TenantSubdomainService.extractTenantSlug('api.runtappy.com')).toBeNull();
      expect(TenantSubdomainService.extractTenantSlug('admin.runtappy.com')).toBeNull();
      expect(TenantSubdomainService.extractTenantSlug('app.runtappy.com')).toBeNull();
      expect(TenantSubdomainService.extractTenantSlug('wall.runtappy.com')).toBeNull();
      expect(TenantSubdomainService.extractTenantSlug('www.runtappy.com')).toBeNull();
    });

    it('extracts tenant slug reliably via extractTenantSlug', () => {
      expect(TenantSubdomainService.extractTenantSlug('arabica.runtappy.com')).toBe('arabica');
      expect(TenantSubdomainService.extractTenantSlug('arabica.localhost:3000')).toBe('arabica');
      expect(TenantSubdomainService.extractTenantSlug('runtappy.com')).toBeNull();
      expect(TenantSubdomainService.extractTenantSlug(null)).toBeNull();
    });
  });

  describe('URL Generation with Backward Compatibility', () => {
    it('generates standard universal paths by default', () => {
      expect(TenantSubdomainService.getTenantUrl('barns', 'card')).toBe('/c/barns');
      expect(TenantSubdomainService.getTenantUrl('barns', 'kiosk')).toBe('/kiosk/barns');
      expect(TenantSubdomainService.getTenantUrl('barns', 'wall', { screenId: 'screen-101' })).toBe(
        '/wall/screen-101?cafe=barns'
      );
    });

    it('generates subdomain URLs when preferSubdomain is true', () => {
      const url = TenantSubdomainService.getTenantUrl('barns', 'card', { preferSubdomain: true });
      expect(url).toContain('barns.runtappy.com');

      const kioskUrl = TenantSubdomainService.getTenantUrl('barns', 'kiosk', { preferSubdomain: true });
      expect(kioskUrl).toBe('https://barns.runtappy.com/kiosk');
    });
  });
});

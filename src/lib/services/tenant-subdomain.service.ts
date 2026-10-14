/**
 * TenantSubdomainService
 * 
 * Enterprise Multi-Tenant Subdomain & Custom Domain resolution engine
 * inspired by the open-source Vercel Platforms Starter Kit (vercel/platforms)
 * and Dub.co (dubinc/dub).
 *
 * Handles:
 * 1. Root domain resolution (runtappy.com, localhost, pages.dev)
 * 2. Subdomain extraction (barns.runtappy.com -> 'barns')
 * 3. Reserved subdomains filtering (app, dashboard, wall, api, www)
 * 4. Safe URL generation with backward compatibility fallbacks
 */

export type DomainType = 'root' | 'app' | 'wall' | 'tenant' | 'custom_domain';

export interface ParsedHost {
  type: DomainType;
  hostname: string;
  subdomain?: string;
  tenantSlug?: string;
  isLocalhost: boolean;
}

export class TenantSubdomainService {
  /** Reserved subdomains that belong to platform infrastructure */
  public static readonly RESERVED_SUBDOMAINS = new Set([
    'www',
    'api',
    'admin',
    'auth',
    'app',
    'dashboard',
    'wall',
    'kiosk',
    'terminal',
    'assets',
    'static',
    'cdn',
    'mail',
    'support',
    'docs',
  ]);

  /**
   * Resolves the configured root domain from environment variables
   * or falls back to sensible defaults.
   */
  public static getRootDomain(): string {
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ROOT_DOMAIN) {
      return process.env.NEXT_PUBLIC_ROOT_DOMAIN.toLowerCase().trim();
    }
    // Production / Staging defaults
    return 'runtappy.com';
  }

  /**
   * Strips port number from hostname (e.g. "barns.localhost:3000" -> "barns.localhost")
   */
  public static cleanHostname(host?: string | null): string {
    if (!host) return '';
    return host.split(':')[0].toLowerCase().trim();
  }

  /**
   * Parses incoming request Host header into structured domain classification.
   */
  public static parseHostname(rawHost?: string | null): ParsedHost {
    const hostname = this.cleanHostname(rawHost);

    if (!hostname) {
      return {
        type: 'root',
        hostname: '',
        isLocalhost: false,
      };
    }

    const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost');
    const rootDomain = this.getRootDomain();

    // 1. Plain Localhost or Apex Root Domain
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === rootDomain ||
      hostname === `www.${rootDomain}` ||
      hostname === 'memories-c9w.pages.dev'
    ) {
      return {
        type: 'root',
        hostname,
        isLocalhost,
      };
    }

    // 2. Localhost Subdomains (e.g. "barns.localhost", "app.localhost")
    if (isLocalhost) {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        const sub = parts[0];
        if (sub === 'app' || sub === 'dashboard') {
          return { type: 'app', hostname, subdomain: sub, isLocalhost: true };
        }
        if (sub === 'wall') {
          return { type: 'wall', hostname, subdomain: sub, isLocalhost: true };
        }
        if (!this.RESERVED_SUBDOMAINS.has(sub)) {
          return { type: 'tenant', hostname, subdomain: sub, tenantSlug: sub, isLocalhost: true };
        }
      }
      return { type: 'root', hostname, isLocalhost: true };
    }

    // 3. Platform Subdomains on Root Domain (e.g. "barns.stampy.sa" or "barns.runtappy.com")
    const matchedDomain = hostname.endsWith('.stampy.sa') ? 'stampy.sa' : (hostname.endsWith(`.${rootDomain}`) ? rootDomain : null);
    if (matchedDomain) {
      const sub = hostname.replace(`.${matchedDomain}`, '');
      if (sub === 'app' || sub === 'dashboard') {
        return { type: 'app', hostname, subdomain: sub, isLocalhost: false };
      }
      if (sub === 'wall') {
        return { type: 'wall', hostname, subdomain: sub, isLocalhost: false };
      }
      if (!this.RESERVED_SUBDOMAINS.has(sub)) {
        return { type: 'tenant', hostname, subdomain: sub, tenantSlug: sub, isLocalhost: false };
      }
      return { type: 'root', hostname, subdomain: sub, isLocalhost: false };
    }

    // 4. Cloudflare Pages previews (e.g. "[hash].memories-c9w.pages.dev")
    if (hostname.endsWith('.pages.dev')) {
      return {
        type: 'root',
        hostname,
        isLocalhost: false,
      };
    }

    // 5. Custom Domain (e.g. "loyalty.barnscafe.com")
    // When a tenant attaches their own CNAME custom domain
    return {
      type: 'custom_domain',
      hostname,
      isLocalhost: false,
    };
  }

  /**
   * Helper to quickly extract tenant slug from hostname if present.
   */
  public static extractTenantSlug(rawHost?: string | null): string | null {
    const parsed = this.parseHostname(rawHost);
    if (parsed.type === 'tenant' && parsed.tenantSlug) {
      return parsed.tenantSlug;
    }
    return null;
  }

  /**
   * Builds the canonical customer experience URL for a given tenant.
   * If running in an environment where subdomains are enabled, returns subdomain URL.
   * Otherwise returns clean path URL (/c/[cafeSlug]).
   */
  public static getTenantUrl(
    cafeSlug: string,
    target: 'card' | 'kiosk' | 'wall' = 'card',
    options?: { screenId?: string; preferSubdomain?: boolean }
  ): string {
    const cleanSlug = encodeURIComponent(cafeSlug.trim().toLowerCase());
    const preferSubdomain = options?.preferSubdomain ?? false;

    if (preferSubdomain) {
      const root = this.getRootDomain();
      const protocol = root.includes('localhost') ? 'http' : 'https';
      const baseSubdomain = `${protocol}://${cleanSlug}.${root}`;

      if (target === 'kiosk') return `${baseSubdomain}/kiosk`;
      if (target === 'wall') return `${baseSubdomain}/wall/${options?.screenId || 'screen-1'}`;
      return baseSubdomain;
    }

    // Default universal path format (compatible across all hosts including static export)
    if (target === 'kiosk') return `/kiosk/${cleanSlug}`;
    if (target === 'wall') return `/wall/${options?.screenId || 'screen-1'}?cafe=${cleanSlug}`;
    return `/c/${cleanSlug}`;
  }
}

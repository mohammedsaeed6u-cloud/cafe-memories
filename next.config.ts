import type { NextConfig } from 'next';

/**
 * One deployment target: Cloudflare Workers through OpenNext.
 *
 * The previous STATIC_EXPORT branch deleted src/app/api before building, so the
 * deployed site had no API at all while every page called /api/v1/*. It is gone.
 * Security headers are declared here as well as in proxy.ts so they survive
 * platforms that bypass the proxy for static assets.
 */

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://api.dicebear.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.walletwallet.dev https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com',
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' blob: https://*.supabase.co",
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Next declares sharp as an optional dependency, but it is a native module
  // that cannot run in a Worker (and its binaries break OpenNext's esbuild
  // step). Keep it out of the standalone trace; services/images.ts is pure JS.
  outputFileTracingExcludes: {
    '/*': [
      '**/node_modules/sharp/**',
      '**/node_modules/sharp-*/**',
      '**/node_modules/@img/**',
      '**/node_modules/.pnpm/sharp@*/**',
      '**/node_modules/.pnpm/@img+*/**',
    ],
  },
  // No server-side image codecs: Workers cannot load native modules, and the
  // browser already encodes the composed strip. See services/images.ts.
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
        ],
      },
    ];
  },
};

export default nextConfig;

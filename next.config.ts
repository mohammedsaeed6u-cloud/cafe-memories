import type { NextConfig } from 'next';

/**
 * One deployment target: Cloudflare Workers through OpenNext.
 *
 * The previous STATIC_EXPORT branch deleted src/app/api before building, so the
 * deployed site had no API at all while every page called /api/v1/*. It is gone.
 * Security headers are declared here and in public/_headers. There is no
 * proxy.ts: Next 16 proxies always run on Node, and OpenNext would ship a
 * second Next runtime (plus @vercel/og wasm) to the Worker, which does not fit
 * the free plan. Page authorization happens in server components instead.
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
      // `next/og` ships 1.4 MB of resvg/yoga wasm. This app has no
      // opengraph-image or ImageResponse route, so it is dead weight in the
      // Worker (and the free plan has no room for it).
      '**/node_modules/next/dist/compiled/@vercel/og/**',
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
  /**
   * OAuth providers may land on `/` or `/login` with `?code=`. Proxy used to
   * forward that to the PKCE handler; a config redirect does the same job with
   * no Worker runtime cost (Next 16 proxies always run on Node, which would
   * ship a second Next runtime to the edge).
   */
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'query', key: 'code' }],
        destination: '/auth/callback',
        permanent: false,
      },
      {
        source: '/login',
        has: [{ type: 'query', key: 'code' }],
        destination: '/auth/callback',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

// Server mode by default so API routes (capture, loyalty, CRM) actually run.
// Static export is opt-in for Cloudflare Pages: STATIC_EXPORT=1 pnpm build
// (API routes + middleware are excluded from that mode by Next itself).
const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === '1'
    ? {
        output: 'export' as const,
        typescript: { ignoreBuildErrors: true },
      }
    : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://images.unsplash.com https://api.dicebear.com https://api.qrserver.com https://*.supabase.co https://api.walletwallet.dev https://*.walletwallet.dev https://*.cloudflare.com https://*.cloudflareinsights.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.walletwallet.dev https://*.walletwallet.dev https://cloudflareinsights.com https://api.dicebear.com https://images.unsplash.com",
              "media-src 'self' blob: data:",
              "worker-src 'self' blob:",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

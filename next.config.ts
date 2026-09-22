import type { NextConfig } from "next";

// Server mode by default so API routes (capture, loyalty, CRM) actually run.
// Static export is opt-in for Cloudflare Pages: STATIC_EXPORT=1 pnpm build
// (API routes + middleware are excluded from that mode by Next itself).
const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === '1' ? { output: 'export' as const } : {}),
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
};

export default nextConfig;

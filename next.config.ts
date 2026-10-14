import type { NextConfig } from 'next';

// APIs, authentication and private media require a server deployment.
// Static export is intentionally unsupported; never ship a UI without its security boundary.
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
};

export default nextConfig;

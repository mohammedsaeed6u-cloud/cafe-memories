import type { NextConfig } from "next";

// APIs, authentication and private media require a server deployment.
// Static export is intentionally unsupported; never ship a UI without its security boundary.
const nextConfig: NextConfig = {
  // Allow the Arena HTTPS preview host (and local browser QA) to load dev-only assets.
  allowedDevOrigins: ["*.e2b.app", "127.0.0.1"],
  images: { unoptimized: true }, // Local marketing asset; private photos use an authenticated media route.
};

export default nextConfig;

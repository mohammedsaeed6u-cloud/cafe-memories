import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.includes('YOUR_DEPLOYED_DOMAIN')
    ? undefined : process.env.NEXT_PUBLIC_SITE_URL;
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/privacy', '/terms'],
      disallow: ['/api/', '/auth/', '/admin', '/dashboard', '/terminal', '/barista', '/login', '/c/', '/wall'],
    },
    ...(siteUrl?.startsWith('https://') ? { sitemap: new URL('/sitemap.xml', siteUrl).toString() } : {}),
  };
}

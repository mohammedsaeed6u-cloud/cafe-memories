import type { MetadataRoute } from 'next';

/** Index only public static pages; customer and display URLs are private/dynamic. */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.includes('YOUR_DEPLOYED_DOMAIN')
    ? undefined : process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl?.startsWith('https://')) return [];
  return ['/', '/privacy', '/terms'].map((path) => ({ url: new URL(path, siteUrl).toString() }));
}

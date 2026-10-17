import type { MetadataRoute } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/site';

// Search engines and AI search crawlers are welcome on public pages. Signed-in and utility pages are not
// blocked here but carry a noindex tag (lib/site.ts PRIVATE_PAGE): a blocked page's noindex is never read.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}

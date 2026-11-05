import type { MetadataRoute } from 'next';
import { absoluteUrl, SEARCH_INDEXING_ON, SITE_URL } from '@/lib/site';

/** AI crawlers that say they honour robots.txt. Link previews (LINE, Facebook) are not on this list, so sharing keeps working. */
const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider', 'Amazonbot', 'meta-externalagent', 'cohere-ai'];

// Search engines and AI search crawlers are welcome on public pages. Signed-in and utility pages are not
// blocked here but carry a noindex tag (lib/site.ts PRIVATE_PAGE): a blocked page's noindex is never read.
export default function robots(): MetadataRoute.Robots {
  if (!SEARCH_INDEXING_ON) {
    // Search engines may still fetch pages, or they could not read the noindex header that keeps them out of results
    return { rules: [{ userAgent: AI_CRAWLERS, disallow: '/' }, { userAgent: '*', allow: '/', disallow: ['/api/', '/admin'] }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}

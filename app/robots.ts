import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin'],
      },
      {
        // Explicit allowance for AI Search & LLM Engines
        userAgent: [
          'Googlebot',
          'Google-Extended',
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'anthropic-ai',
          'PerplexityBot',
          'Applebot-Extended',
          'Bingbot',
        ],
        allow: '/',
        disallow: ['/api/', '/admin'],
      },
    ],
    sitemap: 'https://chillconnecthub.com/sitemap.xml',
    host: 'https://chillconnecthub.com',
  };
}

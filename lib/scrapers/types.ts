import type { ScrapedRawEvent } from '@/lib/aiTagger';

export interface FetchedText {
  url: URL;
  text: string;
  contentType: string;
}

/**
 * Network access handed to site adapters. Both functions apply the scraper's guards
 * (public HTTPS only, robots.txt, blocked platforms, size and time limits).
 */
export interface SiteAdapterContext {
  fetchText(url: string, acceptedTypes?: string[]): Promise<FetchedText>;
  postJson(url: string, body: unknown, headers?: Record<string, string>): Promise<unknown>;
  now: number;
}

export interface SiteScrapeResult {
  scannedCount: number;
  items: ScrapedRawEvent[];
}

/** Reads one specific site whose pages carry no Schema.org Event JSON-LD. */
export interface SiteEventAdapter {
  id: string;
  matches(sourceUrl: URL): boolean;
  scrape(sourceUrl: URL, context: SiteAdapterContext): Promise<SiteScrapeResult>;
}

import type { ScrapedRawEvent } from '@/lib/aiTagger';
import { calendarDayEnd, formatThaiDay, parseThaiDateRange } from './dates';
import { decodeEntities, htmlToText } from './html';
import type { SiteAdapterContext, SiteEventAdapter } from './types';

/**
 * Bangkok Art and Culture Centre, หอศิลปวัฒนธรรมแห่งกรุงเทพมหานคร (https://www.bacc.or.th), owner 2026-11-26: art
 * shows, talks and workshops that Gen Z and Y go to and post about. robots.txt allows everything (checked 2026-11-26).
 * WordPress with Yoast: event pages are listed in event-sitemap{n}.xml with a lastmod; each page has the dates in a
 * "เมื่อไร" box (Thai, Buddhist years) and the rooms in a "สถานที่" box; title, picture and summary come from the Open
 * Graph tags. Only Thai pages are read (the /en/ copies are the same events).
 */

const ORIGIN = 'https://www.bacc.or.th';
const XML_TYPES = ['application/xml', 'text/xml'];
const MAX_EVENT_PAGES = 40;
const PARALLEL_PAGES = 4;
const MAX_DESCRIPTION = 1500;
/** BACC answers slowly (a sitemap holds ~400 events): longer than the scraper's default wait */
const SLOW_SITE_MS = 30_000;
export const BACC_VENUE = 'หอศิลปวัฒนธรรมแห่งกรุงเทพมหานคร (BACC)';
/** The building at Pathum Wan junction (OpenStreetMap) */
const BACC_POINT = { latitude: 13.7466, longitude: 100.5302 };

const meta = (html: string, property: string) =>
  decodeEntities(html.match(new RegExp(`<meta property="${property}" content="([^"]*)"`))?.[1] || '').trim();

/** The text of a sidebar box after its label, e.g. <div class="sb-box when"><div class="sb-label">เมื่อไร</div>…</div> */
function box(html: string, name: string): string {
  const match = html.match(new RegExp(`<div class="sb-box ${name}">\\s*<div class="sb-label">[\\s\\S]*?</div>([\\s\\S]*?)</div>`));
  return match ? htmlToText(match[1].replace(/<br\s*\/?>/gi, ', ')).replace(/,\s*$/, '').trim() : '';
}

export function mapBaccEventPage(html: string, pageUrl: string, now: number = Date.now()): ScrapedRawEvent | null {
  const rawTitle = meta(html, 'og:title').replace(/\s*[-–]\s*Bangkok Art and Culture Centre\s*$/i, '').trim();
  const when = box(html, 'when');
  const range = parseThaiDateRange(when, now);
  if (rawTitle.length < 5 || !range || calendarDayEnd(range.end) < now) return null;
  const rooms = box(html, 'location');
  const time = when.match(/(\d{1,2}[.:]\d{2})\s*[-–]\s*(\d{1,2}[.:]\d{2})/);
  const rawDate = formatThaiDay(range.start);
  const rawEndDate = formatThaiDay(range.end);
  // The page's own paragraphs (the Open Graph summary is cut after a few words), led by its kind for staff:
  // "Main Exhibition", "Talk", "Workshop"…
  const entryStart = html.indexOf('<div class="entry">');
  const entryEnd = html.indexOf('sidebar-event', entryStart);
  const entry = entryStart >= 0 ? html.slice(entryStart, entryEnd > entryStart ? entryEnd : undefined) : '';
  const kind = htmlToText(entry.match(/<h4 class="collection"[^>]*>([\s\S]*?)<\/h4>/)?.[1] || '');
  const paragraphs = [...entry.matchAll(/<p class="wp-block-paragraph">([\s\S]*?)<\/p>/g)].map((m) => htmlToText(m[1])).filter(Boolean).join('\n');
  const summary = [kind && `ประเภท: ${kind}`, paragraphs || meta(html, 'og:description')].filter(Boolean).join('\n');
  const image = meta(html, 'og:image');
  return {
    source: 'BACC',
    sourceUrl: pageUrl,
    rawTitle,
    rawDate,
    rawEndDate: rawEndDate !== rawDate ? rawEndDate : undefined,
    rawTime: time ? `${time[1].replace('.', ':')} - ${time[2].replace('.', ':')}` : '',
    rawLocation: rooms ? `${rooms}, ${BACC_VENUE}` : BACC_VENUE,
    rawProvince: 'กรุงเทพมหานคร',
    rawDescription: summary.length > MAX_DESCRIPTION ? `${summary.slice(0, MAX_DESCRIPTION)}…` : summary,
    rawImage: image.startsWith('https://') ? image : '',
    rawLatitude: BACC_POINT.latitude,
    rawLongitude: BACC_POINT.longitude,
  };
}

/** Thai event pages from the newest event sitemaps, most recently changed first */
async function recentEventPages(context: SiteAdapterContext): Promise<string[]> {
  const index = await context.fetchText(`${ORIGIN}/sitemap_index.xml`, XML_TYPES, SLOW_SITE_MS);
  const sitemaps = [...index.text.matchAll(/<loc>(https:\/\/www\.bacc\.or\.th\/event-sitemap(\d*)\.xml)<\/loc>/g)]
    .sort((left, right) => Number(right[2] || 1) - Number(left[2] || 1))
    .map((match) => match[1]);
  if (sitemaps.length === 0) throw new Error('BACC sitemap lists no event sitemaps; the address may have changed');

  const entries: Array<{ url: string; lastmod: string }> = [];
  for (const sitemap of sitemaps.slice(0, 2)) {
    const { text } = await context.fetchText(sitemap, XML_TYPES, SLOW_SITE_MS);
    for (const match of text.matchAll(/<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>/g)) {
      entries.push({ url: match[1].trim(), lastmod: match[2].trim() });
    }
  }
  return [...new Set(entries.sort((left, right) => right.lastmod.localeCompare(left.lastmod)).map((entry) => entry.url))]
    .filter((url) => /^https:\/\/www\.bacc\.or\.th\/events\/\d+\/?$/.test(url))
    .slice(0, MAX_EVENT_PAGES);
}

export const baccAdapter: SiteEventAdapter = {
  id: 'bacc',
  matches: (url) => /(^|\.)bacc\.or\.th$/i.test(url.hostname) && /^\/(events\/?)?$/i.test(url.pathname),
  async scrape(_sourceUrl, context) {
    const pages = await recentEventPages(context);
    const items: ScrapedRawEvent[] = [];
    let failed = 0;
    for (let index = 0; index < pages.length; index += PARALLEL_PAGES) {
      const results = await Promise.allSettled(pages.slice(index, index + PARALLEL_PAGES).map((url) => context.fetchText(url, undefined, SLOW_SITE_MS)));
      results.forEach((result, offset) => {
        if (result.status === 'rejected') { failed++; return; }
        const item = mapBaccEventPage(result.value.text, pages[index + offset], context.now);
        if (item) items.push(item);
      });
    }
    if (pages.length > 0 && failed === pages.length) throw new Error('Every BACC event page failed to load');
    return { scannedCount: pages.length, items };
  },
};

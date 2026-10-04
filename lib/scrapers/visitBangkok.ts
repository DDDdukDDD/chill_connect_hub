import type { ScrapedRawEvent } from '@/lib/aiTagger';
import { calendarDayEnd, formatThaiDay, parseThaiDateRange } from './dates';
import { decodeEntities, htmlToText } from './html';
import type { SiteEventAdapter } from './types';

/**
 * Visit Bangkok festival calendar by the BMA (https://visit.bangkok.go.th/th/festival-calendar).
 * The page renders client-side from a CMS that requires an API key, so we read the CMS's public
 * RSS feed instead (`/api/event/feed.xml`, latest 20 items). The feed has no structured dates or
 * venue: the date range is parsed from the text, and the venue only from an explicit "สถานที่" line.
 */

const FEED_ORIGIN = 'https://cms-visit.bangkok.go.th';
const SITE_ORIGIN = 'https://visit.bangkok.go.th';
const MAX_DESCRIPTION = 1500;

const tag = (item: string, name: string) => {
  const match = item.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`));
  return match ? match[1].trim() : '';
};

/** Venue from a "สถานที่: ..." or "📍 ..." line; null when the text does not state one clearly. */
function venueFrom(text: string): string | null {
  for (const line of text.split('\n')) {
    const match = line.match(/^\s*(?:📍\s*)?สถานที่(?:จัดงาน)?\s*[:：]?\s*(.+)$/) || line.match(/^\s*📍\s*(.+)$/);
    if (match) return match[1].trim().slice(0, 100);
  }
  return null;
}

export function extractVisitBangkokFeed(xml: string, locale: string, now: number = Date.now()): { scannedCount: number; items: ScrapedRawEvent[] } | null {
  if (!xml.includes('<rss')) return null;
  const entries = xml.split('<item>').slice(1);

  const items = entries.flatMap((entry): ScrapedRawEvent[] => {
    const rawTitle = htmlToText(tag(entry, 'title'));
    const id = tag(entry, 'guid');
    const text = htmlToText(tag(entry, 'content:encoded') || tag(entry, 'description'));
    if (rawTitle.length < 5 || !/^\d+$/.test(id)) return [];

    // The feed's pubDate is a listing date, not the event date; items without a date in the text are skipped
    const range = parseThaiDateRange(text, now);
    if (!range || calendarDayEnd(range.end) < now) return [];

    const rawDate = formatThaiDay(range.start);
    const rawEndDate = formatThaiDay(range.end);
    const image = entry.match(/<enclosure url="([^"]+)"/)?.[1];

    return [{
      source: 'Visit Bangkok (กทม.)',
      sourceUrl: `${SITE_ORIGIN}/${locale}/festival-calendar/${id}`,
      rawTitle,
      rawDate,
      rawEndDate: rawEndDate !== rawDate ? rawEndDate : undefined,
      rawTime: '',
      rawLocation: venueFrom(text) || 'กรุงเทพมหานคร (ดูสถานที่ในรายละเอียด)',
      rawProvince: 'กรุงเทพมหานคร',
      rawDescription: text.length > MAX_DESCRIPTION ? `${text.slice(0, MAX_DESCRIPTION)}…` : text,
      rawImage: image ? decodeEntities(image) : '',
    }];
  });

  return { scannedCount: entries.length, items };
}

export const visitBangkokAdapter: SiteEventAdapter = {
  id: 'visit-bangkok',
  matches: (url) => url.hostname.toLowerCase() === 'visit.bangkok.go.th' && /^\/(th|en|zh-CN)\/festival-calendar\/?$/i.test(url.pathname),
  async scrape(sourceUrl, context) {
    const locale = sourceUrl.pathname.split('/')[1] || 'th';
    const feed = await context.fetchText(`${FEED_ORIGIN}/api/event/feed.xml?locale=${encodeURIComponent(locale)}`, ['application/rss+xml', 'application/xml', 'text/xml']);
    const extracted = extractVisitBangkokFeed(feed.text, locale, context.now);
    if (!extracted) throw new Error('Visit Bangkok feed was not RSS; the feed address may have changed');
    return extracted;
  },
};

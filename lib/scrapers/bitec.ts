import type { ScrapedRawEvent } from '@/lib/aiTagger';
import { bangkokTime, isoTimestamp, toThaiDisplayDate } from './dates';
import { decodeEntities, parseBalancedJson } from './html';
import type { SiteEventAdapter } from './types';

/**
 * BITEC Bangna "What's on" (https://www.bitec.co.th/whats-on).
 * A Next.js App Router page backed by WordPress. The event list is not in the HTML markup but in the
 * React Server Components payload (`self.__next_f.push([1, "..."])`), as dehydrated query data
 * `{"events": [{ slug, title, featuredImage, eventFieldGroup: { eventStartdate, eventEnddate, eventHall }, eventCategories }]}`.
 */

interface BitecEvent {
  slug?: unknown;
  title?: unknown;
  featuredImage?: { node?: { sourceUrl?: unknown } };
  eventFieldGroup?: { eventStartdate?: unknown; eventEnddate?: unknown; eventHall?: unknown };
  eventCategories?: { nodes?: Array<{ name?: unknown }> };
}

const BITEC_VENUE = 'ไบเทค บางนา (BITEC)';
const text = (value: unknown) => (typeof value === 'string' ? decodeEntities(value).trim() : '');

function readFlightPayload(html: string): string {
  const chunks: string[] = [];
  for (const match of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) {
    try {
      chunks.push(JSON.parse(match[1]));
    } catch {
      // Skip chunks that are not plain strings
    }
  }
  return chunks.join('');
}

/** "2026-10-14 10:00:00" (Bangkok wall time) → ISO with offset; midnight means "no time given". */
function toIso(value: string): { iso: string; hasTime: boolean } | null {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2})(?::\d{2})?)?/);
  if (!match) return null;
  const time = match[2] && match[2] !== '00:00' ? match[2] : null;
  return time ? { iso: `${match[1]}T${time}:00+07:00`, hasTime: true } : { iso: match[1], hasTime: false };
}

export function extractBitecEvents(html: string, pageUrl: URL, now: number = Date.now()): { scannedCount: number; items: ScrapedRawEvent[] } | null {
  const payload = readFlightPayload(html);
  const start = payload.indexOf('"events":[');
  if (start < 0) return null;
  let events: BitecEvent[];
  try {
    events = parseBalancedJson(payload, start + '"events":'.length) as BitecEvent[];
  } catch {
    return null;
  }
  if (!Array.isArray(events)) return null;

  const items = events.flatMap((event): ScrapedRawEvent[] => {
    const slug = text(event.slug);
    const rawTitle = text(event.title);
    const fields = event.eventFieldGroup || {};
    const startAt = toIso(text(fields.eventStartdate));
    const endAt = toIso(text(fields.eventEnddate)) || startAt;
    if (!slug || rawTitle.length < 5 || !startAt || !endAt) return [];
    if ((isoTimestamp(endAt.iso, true) ?? 0) < now) return [];

    const hall = text(fields.eventHall);
    const categories = (event.eventCategories?.nodes || []).map((node) => text(node.name)).filter(Boolean);
    const rawDate = toThaiDisplayDate(startAt.iso);
    const rawEndDate = toThaiDisplayDate(endAt.iso);
    const times = [startAt.hasTime && bangkokTime(startAt.iso), endAt.hasTime && bangkokTime(endAt.iso)].filter(Boolean);

    return [{
      source: 'BITEC',
      sourceUrl: new URL(`/whats-on/${encodeURIComponent(slug)}`, pageUrl).toString(),
      rawTitle,
      rawDate,
      rawEndDate: rawEndDate !== rawDate ? rawEndDate : undefined,
      rawTime: times.join(' - '),
      rawLocation: hall ? `${hall}, ${BITEC_VENUE}` : BITEC_VENUE,
      rawProvince: 'กรุงเทพมหานคร',
      rawDescription: categories.length ? `ประเภทงาน: ${categories.join(', ')}` : '',
      rawImage: text(event.featuredImage?.node?.sourceUrl),
    }];
  });

  return { scannedCount: events.length, items };
}

export const bitecAdapter: SiteEventAdapter = {
  id: 'bitec',
  matches: (url) => /(^|\.)bitec\.co\.th$/i.test(url.hostname) && /^\/whats-on\/?$/i.test(url.pathname),
  async scrape(sourceUrl, context) {
    const page = await context.fetchText(sourceUrl.toString());
    const extracted = extractBitecEvents(page.text, page.url, context.now);
    if (!extracted) throw new Error('BITEC event data was not found in the page payload; the page layout may have changed');
    return extracted;
  },
};

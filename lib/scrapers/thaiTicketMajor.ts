import type { ScrapedRawEvent } from '@/lib/aiTagger';
import { decodeEntities } from './html';
import { extractRecords, hasEnded, isEventNode, mapJsonLdEvent, textValue } from './jsonLd';
import type { SiteAdapterContext, SiteEventAdapter } from './types';

/**
 * ThaiTicketMajor (https://www.thaiticketmajor.com/concert/).
 * The concert and sport list pages carry no JSON-LD, but each show's own page has a Schema.org Event
 * (title, venue, start/end, poster, ticket prices). We read the links from both list pages and then
 * each show page, a few at a time.
 */

const ORIGIN = 'https://www.thaiticketmajor.com';
const LIST_PAGES = ['/concert/', '/sport/'];
const SHOW_LINK = /href="(?:https:\/\/www\.thaiticketmajor\.com)?(\/(?:concert|sport|performance)\/[a-z0-9\-]+\.html)"/gi;
const MAX_SHOW_PAGES = 60;
const PARALLEL_PAGES = 4;

// The JSON-LD has the venue name but no province; only well-known venues are mapped, others stay blank for review
const VENUE_PROVINCES: Array<[RegExp, string]> = [
  [/อิมแพ็ค|impact|เมืองทอง|ธันเดอร์\s?โดม|thunder\s?dome|ทรู\s?สเตเดียม|true\s?stadium/i, 'นนทบุรี'],
  [/กรุงเทพ|bangkok|ไบเทค|bitec|สิริกิติ์|qsncc|ราชมังคลา|rajamangala|ยูเนี่ยน\s?มอลล์|union\s?mall|ลุมพินี|lumpinee|ราชดำเนิน|rajadamnern|ไอคอนสยาม|iconsiam|พารากอน|paragon|สยามสแควร์|siam\s?square|siampic|ยูโอบี\s?ไลฟ์|uob\s?live|เอ็มสเฟียร์|emsphere|ไทยแลนด์คัลเจอรัลเซ็นเตอร์|ศูนย์วัฒนธรรมแห่งประเทศไทย|หอประชุมใหญ่\s?มหาวิทยาลัยธรรมศาสตร์|สามย่าน|samyan|ไลฟ์\s?เฮาส์|centralworld|เซ็นทรัลเวิลด์/i, 'กรุงเทพมหานคร'],
];

function venueProvince(location: string): string | undefined {
  return VENUE_PROVINCES.find(([pattern]) => pattern.test(location))?.[1];
}

export function extractShowLinks(html: string): string[] {
  return [...new Set([...html.matchAll(SHOW_LINK)].map((match) => match[1].toLowerCase()))];
}

/** Maps the Event JSON-LD of one show page; ended shows and pages without an Event give nothing. */
export function extractShowEvents(html: string, pageUrl: URL, now: number): ScrapedRawEvent[] {
  return extractRecords(html, 'text/html')
    .filter((record) => isEventNode(record) && !hasEnded(record, now))
    .flatMap((record) => {
      const event = mapJsonLdEvent(record, pageUrl, 'ThaiTicketMajor');
      // The page names the venue only; the poster title doubles as the description
      if (!event) return [];
      // streetAddress on every show is ThaiTicketMajor's own office, so only the venue name is kept
      const venue = decodeEntities(textValue((record.location as Record<string, unknown> | undefined)?.name)) || event.rawLocation;
      return [{
        ...event,
        source: 'ThaiTicketMajor',
        sourceUrl: pageUrl.toString(),
        rawLocation: venue,
        rawProvince: venueProvince(venue),
        rawDescription: event.rawDescription === event.rawTitle ? '' : event.rawDescription,
      }];
    });
}

async function readShows(paths: string[], context: SiteAdapterContext): Promise<{ items: ScrapedRawEvent[]; failed: number }> {
  const items: ScrapedRawEvent[] = [];
  let failed = 0;
  for (let index = 0; index < paths.length; index += PARALLEL_PAGES) {
    const pages = await Promise.allSettled(paths.slice(index, index + PARALLEL_PAGES).map((path) => context.fetchText(`${ORIGIN}${path}`)));
    for (const page of pages) {
      if (page.status === 'fulfilled') items.push(...extractShowEvents(page.value.text, page.value.url, context.now));
      else failed++;
    }
  }
  return { items, failed };
}

export const thaiTicketMajorAdapter: SiteEventAdapter = {
  id: 'thaiticketmajor',
  matches: (url) => /(^|\.)thaiticketmajor\.com$/i.test(url.hostname) && /^\/(concert|sport)?\/?$/i.test(url.pathname),
  async scrape(_sourceUrl, context) {
    const lists = await Promise.all(LIST_PAGES.map((path) => context.fetchText(`${ORIGIN}${path}`)));
    const paths = [...new Set(lists.flatMap((list) => extractShowLinks(list.text)))].slice(0, MAX_SHOW_PAGES);
    if (paths.length === 0) throw new Error('ThaiTicketMajor list pages had no show links; the page layout may have changed');
    const { items, failed } = await readShows(paths, context);
    if (items.length === 0 && failed === paths.length) throw new Error('Every ThaiTicketMajor show page failed to load');
    return { scannedCount: paths.length, items };
  },
};

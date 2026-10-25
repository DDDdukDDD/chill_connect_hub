import type { ScrapedRawEvent } from '@/lib/aiTagger';
import { bangkokTime, isoTimestamp, toThaiDisplayDate } from './dates';
import { thaiProvinceName } from './thaiProvinces';
import type { SiteEventAdapter } from './types';

/**
 * ThaiRun race calendar (https://race.thai.run/).
 * The site is a client-side React app; its race list comes from the public GraphQL query
 * `listEvents` on api.race.thai.run that the homepage itself sends. This is the site's own
 * undocumented API, so the query may need updating if ThaiRun changes it.
 */

const API_URL = 'https://api.race.thai.run/graphql';
const LIST_EVENTS_QUERY = `query listEvents($filter: FilterFindManyEventInput, $limit: Int, $sort: SortFindManyEventInput) {
  listEvents(filter: $filter, limit: $limit, sort: $sort) {
    slug name { en th } coverUrl thumbnailUrl startDate endDate hideDate location provinces
    hidden testMode isVirtual regClosed organizer { name }
    races { distance ticketTypes { price } }
  }
}`;

interface ThaiRunEvent {
  slug?: string;
  name?: { en?: string; th?: string };
  coverUrl?: string;
  thumbnailUrl?: string;
  startDate?: string;
  endDate?: string;
  hideDate?: boolean;
  location?: string | null;
  provinces?: string[];
  hidden?: boolean;
  testMode?: boolean;
  isVirtual?: boolean;
  regClosed?: boolean;
  organizer?: { name?: string } | null;
  /** One per distance; each ticket type (early bird, with shirt…) has its own price in baht */
  races?: Array<{ distance?: number; ticketTypes?: Array<{ price?: number }> }> | null;
}

const baht = (n: number) => `฿${n.toLocaleString('en-US')}`;

/** The distances in km from the race list, shortest first (field names found by probing the API, 2026-10-25) */
function distances(event: ThaiRunEvent): number[] {
  return [...new Set((event.races || []).map((race) => race.distance).filter((d): d is number => typeof d === 'number' && d > 0))].sort((a, b) => a - b);
}

/** The fee range over every distance and ticket type, e.g. "฿499 - ฿1,199"; '' when the API gives none */
function feeText(event: ThaiRunEvent): string {
  const prices = (event.races || []).flatMap((race) => (race.ticketTypes || []).map((t) => t.price)).filter((p): p is number => typeof p === 'number' && p > 0);
  if (!prices.length) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? baht(min) : `${baht(min)} - ${baht(max)}`;
}

/** Start times at Bangkok midnight are date-only placeholders, not real gun times. */
function startTime(iso: string): string {
  const time = bangkokTime(iso);
  return time && time !== '00:00' ? time : '';
}

export function mapThaiRunEvents(events: ThaiRunEvent[], now: number = Date.now()): ScrapedRawEvent[] {
  return events.flatMap((event): ScrapedRawEvent[] => {
    const slug = event.slug?.trim();
    const rawTitle = (event.name?.th || event.name?.en || '').trim();
    const start = event.startDate || '';
    const end = event.endDate || start;
    if (!slug || rawTitle.length < 5 || !start || event.hideDate) return [];
    if (event.hidden || event.testMode || event.isVirtual) return []; // virtual runs have no place to meet
    if ((isoTimestamp(end, true) ?? isoTimestamp(start, true) ?? 0) < now) return [];

    // Races without a Thai province are tour packages abroad
    const province = (event.provinces || []).map(thaiProvinceName).find(Boolean);
    if (!province) return [];

    const rawDate = toThaiDisplayDate(start);
    const rawEndDate = toThaiDisplayDate(end);
    const organizer = event.organizer?.name?.trim();
    const km = distances(event);
    const fee = feeText(event);
    return [{
      source: 'ThaiRun',
      sourceUrl: `https://race.thai.run/events/${encodeURIComponent(slug)}`,
      rawTitle,
      rawDate,
      rawEndDate: rawEndDate !== rawDate ? rawEndDate : undefined,
      rawTime: startTime(start),
      rawLocation: event.location?.trim() || `${province} (จุดปล่อยตัวตามประกาศผู้จัด)`,
      rawProvince: province,
      ...(fee && { rawPrice: fee }),
      // Distances, fee and sign-up show as rows of the page's "สิ่งที่ควรทราบ"; the text only says whose run it is
      ...(km.length && { rawDistances: km }),
      rawRegistrationOpen: !event.regClosed,
      rawDescription: `งานวิ่ง${organizer ? `ที่จัดโดย ${organizer}` : ''} ดูรายละเอียดเส้นทาง เสื้อ และเหรียญได้ที่เว็บไซต์ ThaiRun`,
      rawImage: event.coverUrl || event.thumbnailUrl || '',
    }];
  });
}

export const thaiRunAdapter: SiteEventAdapter = {
  id: 'thairun',
  matches: (url) => url.hostname.toLowerCase() === 'race.thai.run' && (url.pathname === '/' || url.pathname === '/events'),
  async scrape(_sourceUrl, context) {
    const response = await context.postJson(API_URL, {
      query: LIST_EVENTS_QUERY,
      // Same filter as the homepage list: races still open for registration, newest first
      variables: { filter: { _operators: { regClosed: { ne: true } } }, limit: 100, sort: '_ID_DESC' },
    }, { 'X-RunX-Platform': 'thai' }) as { data?: { listEvents?: ThaiRunEvent[] }; errors?: Array<{ message?: string }> };

    if (response.errors?.length) throw new Error(`ThaiRun API error: ${response.errors[0]?.message || 'unknown'}`);
    const events = response.data?.listEvents;
    if (!Array.isArray(events)) throw new Error('ThaiRun API returned no event list; the query may need updating');
    return { scannedCount: events.length, items: mapThaiRunEvents(events, context.now) };
  },
};

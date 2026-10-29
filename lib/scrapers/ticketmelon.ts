import type { ScrapedRawEvent } from '@/lib/aiTagger';
import { bangkokTime, toThaiDisplayDate } from './dates';
import { htmlToText } from './html';
import { thaiProvinceName } from './thaiProvinces';
import type { SiteAdapterContext, SiteEventAdapter } from './types';

/**
 * Ticketmelon (https://www.ticketmelon.com).
 * Pages have no JSON-LD, but each event page is server-rendered with Next.js and carries the event in
 * `__NEXT_DATA__` (props.pageProps.event: name, show times, venue with Google address parts and
 * coordinates, poster, HTML description). Event pages are listed in sitemap-event{n}.xml files with a
 * lastmod; we read the most recently changed pages. Ticketmelon also sells abroad, so only venues in
 * Thailand are kept.
 */

const ORIGIN = 'https://www.ticketmelon.com';
const XML_TYPES = ['application/xml', 'text/xml'];
const MAX_EVENT_PAGES = 60;
const PARALLEL_PAGES = 4;
const MAX_DESCRIPTION = 1500;

interface AddressPart {
  long_name?: string;
  short_name?: string;
  types?: string[];
}

interface TicketmelonEvent {
  name?: string;
  status?: string;
  is_active?: boolean;
  is_hide_web?: boolean;
  show_starttime?: number;
  show_endtime?: number;
  description?: string;
  img_poster?: string;
  img_banner?: string;
  eo_slug?: string;
  venue?: {
    name?: string;
    formatted_address?: string;
    latitude?: number;
    longitude?: number;
    address_components?: AddressPart[];
  } | null;
}

const part = (parts: AddressPart[], type: string) => parts.find((entry) => entry.types?.includes(type));

/** Province from Google's level-1 area, in English ("Chang Wat Nonthaburi", "Krung Thep Maha Nakhon") or Thai. */
function provinceOf(parts: AddressPart[]): string | undefined {
  const area = part(parts, 'administrative_area_level_1')?.long_name?.trim();
  if (!area) return undefined;
  if (/[฀-๿]/.test(area)) return area.replace(/^(จังหวัด|จ\.)\s*/, '');
  return thaiProvinceName(area);
}

const usableImage = (value: string | undefined) => (value && value.trim().startsWith('https://') ? value.trim() : '');

export function mapTicketmelonEvent(event: TicketmelonEvent, pageUrl: string, now: number = Date.now()): ScrapedRawEvent | null {
  const rawTitle = event.name?.trim() || '';
  if (rawTitle.length < 5 || event.status !== 'publish' || event.is_active === false || event.is_hide_web) return null;
  const start = Number(event.show_starttime);
  const end = Number(event.show_endtime) || start;
  if (!(start > 0) || end < now) return null;

  const venue = event.venue || {};
  const parts = venue.address_components || [];
  if (part(parts, 'country')?.short_name !== 'TH') return null; // events abroad (Malaysia, the Philippines…)

  const startIso = new Date(start).toISOString();
  const endIso = new Date(end).toISOString();
  const rawDate = toThaiDisplayDate(startIso);
  const rawEndDate = toThaiDisplayDate(endIso);
  // Organizers' editor leaves language markers such as "[LANGUAGE_CHECK_TH]" in the text
  const text = htmlToText(event.description || '').replace(/\[LANGUAGE_CHECK_[A-Z]+\]\s*/g, '').trim();
  const latitude = Number(venue.latitude);
  const longitude = Number(venue.longitude);
  return {
    source: 'Ticketmelon',
    sourceUrl: pageUrl,
    rawTitle,
    rawDate,
    rawEndDate: rawEndDate !== rawDate ? rawEndDate : undefined,
    rawTime: [bangkokTime(startIso), bangkokTime(endIso)].filter(Boolean).join(' - '),
    rawLocation: venue.name?.trim() || venue.formatted_address?.trim() || 'ดูสถานที่ในหน้าผู้จัด',
    rawProvince: provinceOf(parts),
    rawDescription: text.length > MAX_DESCRIPTION ? `${text.slice(0, MAX_DESCRIPTION)}…` : text,
    rawImage: usableImage(event.img_poster) || usableImage(event.img_banner),
    rawLatitude: Number.isFinite(latitude) && latitude !== 0 ? latitude : undefined,
    rawLongitude: Number.isFinite(longitude) && longitude !== 0 ? longitude : undefined,
  };
}

export function readNextDataEvent(html: string): TicketmelonEvent | null {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    const event = JSON.parse(match[1])?.props?.pageProps?.event;
    return event && typeof event === 'object' ? event as TicketmelonEvent : null;
  } catch {
    return null;
  }
}

/** Event page URLs from the event sitemaps, most recently changed first. */
async function recentEventPages(context: SiteAdapterContext): Promise<string[]> {
  const index = await context.fetchText(`${ORIGIN}/sitemap.xml`, XML_TYPES);
  const sitemaps = [...index.text.matchAll(/<loc>(https:\/\/www\.ticketmelon\.com\/sitemap-event\d+\.xml)<\/loc>/g)]
    .map((match) => match[1])
    .sort((left, right) => Number(right.match(/(\d+)\.xml$/)![1]) - Number(left.match(/(\d+)\.xml$/)![1]));
  if (sitemaps.length === 0) throw new Error('Ticketmelon sitemap lists no event sitemaps; the address may have changed');

  // The newest events are in the highest-numbered files
  const entries: Array<{ url: string; lastmod: string }> = [];
  for (const sitemap of sitemaps.slice(0, 2)) {
    const { text } = await context.fetchText(sitemap, XML_TYPES);
    for (const match of text.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)) {
      entries.push({ url: match[1].trim(), lastmod: match[2]?.trim() || '' });
    }
  }
  return [...new Set(entries.sort((left, right) => right.lastmod.localeCompare(left.lastmod)).map((entry) => entry.url))]
    .filter((url) => url.startsWith(`${ORIGIN}/`) && !url.includes('?'))
    .slice(0, MAX_EVENT_PAGES);
}

export const ticketmelonAdapter: SiteEventAdapter = {
  id: 'ticketmelon',
  matches: (url) => /(^|\.)ticketmelon\.com$/i.test(url.hostname) && /^\/?$/.test(url.pathname),
  async scrape(_sourceUrl, context) {
    const pages = await recentEventPages(context);
    const items: ScrapedRawEvent[] = [];
    let failed = 0;
    for (let index = 0; index < pages.length; index += PARALLEL_PAGES) {
      const results = await Promise.allSettled(pages.slice(index, index + PARALLEL_PAGES).map((url) => context.fetchText(url)));
      results.forEach((result, offset) => {
        if (result.status === 'rejected') { failed++; return; }
        const event = readNextDataEvent(result.value.text);
        const item = event && mapTicketmelonEvent(event, pages[index + offset], context.now);
        if (item) items.push(item);
      });
    }
    if (items.length === 0 && failed === pages.length) throw new Error('Every Ticketmelon event page failed to load');
    return { scannedCount: pages.length, items };
  },
};

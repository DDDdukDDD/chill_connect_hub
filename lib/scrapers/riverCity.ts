import type { ScrapedRawEvent } from '@/lib/aiTagger';
import { calendarDayEnd, formatThaiDay, type CalendarDay } from './dates';
import { decodeEntities, htmlToText } from './html';
import type { SiteEventAdapter } from './types';

/**
 * River City Bangkok (https://rivercitybangkok.com), owner 2026-11-26: the riverside art and antiques centre's
 * exhibitions, a Gen Z and Y photo spot. robots.txt allows these pages (checked 2026-11-26). A category page such as
 * /category/exhibitions/ starts with "Current Listings": one card per show with its title, an English date line
 * ("25 Nov 2026—14 Jan 2027") and a link; past shows follow further down and are not read. Each show's own page adds
 * the full picture and a summary (Open Graph).
 */

const RCB_VENUE = 'ริเวอร์ซิตี้ แบงค็อก (River City Bangkok)';
/** The building on Charoen Krung Soi 24 (OpenStreetMap) */
const RCB_POINT = { latitude: 13.7299, longitude: 100.5136 };
const MAX_DESCRIPTION = 1500;
const MAX_SHOWS = 20;

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const month = (name: string | undefined) => (name ? MONTHS[name.slice(0, 3).toLowerCase()] : undefined);

/** "25 Nov 2026—14 Jan 2027", "20 Nov—15 Dec 2026", "3—28 Dec 2026" or one day "6 Dec 2026" */
export function parseEnglishDateRange(text: string): { start: CalendarDay; end: CalendarDay } | null {
  const range = text.match(/(\d{1,2})\s*([A-Za-z]{3,})?\.?\s*(\d{4})?\s*[—–-]\s*(\d{1,2})\s*([A-Za-z]{3,})\.?\s*(\d{4})/);
  if (range) {
    const endMonth = month(range[5]);
    if (endMonth === undefined) return null;
    const startMonth = month(range[2]) ?? endMonth;
    const endYear = Number(range[6]);
    const startYear = range[3] ? Number(range[3]) : startMonth > endMonth ? endYear - 1 : endYear;
    return { start: { year: startYear, month: startMonth, day: Number(range[1]) }, end: { year: endYear, month: endMonth, day: Number(range[4]) } };
  }
  const single = text.match(/(\d{1,2})\s*([A-Za-z]{3,})\.?\s*(\d{4})/);
  const singleMonth = month(single?.[2]);
  if (!single || singleMonth === undefined) return null;
  const day = { year: Number(single[3]), month: singleMonth, day: Number(single[1]) };
  return { start: day, end: day };
}

export interface RiverCityCard {
  url: string;
  title: string;
  dates: string;
}

/** The cards under "Current Listings", before the past shows */
export function readCurrentCards(html: string): RiverCityCard[] {
  const start = html.indexOf('id="current-events-container"');
  if (start < 0) return [];
  const rest = html.slice(start);
  const end = rest.search(/id="past-events|class="past-events|>\s*Past Listings/i);
  const section = end > 0 ? rest.slice(0, end) : rest;
  return [...section.matchAll(/<a href="([^"]+)" class="event-item">([\s\S]*?)<\/a>/g)].map((match) => ({
    url: decodeEntities(match[1]),
    title: htmlToText(match[2].match(/<h3 class="event-name">([\s\S]*?)<\/h3>/)?.[1] || ''),
    dates: htmlToText(match[2].match(/<span class="duration">([\s\S]*?)<\/span>/)?.[1] || ''),
  }));
}

const meta = (html: string, property: string) =>
  decodeEntities(html.match(new RegExp(`<meta property="${property}" content="([^"]*)"`))?.[1] || '').trim();

export function mapRiverCityShow(card: RiverCityCard, pageHtml: string, now: number = Date.now()): ScrapedRawEvent | null {
  const range = parseEnglishDateRange(card.dates);
  if (card.title.length < 5 || !range || calendarDayEnd(range.end) < now) return null;
  const rawDate = formatThaiDay(range.start);
  const rawEndDate = formatThaiDay(range.end);
  const summary = meta(pageHtml, 'og:description');
  const image = meta(pageHtml, 'og:image');
  return {
    source: 'River City Bangkok',
    sourceUrl: card.url,
    rawTitle: card.title,
    rawDate,
    rawEndDate: rawEndDate !== rawDate ? rawEndDate : undefined,
    rawTime: '',
    rawLocation: RCB_VENUE,
    rawProvince: 'กรุงเทพมหานคร',
    rawDescription: summary.length > MAX_DESCRIPTION ? `${summary.slice(0, MAX_DESCRIPTION)}…` : summary,
    rawImage: image.startsWith('https://') ? image : '',
    rawLatitude: RCB_POINT.latitude,
    rawLongitude: RCB_POINT.longitude,
  };
}

export const riverCityAdapter: SiteEventAdapter = {
  id: 'river-city',
  matches: (url) => /(^|\.)rivercitybangkok\.com$/i.test(url.hostname) && /^\/category\/[^/]+\/?$/i.test(url.pathname),
  async scrape(sourceUrl, context) {
    const listing = await context.fetchText(sourceUrl.toString());
    const cards = readCurrentCards(listing.text).filter((card) => card.url.startsWith('https://')).slice(0, MAX_SHOWS);
    if (cards.length === 0) throw new Error('No River City listings were found; the page layout may have changed');
    const items: ScrapedRawEvent[] = [];
    for (const card of cards) {
      // The show's own page only adds the picture and summary: a page that fails still leaves the card's facts
      const page = await context.fetchText(card.url).catch(() => null);
      const item = mapRiverCityShow(card, page?.text || '', context.now);
      if (item) items.push(item);
    }
    return { scannedCount: cards.length, items };
  },
};

import type { ScrapedRawEvent } from '@/lib/aiTagger';
import { calendarDayEnd, formatThaiDay, parseThaiDateRange } from './dates';
import { decodeEntities, htmlToText } from './html';
import type { SiteEventAdapter } from './types';

/**
 * IMPACT Muang Thong Thani event calendar (https://www.impact.co.th/th/visitors/event-calendar).
 * Server-rendered Joomla "Event Booking" grid: one card per event with a Thai date line
 * ("23 ตุลาคม - 01 พฤศจิกายน 2569"), hall, price and poster. The default view lists ongoing
 * and upcoming events of the current year.
 */

const IMPACT_VENUE = 'อิมแพ็ค เมืองทองธานี';

// URL path segment → Thai event kind, kept in the description for moderators
const KIND_LABELS: Record<string, string> = {
  concert: 'คอนเสิร์ต',
  'exhibition-public': 'งานแสดงสินค้าสำหรับบุคคลทั่วไป',
  'exhibition-trade': 'งานแสดงสินค้าเฉพาะธุรกิจ (B2B)',
};

const first = (html: string, pattern: RegExp) => {
  const match = html.match(pattern);
  return match ? htmlToText(match[1]) : '';
};

export function extractImpactEvents(html: string, pageUrl: URL, now: number = Date.now()): { scannedCount: number; items: ScrapedRawEvent[] } | null {
  const cards = html.split(/<div class="[^"]*eb-event-item-grid-default-layout[^"]*">/).slice(1);
  if (cards.length === 0) return null;

  const items = cards.flatMap((card): ScrapedRawEvent[] => {
    const link = card.match(/<a class="eb-event-title" href="([^"]+)">([\s\S]*?)<\/a>/);
    if (!link) return [];
    const rawTitle = htmlToText(link[2]);
    const dateText = first(card, /<div class="eb-event-date-time">([\s\S]*?)<\/div>/);
    const range = parseThaiDateRange(dateText, now);
    if (rawTitle.length < 5 || !range || calendarDayEnd(range.end) < now) return [];

    const hall = first(card, /<div class="eb-event-location">([\s\S]*?)<\/div>/);
    const price = first(card, /<span class="eb-individual-price">([\s\S]*?)<\/span>/);
    const imagePath = card.match(/<img src="([^"]+)" class="eb-event-thumb"/)?.[1];
    const sourceUrl = new URL(decodeEntities(link[1]), pageUrl).toString();
    const kind = sourceUrl.match(/\/event-calendar\/([^/]+)\//)?.[1] || '';
    const rawDate = formatThaiDay(range.start);
    const rawEndDate = formatThaiDay(range.end);

    return [{
      source: 'IMPACT',
      sourceUrl,
      rawTitle,
      rawDate,
      rawEndDate: rawEndDate !== rawDate ? rawEndDate : undefined,
      rawTime: '',
      rawLocation: !hall ? IMPACT_VENUE : hall.includes('เมืองทอง') ? hall : `${hall}, ${IMPACT_VENUE}`,
      rawProvince: 'นนทบุรี',
      rawPrice: price || undefined,
      rawDescription: KIND_LABELS[kind] ? `ประเภทงาน: ${KIND_LABELS[kind]}` : '',
      rawImage: imagePath ? new URL(decodeEntities(imagePath), pageUrl).toString() : '',
    }];
  });

  return { scannedCount: cards.length, items };
}

export const impactAdapter: SiteEventAdapter = {
  id: 'impact',
  matches: (url) => /(^|\.)impact\.co\.th$/i.test(url.hostname) && /\/visitors\/event-calendar\/?$/i.test(url.pathname),
  async scrape(sourceUrl, context) {
    const page = await context.fetchText(sourceUrl.toString());
    const extracted = extractImpactEvents(page.text, page.url, context.now);
    if (!extracted) throw new Error('No IMPACT event cards were found; the page layout may have changed');
    return extracted;
  },
};

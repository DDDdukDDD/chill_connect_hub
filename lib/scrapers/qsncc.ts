import type { ScrapedRawEvent } from '@/lib/aiTagger';
import { bangkokTime, isoTimestamp, toThaiDisplayDate } from './dates';
import type { SiteEventAdapter } from './types';

/**
 * QSNCC event calendar (https://www.qsncc.com/en/whats-on/event-calendar).
 * The page has no Schema.org JSON-LD; it is a Next.js page whose `__NEXT_DATA__` carries the
 * Prismic `calendar_event` documents for the first page of the calendar (soonest events first).
 */

interface PrismicTextBlock { text?: unknown }
interface PrismicMedia { internalMedia?: { url?: unknown } }
interface QsnccCalendarDocument {
  uid?: unknown;
  type?: unknown;
  data?: {
    title?: unknown;
    description?: unknown;
    media?: unknown;
    location?: unknown;
    startDate2?: unknown;
    endDate2?: unknown;
    timeInfoVisibility?: unknown;
  };
}

const QSNCC_VENUE = 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)';

function isQsnccCalendarUrl(url: URL): boolean {
  return /(^|\.)qsncc\.com$/i.test(url.hostname) && /\/whats-on\/event-calendar\/?$/i.test(url.pathname);
}

function readNextData(html: string): unknown {
  const match = html.match(/<script\b[^>]*id\s*=\s*["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script\s*>/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

function coverImage(media: unknown): string {
  const first = Array.isArray(media) ? (media as PrismicMedia[]).find((item) => text(item?.internalMedia?.url)) : undefined;
  const url = text(first?.internalMedia?.url);
  // Prismic URLs arrive with a doubled query ("?auto=...?auto=..."); keep one resize hint
  return url ? `${url.split('?')[0]}?auto=format,compress&w=1200` : '';
}

function location(value: unknown): string {
  const raw = text(value);
  if (!raw || /^qsncc$/i.test(raw)) return QSNCC_VENUE;
  return /qsncc|สิริกิติ์/i.test(raw) ? raw : `${raw}, ${QSNCC_VENUE}`;
}

/** Date-only ISO in Bangkok time, for events whose page hides the time of day. */
function bangkokDay(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(iso));
}

export function extractQsnccCalendarEvents(
  html: string,
  pageUrl: URL,
  now: number = Date.now()
): { scannedCount: number; items: ScrapedRawEvent[] } | null {
  const nextData = readNextData(html) as { props?: { pageProps?: { calendarEvents?: { results?: unknown } } } } | null;
  const results = nextData?.props?.pageProps?.calendarEvents?.results;
  if (!Array.isArray(results)) return null;

  const documents = (results as QsnccCalendarDocument[]).filter((doc) => doc?.type === 'calendar_event');
  const calendarBase = new URL(pageUrl.pathname.endsWith('/') ? pageUrl.pathname : `${pageUrl.pathname}/`, pageUrl.origin);

  const items = documents.flatMap((doc): ScrapedRawEvent[] => {
    const data = doc.data || {};
    const uid = text(doc.uid);
    const rawTitle = text(data.title);
    const start = text(data.startDate2);
    const end = text(data.endDate2) || start;
    const startTs = isoTimestamp(start);
    if (!uid || rawTitle.length < 5 || startTs === null) return [];
    if ((isoTimestamp(end, true) ?? startTs) < now) return []; // already over

    // Without visible times the stored hour is an editor artefact; keep the calendar day only
    const showTime = data.timeInfoVisibility === true;
    const startValue = showTime ? start : bangkokDay(start);
    const endValue = showTime ? end : bangkokDay(end);
    const description = Array.isArray(data.description)
      ? (data.description as PrismicTextBlock[]).map((block) => text(block?.text)).filter(Boolean).join('\n\n')
      : '';

    const rawDate = toThaiDisplayDate(startValue);
    const rawEndDate = toThaiDisplayDate(endValue);

    return [{
      source: 'QSNCC',
      sourceUrl: new URL(encodeURIComponent(uid), calendarBase).toString(),
      rawTitle,
      rawDate,
      rawEndDate: rawEndDate !== rawDate ? rawEndDate : undefined,
      rawTime: showTime ? [bangkokTime(start), bangkokTime(end)].filter(Boolean).join(' - ') : '',
      rawLocation: location(data.location),
      rawProvince: 'กรุงเทพมหานคร',
      rawDescription: description,
      rawImage: coverImage(data.media),
    }];
  });

  return { scannedCount: documents.length, items };
}

export const qsnccAdapter: SiteEventAdapter = {
  id: 'qsncc',
  matches: isQsnccCalendarUrl,
  async scrape(sourceUrl, context) {
    const page = await context.fetchText(sourceUrl.toString());
    const extracted = extractQsnccCalendarEvents(page.text, page.url, context.now);
    if (!extracted) throw new Error('QSNCC calendar data (__NEXT_DATA__) was not found; the page layout may have changed');
    return extracted;
  },
};

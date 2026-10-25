import { EventItem } from '@/data/mockData';
import { LifestyleSpotItem } from '@/data/spotsData';
import { THAI_MONTHS_MAP, isEventEnded, isEventNew, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';

/**
 * Picks the items of the homepage highlights row by rule, from data that is already on the page.
 * Every picked item carries the reason it was picked, so the card can say it.
 */

export type HighlightMode = 'all' | 'community' | 'fairs' | 'spots';
export type HighlightPillar = 'community' | 'fairs' | 'spots';

export interface HighlightItem {
  pillar: HighlightPillar;
  /** The item in card shape. A place is turned into an event-shaped item with eventType 'spots'. */
  event: EventItem;
  /** Why this item is a highlight. Empty when no rule matched (the item only fills the row). */
  reason: string;
  score: number;
}

interface PickHighlightsInput {
  events: EventItem[];
  spots: LifestyleSpotItem[];
  mode: HighlightMode;
  /** Items already at the top of the sections below; they are picked last so the row does not repeat them */
  excludeIds: string[];
  /** Start of today on the visitor's clock (ms) */
  todayStart: number;
  limit?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Trade shows and congresses are listed on /events, but are not what a visitor planning a day off looks for
const TRADE_EVENT = /congress|annual meetings?|awards|conference|summit|symposium|\boil\b|\bgas\b|metal|marine|offshore|powerex|ประชุมวิชาการ|สัมมนา/i;

export const isTradeEvent = (event: { title: string }) => TRADE_EVENT.test(event.title);

// Day counts are shown only for a date text with a day and a Thai month; the parser guesses the rest
export const hasExactDate = (date?: string) =>
  !!date && /\d/.test(date) && Object.keys(THAI_MONTHS_MAP).some((month) => date.toLowerCase().includes(month));

const daysUntil = (timestamp: number, todayStart: number) => Math.round((timestamp - todayStart) / DAY_MS);

const dayLabel = (days: number) => (days === 0 ? 'วันนี้' : days === 1 ? 'พรุ่งนี้' : `อีก ${days} วัน`);

function communityHighlight(event: EventItem, todayStart: number): HighlightItem | null {
  const seatsLeft = event.maxParticipants - event.participantsCount;
  if (seatsLeft <= 0) return null;
  const days = hasExactDate(event.date) ? daysUntil(parseEventDateToTimestamp(event.date), todayStart) : -1;

  const isSoon = days >= 0 && days <= 14;
  const isAlmostFull = seatsLeft <= 3;
  const isNew = isEventNew(event);
  const reason = isAlmostFull ? `เหลือ ${seatsLeft} ที่` : isSoon ? dayLabel(days) : isNew ? 'เปิดใหม่' : '';
  // Soon counts most, so a nearly full event next week comes before a nearly full one in two months
  const score = (isSoon ? 60 - days * 2 : 0) + (isAlmostFull ? 30 : 0) + (isNew ? 10 : 0);

  return { pillar: 'community', event, reason, score };
}

function fairHighlight(event: EventItem, todayStart: number): HighlightItem {
  let reason = '';
  let score = 0;
  if (hasExactDate(event.date)) {
    const startDays = daysUntil(parseEventDateToTimestamp(event.date), todayStart);
    const endDays = daysUntil(parseEventEndDateToTimestamp(event.date), todayStart);
    if (startDays <= 0 && endDays >= 0) {
      reason = endDays <= 1 ? 'วันสุดท้าย' : 'กำลังจัดอยู่';
      score = 60;
    } else if (startDays > 0 && startDays <= 14) {
      reason = startDays === 1 ? 'เริ่มพรุ่งนี้' : `เริ่มในอีก ${startDays} วัน`;
      score = 80 - startDays * 2;
    }
  }
  if (isTradeEvent(event)) score -= 100;

  return { pillar: 'fairs', event, reason, score };
}

function spotHighlight(spot: LifestyleSpotItem): HighlightItem | null {
  if (spot.publicationStatus === 'draft') return null;
  const isWellReviewed = spot.rating >= 4.5 && spot.reviewsCount >= 50;
  const popularity = spot.popularity || 0;

  return {
    pillar: 'spots',
    // The row uses the event card, so a place is shown in that shape (the card links it to /spots/[id])
    event: {
      id: spot.id,
      title: spot.title,
      description: spot.description,
      image: spot.image,
      date: spot.openHours || 'เปิดบริการทุกวัน',
      time: '',
      location: [spot.district, spot.province].filter(Boolean).join(', '),
      province: spot.province,
      category: 'chill',
      tag: spot.categoryLabel,
      price: spot.price || '',
      hostName: spot.province,
      participantsCount: 0,
      maxParticipants: 0,
      rating: spot.rating,
      reviewsCount: spot.reviewsCount,
      eventType: 'spots',
    } as unknown as EventItem,
    reason: isWellReviewed ? `รีวิว ${spot.rating.toFixed(1)}` : popularity > 0 ? 'ยอดนิยม' : '',
    // Popularity is the page-view count from the source site, far below the 1,000,000 a good review score adds
    score: (isWellReviewed ? 1_000_000 * spot.rating : 0) + popularity,
  };
}

export function pickHighlights({ events, spots, mode, excludeIds, todayStart, limit = 8 }: PickHighlightsInput): HighlightItem[] {
  const excluded = new Set(excludeIds);
  // Best first; items already shown below go to the back
  const rank = (items: (HighlightItem | null)[]) =>
    (items.filter(Boolean) as HighlightItem[]).sort(
      (a, b) => Number(excluded.has(a.event.id)) - Number(excluded.has(b.event.id)) || b.score - a.score
    );

  const activeEvents = events.filter((e) => !isEventEnded(e));
  const queues: Record<HighlightPillar, HighlightItem[]> = {
    community: rank(activeEvents.filter((e) => (e.eventType || 'community') === 'community').map((e) => communityHighlight(e, todayStart))),
    fairs: rank(activeEvents.filter((e) => e.eventType === 'public_venue').map((e) => fairHighlight(e, todayStart))),
    spots: rank(spots.map(spotHighlight)),
  };
  // One place per province, so the most viewed province does not fill the row
  const seenProvinces = new Set<string>();
  queues.spots = queues.spots.filter(({ event }) => {
    if (seenProvinces.has(event.hostName)) return false;
    seenProvinces.add(event.hostName);
    return true;
  });

  if (mode !== 'all') return queues[mode].slice(0, limit);

  // One from each pillar in turn, so the row always mixes the three
  const order: HighlightPillar[] = ['community', 'fairs', 'spots'];
  const picked: HighlightItem[] = [];
  for (let round = 0; picked.length < limit && order.some((p) => queues[p].length > round); round++) {
    for (const pillar of order) {
      if (queues[pillar][round] && picked.length < limit) picked.push(queues[pillar][round]);
    }
  }
  return picked;
}

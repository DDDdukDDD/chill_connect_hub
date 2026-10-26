import { EventItem } from '@/data/mockData';
import { LifestyleSpotItem } from '@/data/spotsData';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { hasExactDate, isTradeEvent } from '@/lib/highlights';

/**
 * Ready-made day plans for the homepage: a place, plus what is on in the same province on the same day.
 * Built by rule from the three pillars; nothing here is written by hand.
 */

/** Chill = time for yourself (places and fairs first). Connect = going out to meet people (meetups first). */
export type Mood = 'chill' | 'connect';
export type PlanPillar = 'spots' | 'community' | 'fairs';

export interface PlanStop {
  pillar: PlanPillar;
  id: string;
  href: string;
  title: string;
  image: string;
  meta: string;
}

export interface HolidayPlan {
  id: string;
  province: string;
  /** e.g. "เสาร์ 17 ต.ค." */
  dateLabel: string;
  stops: PlanStop[];
}

interface BuildPlansInput {
  events: EventItem[];
  spots: LifestyleSpotItem[];
  mood: Mood;
  /** Start of today on the visitor's clock (ms) */
  todayStart: number;
  limit?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HORIZON_DAYS = 14;
const WEEKDAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// Events and places name Bangkok differently
const provinceKey = (province?: string) => {
  const name = (province || '').trim();
  return name === 'กรุงเทพมหานคร' || name === 'กทม.' ? 'กรุงเทพฯ' : name;
};

// Same test the server applies in lib/social/spotTrips.ts (spotAllowsMeetups)
const allowsMeetups = (spot: LifestyleSpotItem) =>
  spot.meetupAllowed === true && spot.category !== 'bar' && spot.publicationStatus !== 'draft';

const isWeekend = (todayStart: number, day: number) => [0, 6].includes(new Date(todayStart + day * DAY_MS).getDay());

interface Anchor {
  event: EventItem;
  pillar: 'community' | 'fairs';
  province: string;
  /** Days from today on which the plan happens */
  day: number;
  startDay: number;
  endDay: number;
}

function toAnchor(event: EventItem, todayStart: number): Anchor | null {
  const province = provinceKey(event.province);
  if (!province || province === 'ออนไลน์' || !hasExactDate(event.date) || isEventEnded(event)) return null;
  const startDay = Math.round((parseEventDateToTimestamp(event.date) - todayStart) / DAY_MS);

  if (event.eventType === 'public_venue') {
    if (isTradeEvent(event)) return null;
    const endDay = Math.floor((parseEventEndDateToTimestamp(event.date) - todayStart) / DAY_MS);
    const from = Math.max(startDay, 0);
    const to = Math.min(endDay, HORIZON_DAYS);
    if (from > to) return null;
    // A fair that runs several days is planned for its first weekend day, if it has one
    let day = from;
    for (let d = from; d <= to; d++) {
      if (isWeekend(todayStart, d)) {
        day = d;
        break;
      }
    }
    return { event, pillar: 'fairs', province, day, startDay: from, endDay: to };
  }

  if (startDay < 0 || startDay > HORIZON_DAYS || event.participantsCount >= event.maxParticipants) return null;
  return { event, pillar: 'community', province, day: startDay, startDay, endDay: startDay };
}

const eventStop = ({ event, pillar }: Anchor): PlanStop => ({
  pillar,
  id: event.id,
  href: `/${pillar === 'fairs' ? 'events' : 'community'}/${encodeURIComponent(event.id)}`,
  title: event.title,
  image: event.image,
  meta: pillar === 'fairs' ? event.location : [event.time, event.location].filter(Boolean).join(' · '),
});

const spotStop = (spot: LifestyleSpotItem): PlanStop => ({
  pillar: 'spots',
  id: spot.id,
  href: `/spots/${encodeURIComponent(spot.id)}`,
  title: spot.title,
  image: spot.image,
  meta: [spot.categoryLabel, spot.district].filter(Boolean).join(' · '),
});

export function buildHolidayPlans({ events, spots, mood, todayStart, limit = 3 }: BuildPlansInput): HolidayPlan[] {
  const firstPillar = mood === 'connect' ? 'community' : 'fairs';
  const anchors = (events.map((e) => toAnchor(e, todayStart)).filter(Boolean) as Anchor[]).sort(
    (a, b) =>
      Number(b.pillar === firstPillar) - Number(a.pillar === firstPillar) ||
      Number(isWeekend(todayStart, b.day)) - Number(isWeekend(todayStart, a.day)) ||
      a.day - b.day
  );

  // Places of each province, best known first; in Connect mood, places open for meet-ups come first
  const spotsByProvince = new Map<string, LifestyleSpotItem[]>();
  const score = (s: LifestyleSpotItem) => (s.popularity || 0) + (s.rating > 0 ? s.rating * 200 : 0);
  for (const spot of [...spots].sort((a, b) => score(b) - score(a))) {
    if (spot.publicationStatus === 'draft' || !spot.image) continue;
    const key = provinceKey(spot.province);
    if (!spotsByProvince.has(key)) spotsByProvince.set(key, []);
    spotsByProvince.get(key)!.push(spot);
  }
  if (mood === 'connect') {
    spotsByProvince.forEach((list, key) => spotsByProvince.set(key, [...list.filter(allowsMeetups), ...list.filter((s) => !allowsMeetups(s))]));
  }

  const plans: HolidayPlan[] = [];
  const usedIds = new Set<string>();
  const usedProvinces = new Set<string>();

  const tryAnchor = (anchor: Anchor) => {
    if (plans.length >= limit || usedIds.has(anchor.event.id)) return;
    const places = (spotsByProvince.get(anchor.province) || []).filter((s) => !usedIds.has(s.id));
    if (places.length === 0) return;

    // Something from the other pillar on the same day in the same province, if there is one
    const companion = anchors.find(
      (other) =>
        other.pillar !== anchor.pillar &&
        other.province === anchor.province &&
        !usedIds.has(other.event.id) &&
        other.startDay <= anchor.day &&
        other.endDay >= anchor.day
    );

    const eventStops = [anchor, companion].filter(Boolean) as Anchor[];
    // A meetup has a set hour, so it comes before the fair, which is open all day
    eventStops.sort((a, b) => Number(a.pillar === 'fairs') - Number(b.pillar === 'fairs'));
    const placeStops = places.slice(0, 3 - eventStops.length);
    const stops = [...placeStops.slice(0, 1).map(spotStop), ...eventStops.map(eventStop), ...placeStops.slice(1).map(spotStop)];

    stops.forEach((stop) => usedIds.add(stop.id));
    usedProvinces.add(anchor.province);
    const date = new Date(todayStart + anchor.day * DAY_MS);
    plans.push({
      id: `${anchor.province}-${anchor.day}-${anchor.event.id}`,
      province: anchor.province,
      dateLabel: `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`,
      stops,
    });
  };

  // First one plan per province, then fill what is left
  anchors.forEach((anchor) => {
    if (!usedProvinces.has(anchor.province)) tryAnchor(anchor);
  });
  anchors.forEach(tryAnchor);

  return plans;
}

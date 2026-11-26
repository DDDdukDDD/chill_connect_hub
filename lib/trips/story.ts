/**
 * Trip stories (docs/TRIPS_PLAN.md): the shapes the pages receive, and how a trip's photos become a story.
 * Pure functions with no server imports, so the player in the browser and the server page tell the same story.
 */

export type TripVisibility = 'public' | 'followers' | 'private';
export type TripStatus = 'draft' | 'published' | 'hidden' | 'removed';

export interface TripPerson {
  id: string;
  name: string;
  avatar?: string;
}

export interface TripItemView {
  id: string;
  kind: 'photo' | 'video';
  /** Photo, or the clip itself */
  mediaUrl: string;
  posterUrl?: string;
  ratio?: number;
  caption: string;
  /** Wall-clock time where it was taken: "2026-12-05T18:40" */
  takenLocal: string;
  city?: string;
  country?: string;
  countryCode?: string;
  /** Rounded to about 1 km; only for drawing the route */
  lat?: number;
  lng?: number;
  /** The post it came from */
  momentId?: string;
  /** Only in the author's own view */
  hidden?: boolean;
}

export interface TripView {
  id: string;
  title: string;
  intro: string;
  startsOn: string;
  endsOn: string;
  visibility: TripVisibility;
  status: TripStatus;
  author: TripPerson;
  withPeople: TripPerson[];
  coverItemId?: string;
  /** Sub-trips by city the author set, in order */
  legs: TripLeg[];
  /** The trip this one was planned from ("ไปตามรอย"), while it can still be seen */
  follows?: { id: string; title: string; authorName: string };
  /** Members who planned a trip after this one */
  followedCount: number;
  items: TripItemView[];
  publishedAt?: string;
  createdAt: string;
  /** The viewer wrote it */
  isOwner: boolean;
}

/** A sub-trip (owner 2026-11-26): days in one city inside the big trip, e.g. เซินเจิ้น 7–9 ธ.ค. */
export interface TripLeg {
  id: string;
  city: string;
  /** "YYYY-MM-DD", both days included */
  from: string;
  to: string;
}

export interface TripChapter {
  /** "YYYY-MM-DD" */
  day: string;
  /** "วันที่ 2" */
  label: string;
  /** The city of the day: its sub-trip's, else where most of its photos were taken */
  title: string;
  items: TripItemView[];
}

/** A sub-trip as told: the author's, or days outside every sub-trip grouped by the city of their photos */
export interface TripPart {
  /** The sub-trip's id; "auto-YYYY-MM-DD" for a group the author did not set */
  id: string;
  city: string;
  from: string;
  to: string;
  /** 1, 2, 3 … in the order of the trip */
  number: number;
  chapters: TripChapter[];
}

export const MAX_TRIP_LEGS = 20;

export interface TripStop {
  name: string;
  /** Position on the route drawing, 0-100 */
  x: number;
  y: number;
}

export const MAX_TRIP_ITEMS = 300;
export const MAX_TRIP_DAYS = 61;
export const MAX_TRIP_TITLE = 80;
export const MAX_TRIP_INTRO = 300;
export const MAX_ITEM_CAPTION = 300;

const DAY_MS = 24 * 60 * 60 * 1000;
const dayOf = (takenLocal: string) => takenLocal.slice(0, 10);
export const timeOf = (takenLocal: string) => takenLocal.slice(11, 16);

/** Days between two "YYYY-MM-DD" dates (0 for the same day) */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** Whole days of the trip, counting the first */
export const tripLength = (trip: Pick<TripView, 'startsOn' | 'endsOn'>) => daysBetween(trip.startsOn, trip.endsOn) + 1;

/** The one city name to show for an item: the city, else the country */
const placeOf = (item: TripItemView) => item.city || item.country || '';

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best = '';
  let bestCount = 0;
  for (const [value, count] of counts) if (count > bestCount) [best, bestCount] = [value, count];
  return best;
}

/** Items the story shows, oldest first */
export const visibleItems = (trip: Pick<TripView, 'items'>) =>
  trip.items.filter((item) => !item.hidden).sort((a, b) => a.takenLocal.localeCompare(b.takenLocal));

/** The sub-trip a day falls in */
export const legOfDay = (legs: TripLeg[], day: string) => legs.find((leg) => day >= leg.from && day <= leg.to);

/**
 * One chapter per day that has photos. A day is named after its sub-trip's city; outside every sub-trip, after the
 * city most of its photos were taken in, else after the nearest day that has a city.
 */
export function tripChapters(trip: Pick<TripView, 'items' | 'startsOn' | 'legs'>): TripChapter[] {
  const byDay = new Map<string, TripItemView[]>();
  for (const item of visibleItems(trip)) {
    const day = dayOf(item.takenLocal);
    byDay.set(day, [...(byDay.get(day) ?? []), item]);
  }
  const days = [...byDay.keys()].sort();
  const known = new Map(days.map((day) => [day, legOfDay(trip.legs, day)?.city || mostCommon(byDay.get(day)!.map(placeOf))]));
  return days.map((day) => {
    let title = known.get(day) || '';
    if (!title) {
      const nearest = days.filter((d) => known.get(d)).sort((a, b) => Math.abs(daysBetween(a, day)) - Math.abs(daysBetween(b, day)))[0];
      title = nearest ? known.get(nearest)! : '';
    }
    const number = daysBetween(trip.startsOn, day) + 1;
    return { day, label: number >= 1 ? `วันที่ ${number}` : thaiShortDate(day), title, items: byDay.get(day)! };
  });
}

/**
 * The trip as sub-trips, in order: each of the author's sub-trips that has photos, and the days outside them grouped
 * by city (one group per run of days in the same city, so China → Hong Kong → China gives three).
 */
export function tripParts(trip: Pick<TripView, 'items' | 'startsOn' | 'legs'>): TripPart[] {
  const parts: Omit<TripPart, 'number'>[] = [];
  for (const chapter of tripChapters(trip)) {
    const leg = legOfDay(trip.legs, chapter.day);
    const last = parts[parts.length - 1];
    const id = leg ? leg.id : `auto-${chapter.day}`;
    if (last && (leg ? last.id === leg.id : last.id.startsWith('auto-') && last.city === chapter.title)) {
      last.chapters.push(chapter);
      last.to = chapter.day;
    } else parts.push({ id, city: leg?.city ?? chapter.title, from: leg?.from ?? chapter.day, to: leg?.to ?? chapter.day, chapters: [chapter] });
  }
  return parts.map((part, i) => ({ ...part, number: i + 1 }));
}

/** Sub-trips the photos suggest, for the editor's "ตามเมืองในรูป" */
export function suggestedLegs(trip: Pick<TripView, 'items' | 'startsOn'>): Omit<TripLeg, 'id'>[] {
  return tripParts({ ...trip, legs: [] })
    .filter((part) => part.city)
    .map(({ city, from, to }) => ({ city, from, to }));
}

/**
 * The route: one stop per sub-trip, placed by the average position of its photos (north up). When a stop has no
 * located photo the stops are laid out in order instead, so a trip told without GPS still gets its route.
 */
export function tripStops(trip: Pick<TripView, 'items' | 'startsOn' | 'legs'>): TripStop[] {
  const parts = tripParts(trip).filter((part) => part.city);
  if (parts.length < 2) return [];
  const points = parts.map((part) => {
    const located = part.chapters.flatMap((c) => c.items).filter((i) => i.lat !== undefined && i.lng !== undefined);
    return {
      name: part.city,
      lat: located.length ? located.reduce((s, i) => s + i.lat!, 0) / located.length : undefined,
      lng: located.length ? located.reduce((s, i) => s + i.lng!, 0) / located.length : undefined,
    };
  });
  const lats = points.map((p) => p.lat);
  const spread = points.every((p) => p.lat !== undefined) && new Set(points.map((p) => `${p.lat!.toFixed(2)},${p.lng!.toFixed(2)}`)).size > 1;
  if (!spread) {
    // In order, a gentle zigzag from left to right
    return points.map((p, i) => ({ name: p.name, x: Math.round(15 + (70 * i) / (points.length - 1)), y: i % 2 ? 62 : 38 }));
  }
  // Equirectangular projection, the longer side filling 15–85 so labels fit
  const ys = lats as number[];
  const mid = ((Math.min(...ys) + Math.max(...ys)) / 2) * (Math.PI / 180);
  const xs = points.map((p) => p.lng! * Math.cos(mid));
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY, 0.0001);
  const width = ((Math.max(...xs) - minX) / span) * 70;
  const height = ((Math.max(...ys) - minY) / span) * 70;
  return points.map((p, i) => ({
    name: p.name,
    x: Math.round((15 + (70 - width) / 2 + ((xs[i] - minX) / span) * 70) * 10) / 10,
    y: Math.round((15 + (70 - height) / 2 + ((Math.max(...ys) - ys[i]) / span) * 70) * 10) / 10,
  }));
}

/** Distinct cities (by sub-trip, in order) and countries, for the end of the story and the page */
export function tripPlaces(trip: Pick<TripView, 'items' | 'startsOn' | 'legs'>) {
  const cities = [...new Set(tripParts(trip).map((part) => part.city).filter(Boolean))];
  const countries = new Set(visibleItems(trip).map((item) => item.country).filter(Boolean) as string[]);
  return { cities, countries: [...countries] };
}

/** One sub-trip told on its own (its link and "เล่นเฉพาะ…"): its days only, numbered from its first day */
export function subTrip(trip: TripView, partId: string): TripView | null {
  const part = tripParts(trip).find((p) => p.id === partId);
  if (!part) return null;
  const ids = new Set(part.chapters.flatMap((c) => c.items.map((i) => i.id)));
  const days = daysBetween(part.from, part.to) + 1;
  return {
    ...trip,
    title: `${part.city || trip.title}${days > 1 ? ` ${days} วัน` : ''}`,
    intro: '',
    startsOn: part.from,
    endsOn: part.to,
    legs: [{ id: part.id, city: part.city, from: part.from, to: part.to }],
    items: trip.items.filter((i) => ids.has(i.id)),
    coverItemId: trip.coverItemId && ids.has(trip.coverItemId) ? trip.coverItemId : undefined,
  };
}

/** "YYYY-MM-DD" sub-trips from a request: cleaned, in order, inside the trip, not overlapping */
export function cleanLegs(value: unknown, startsOn: string, endsOn: string): TripLeg[] | string {
  const list = Array.isArray(value) ? value : [];
  if (list.length > MAX_TRIP_LEGS) return `ทริปย่อยได้ไม่เกิน ${MAX_TRIP_LEGS} ช่วง`;
  const legs: TripLeg[] = [];
  for (const raw of list) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const city = typeof r.city === 'string' ? r.city.replace(/\s+/g, ' ').trim().slice(0, 60) : '';
    const from = cleanDay(r.from);
    const to = cleanDay(r.to) ?? from;
    if (!city) return 'ใส่ชื่อเมืองของทุกทริปย่อย';
    if (!from || !to || to < from) return `วันของ ${city} ไม่ถูกต้อง`;
    if (from < startsOn || to > endsOn) return `วันของ ${city} ต้องอยู่ในช่วงทริป`;
    const id = typeof r.id === 'string' && /^[a-z0-9]{6,12}$/.test(r.id) ? r.id : Math.random().toString(36).slice(2, 10).padEnd(8, '0');
    legs.push({ id, city, from, to });
  }
  legs.sort((a, b) => a.from.localeCompare(b.from));
  for (let i = 1; i < legs.length; i++) if (legs[i].from <= legs[i - 1].to) return `${legs[i - 1].city} กับ ${legs[i].city} วันซ้อนกัน`;
  return legs;
}

export function tripCover(trip: Pick<TripView, 'items' | 'coverItemId'>): TripItemView | undefined {
  const items = visibleItems(trip);
  return items.find((item) => item.id === trip.coverItemId) ?? items[0];
}

/** The picture an item shows in grids and the player's background */
export const itemPicture = (item: TripItemView) => (item.kind === 'video' ? item.posterUrl || item.mediaUrl : item.mediaUrl);

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** "5 ธ.ค." */
export function thaiShortDate(day: string): string {
  const [, m, d] = day.split('-').map(Number);
  return `${d} ${THAI_MONTHS[m - 1]}`;
}

/** "4–13 ธ.ค. 2569", "28 พ.ย. – 3 ธ.ค. 2569", or one day */
export function thaiDateRange(from: string, to: string): string {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const year = (y: number) => y + 543;
  if (from === to) return `${fd} ${THAI_MONTHS[fm - 1]} ${year(fy)}`;
  if (fy === ty && fm === tm) return `${fd}–${td} ${THAI_MONTHS[fm - 1]} ${year(fy)}`;
  if (fy === ty) return `${fd} ${THAI_MONTHS[fm - 1]} – ${td} ${THAI_MONTHS[tm - 1]} ${year(ty)}`;
  return `${fd} ${THAI_MONTHS[fm - 1]} ${year(fy)} – ${td} ${THAI_MONTHS[tm - 1]} ${year(ty)}`;
}

/** "ทริป 10 วัน", or "เรื่องสั้น" for one day */
export const tripTag = (trip: Pick<TripView, 'startsOn' | 'endsOn'>) => (tripLength(trip) > 1 ? `ทริป ${tripLength(trip)} วัน` : 'เรื่องสั้น');

/** The phone's wall-clock time now as "YYYY-MM-DDTHH:MM" (browser only) */
export function localNow(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "YYYY-MM-DDTHH:MM" with sane parts, or null */
export function cleanLocalTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`;
}

export function cleanDay(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? null : value;
}

/**
 * "ไปตามรอยทริปนี้": the source trip's sub-trips moved to start on `startsOn` (the author's own, else the cities its
 * photos were grouped into), for a new trip of the same length
 */
export function followedLegs(source: TripView, startsOn: string): { endsOn: string; legs: Omit<TripLeg, 'id'>[] } {
  const shift = (day: string, by: number) => {
    const date = new Date(`${day}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + by);
    return date.toISOString().slice(0, 10);
  };
  const offset = daysBetween(source.startsOn, startsOn);
  const endsOn = shift(source.endsOn, offset);
  const from = source.legs.length ? source.legs : tripParts(source).filter((p) => p.city).map(({ city, from: f, to }) => ({ id: '', city, from: f, to }));
  const legs = from
    .map((leg) => ({ city: leg.city, from: shift(leg.from, offset), to: shift(leg.to, offset) }))
    .filter((leg) => leg.from >= startsOn && leg.to <= endsOn);
  return { endsOn, legs };
}

import type { LifestyleSpotItem } from '@/data/spotsData';
import { getSpotVibeCategory } from '@/lib/spotVibe';
import { getDistanceKm } from '@/lib/nearbySpots';
import { effectiveTier } from '@/lib/spotCuration';

/**
 * Smart Plan (owner 2026-10-25): "ไปที่นี่แล้วไปต่อไหน". Starts at the place being viewed and adds one or two
 * places of a different kind near by, in the order that makes the shortest trip, with times that fit each place's
 * opening hours. Fewer good places near by make a shorter plan, never one filled with far or closed places.
 */

/** Within driving reach (owner 2026-10-25); closer places score higher inside it */
export const PLAN_RADIUS_KM = 30;
const MAX_OTHERS = 2;
const DAY_START = 9 * 60;

export interface PlanStop {
  spot: LifestyleSpotItem;
  /** Minutes after midnight */
  arrive: number;
  leave: number;
  /** From the previous stop; absent on the first */
  travel?: { km: number; minutes: number; walk: boolean };
}

// How long people usually stay, in minutes
const STAY: Partial<Record<LifestyleSpotItem['category'], number>> = {
  cafe: 60, restaurant: 75, bar: 120, temple: 60, museum: 90, art: 75, park: 75, nature: 120, beach: 120,
  viewpoint: 60, market: 90, mall: 120, oldtown: 90, attraction: 90, workspace: 90, coworking: 90,
};
const stayOf = (spot: LifestyleSpotItem) => STAY[spot.category] ?? 90;

/** Opening hours as minutes, from the first "08:00-17:00" in the text; null when the text gives no times */
export function openWindow(text?: string): { open: number; close: number } | null {
  const match = (text || '').match(/(\d{1,2})[:.](\d{2})\s*(?:-|–|ถึง)\s*(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  const open = Number(match[1]) * 60 + Number(match[2]);
  let close = Number(match[3]) * 60 + Number(match[4]);
  // "00:00-00:00" is all day; a close before the open runs past midnight
  if (close <= open) close += 24 * 60;
  return { open, close };
}

const roundUp5 = (n: number) => Math.ceil(n / 5) * 5;
export function travelBetween(a: LifestyleSpotItem, b: LifestyleSpotItem) {
  const km = getDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
  const walk = km < 1;
  return { km, walk, minutes: Math.max(5, roundUp5(walk ? km * 15 : 10 + km * 2.5)) };
}

/** Times for stops in this order, or null when a stop would be closed */
function schedule(order: LifestyleSpotItem[]): PlanStop[] | null {
  const stops: PlanStop[] = [];
  let clock = 0;
  for (let i = 0; i < order.length; i++) {
    const spot = order[i];
    const hours = openWindow(spot.openHours);
    const travel = i > 0 ? travelBetween(order[i - 1], spot) : undefined;
    let arrive = i === 0 ? Math.max(DAY_START, hours?.open ?? DAY_START) : clock + (travel?.minutes ?? 0);
    if (hours && arrive < hours.open) arrive = hours.open;
    const leave = arrive + stayOf(spot);
    if (hours && leave > hours.close) return null;
    // A plan ends by late evening
    if (leave > 23 * 60) return null;
    stops.push({ spot, arrive, leave, travel });
    clock = leave;
  }
  return stops;
}

/** The place first, then the others in whichever order makes the shortest trip that fits their hours */
function bestSchedule(start: LifestyleSpotItem, others: LifestyleSpotItem[]): PlanStop[] | null {
  const orders = others.length < 2 ? [others] : [others, [...others].reverse()];
  let best: { stops: PlanStop[]; km: number } | null = null;
  for (const rest of orders) {
    const stops = schedule([start, ...rest]);
    if (!stops) continue;
    const km = stops.reduce((sum, s) => sum + (s.travel?.km ?? 0), 0);
    if (!best || km < best.km) best = { stops, km };
  }
  return best?.stops ?? null;
}

const baseName = (title: string) => title.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();

/** Places that could follow this one, best first */
export function planCandidates(current: LifestyleSpotItem, catalog: LifestyleSpotItem[]): LifestyleSpotItem[] {
  const here = baseName(current.title);
  const scored: Array<{ spot: LifestyleSpotItem; score: number }> = [];
  for (const spot of catalog) {
    if (spot.id === current.id || spot.publicationStatus === 'draft' || effectiveTier(spot) === 'hidden') continue;
    const km = getDistanceKm(current.latitude, current.longitude, spot.latitude, spot.longitude);
    if (km > PLAN_RADIUS_KM || km < 0.2) continue;
    // The same place under another name
    const name = baseName(spot.title);
    if (!name || name === here || name.includes(here) || here.includes(name)) continue;
    const score = (effectiveTier(spot) === 'featured' ? 30 : 10) + Math.min(spot.rating || 0, 5) * 2 - km * 2;
    scored.push({ spot, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((entry) => entry.spot);
}

const vibeOf = (spot: LifestyleSpotItem) => getSpotVibeCategory(spot);

/**
 * The plan for these chosen places, or a fresh pick: each added place is of a kind the plan does not have yet and
 * must fit the times. `skip` leaves out places the person swapped away.
 */
export function buildPlan(
  current: LifestyleSpotItem,
  candidates: LifestyleSpotItem[],
  chosen: LifestyleSpotItem[] | null,
  skip: Set<string> = new Set(),
): PlanStop[] {
  if (chosen) return bestSchedule(current, chosen) ?? [{ spot: current, arrive: DAY_START, leave: DAY_START + stayOf(current) }];
  const picked: LifestyleSpotItem[] = [];
  for (const spot of candidates) {
    if (picked.length >= MAX_OTHERS) break;
    if (skip.has(spot.id)) continue;
    if ([current, ...picked].some((s) => vibeOf(s) === vibeOf(spot))) continue;
    if (bestSchedule(current, [...picked, spot])) picked.push(spot);
  }
  return bestSchedule(current, picked) ?? [{ spot: current, arrive: DAY_START, leave: DAY_START + stayOf(current) }];
}

/** Another place for one stop: a kind the rest of the plan does not have, that still fits the times */
export function replacementFor(
  current: LifestyleSpotItem,
  candidates: LifestyleSpotItem[],
  others: LifestyleSpotItem[],
  index: number,
  skip: Set<string>,
): LifestyleSpotItem | null {
  const rest = others.filter((_, i) => i !== index);
  const shown = new Set(others.map((s) => s.id));
  for (const spot of candidates) {
    if (shown.has(spot.id) || skip.has(spot.id)) continue;
    if ([current, ...rest].some((s) => vibeOf(s) === vibeOf(spot))) continue;
    const next = [...rest];
    next.splice(index, 0, spot);
    if (bestSchedule(current, next)) return spot;
  }
  return null;
}

export const clockText = (minutes: number) => {
  const m = minutes % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** Google Maps directions through every stop, by coordinates so a name never lands on another place */
export function planMapsUrl(stops: PlanStop[]): string {
  const at = (s: LifestyleSpotItem) => `${s.latitude},${s.longitude}`;
  if (stops.length < 2) return `https://www.google.com/maps/search/?api=1&query=${at(stops[0].spot)}`;
  const waypoints = stops.slice(1, -1).map((s) => at(s.spot)).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${at(stops[0].spot)}&destination=${at(stops[stops.length - 1].spot)}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''}`;
}

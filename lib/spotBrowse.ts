import { db } from '@/lib/db';
import { getNearbySpots, getSpotVibeCategory, type LifestyleSpotItem } from '@/data/spotsData';
import { MASTER_SPOT_CATEGORIES } from '@/data/masterHub';
import { calculateDistanceKm } from '@/data/zones';
import { ALL_PROVINCES, matchesQuery, spotInProvince, spotSearchText } from '@/lib/discoverMatch';
import { compareSpotsByRank, shownWhenBrowsing } from '@/lib/spotRanking';
import { spotListItem } from '@/lib/listItems';
import { planCandidates } from '@/lib/spotDayPlan';

/**
 * The /spots list worked out on the server. The browser used to download the whole catalog (~2,000 places, about 7 MB
 * in 21 requests) and filter it itself, which made the page and the next tab slow on phones (2026-10-28). Now the server
 * filters, ranks and counts with the same rules, and sends only the places on screen.
 */

/** Groups with fewer places nationwide stay off the category rail until the catalog has enough (owner 2026-10-25) */
const MIN_SPOTS_PER_GROUP = 10;
const VIBE_IDS = new Set<string>(MASTER_SPOT_CATEGORIES.map((c) => c.id));

type Indexed = { spot: LifestyleSpotItem; text: string; vibe: string; shown: boolean };

export type SpotBrowseParams = {
  q?: string;
  province?: string;
  /** A vibe group id, or a plain spot category */
  category?: string;
  free?: boolean;
  /** Only these ids (the member's saved places) */
  ids?: string[];
  near?: { lat: number; lng: number };
  /** When the visitor opened the list, so "new" places keep their spot across "แสดงเพิ่มเติม" */
  openedAt?: number;
  limit?: number;
};

export type SpotBrowseResult = {
  spots: (LifestyleSpotItem & { distanceKm?: number })[];
  total: number;
  /** Places per vibe group in the picked province, for the category tabs */
  counts: Record<string, number>;
  /** Vibe groups with enough places nationwide to show on the rail */
  railIds: string[];
  /** The time the order was worked out for (pass it back as `t` so "แสดงเพิ่มเติม" keeps the order) */
  openedAt: number;
};

// One index per catalog read: the database layer hands back the same array until a place changes
const indexes = new WeakMap<LifestyleSpotItem[], { all: Indexed[]; rail: string[] }>();

async function catalogIndex() {
  const first = await db.findSpots({ page: 1, limit: 100 });
  const known = indexes.get(first.items);
  if (known) return known;
  const spots = [...first.items];
  for (let page = 2; spots.length < first.totalCount && page <= 100; page += 1) {
    const next = await db.findSpots({ page, limit: 100 });
    spots.push(...next.items);
    if (!next.hasNextPage) break;
  }
  const all = spots.map((spot) => ({ spot, text: spotSearchText(spot), vibe: getSpotVibeCategory(spot), shown: shownWhenBrowsing(spot) }));
  const nationwide: Record<string, number> = {};
  for (const entry of all) if (entry.shown) nationwide[entry.vibe] = (nationwide[entry.vibe] || 0) + 1;
  const index = { all, rail: MASTER_SPOT_CATEGORIES.filter((c) => (nationwide[c.id] || 0) >= MIN_SPOTS_PER_GROUP).map((c) => c.id) };
  indexes.set(first.items, index);
  return index;
}

export async function browseSpots(params: SpotBrowseParams): Promise<SpotBrowseResult> {
  const { all, rail } = await catalogIndex();
  const query = params.q?.trim() ?? '';
  const province = params.province || ALL_PROVINCES;
  const category = params.category && params.category !== 'all' ? params.category : '';
  const ids = params.ids ? new Set(params.ids) : null;
  const openedAt = params.openedAt ?? Date.now();

  const counts: Record<string, number> = { all: 0 };
  const found: Indexed[] = [];
  for (const entry of all) {
    if (!spotInProvince(entry.spot, province, entry.text)) continue;
    if (entry.shown) {
      counts.all += 1;
      counts[entry.vibe] = (counts[entry.vibe] || 0) + 1;
    }
    if (category && (VIBE_IDS.has(category) ? entry.vibe !== category : entry.spot.category !== category)) continue;
    if (ids && !ids.has(entry.spot.id)) continue;
    if (params.free && !entry.spot.price?.includes('ฟรี')) continue;
    if (!matchesQuery(entry.text, query)) continue;
    // Places curated as hidden show only when searched for (saved ones still show in the saved list)
    if (!query && !ids && !entry.shown) continue;
    found.push(entry);
  }

  let ranked: (LifestyleSpotItem & { distanceKm?: number })[];
  if (params.near) {
    const { lat, lng } = params.near;
    ranked = found
      .map(({ spot }) => ({ spot, km: spot.latitude && spot.longitude ? calculateDistanceKm(lat, lng, spot.latitude, spot.longitude) : undefined }))
      .sort((a, b) => (a.km ?? 999) - (b.km ?? 999))
      .map(({ spot, km }) => ({ ...spot, distanceKm: km === undefined ? undefined : Math.round(km * 10) / 10 }));
  } else {
    ranked = found.map((entry) => entry.spot).sort(compareSpotsByRank(openedAt));
  }

  const limit = Math.min(Math.max(params.limit ?? 24, 1), 200);
  return {
    spots: ranked.slice(0, limit).map((spot) => ({ ...spotListItem(spot), ...(spot.distanceKm !== undefined ? { distanceKm: spot.distanceKm } : {}) })),
    total: ranked.length,
    counts,
    railIds: category && !rail.includes(category) ? [...rail, category] : rail,
    openedAt,
  };
}

/** The browse parameters from an address (`/spots?q=…&province=…&category=…&price=free`) or the API's query string */
export function browseParamsFrom(get: (key: string) => string | null | undefined): SpotBrowseParams {
  const num = (key: string) => {
    const value = Number(get(key));
    return Number.isFinite(value) && get(key) ? value : undefined;
  };
  const lat = num('lat');
  const lng = num('lng');
  const ids = get('ids');
  return {
    q: get('q') ?? undefined,
    province: get('province') ?? undefined,
    category: get('category') ?? undefined,
    free: get('price') === 'free',
    ids: ids != null ? ids.split(',').filter(Boolean) : undefined,
    near: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
    openedAt: num('t'),
    limit: num('limit'),
  };
}

/** Cafés count as "near" within this (components/NearbyDiningSection.tsx, and the Google search radius) */
const DINING_KM = 3;

/**
 * What a place page needs for its "nearby" sections, so it does not download the whole catalog: the best-scored
 * nearby places (same rules as getNearbySpots), everything within a short ride for the café list, and the best
 * day-plan stops (components/SmartSpotPlanCard.tsx; that card used to download the whole catalog too).
 */
export async function nearbyPool(spot: LifestyleSpotItem): Promise<LifestyleSpotItem[]> {
  const { all } = await catalogIndex();
  const spots = all.map((entry) => entry.spot);
  const best = getNearbySpots(spot, 24, spots);
  const close =
    spot.latitude && spot.longitude
      ? spots
          .filter((s) => s.id !== spot.id && s.latitude && s.longitude && calculateDistanceKm(spot.latitude, spot.longitude, s.latitude, s.longitude) <= DINING_KM)
          .slice(0, 80)
      : [];
  const seen = new Set<string>();
  const plan = planCandidates(spot, spots).slice(0, 40);
  return [...best, ...close, ...plan].filter((s) => !seen.has(s.id) && seen.add(s.id)).map(spotListItem);
}

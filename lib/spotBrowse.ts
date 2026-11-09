import { db } from '@/lib/db';
import { getNearbySpots, getSpotVibeCategory, type LifestyleSpotItem } from '@/data/spotsData';
import { MASTER_SPOT_CATEGORIES } from '@/data/masterHub';
import { calculateDistanceKm } from '@/data/zones';
import { ALL_PROVINCES, matchesQuery, spotInProvince, spotSearchText } from '@/lib/discoverMatch';
import { compareSpotsByRank, shownWhenBrowsing } from '@/lib/spotRanking';
import { spotListItem } from '@/lib/listItems';
import { planCandidates } from '@/lib/spotDayPlan';
import { isSpotOpenNow } from '@/lib/openHours';
import { bangkokDistrictOf } from '@/data/bangkokDistricts';

/**
 * The /spots list worked out on the server. The browser used to download the whole catalog (~2,000 places, about 7 MB
 * in 21 requests) and filter it itself, which made the page and the next tab slow on phones (2026-10-28). Now the server
 * filters, ranks and counts with the same rules, and sends only the places on screen.
 */

/** Groups with fewer places nationwide stay off the category rail until the catalog has enough (owner 2026-10-25) */
const MIN_SPOTS_PER_GROUP = 10;
const VIBE_IDS = new Set<string>(MASTER_SPOT_CATEGORIES.map((c) => c.id));

type Indexed = { spot: LifestyleSpotItem; text: string; vibe: string; shown: boolean; district: string };

/** A district as people say it: "เขตบางรัก", "อ.เมือง" and "อำเภอเมือง" read as "บางรัก" and "เมือง". In Bangkok a
 *  sub-district (แขวง) counts as its district: "ลุมพินี" is ปทุมวัน (data/bangkokDistricts.ts) */
export function districtName(district?: string, province?: string): string {
  const name = (district || '').trim().replace(/^(เขต|อำเภอ|อ.)s*/, '').trim();
  // "จังหวัดเชียงใหม่" in the district field names the province, not a district
  if (name.startsWith('จังหวัด')) return '';
  return name && /กรุงเทพ/.test(province || '') ? bangkokDistrictOf(name) : name;
}

/** At most this many districts are offered in the filter, the ones with the most places */
const DISTRICTS_SHOWN = 60;

export type SpotBrowseParams = {
  q?: string;
  province?: string;
  /** Districts inside the province, as districtName() gives them; a place in any of them shows */
  districts?: string[];
  /** Only places whose hours say they are open now */
  openNow?: boolean;
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
  /** Districts of the picked province with their number of places, most first (empty for the whole country) */
  districts: { name: string; count: number }[];
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
  const all = spots.map((spot) => ({ spot, text: spotSearchText(spot), vibe: getSpotVibeCategory(spot), shown: shownWhenBrowsing(spot), district: districtName(spot.district, spot.province) }));
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
  // Whole minutes: the list's address carries this time, and visitors in the same minute then share the CDN's copy
  const openedAt = Math.floor((params.openedAt ?? Date.now()) / 60_000) * 60_000;
  const districts = province !== ALL_PROVINCES && params.districts?.length ? new Set(params.districts.map((name) => districtName(name, province))) : null;
  const now = Date.now();
  const districtCounts = new Map<string, number>();

  const counts: Record<string, number> = { all: 0 };
  const found: Indexed[] = [];
  for (const entry of all) {
    if (!spotInProvince(entry.spot, province, entry.text)) continue;
    if (province !== ALL_PROVINCES && entry.shown && entry.district) districtCounts.set(entry.district, (districtCounts.get(entry.district) || 0) + 1);
    if (districts && !districts.has(entry.district)) continue;
    if (entry.shown) {
      counts.all += 1;
      counts[entry.vibe] = (counts[entry.vibe] || 0) + 1;
    }
    if (category && (VIBE_IDS.has(category) ? entry.vibe !== category : entry.spot.category !== category)) continue;
    if (ids && !ids.has(entry.spot.id)) continue;
    if (params.free && !entry.spot.price?.includes('ฟรี')) continue;
    if (params.openNow && !isSpotOpenNow(entry.spot.openHours, now)) continue;
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
    districts: [...districtCounts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'th')).slice(0, DISTRICTS_SHOWN),
    railIds: category && !rail.includes(category) ? [...rail, category] : rail,
    openedAt,
  };
}

/** The browse parameters from an address (`/spots?q=…&province=…&district=a,b&category=…&price=free&open=now`) or the API's query string */
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
    districts: get('district')?.split(',').map((name) => name.trim()).filter(Boolean),
    openNow: get('open') === 'now',
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

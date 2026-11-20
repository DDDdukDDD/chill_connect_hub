import type { LifestyleSpotItem } from '@/data/spotsData';

/**
 * "Do we have this place already?" for importers (TAT, OSM venues). A place matches when it is the same record
 * (id or source URL), has the same name in the same province, lies within 60 m, or lies within 250 m with an
 * overlapping name. Venue imports (cafés side by side, one café with branches) pass `nearbyMetres: 0` and
 * `sameNameInProvince: false`, so only a close place with an overlapping name counts.
 */

export const normName = (value: string) => value.toLocaleLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^\p{L}\p{N}]+/gu, '');

export const metres = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(h));
};

export const namesOverlap = (a: string, b: string) => {
  const x = normName(a);
  const y = normName(b);
  return x.length >= 3 && y.length >= 3 && (x.includes(y) || y.includes(x));
};

export const provinceKey = (p: string) => p.replace(/^จังหวัด/, '').replace(/^กรุงเทพมหานคร$/, 'กรุงเทพฯ').trim();

export interface MatchCandidate { id: string; title: string; province: string; latitude: number; longitude: number; sourceUrl?: string }

/** A matcher over the places we have; `add` keeps it current while an import adds places */
export function placeMatcher(existing: LifestyleSpotItem[], { nearbyMetres = 60, sameNameInProvince = true }: { nearbyMetres?: number; sameNameInProvince?: boolean } = {}) {
  const bySource = new Map(existing.filter((s) => s.sourceUrl).map((s) => [s.sourceUrl!, s]));
  const byId = new Map(existing.map((s) => [s.id, s]));
  const byName = new Map(existing.map((s) => [`${normName(s.title)}|${provinceKey(s.province)}`, s]));
  const points = existing.filter((s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude));
  return {
    match(spot: MatchCandidate): LifestyleSpotItem | null {
      const same = byId.get(spot.id) ?? (spot.sourceUrl ? bySource.get(spot.sourceUrl) : undefined) ?? (sameNameInProvince ? byName.get(`${normName(spot.title)}|${provinceKey(spot.province)}`) : undefined);
      if (same) return same;
      if (!Number.isFinite(spot.latitude) || !Number.isFinite(spot.longitude)) return null;
      for (const other of points) {
        if (Math.abs(other.latitude - spot.latitude) > 0.003 || Math.abs(other.longitude - spot.longitude) > 0.003) continue;
        const d = metres(spot, other);
        if (d < nearbyMetres || (d < 250 && namesOverlap(spot.title, other.title))) return other;
      }
      return null;
    },
    add(spot: LifestyleSpotItem) {
      if (spot.sourceUrl) bySource.set(spot.sourceUrl, spot);
      byId.set(spot.id, spot);
      byName.set(`${normName(spot.title)}|${provinceKey(spot.province)}`, spot);
      points.push(spot);
    },
  };
}

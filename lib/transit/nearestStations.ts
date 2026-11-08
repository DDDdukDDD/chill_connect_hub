import data from './railStations.json';

/**
 * The nearest rail stations to a place (BTS, MRT lines, Airport Rail Link, Red Line), from OpenStreetMap station
 * points around Bangkok (railStations.json, ODbL). Server only: the list stays out of the browser bundle.
 * Walking time assumes streets add about 30% to the straight line and 80 m a minute.
 */
export interface NearbyStation {
  line: string;
  name: string;
  meters: number;
  walkMinutes: number;
}

const STATIONS = (data as { stations: Array<{ line: string; name: string; lat: number; lon: number }> }).stations;
const WALKABLE_METERS = 1500;
const FAR_METERS = 4000;

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(a));
}

/** Up to two stations within walking distance; if none, the single nearest one within 4 km; else none. */
export function nearestStations(latitude?: number, longitude?: number): NearbyStation[] {
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !latitude || !longitude) return [];
  const sorted = STATIONS.map((s) => {
    const meters = Math.round(distanceMeters(latitude, longitude, s.lat, s.lon) * 1.3);
    return { line: s.line, name: s.name, meters, walkMinutes: Math.max(1, Math.round(meters / 80)) };
  }).sort((a, b) => a.meters - b.meters);
  const walkable = sorted.filter((s) => s.meters <= WALKABLE_METERS).slice(0, 2);
  if (walkable.length) return walkable;
  return sorted[0] && sorted[0].meters <= FAR_METERS ? [sorted[0]] : [];
}

/** "BTS ช่องนนทรี เดินราว 8 นาที · MRT ลุมพินี เดินราว 15 นาที", or "ใกล้สุด MRT บางซื่อ ห่างราว 2.4 กม." */
export function stationsText(stations: NearbyStation[]): string {
  if (!stations.length) return '';
  if (stations[0].meters > WALKABLE_METERS) {
    const s = stations[0];
    return `ใกล้สุด ${s.line} ${s.name} ห่างราว ${(s.meters / 1000).toFixed(1)} กม.`;
  }
  return stations.map((s) => `${s.line} ${s.name} เดินราว ${s.walkMinutes} นาที`).join(' · ');
}

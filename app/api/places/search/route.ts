import { NextResponse } from 'next/server';
import { getAdminActor } from '@/lib/adminApiAuth';
import { cacheManager } from '@/lib/cache';
import { isThaiCoordinate } from '@/lib/contentQuality';
import { sql, USE_POSTGRES } from '@/lib/db/postgres/client';
import { getSessionMember } from '@/lib/members/session';
import { NOT_A_PLACE } from '@/lib/moments/feedRules';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

// ?q=[&lat=&lng=][&used=1] → { success, places: [{ name, detail, latitude, longitude }], used?: [{ name, posts }] }
// Place search while typing. `places` come from OpenStreetMap through Photon, made for search-as-you-type: it finds
// a name from its first letters ("วัดอรุ" → วัดอรุณ), which Nominatim does not; Nominatim answers when Photon is down.
// OpenStreetMap data may be stored with a post, unlike Google Places content.
// `used=1` (the moment place picker) adds names members already put on public posts, so a place missing from the
// map is found once someone has typed it. Those names are on public posts already, so listing them shows nothing new.
const PHOTON_URL = 'https://photon.komoot.io/api/';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Chillwaa/1.0 (place search; https://www.chillwaa.com)';
const THAILAND_BBOX = '97.3,5.6,105.7,20.5';
const MAX_PLACES = 8;
const MAX_USED = 5;

type Place = { name: string; detail: string; latitude: number; longitude: number };

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, string | undefined>;
}

/**
 * The same place often comes back as a building, its grounds and its entrance: keep the first of a name within
 * about a kilometre. Branches of a shop farther apart stay, each with its own area under the name
 */
function distinct(places: Place[]) {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = `${place.name.toLowerCase()}|${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function photon(query: string, near: { lat: number; lng: number } | null): Promise<Place[]> {
  const params = new URLSearchParams({ q: query, limit: String(MAX_PLACES * 2), bbox: THAILAND_BBOX });
  if (near) {
    params.set('lat', String(near.lat));
    params.set('lon', String(near.lng));
  }
  const res = await fetch(`${PHOTON_URL}?${params}`, { cache: 'no-store', headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const { features = [] } = (await res.json()) as { features?: PhotonFeature[] };
  return features.flatMap(({ geometry, properties = {} }) => {
    const [longitude, latitude] = geometry?.coordinates ?? [NaN, NaN];
    if (!properties.name || !isThaiCoordinate(latitude, longitude)) return [];
    const area = [properties.street, properties.district, properties.city, properties.state].filter((part, i, all) => part && all.indexOf(part) === i);
    return [{ name: properties.name, detail: area.slice(0, 3).join(' '), latitude, longitude }];
  });
}

async function nominatim(query: string): Promise<Place[]> {
  const params = new URLSearchParams({ q: query, format: 'jsonv2', countrycodes: 'th', 'accept-language': 'th', limit: '5' });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, { cache: 'no-store', headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return ((await res.json()) as { lat?: string; lon?: string; name?: string; display_name?: string }[])
    .map((place) => {
      const [first, ...rest] = (place.display_name || '').split(', ');
      return { name: place.name || first || query, detail: rest.slice(0, 4).join(' '), latitude: Number(place.lat), longitude: Number(place.lon) };
    })
    .filter((place) => isThaiCoordinate(place.latitude, place.longitude));
}

/** Map places for a query; the same words from anyone are asked once every 10 minutes (Photon asks for fair use) */
function mapPlaces(query: string, near: { lat: number; lng: number } | null) {
  const key = `places:search:${query.toLowerCase()}:${near ? `${near.lat},${near.lng}` : ''}`;
  return cacheManager.getOrSet(
    key,
    async () => {
      try {
        return distinct(await photon(query, near)).slice(0, MAX_PLACES);
      } catch (error) {
        console.warn('[places/search] Photon failed, asking Nominatim:', error);
        return distinct(await nominatim(query));
      }
    },
    { ttlMs: 10 * 60 * 1000, tags: ['places:search'] }
  );
}

/** Names on public posts that contain the words, most used first */
async function usedNames(query: string): Promise<{ name: string; posts: number }[]> {
  if (!USE_POSTGRES) return [];
  const pattern = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await sql()`
    select location_text as name, count(*)::int as posts
    from app.moments
    where status = 'published' and location_text <> '' and location_text ilike ${pattern} and location_text <> all(${NOT_A_PLACE})
    group by location_text
    order by count(*) desc, max(created_at) desc
    limit ${MAX_USED}`;
  return rows.map((row) => ({ name: row.name as string, posts: row.posts as number }));
}

export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member && !await getAdminActor(request)) {
    return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  }
  // Asked while typing, after a pause: a few per place name
  if (await isRateLimited(`place-search:${member?.id ?? clientIp(request)}`, 120, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ค้นหาหลายครั้งเกินไป รอสักครู่แล้วลองใหม่' }, { status: 429 });
  }
  const params = new URL(request.url).searchParams;
  const query = (params.get('q') || '').trim().slice(0, 120);
  if (query.length < 2) return NextResponse.json({ success: false, message: 'พิมพ์ชื่อสถานที่อย่างน้อย 2 ตัวอักษร' }, { status: 400 });
  // Rounded to about 1 km: enough to put nearby places first, and it is not kept
  const lat = Math.round(Number(params.get('lat')) * 100) / 100;
  const lng = Math.round(Number(params.get('lng')) * 100) / 100;
  const near = isThaiCoordinate(lat, lng) ? { lat, lng } : null;

  const [places, used] = await Promise.all([
    mapPlaces(query, near).then(
      (list) => ({ list }),
      (error) => {
        console.warn('[places/search] failed:', error);
        return { list: null };
      }
    ),
    params.get('used') === '1' && member ? usedNames(query).catch(() => []) : Promise.resolve(undefined),
  ]);
  if (!places.list && !used?.length) {
    return NextResponse.json({ success: false, message: 'ค้นหาไม่ได้ในตอนนี้ ลองแตะบนแผนที่เพื่อปักหมุดแทน' }, { status: 502 });
  }
  return NextResponse.json({ success: true, places: places.list ?? [], ...(used ? { used } : {}) }, { headers: { 'Cache-Control': 'no-store' } });
}

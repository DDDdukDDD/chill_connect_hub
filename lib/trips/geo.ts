import { sql } from '../db/postgres/client';

/**
 * City names for trip photos. A photo's coordinates are rounded to a 0.05° grid (about 5 km) and looked up once
 * from OpenStreetMap's Nominatim, then kept in app.geo_places for everyone. Only the rounded point is sent, with no
 * member or trip attached. Nominatim's rules allow one request a second with a real User-Agent, so lookups are made one
 * by one and a call stops after a few (resolveTripPlaces is called again until nothing is left).
 */

export interface GeoPlace {
  city?: string;
  country?: string;
  countryCode?: string;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'Chillwaa/1.0 (+https://www.chillwaa.com)';
const GAP_MS = 1100;

export const roundCoord = (value: number) => Math.round(value * 100) / 100;
const gridKey = (lat: number, lng: number) => `${(Math.round(lat * 20) / 20).toFixed(2)},${(Math.round(lng * 20) / 20).toFixed(2)}`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** "Yuexiu District", "เขตชิบูยะ", "福田区": a part of a city, not the city a traveller would name */
const DISTRICT = /(district|sub-district|ward)$|^เขต|^แขวง|^อำเภอ|区$|區$/i;
/** "จังหวัดเชียงใหม่" → "เชียงใหม่", "ประเทศจีน" → "จีน" */
const plainName = (name: string | undefined) => name?.replace(/^(จังหวัด|ประเทศ)\s*/, '').trim().slice(0, 80) || undefined;

/**
 * The city a traveller would name. At zoom 8 Nominatim gives the city (ปารีส, เซินเจิ้น, ฮ่องกง, กรุงเทพมหานคร) or, in
 * Thailand and Japan, the province (เชียงใหม่, โตเกียว); in some Chinese cities it gives a district instead, which the
 * caller then asks again at zoom 7 (กว่างโจว).
 */
function cityFrom(address: Record<string, string>): string | undefined {
  const city = address.city || address.town || address.municipality;
  if (city && !DISTRICT.test(city)) return city;
  return address.province || address.state_district || (address.state && !city ? address.state : undefined) || undefined;
}

async function ask(lat: number, lng: number, zoom: number): Promise<Record<string, string> | null | undefined> {
  const url = `${NOMINATIM}?format=jsonv2&zoom=${zoom}&addressdetails=1&accept-language=th,en&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Referer: 'https://www.chillwaa.com' }, signal: AbortSignal.timeout(6000) }).catch(() => null);
  if (!res?.ok) return null;
  const json = (await res.json().catch(() => null)) as { address?: Record<string, string>; error?: string } | null;
  return json && !json.error && json.address ? json.address : undefined;
}

/** null = Nominatim did not answer (try later); {} = nothing there (open sea) */
async function lookup(lat: number, lng: number): Promise<GeoPlace | null> {
  let address = await ask(lat, lng, 8);
  if (address === null) return null;
  if (!address) return {};
  let city = cityFrom(address);
  if (!city) {
    await sleep(GAP_MS);
    const wider = await ask(lat, lng, 7);
    if (wider) {
      address = wider;
      city = cityFrom(wider);
    }
  }
  return { city: plainName(city), country: plainName(address.country), countryCode: address.country_code?.toUpperCase() };
}

/**
 * Fills city and country on items of one trip that have coordinates but no city yet, using at most `budget`
 * new lookups. Returns how many items are still waiting.
 */
export async function resolveTripPlaces(tripId: string, budget = 6): Promise<{ waiting: number }> {
  const db = sql();
  const rows = await db<{ lat: number; lng: number }[]>`
    select distinct lat, lng from app.trip_items where trip_id = ${tripId} and city is null and country is null and lat is not null`;
  const keys = new Map<string, { lat: number; lng: number }>();
  for (const row of rows) keys.set(gridKey(row.lat, row.lng), row);

  const known = keys.size
    ? await db<{ key: string; city: string | null; country: string | null; country_code: string | null }[]>`
        select key, city, country, country_code from app.geo_places where key in ${db([...keys.keys()])}`
    : [];
  const places = new Map(known.map((row) => [row.key, row]));

  let used = 0;
  for (const [key, point] of keys) {
    if (places.has(key) || used >= budget) continue;
    if (used > 0) await sleep(GAP_MS);
    used += 1;
    const found = await lookup(point.lat, point.lng);
    if (!found) break; // Nominatim is busy or down: try again on the next call
    await db`
      insert into app.geo_places (key, city, country, country_code) values (${key}, ${found.city ?? null}, ${found.country ?? null}, ${found.countryCode ?? null})
      on conflict (key) do update set city = excluded.city, country = excluded.country, country_code = excluded.country_code, fetched_at = now()`;
    places.set(key, { key, city: found.city ?? null, country: found.country ?? null, country_code: found.countryCode ?? null });
  }

  let waiting = 0;
  for (const point of rows) {
    const place = places.get(gridKey(point.lat, point.lng));
    if (!place) {
      waiting += 1;
      continue;
    }
    // A point Nominatim knows nothing about (open sea) is marked with an empty country so it is not asked again
    await db`
      update app.trip_items set city = ${place.city}, country = ${place.country ?? ''}, country_code = ${place.country_code}
      where trip_id = ${tripId} and lat = ${point.lat} and lng = ${point.lng} and city is null and country is null`;
  }
  return { waiting };
}

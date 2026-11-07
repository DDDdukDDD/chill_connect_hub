import { NextResponse } from 'next/server';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { cacheManager } from '@/lib/cache';
import { isThaiCoordinate } from '@/lib/contentQuality';
import { db } from '@/lib/db';
import { getSessionMember } from '@/lib/members/session';
import { getDistanceKm } from '@/lib/nearbySpots';
import { isRateLimited } from '@/lib/rateLimit';

// ?lat=&lng= → { success, spots: [{ id, title, location }], places: [{ name, detail }] }
// What is around the member when they tag a place on a moment: our own places first, then named places from
// OpenStreetMap, whose data may be stored with a post, unlike Google Places content. The position is not kept.
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SPOT_RADIUS_KM = 5;
const PLACE_RADIUS_M = 600;
const MAX_ROWS = 12;

const KIND_LABELS: Record<string, string> = {
  cafe: 'คาเฟ่', restaurant: 'ร้านอาหาร', bar: 'บาร์', pub: 'ผับ', fast_food: 'ร้านอาหาร', cinema: 'โรงภาพยนตร์', theatre: 'โรงละคร', arts_centre: 'ศูนย์ศิลปะ',
  museum: 'พิพิธภัณฑ์', gallery: 'แกลเลอรี', hotel: 'ที่พัก', attraction: 'ที่เที่ยว', viewpoint: 'จุดชมวิว', park: 'สวน', mall: 'ห้างสรรพสินค้า', place_of_worship: 'ศาสนสถาน',
};

interface OverpassElement {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const catalogSpots = () =>
  cacheManager.getOrSet(
    'places:nearby-catalog',
    async () => {
      const first = await db.findSpots({ page: 1, limit: 100 });
      const spots: LifestyleSpotItem[] = [...first.items];
      for (let page = 2; page <= first.totalPages; page += 1) spots.push(...(await db.findSpots({ page, limit: 100 })).items);
      return spots.map(({ id, title, district, province, latitude, longitude }) => ({ id, title, location: [district, province].filter(Boolean).join(', '), latitude, longitude }));
    },
    { ttlMs: 10 * 60 * 1000, tags: ['places:nearby-catalog'] }
  );

async function openStreetMapPlaces(lat: number, lng: number) {
  const around = `(around:${PLACE_RADIUS_M},${lat},${lng})`;
  const query = `[out:json][timeout:6];(${['amenity', 'tourism', 'shop', 'leisure'].map((key) => `nwr${around}["name"]["${key}"];`).join('')});out tags center 60;`;
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Chillwaa/1.0 (moment place picker)' },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const { elements = [] } = (await res.json()) as { elements?: OverpassElement[] };
  const seen = new Set<string>();
  return elements
    .flatMap((element) => {
      const tags = element.tags ?? {};
      const name = tags['name:th'] || tags.name;
      const placeLat = element.lat ?? element.center?.lat;
      const placeLng = element.lon ?? element.center?.lon;
      if (!name || placeLat === undefined || placeLng === undefined || seen.has(name)) return [];
      seen.add(name);
      const kind = tags.amenity ?? tags.tourism ?? tags.leisure ?? tags.shop ?? '';
      return [{ name, detail: KIND_LABELS[kind] ?? '', distanceKm: getDistanceKm(lat, lng, placeLat, placeLng) }];
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_ROWS)
    .map(({ name, detail }) => ({ name, detail }));
}

/** The neighbourhood and province at a point, from OpenStreetMap (Nominatim) */
async function areaName(lat: number, lng: number) {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lng), format: 'jsonv2', 'accept-language': 'th', zoom: '16' });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Chillwaa/1.0 (moment place picker)' },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const { address = {} } = (await res.json()) as { address?: Record<string, string> };
  const area = address.neighbourhood || address.quarter || address.suburb || address.town || address.village;
  const city = address.city || address.state || address.province;
  const name = [area, city].filter(Boolean).join(', ');
  return name ? { name, detail: 'ย่านนี้' } : null;
}

export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  if (await isRateLimited(`place-nearby:${member.id}`, 40, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ค้นหาหลายครั้งเกินไป รอสักครู่แล้วลองใหม่นะ' }, { status: 429 });
  }
  const params = new URL(request.url).searchParams;
  // About 100 metres: enough to list what is around, and less exact than the phone's position
  const lat = Math.round(Number(params.get('lat')) * 1000) / 1000;
  const lng = Math.round(Number(params.get('lng')) * 1000) / 1000;
  if (!isThaiCoordinate(lat, lng)) return NextResponse.json({ success: true, spots: [], places: [] });

  const headers = { 'Cache-Control': 'private, no-store' };
  // Asked for apart, so our own places show at once while the slower outside services answer
  if (params.get('general') === '1') {
    // The public list of named places is often at capacity; the name of the area nearly always comes back
    const [area, named] = await Promise.all([areaName(lat, lng).catch(() => null), openStreetMapPlaces(lat, lng).catch(() => [])]);
    return NextResponse.json({ success: true, spots: [], places: [...named, ...(area ? [area] : [])] }, { headers });
  }
  const spots = (await catalogSpots())
    .map((spot) => ({ spot, distanceKm: getDistanceKm(lat, lng, spot.latitude, spot.longitude) }))
    .filter(({ distanceKm }) => distanceKm <= SPOT_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_ROWS)
    .map(({ spot }) => ({ id: spot.id, title: spot.title, location: spot.location }));
  return NextResponse.json({ success: true, spots, places: [] }, { headers });
}

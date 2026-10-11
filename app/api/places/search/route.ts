import { NextResponse } from 'next/server';
import { getAdminActor } from '@/lib/adminApiAuth';
import { isThaiCoordinate } from '@/lib/contentQuality';
import { getSessionMember } from '@/lib/members/session';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

// ?q= → { success, places: [{ name, detail, latitude, longitude }] }
// Place search for the pin picker, from OpenStreetMap (Nominatim). Its data may be stored, unlike Google Places
// content. Nominatim allows about one request a second, so this is called on a button press, never while typing.
const SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

interface NominatimPlace {
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
}

export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member && !getAdminActor(request)) {
    return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  }
  if (isRateLimited(`place-search:${member?.id ?? clientIp(request)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ค้นหาหลายครั้งเกินไป รอสักครู่แล้วลองใหม่' }, { status: 429 });
  }
  const query = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 120);
  if (query.length < 2) return NextResponse.json({ success: false, message: 'พิมพ์ชื่อสถานที่อย่างน้อย 2 ตัวอักษร' }, { status: 400 });

  try {
    const params = new URLSearchParams({ q: query, format: 'jsonv2', countrycodes: 'th', 'accept-language': 'th', limit: '5' });
    const res = await fetch(`${SEARCH_URL}?${params}`, {
      cache: 'no-store',
      headers: { 'User-Agent': 'ChillConnectHub/1.0 (prototype; place pin picker)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const places = ((await res.json()) as NominatimPlace[])
      .map((place) => {
        const [first, ...rest] = (place.display_name || '').split(', ');
        return {
          name: place.name || first || query,
          detail: rest.slice(0, 4).join(' '),
          latitude: Number(place.lat),
          longitude: Number(place.lon),
        };
      })
      .filter((place) => isThaiCoordinate(place.latitude, place.longitude));
    return NextResponse.json({ success: true, places }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.warn('[places/search] failed:', error);
    return NextResponse.json({ success: false, message: 'ค้นหาไม่ได้ในตอนนี้ ลองแตะบนแผนที่เพื่อปักหมุดแทน' }, { status: 502 });
  }
}

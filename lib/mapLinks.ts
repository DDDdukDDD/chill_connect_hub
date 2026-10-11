import { isThaiCoordinate } from './contentQuality';

/**
 * Coordinates from a Google Maps link that a member or staff pasted.
 * A full link carries them in its address. A short share link (maps.app.goo.gl) does not, so the server
 * follows it, on Google hosts only, to the full address. Links shared from the phone app often carry no
 * coordinates at all; the caller then asks for a pin on the map instead.
 * No API key and no Places API call: the only request goes to the address the person gave us.
 */
export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

const GOOGLE_HOST = /^([a-z0-9-]+\.)*(google\.[a-z]{2,3}(\.[a-z]{2})?|goo\.gl)$/i;
const NUMBER = '(-?[0-9]{1,3}\\.[0-9]+)';
// The place's own pin (!3d !4d) comes before the map centre (@), which moves when the map is dragged
const IN_ADDRESS = [
  new RegExp(`!3d${NUMBER}!4d${NUMBER}`),
  new RegExp(`[?&](?:q|query|ll|destination|center)=${NUMBER}(?:,|%2C)${NUMBER}`, 'i'),
  new RegExp(`@${NUMBER},${NUMBER}`),
];

function firstThaiPair(text: string): MapCoordinates | null {
  for (const pattern of IN_ADDRESS) {
    const match = text.match(pattern);
    if (!match) continue;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (isThaiCoordinate(latitude, longitude)) return { latitude, longitude };
  }
  return null;
}

export function isGoogleMapsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && GOOGLE_HOST.test(parsed.hostname);
  } catch {
    return false;
  }
}

/** Latitude and longitude from a Google Maps link, when the link itself carries them */
export function coordinatesFromMapUrl(url: string): MapCoordinates | null {
  return firstThaiPair(url);
}

/**
 * Coordinates for any Google Maps link, following a short link when needed.
 * Returns null when the link is not a Google link, cannot be reached, or carries no pin inside Thailand.
 */
export async function resolveMapCoordinates(url: string): Promise<MapCoordinates | null> {
  if (!isGoogleMapsUrl(url)) return null;
  const direct = coordinatesFromMapUrl(url);
  if (direct) return direct;

  let current = url;
  try {
    for (let hop = 0; hop < 5; hop += 1) {
      const res = await fetch(current, {
        redirect: 'manual',
        cache: 'no-store',
        headers: { 'Accept-Language': 'th,en;q=0.8', 'User-Agent': 'Mozilla/5.0 (compatible; ChillConnectHub/1.0)' },
        signal: AbortSignal.timeout(6000),
      });
      const next = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && next) {
        current = new URL(next, current).toString();
        // Never leave Google: a pasted link must not make the server call another host
        if (!isGoogleMapsUrl(current)) return null;
        const found = coordinatesFromMapUrl(current);
        if (found) return found;
        continue;
      }
      // The page itself is not read: it only holds a default view of the map, not the place's pin
      return null;
    }
  } catch {
    // Unreachable or too slow: staff set the pin by hand instead
  }
  return null;
}

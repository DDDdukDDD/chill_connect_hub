import fs from 'fs';
import os from 'os';
import path from 'path';
import { getDistanceKm, LifestyleSpotItem } from '@/data/spotsData';
import { IS_SERVERLESS } from './db/databaseFile';
import type { NearbyDiningItem } from './nearbyDiningService';

/**
 * Highly rated cafes and restaurants around a spot, from Google Places API (New) Nearby Search.
 * Server-side only: the key (GOOGLE_PLACES_API_KEY) never reaches the browser.
 *
 * Google Maps Platform terms shape this module:
 * - Only the place id may be stored. Ratings, names and addresses are fetched live for each request,
 *   never cached or written to our database.
 * - Places content shown without a Google map must carry the "Google Maps" attribution
 *   (returned as `attribution` for the UI).
 * - Rating fields bill as the Nearby Search Enterprise SKU (1,000 free calls per month), so a monthly
 *   cap (GOOGLE_PLACES_MONTHLY_LIMIT, default 900) stops calls before billing starts.
 */
export const MIN_GOOGLE_RATING = 4.5;
/** A 5.0 from three reviews is not "ยอดฮิต"; require a meaningful number of reviews */
export const MIN_GOOGLE_REVIEWS = 50;
export const GOOGLE_ATTRIBUTION = 'Google Maps';

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';
// Places whose main business is food or drink (Places API Table A types)
const FOOD_PRIMARY_TYPES = [
  'restaurant', 'thai_restaurant', 'japanese_restaurant', 'chinese_restaurant', 'korean_restaurant',
  'italian_restaurant', 'seafood_restaurant', 'vegetarian_restaurant', 'breakfast_restaurant',
  'brunch_restaurant', 'ramen_restaurant', 'sushi_restaurant', 'barbecue_restaurant', 'steak_house',
  'cafe', 'coffee_shop', 'bakery', 'dessert_shop', 'ice_cream_shop',
];
const RADIUS_M = 3000;
const FIELD_MASK = [
  'places.id', 'places.displayName', 'places.rating', 'places.userRatingCount', 'places.location',
  'places.googleMapsUri', 'places.primaryType', 'places.primaryTypeDisplayName',
  'places.shortFormattedAddress', 'places.currentOpeningHours.openNow', 'places.priceLevel',
].join(',');

// Neutral inline placeholder: Place Photos is a separate paid SKU and its URL needs the key,
// so photos are not requested
const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#F1F5F9"/><path d="M20 26h20v10a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" fill="none" stroke="#94A3B8" stroke-width="2.5"/><path d="M40 29h3a4 4 0 0 1 0 8h-3" fill="none" stroke="#94A3B8" stroke-width="2.5"/><path d="M26 18v4M31 16v6M36 18v4" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/></svg>'
)}`;

const PRICE_LEVELS: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '฿',
  PRICE_LEVEL_MODERATE: '฿฿',
  PRICE_LEVEL_EXPENSIVE: '฿฿฿',
  PRICE_LEVEL_VERY_EXPENSIVE: '฿฿฿฿',
};

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  shortFormattedAddress?: string;
  currentOpeningHours?: { openNow?: boolean };
  priceLevel?: string;
}

function categoryOf(type: string | undefined): NearbyDiningItem['category'] {
  if (!type) return 'restaurant';
  if (type === 'cafe' || type === 'coffee_shop' || type === 'tea_house') return 'cafe';
  if (type === 'bakery' || type === 'dessert_shop') return 'bakery';
  if (type === 'bar' || type === 'wine_bar' || type === 'pub') return 'slowbar';
  if (type === 'thai_restaurant') return 'local_food';
  return 'restaurant';
}

// ── Monthly call budget (a counter, not Google content, so it may be stored) ──
const USAGE_FILE = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'google_places_usage.json')
  : path.join(process.cwd(), 'data', 'google_places_usage.json');
const globalForUsage = globalThis as unknown as { _cchPlacesUsage?: { month: string; calls: number } };

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function readUsage(): { month: string; calls: number } {
  const month = currentMonth();
  if (!globalForUsage._cchPlacesUsage) {
    try {
      globalForUsage._cchPlacesUsage = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf-8'));
    } catch {
      globalForUsage._cchPlacesUsage = { month, calls: 0 };
    }
  }
  if (globalForUsage._cchPlacesUsage!.month !== month) globalForUsage._cchPlacesUsage = { month, calls: 0 };
  return globalForUsage._cchPlacesUsage!;
}

function recordCall() {
  const usage = readUsage();
  usage.calls += 1;
  try {
    fs.mkdirSync(path.dirname(USAGE_FILE), { recursive: true });
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usage), 'utf-8');
  } catch {
    // The in-memory counter still protects this process
  }
}

export function getPlacesUsage() {
  const usage = readUsage();
  const limit = Number(process.env.GOOGLE_PLACES_MONTHLY_LIMIT) || 900;
  return { ...usage, limit, configured: Boolean(process.env.GOOGLE_PLACES_API_KEY) };
}

/**
 * Live Google results for a spot, or null when Google is not usable right now
 * (no key, monthly cap reached, or the request failed), so the caller can fall back.
 * An empty array means Google answered but nothing nearby passed the rating filter.
 */
export async function searchHighlyRatedDining(
  spot: LifestyleSpotItem,
  limit: number,
  catalog: LifestyleSpotItem[]
): Promise<NearbyDiningItem[] | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  const usage = getPlacesUsage();
  if (usage.calls >= usage.limit) {
    console.warn(`[googlePlaces] monthly cap reached (${usage.calls}/${usage.limit}); using the catalog fallback`);
    return null;
  }

  recordCall();
  let places: GooglePlace[];
  try {
    const res = await fetch(SEARCH_URL, {
      method: 'POST',
      cache: 'no-store', // Places content may not be cached
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELD_MASK },
      body: JSON.stringify({
        // Primary types, not includedTypes: hotels and malls also carry the "restaurant" type
        includedPrimaryTypes: FOOD_PRIMARY_TYPES,
        maxResultCount: 20,
        rankPreference: 'POPULARITY',
        languageCode: 'th',
        regionCode: 'TH',
        locationRestriction: { circle: { center: { latitude: spot.latitude, longitude: spot.longitude }, radius: RADIUS_M } },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn('[googlePlaces] Nearby Search failed:', res.status, (await res.text()).slice(0, 300));
      return null;
    }
    places = ((await res.json()) as { places?: GooglePlace[] }).places ?? [];
  } catch (error) {
    console.warn('[googlePlaces] Nearby Search error:', error);
    return null;
  }

  const nearbyCatalog = catalog.filter((s) => s.id !== spot.id && getDistanceKm(spot.latitude, spot.longitude, s.latitude, s.longitude) <= 5);
  return places
    .filter((p) => p.id && p.displayName?.text && (p.rating ?? 0) >= MIN_GOOGLE_RATING && (p.userRatingCount ?? 0) >= MIN_GOOGLE_REVIEWS)
    .slice(0, limit)
    .map((p): NearbyDiningItem => {
      const name = p.displayName!.text!;
      const lat = p.location?.latitude ?? spot.latitude;
      const lng = p.location?.longitude ?? spot.longitude;
      // Link to our own page when the same place is in our catalog (same name, within 300 m)
      const lower = name.toLowerCase();
      const internal = nearbyCatalog.find((s) => {
        const title = s.title.toLowerCase();
        return (title.includes(lower) || lower.includes(title)) && getDistanceKm(lat, lng, s.latitude, s.longitude) <= 0.3;
      });
      return {
        id: `gplace-${p.id}`,
        name,
        category: categoryOf(p.primaryType),
        categoryLabel: p.primaryTypeDisplayName?.text || 'ร้านอาหาร',
        image: PLACEHOLDER_IMAGE,
        rating: p.rating!,
        reviewsCount: p.userRatingCount!,
        distanceKm: getDistanceKm(spot.latitude, spot.longitude, lat, lng),
        openHours: p.currentOpeningHours?.openNow === true ? 'เปิดอยู่ตอนนี้' : p.currentOpeningHours?.openNow === false ? 'ปิดอยู่ตอนนี้' : 'ไม่ระบุเวลาเปิด',
        priceRange: p.priceLevel ? PRICE_LEVELS[p.priceLevel] : undefined,
        specialty: p.shortFormattedAddress || p.primaryTypeDisplayName?.text || '',
        googleMapsUrl: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
        isPartner: false,
        spotId: internal?.id,
        reviewsSource: 'google',
      };
    });
}

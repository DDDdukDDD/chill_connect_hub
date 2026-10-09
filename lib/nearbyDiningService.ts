import { LifestyleSpotItem, MOCK_SPOTS, getDistanceKm } from '@/data/spotsData';

export interface NearbyDiningItem {
  id: string;
  name: string;
  category: 'cafe' | 'restaurant' | 'slowbar' | 'bakery' | 'local_food';
  categoryLabel: string;
  image: string;
  rating: number;
  reviewsCount: number;
  distanceKm: number;
  openHours: string;
  priceRange?: string;
  specialty: string;
  googleMapsUrl: string;
  isPartner?: boolean;
  spotId?: string; // Links directly to internal spot detail page if available
  /** 'google' = live Google Places rating (show the "Google Maps" attribution); absent = our own catalog */
  reviewsSource?: 'google';
}

/**
 * Nearby cafes and restaurants for a spot.
 * In the browser this asks our own API (`/api/spots/[id]/nearby-dining`), which calls Google Places on the
 * server, so no Google key is ever shipped to the client. Without a usable answer it falls back to the
 * local catalog calculation.
 */
export async function getNearbyDining(
  spot: LifestyleSpotItem,
  limit: number = 6,
  pool: LifestyleSpotItem[] = MOCK_SPOTS
): Promise<NearbyDiningItem[]> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/spots/${encodeURIComponent(spot.id)}/nearby-dining?limit=${limit}`);
      if (res.ok) {
        const body = (await res.json()) as { data?: NearbyDiningItem[] };
        if (Array.isArray(body.data)) return body.data;
      }
    } catch (error) {
      console.warn('[nearbyDiningService] nearby-dining API unavailable, using the local catalog:', error);
    }
  }
  return getNearbyDiningSync(spot, limit, pool);
}

/** Only places within this distance count as "around the area" */
const NEARBY_RADIUS_KM = 15;

/**
 * Synchronous local calculation from curated Thai partners & internal spots
 * Instant 0ms response time, perfect for initial SSR & zero-flash UI
 */
export function getNearbyDiningSync(
  spot: LifestyleSpotItem,
  limit: number = 6,
  pool: LifestyleSpotItem[] = MOCK_SPOTS
): NearbyDiningItem[] {
  // pool = the live published catalog when available (imported cafes carry real coordinates)
  const internalCafes = pool.filter(
    (s) => s.id !== spot.id && (s.category === 'cafe' || s.vibeTags?.some((v) => /กาแฟ|cafe|coffee|อาหาร|จิบกาแฟ/i.test(v)))
  ).map((s) => ({
    id: `spot-dining-${s.id}`,
    name: s.title,
    category: 'cafe' as const,
    categoryLabel: s.categoryLabel || 'คาเฟ่ & สโลว์บาร์',
    image: s.image,
    // Real values only; imported spots have no ratings and many have no price
    rating: s.rating || 0,
    reviewsCount: s.reviewsCount || 0,
    openHours: s.openHours || 'ไม่ระบุ',
    priceRange: s.price || 'ไม่ระบุ',
    specialty: s.highlights?.[0] || s.description.slice(0, 50),
    latitude: s.latitude,
    longitude: s.longitude,
    province: s.province,
    district: s.district,
    googleMapsUrl: s.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(s.title)}`,
    isPartner: true,
    spotId: s.id,
  }));

  const allPool = internalCafes.filter((item) => {
    if (item.spotId && item.spotId === spot.id) return false;
    const cleanItemName = item.name.replace(/\s+/g, '').toLowerCase();
    const cleanSpotName = spot.title.replace(/\s+/g, '').toLowerCase();
    if (cleanItemName.includes(cleanSpotName) || cleanSpotName.includes(cleanItemName)) return false;
    return true;
  });

  // Calculate real distance & proximity score
  const scored = allPool.map((item) => {
    let score = 0;
    const distanceKm = getDistanceKm(spot.latitude, spot.longitude, item.latitude, item.longitude);

    // Exact District Match (e.g. Mae Taeng with Mae Taeng)
    if (spot.district && item.district && spot.district === item.district) {
      score += 120;
    }
    // Same Province Match (e.g. Chiang Mai)
    if (spot.province === item.province) {
      score += 60;
    }
    // Distance bonus (closer is higher)
    if (distanceKm <= 1.5) {
      score += 90;
    } else if (distanceKm <= 5) {
      score += 60;
    } else if (distanceKm <= 15) {
      score += 35;
    } else if (distanceKm <= 35) {
      score += 15;
    }

    // Rating bonus (only when a real rating exists)
    score += (item.rating || 0) * 5;

    return {
      item,
      distanceKm,
      score,
    };
  });

  // Sort by score then distance; places outside the radius are not "nearby"
  const nearby = scored.filter((entry) => entry.distanceKm <= NEARBY_RADIUS_KM);
  nearby.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.distanceKm - b.distanceKm;
  });

  // Deduplicate by name and return top results
  const seenNames = new Set<string>();
  const results: NearbyDiningItem[] = [];

  for (const entry of nearby) {
    const normalizedName = entry.item.name.replace(/\s+/g, '').toLowerCase();
    if (seenNames.has(normalizedName)) continue;
    seenNames.add(normalizedName);

    // Auto-link to internal spot if matching
    let linkedSpotId = entry.item.spotId;
    if (!linkedSpotId) {
      const match = pool.find(
        (s) => s.id !== spot.id && (s.title.includes(entry.item.name) || entry.item.name.includes(s.title))
      );
      if (match) linkedSpotId = match.id;
    }

    results.push({
      id: entry.item.id,
      name: entry.item.name,
      category: entry.item.category,
      categoryLabel: entry.item.categoryLabel,
      image: entry.item.image,
      rating: entry.item.rating,
      reviewsCount: entry.item.reviewsCount,
      distanceKm: entry.distanceKm,
      openHours: entry.item.openHours,
      priceRange: entry.item.priceRange,
      specialty: entry.item.specialty,
      googleMapsUrl: entry.item.googleMapsUrl,
      isPartner: entry.item.isPartner,
      spotId: linkedSpotId,
    });

    if (results.length >= limit) break;
  }

  // No invented fallback: with nothing nearby the section hides itself (NearbyDiningSection returns null)
  return results;
}

import type { LifestyleSpotItem } from '@/data/spotsData';

/*
 * Distance and nearby-place helpers, apart from data/spotsData.ts so a browser page can use them without the ~400 KB of
 * bundled sample places that file builds (2026-10-28). data/spotsData.ts re-exports them with the bundled data as the pool.
 */

export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Retrieve nearby or similar spots prioritizing same zone, district, GPS proximity, and province
 */
/** `pool` is the catalog to search: the server's nearby candidates on a place page, the whole catalog on the server. */
export function getNearbySpots(currentSpot: LifestyleSpotItem, limit = 4, pool: LifestyleSpotItem[]): LifestyleSpotItem[] {
  const others = pool.filter((s) => s.id !== currentSpot.id);

  // Score each spot based on proximity factors:
  // 1. Same Zone (if specified) -> top priority
  // 2. Same District -> very high priority
  // 3. GPS Distance (within 15km)
  // 4. Same Province
  // 5. Same Category
  const scored = others.map((s) => {
    let score = 0;
    const distanceKm = getDistanceKm(currentSpot.latitude, currentSpot.longitude, s.latitude, s.longitude);

    if (currentSpot.zone && s.zone && currentSpot.zone === s.zone) {
      score += 100;
    }
    if (currentSpot.district && s.district && currentSpot.district === s.district) {
      score += 80;
    }
    if (currentSpot.province === s.province) {
      score += 50;
    }
    if (distanceKm <= 5) {
      score += 40;
    } else if (distanceKm <= 15) {
      score += 25;
    } else if (distanceKm <= 35) {
      score += 10;
    }
    if (currentSpot.category === s.category) {
      score += 15;
    }

    return { spot: s, score, distanceKm };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.distanceKm - b.distanceKm;
  });

  return scored.slice(0, limit).map((item) => item.spot);
}

/**
 * Recommendation info package with smart zonal title and subtitle
 */
export function getNearbyRecommendationInfo(currentSpot: LifestyleSpotItem, limit: number, pool: LifestyleSpotItem[]) {
  const spots = getNearbySpots(currentSpot, limit, pool);
  const zoneName = currentSpot.zone || currentSpot.district;
  const isZonal = Boolean(zoneName && zoneName !== currentSpot.province);

  const sectionTitle = isZonal
    ? `สถานที่แนะนำในย่าน ${zoneName} และใกล้เคียง 🌿`
    : `สถานที่แนะนำอื่นๆ ในจังหวัด ${currentSpot.province} 🌿`;

  const sectionSubtitle = isZonal
    ? `จุดเช็คอินและที่เที่ยวยอดฮิตในย่าน ${zoneName} ที่เดินทางไปต่อได้สะดวกในทริปเดียวกัน`
    : `จุดเช็คอินและที่เที่ยวยอดฮิตที่น่าแวะไปต่อในจังหวัด ${currentSpot.province}`;

  return {
    spots,
    sectionTitle,
    sectionSubtitle,
    zoneName: isZonal ? zoneName : currentSpot.province,
  };
}

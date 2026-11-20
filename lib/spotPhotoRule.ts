import type { LifestyleSpotItem } from '@/data/spotsData';

/**
 * Cafés, bars and galleries imported from OpenStreetMap (id "osmb-…", db/import-osm-venues.ts) come without pictures.
 * Owner 2026-11-19 (option 1): they stay drafts until a real photo of the place is added; a stock photo of some other
 * café would pass for this one, so it does not count, and "เติมรูปอัตโนมัติ" leaves them alone.
 * Chain branches (`chainBrand`) are the exception: they are never shown as a card to pick from, only as a meeting
 * point and a place to tag, so they are published without a photo.
 */
export const OSM_VENUE_PREFIX = 'osmb-';

const STOCK_IMAGE = /unsplash|placeholder|picsum|\/images\/onboarding\//i;

/** An OSM venue shows its own photo or none, never a stock picture of some other place (lib/spotImageResolver.ts) */
export const isOsmVenue = (spot: Partial<Pick<LifestyleSpotItem, 'id'>>) => typeof spot.id === 'string' && spot.id.startsWith(OSM_VENUE_PREFIX);

/** True when this place may not be published yet because it has no real photo of its own */
export function lacksOwnPhoto(spot: Pick<LifestyleSpotItem, 'id' | 'image' | 'chainBrand'>): boolean {
  if (!isOsmVenue(spot) || spot.chainBrand) return false;
  const image = (spot.image || '').trim();
  return !/^(https:\/\/|\/)/.test(image) || STOCK_IMAGE.test(image);
}

export const LACKS_PHOTO_ERROR = 'ร้านนี้ยังไม่มีรูปจริงของร้าน ใส่รูปก่อนเผยแพร่ (รูปสต็อกใช้ไม่ได้)';

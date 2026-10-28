import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { effectiveTier } from '@/lib/spotCuration';

/**
 * What a list page sends per item: everything its tiles, filters and search read, without the fields only the detail
 * page shows. The long description is cut, since search only needs its start. /events went from ~290 KB of page data
 * to well under half (2026-10-28, phone tab switches felt slow).
 */
const DESCRIPTION_CHARS = 280;

const EVENT_DETAIL_ONLY = [
  'source', 'sourceUrl', 'externalUrl', 'link', 'moderatedAt', 'transportation', 'itinerary', 'galleryImages', 'raceDistances',
  'faq', 'contact', 'parking', 'ticketTiers', 'highlights', 'agenda', 'rules', 'meetingPoint', 'safetyNotes',
] as const;

const SPOT_DETAIL_ONLY = [
  'galleryImages', 'sourceUrl', 'sourceName', 'googleMapsUrl', 'contact', 'transitInfo', 'parkingInfo', 'highlights',
  'reviews', 'facilities', 'tips', 'faq', 'website', 'phone',
] as const;

const cut = (text: string | undefined) => (text && text.length > DESCRIPTION_CHARS ? `${text.slice(0, DESCRIPTION_CHARS)}…` : text);

export function eventListItem(event: EventItem): EventItem {
  const item = { ...event, description: cut(event.description) ?? '' } as Record<string, unknown>;
  for (const key of EVENT_DETAIL_ONLY) delete item[key];
  return item as unknown as EventItem;
}

export function spotListItem(spot: LifestyleSpotItem): LifestyleSpotItem {
  const item = { ...spot, description: cut(spot.description) ?? '' } as Record<string, unknown>;
  for (const key of SPOT_DETAIL_ONLY) delete item[key];
  // The tier and score only (ranking and the day plan read them), as GET /api/spots sends; the reasons stay in the admin console
  if (spot.curation) item.curation = { score: spot.curation.score, tier: effectiveTier(spot), reasons: [], computedAt: spot.curation.computedAt };
  return item as unknown as LifestyleSpotItem;
}

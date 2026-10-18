import { getMasterData } from '@/lib/masterDataStore';
import type { EventItem } from '@/data/mockData';

type CategoryFields = Pick<EventItem, 'lifestyleCategory' | 'fairCategory'> & { category?: EventItem['category'] };

/**
 * The group a host picked for the ค้นพบ tabs, checked against the active groups in master data: a meetup keeps
 * only a real meetup category (and its mood is set from it), a fair only a real fair group. Anything else is dropped,
 * so the list falls back to sorting by title. Returns the fields to write over the incoming event.
 */
export function checkedEventCategories(eventData: Partial<EventItem>): CategoryFields {
  const master = getMasterData();
  if (eventData.eventType === 'public_venue') {
    const ok = master.fairCategories.some((c) => c.active && c.id === eventData.fairCategory);
    return { lifestyleCategory: undefined, fairCategory: ok ? eventData.fairCategory : undefined };
  }
  const picked = master.communityCategories.find((c) => c.active && c.id === eventData.lifestyleCategory);
  const mood = picked?.parentId as EventItem['category'] | undefined;
  return {
    fairCategory: undefined,
    lifestyleCategory: picked?.id,
    ...(mood && ['heal', 'move', 'chill', 'learn'].includes(mood) && { category: mood }),
  };
}

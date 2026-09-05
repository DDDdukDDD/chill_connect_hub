import { EventItem, ChallengeQuest } from '@/data/mockData';
import { LifestyleSpotItem } from '@/data/spotsData';
import {
  EventQueryParams,
  SpotQueryParams,
  QuestQueryParams,
  PaginatedResult,
} from './types';

/**
 * Universal Array Paginator
 * Slices an array of items and returns structured pagination metadata.
 */
export function paginateArray<T>(
  items: T[],
  page: number = 1,
  limit: number = 12
): PaginatedResult<T> {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));
  
  const startIndex = (safePage - 1) * safeLimit;
  const slicedItems = items.slice(startIndex, startIndex + safeLimit);

  const hasNextPage = safePage < totalPages;
  const hasPrevPage = safePage > 1;

  return {
    items: slicedItems,
    totalCount,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextCursor: hasNextPage ? String(safePage + 1) : null,
  };
}

/**
 * Helper to check if an event has already ended based on date
 */
export function isEventEnded(event: EventItem): boolean {
  if (event.status === 'ended') return true;
  if (!event.date) return false;

  const currentYear = 2026;
  // Match DD Month YYYY (e.g. 23 ส.ค. 2026 or 2026-08-23)
  const isoMatch = event.date.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const evDate = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T23:59:59`);
    return evDate.getTime() < Date.now();
  }

  const thaiMonths: Record<string, number> = {
    'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3, 'พ.ค.': 4, 'มิ.ย.': 5,
    'ก.ค.': 6, 'ส.ค.': 7, 'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11,
  };

  for (const [mName, mIdx] of Object.entries(thaiMonths)) {
    if (event.date.includes(mName)) {
      const dayMatch = event.date.match(/(\d{1,2})/);
      const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
      const evDate = new Date(currentYear, mIdx, day, 23, 59, 59);
      return evDate.getTime() < Date.now();
    }
  }

  return false;
}

/**
 * Filter Events across the 3 Pillars with multi-criteria indexing
 */
export function filterEvents(
  events: EventItem[],
  params: EventQueryParams = {}
): EventItem[] {
  const {
    eventType = 'all',
    category,
    province,
    zone,
    venueTag,
    searchQuery,
    status,
    includeEnded = false,
    sortBy = 'newest',
  } = params;

  const filtered = events.filter((ev) => {
    // 1. Ended Events auto-hide unless explicitly requested
    if (!includeEnded && isEventEnded(ev)) {
      return false;
    }

    // 2. Event Type Pillar filter
    if (eventType !== 'all' && ev.eventType !== eventType) {
      return false;
    }

    // 3. Category Filter
    if (category && category !== 'all' && ev.category !== category) {
      return false;
    }

    // 4. Province Filter (Supports fuzzy Thai province comparison & Online meetups)
    if (province && province !== 'all' && province !== 'ทั่วไทย') {
      const pLower = province.toLowerCase().trim();
      const isOnlineQuery = pLower === 'online' || pLower.includes('ออนไลน์');

      if (isOnlineQuery) {
        const isOnline =
          ev.province === 'ออนไลน์' ||
          (ev.location || '').toLowerCase().includes('ออนไลน์') ||
          (ev.location || '').toLowerCase().includes('zoom') ||
          (ev.location || '').toLowerCase().includes('discord');
        if (!isOnline) return false;
      } else {
        const evLocation = (ev.location || '').toLowerCase();
        const evProv = (ev.province || '').toLowerCase();

        // Normalize Bangkok variations: กทม, กรุงเทพ, กรุงเทพฯ, กรุงเทพมหานคร, bangkok
        const isBkkQuery = pLower.includes('กรุงเทพ') || pLower.includes('กทม') || pLower.includes('bangkok');
        const isEvBkk = evProv.includes('กรุงเทพ') || evProv.includes('กทม') || evLocation.includes('กรุงเทพ') || evLocation.includes('กทม');

        if (isBkkQuery) {
          if (!isEvBkk) return false;
        } else {
          // Other provinces (e.g. นนทบุรี, เชียงใหม่, ชลบุรี, ภูเก็ต)
          const cleanProvQuery = pLower.replace('จังหวัด', '').trim();
          if (!evLocation.includes(cleanProvQuery) && !evProv.includes(cleanProvQuery)) {
            return false;
          }
        }
      }
    }

    // 4.1 Zone / District Filter (For Neighborhoods e.g. ari, siam, bangna, etc.)
    if (zone && zone !== 'all') {
      const zLower = zone.toLowerCase().trim();
      const evZone = (ev.zone || '').toLowerCase();
      const evLocation = (ev.location || '').toLowerCase();
      if (!evZone.includes(zLower) && !evLocation.includes(zLower)) {
        return false;
      }
    }

    // 5. Venue Tag (For Major Fairs e.g. 'qsncc', 'bitec', 'impact')
    if (venueTag && venueTag !== 'all' && ev.venueTag !== venueTag) {
      return false;
    }

    // 6. Recruitment Status (For Community Meetups)
    if (status && status !== 'all') {
      const isFull = (ev.participantsCount ?? 0) >= (ev.maxParticipants ?? 10);
      if (status === 'full' && !isFull) return false;
      if (status === 'recruiting' && isFull) return false;
      if (status === 'ended' && !isEventEnded(ev)) return false;
    }

    // 7. Full-text Search Query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const searchableText = [
        ev.title,
        ev.description,
        ev.location,
        ev.hostName,
        ev.tag,
        ev.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // Sort
  if (sortBy === 'popular') {
    filtered.sort((a, b) => (b.participantsCount || 0) - (a.participantsCount || 0));
  } else if (sortBy === 'oldest') {
    filtered.sort((a, b) => (a.createdAtTimestamp || 0) - (b.createdAtTimestamp || 0));
  } else {
    // 'newest' default
    filtered.sort((a, b) => (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0));
  }

  return filtered;
}

/**
 * Filter Lifestyle Spots across 77 Thai provinces
 */
export function filterSpots(
  spots: LifestyleSpotItem[],
  params: SpotQueryParams = {}
): LifestyleSpotItem[] {
  const {
    category,
    province,
    vibeTag,
    searchQuery,
    hasImageOnly = false,
    sortBy = 'popular',
  } = params;

  const filtered = spots.filter((spot) => {
    // 1. Category filter
    if (category && category !== 'all' && spot.category !== category) {
      return false;
    }

    // 2. Province filter
    if (province && province !== 'all') {
      const pLower = province.toLowerCase();
      const spotProv = (spot.province || '').toLowerCase();
      if (!spotProv.includes(pLower) && !pLower.includes(spotProv)) {
        return false;
      }
    }

    // 3. Vibe Tag filter
    if (vibeTag && vibeTag !== 'all') {
      const hasVibe = (spot.vibeTags || []).some(
        (v) => v.toLowerCase() === vibeTag.toLowerCase()
      );
      if (!hasVibe) return false;
    }

    // 4. Has Image filter
    if (hasImageOnly && (!spot.image || spot.image.includes('placeholder'))) {
      return false;
    }

    // 5. Full-text search
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const searchable = [
        spot.title,
        spot.description,
        spot.province,
        spot.district,
        spot.categoryLabel,
        ...(spot.vibeTags || []),
        ...(spot.highlights || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchable.includes(q)) {
        return false;
      }
    }

    return true;
  });

  if (sortBy === 'rating') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return filtered;
}

/**
 * Filter Challenge Quests
 */
export function filterQuests(
  quests: ChallengeQuest[],
  params: QuestQueryParams = {}
): ChallengeQuest[] {
  const { category, searchQuery } = params;

  return quests.filter((q) => {
    if (category && category !== 'all' && q.category !== category) {
      return false;
    }
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const searchable = `${q.title} ${q.objective || ''} ${q.targetGoal || ''} ${q.badgeLabel || ''}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
}

import { getSpotVibeCategory, type LifestyleSpotItem } from '@/data/spotsData';
import type { SpotVibeId } from '@/data/masterHub';
import { cacheManager } from './cache';
import { db } from './db';
import type { Member } from './members/types';
import { spotAllowsMeetups } from './social/spotTrips';
import { visitsOf } from './social/visits';

/**
 * The places the member home needs, instead of the whole catalog (~2,000 places, 21 requests of ~300 KB):
 * the best-ranked ones (the band's picks), the best of every vibe (the "ที่เที่ยว" row, meet-up places first),
 * and the member's own saved and visited places (the band's plans and share prompts).
 */
const TOP_OVERALL = 30;
const PER_VIBE = 2;

/** Same ranking the home page used on the full list */
const score = (spot: LifestyleSpotItem) => (spot.popularity || 0) + (spot.rating > 0 ? spot.rating * 200 : 0);

async function allPublishedSpots(): Promise<LifestyleSpotItem[]> {
  const spots: LifestyleSpotItem[] = [];
  for (let page = 1; ; page++) {
    const result = await db.findSpots({ page, limit: 100 });
    spots.push(...result.items);
    if (!result.hasNextPage) return spots;
  }
}

function featuredSpots(): Promise<LifestyleSpotItem[]> {
  return cacheManager.getOrSet(
    'spots:home-featured',
    async () => {
      const ranked = (await allPublishedSpots()).sort((a, b) => score(b) - score(a));
      const picked = new Set(ranked.slice(0, TOP_OVERALL));
      const byVibe = new Map<SpotVibeId, { meetup: number; other: number }>();
      for (const spot of ranked) {
        const vibe = getSpotVibeCategory(spot);
        const taken = byVibe.get(vibe) ?? { meetup: 0, other: 0 };
        const kind = spotAllowsMeetups(spot) ? 'meetup' : 'other';
        if (taken[kind] < PER_VIBE) {
          taken[kind]++;
          picked.add(spot);
        }
        byVibe.set(vibe, taken);
      }
      return ranked.filter((spot) => picked.has(spot));
    },
    { ttlMs: 60 * 1000, tags: ['spots'] }
  );
}

export async function homeSpotsFor(member: Member | null): Promise<LifestyleSpotItem[]> {
  const featured = await featuredSpots();
  if (!member) return featured;
  const have = new Set(featured.map((spot) => spot.id));
  const visited = (await visitsOf(member.id)).filter((v) => v.targetType === 'spot').map((v) => v.targetId);
  const ownIds = [...new Set([...(member.savedSpotIds ?? []), ...visited])].filter((id) => !have.has(id)).slice(0, 200);
  const own = await Promise.all(ownIds.map((id) => db.findSpotById(id)));
  return [...featured, ...own.filter((spot): spot is LifestyleSpotItem => Boolean(spot) && spot!.publicationStatus !== 'draft')];
}

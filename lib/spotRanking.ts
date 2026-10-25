import type { LifestyleSpotItem } from '@/data/spotsData';
import { effectiveTier } from './spotCuration';

const TIER_ORDER = { featured: 0, standard: 1, hidden: 2 } as const;

/** Browsing leaves out places curated as hidden; a search still finds them (lib/spotCuration.ts) */
export const shownWhenBrowsing = (spot: LifestyleSpotItem) => effectiveTier(spot) !== 'hidden';

/**
 * The default order of the /spots list: curated tier (featured first), then the curation score, then nationwide
 * view count plus a rating bonus.
 * A place a member suggested in the last 14 days goes first (newest on top): it has no views or rating yet
 * and would otherwise sit on the last page where nobody finds it.
 * Shared by the page and the server, so the places sent in the HTML are the ones the page shows first.
 */
export function compareSpotsByRank(openedAt: number) {
  const freshSince = openedAt - 14 * 24 * 60 * 60 * 1000;
  const freshness = (spot: LifestyleSpotItem) => {
    const suggested = spot.suggestedAt ? Date.parse(spot.suggestedAt) : 0;
    return suggested >= freshSince ? suggested : 0;
  };
  const score = (spot: LifestyleSpotItem) => (spot.popularity || 0) + (spot.rating > 0 ? spot.rating * 200 : 0);
  return (a: LifestyleSpotItem, b: LifestyleSpotItem) =>
    freshness(b) - freshness(a) ||
    TIER_ORDER[effectiveTier(a)] - TIER_ORDER[effectiveTier(b)] ||
    (b.curation?.score ?? 0) - (a.curation?.score ?? 0) ||
    score(b) - score(a);
}

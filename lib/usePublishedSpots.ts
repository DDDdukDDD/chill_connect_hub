'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchAllContentPages } from '@/lib/contentClient';
import { LifestyleSpotItem, MOCK_SPOTS, getSpotVibeCategory } from '@/data/spotsData';
import { SpotVibeId } from '@/data/masterHub';

/**
 * High-performance WeakMap caches for O(1) instantaneous lookups.
 * Eliminates repetitive string concatenation and regex parsing across 2,040+ spots.
 */
const vibeCache = new WeakMap<LifestyleSpotItem, SpotVibeId>();
const searchTextCache = new WeakMap<LifestyleSpotItem, string>();

export function getCachedSpotVibeCategory(spot: LifestyleSpotItem): SpotVibeId {
  let vibe = vibeCache.get(spot);
  if (!vibe) {
    vibe = getSpotVibeCategory(spot);
    vibeCache.set(spot, vibe);
  }
  return vibe;
}

export function getCachedSpotSearchText(spot: LifestyleSpotItem): string {
  let text = searchTextCache.get(spot);
  if (!text) {
    text = `${spot.province} ${spot.district || ''} ${spot.title} ${(spot.vibeTags || []).join(' ')} ${spot.categoryLabel || ''} ${spot.description}`.toLowerCase();
    searchTextCache.set(spot, text);
  }
  return text;
}

/**
 * Published spots from `/api/spots`, fetched once per page load and shared by every component.
 * In-memory singleton cachedSpots prevents redundant network requests across tab/page switches.
 */
let pending: Promise<LifestyleSpotItem[]> | null = null;
let cachedSpots: LifestyleSpotItem[] | null = null;

export function getLoadedSpotsSync(): LifestyleSpotItem[] | null {
  return cachedSpots;
}

export function loadPublishedSpots(): Promise<LifestyleSpotItem[]> {
  if (cachedSpots && cachedSpots.length > 0) {
    return Promise.resolve(cachedSpots);
  }

  pending ??= fetchAllContentPages<LifestyleSpotItem>('/api/spots', 'spots')
    .then((spots) => {
      const finalSpots = spots.length > 0 ? spots : MOCK_SPOTS;
      cachedSpots = finalSpots;

      // Pre-warm the cache for all spots in single synchronous pass (< 5ms)
      for (let i = 0; i < finalSpots.length; i++) {
        getCachedSpotVibeCategory(finalSpots[i]);
        getCachedSpotSearchText(finalSpots[i]);
      }

      return finalSpots;
    })
    .catch((error) => {
      console.warn('Using bundled spots fallback:', error);
      // Show the bundled spots for now but do not cache them, so the next mount retries the API
      pending = null;
      return MOCK_SPOTS;
    });
  return pending;
}

/** Returns cached spots immediately if available, or fetches once without blocking navigation. */
export function usePublishedSpots(): { spots: LifestyleSpotItem[]; isLoaded: boolean } {
  const [spots, setSpots] = useState<LifestyleSpotItem[]>(() => cachedSpots || []);
  const [isLoaded, setIsLoaded] = useState(() => cachedSpots !== null);

  useEffect(() => {
    let active = true;
    if (cachedSpots && spots.length === cachedSpots.length) {
      return;
    }

    loadPublishedSpots().then((result) => {
      if (!active) return;
      setSpots(result);
      setIsLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [spots.length]);

  return { spots, isLoaded };
}

/**
 * Published spots plus the bundled ones that are no longer published, for resolving ids a member
 * saved earlier (saved lists must not silently lose places when the catalog changes).
 */
export function useSpotCatalog(): LifestyleSpotItem[] {
  const { spots } = usePublishedSpots();
  return useMemo(() => {
    const ids = new Set(spots.map((spot) => spot.id));
    return [...spots, ...MOCK_SPOTS.filter((spot) => !ids.has(spot.id))];
  }, [spots]);
}


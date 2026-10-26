'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchAllContentPages } from '@/lib/contentClient';
import { LifestyleSpotItem, MOCK_SPOTS, getSpotVibeCategory } from '@/data/spotsData';
import { SpotVibeId } from '@/data/masterHub';
import { spotSearchText } from '@/lib/discoverMatch';

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
    text = spotSearchText(spot);
    searchTextCache.set(spot, text);
  }
  return text;
}

/**
 * Published spots from `/api/spots`, fetched once per page load and shared by every component.
 * The cache lives on globalThis, not in module variables: the bundler puts this module in several chunks, and each
 * copy kept its own cache, so the member home downloaded the whole catalog (21 requests) twice (E2E 2026-10-26).
 */
type SpotsCache = { pending: Promise<LifestyleSpotItem[]> | null; spots: LifestyleSpotItem[] | null };
const cache: SpotsCache = ((globalThis as { __publishedSpots?: SpotsCache }).__publishedSpots ??= { pending: null, spots: null });

export function getLoadedSpotsSync(): LifestyleSpotItem[] | null {
  return cache.spots;
}

export function loadPublishedSpots(): Promise<LifestyleSpotItem[]> {
  if (cache.spots && cache.spots.length > 0) {
    return Promise.resolve(cache.spots);
  }

  cache.pending ??= fetchAllContentPages<LifestyleSpotItem>('/api/spots', 'spots')
    .then((spots) => {
      const finalSpots = spots.length > 0 ? spots : MOCK_SPOTS;
      cache.spots = finalSpots;

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
      cache.pending = null;
      return MOCK_SPOTS;
    });
  return cache.pending;
}

/**
 * Returns cached spots immediately if available, or fetches once without blocking navigation.
 * `enabled: false` skips the download (the whole catalog is ~2,000 places in 21 requests) until a screen needs it.
 */
export function usePublishedSpots(enabled = true): { spots: LifestyleSpotItem[]; isLoaded: boolean } {
  const [spots, setSpots] = useState<LifestyleSpotItem[]>(() => cache.spots || []);
  const [isLoaded, setIsLoaded] = useState(() => cache.spots !== null);

  useEffect(() => {
    let active = true;
    if (!enabled || (cache.spots && spots.length === cache.spots.length)) {
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
  }, [spots.length, enabled]);

  return { spots, isLoaded };
}

/**
 * The member home and My Hub need ~100 places, not the catalog: GET /api/spots?home=1 sends the best-ranked ones,
 * the best of each vibe and the member's own saved and visited places. The last answer shows at once on the next
 * mount while a fresh one loads (a place saved meanwhile must show up). If the full catalog is already loaded, that is used.
 */
type HomeSpotsCache = { spots: LifestyleSpotItem[] | null };
const homeCache: HomeSpotsCache = ((globalThis as { __homeSpots?: HomeSpotsCache }).__homeSpots ??= { spots: null });

export function useHomeSpots(enabled = true): { spots: LifestyleSpotItem[]; isLoaded: boolean } {
  const [spots, setSpots] = useState<LifestyleSpotItem[]>(() => cache.spots || homeCache.spots || []);
  const [isLoaded, setIsLoaded] = useState(() => Boolean(cache.spots || homeCache.spots));

  useEffect(() => {
    if (!enabled || cache.spots) return;
    let active = true;
    fetch('/api/spots?home=1', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        const list: LifestyleSpotItem[] = Array.isArray(json?.spots) ? json.spots : [];
        homeCache.spots = list;
        setSpots(list);
        setIsLoaded(true);
      })
      .catch(() => active && setIsLoaded(true));
    return () => {
      active = false;
    };
  }, [enabled]);

  return { spots, isLoaded };
}

/**
 * Published spots plus the bundled ones that are no longer published, for resolving ids a member
 * saved earlier (saved lists must not silently lose places when the catalog changes).
 */
export function useSpotCatalog(scope: 'all' | 'home' = 'all'): LifestyleSpotItem[] {
  const all = usePublishedSpots(scope === 'all');
  const home = useHomeSpots(scope === 'home');
  const { spots } = scope === 'home' ? home : all;
  return useMemo(() => {
    const ids = new Set(spots.map((spot) => spot.id));
    return [...spots, ...MOCK_SPOTS.filter((spot) => !ids.has(spot.id))];
  }, [spots]);
}


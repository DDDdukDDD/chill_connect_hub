'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchAllContentPages } from '@/lib/contentClient';
import { LifestyleSpotItem, MOCK_SPOTS } from '@/data/spotsData';

/**
 * Published spots from `/api/spots`, fetched once per page load and shared by every component.
 * The bundled MOCK_SPOTS are only a fallback when the API is unreachable or empty, because the
 * live catalog (imported from the Department of Tourism) is not in the static data.
 */
let pending: Promise<LifestyleSpotItem[]> | null = null;

export function loadPublishedSpots(): Promise<LifestyleSpotItem[]> {
  pending ??= fetchAllContentPages<LifestyleSpotItem>('/api/spots', 'spots')
    .then((spots) => (spots.length > 0 ? spots : MOCK_SPOTS))
    .catch((error) => {
      console.warn('Using bundled spots fallback:', error);
      pending = null; // retry on the next mount
      return MOCK_SPOTS;
    });
  return pending;
}

/** Returns `[]` until the catalog has loaded, then the published spots. */
export function usePublishedSpots(): { spots: LifestyleSpotItem[]; isLoaded: boolean } {
  const [spots, setSpots] = useState<LifestyleSpotItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    loadPublishedSpots().then((result) => {
      if (!active) return;
      setSpots(result);
      setIsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

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

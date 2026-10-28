'use client';

import { useMemo } from 'react';
import { MOCK_SPOTS, type LifestyleSpotItem } from '@/data/spotsData';
import { useHomeSpots, usePublishedSpots } from '@/lib/usePublishedSpots';

// Its own file: it needs the bundled sample places (~400 KB), which the other place hooks no longer ship (2026-10-28)

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


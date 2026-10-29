'use client';

import type { LifestyleSpotItem } from '@/data/spotsData';
import { useHomeSpots, usePublishedSpots } from '@/lib/usePublishedSpots';

/**
 * Published spots for resolving ids a member saved. With 'home', the server already adds the member's saved and
 * visited places, bundled samples that left the catalog included (lib/homeSpots.ts), so the browser no longer
 * ships the ~400 KB of samples for it (2026-10-29: My Hub, and every page linking there, downloaded them).
 */
export function useSpotCatalog(scope: 'all' | 'home' = 'all'): LifestyleSpotItem[] {
  const all = usePublishedSpots(scope === 'all');
  const home = useHomeSpots(scope === 'home');
  return (scope === 'home' ? home : all).spots;
}

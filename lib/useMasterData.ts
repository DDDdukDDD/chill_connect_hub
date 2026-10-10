'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildSeedMasterData, MasterCategory, MasterFeaturedGroup, MasterProvince, MasterVenue, MasterZone,
  resolveCommunityCategories, resolveCommunityClubs, resolveCommunityMoods, resolveFairCategories,
  resolveFeaturedProvinces, resolveProvinces, resolveSpotVibes, resolveVenueGroups, resolveVenues, resolveZones,
} from './masterData';

/**
 * Admin-managed master data for the public site, fetched once per page load from /api/master.
 * Until it loads (or if it fails) the bundled code defaults are used, so the UI never renders empty.
 * The resolved lists keep the shapes of the old constants (MASTER_SPOT_CATEGORIES, MASTER_VENUE_OPTIONS, …).
 */
interface PublicMasterData {
  spotVibes: MasterCategory[];
  communityMoods: MasterCategory[];
  communityCategories: MasterCategory[];
  fairCategories: MasterCategory[];
  questCategories: MasterCategory[];
  venues: MasterVenue[];
  provinces: MasterProvince[];
  zones: MasterZone[];
  communityClubs: MasterFeaturedGroup[];
  venueGroups: MasterFeaturedGroup[];
}

let cached: PublicMasterData | null = null;
let pending: Promise<PublicMasterData | null> | null = null;

function loadMasterData(): Promise<PublicMasterData | null> {
  if (cached) return Promise.resolve(cached);
  pending ??= fetch('/api/master')
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => {
      if (json?.success) cached = json as PublicMasterData;
      return cached;
    })
    .catch(() => null)
    .finally(() => { pending = null; });
  return pending;
}

export function useMasterData() {
  const [data, setData] = useState<PublicMasterData | null>(() => cached);

  useEffect(() => {
    if (cached) return;
    let active = true;
    loadMasterData().then((result) => { if (active && result) setData(result); });
    return () => { active = false; };
  }, []);

  return useMemo(() => {
    const source = data ?? buildSeedMasterData();
    return {
      isLoaded: data !== null,
      spotVibes: resolveSpotVibes(source.spotVibes),
      communityMoods: resolveCommunityMoods(source.communityMoods),
      communityCategories: resolveCommunityCategories(source.communityCategories),
      fairCategories: resolveFairCategories(source.fairCategories),
      questCategories: source.questCategories.filter((c) => c.active),
      venues: resolveVenues(source.venues),
      provinces: resolveProvinces(source.provinces),
      featuredProvinces: resolveFeaturedProvinces(source.provinces),
      zonesFor: (province?: string) => resolveZones(source.zones, province),
      /** TopCommunityRail cards (TOP_COMMUNITY_CLUBS shape) */
      communityClubs: resolveCommunityClubs(source.communityClubs),
      /** TopVenuesRail cards (TOP_VENUES shape) */
      venueGroups: resolveVenueGroups(source.venueGroups),
    };
  }, [data]);
}

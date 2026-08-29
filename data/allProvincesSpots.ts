import type { LifestyleSpotItem } from './spotsData';
import { BANGKOK_SPOTS } from './spots/bangkok';
import { CENTRAL_SPOTS } from './spots/central';
import { NORTH_SPOTS } from './spots/north';
import { SOUTH_SPOTS } from './spots/south';
import { NORTHEAST_SPOTS } from './spots/northeast';
import { EAST_WEST_SPOTS } from './spots/east_west';

/**
 * Curated Top Lifestyle Spots & Popular Check-in Landmarks for all 77 Thai Provinces
 * Comprehensive authentic data covering all 77 provinces of Thailand.
 */
export const PROVINCES_77_TOP_SPOTS: LifestyleSpotItem[] = [
  ...BANGKOK_SPOTS,
  ...CENTRAL_SPOTS,
  ...NORTH_SPOTS,
  ...SOUTH_SPOTS,
  ...NORTHEAST_SPOTS,
  ...EAST_WEST_SPOTS,
];

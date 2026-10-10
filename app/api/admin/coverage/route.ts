import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { db } from '@/lib/db';
import { isThaiCoordinate } from '@/lib/contentQuality';
import { getSpotVibeCategory, LifestyleSpotItem } from '@/data/spotsData';
import { MASTER_77_PROVINCES, MASTER_SPOT_CATEGORIES, SpotVibeId } from '@/data/masterHub';

async function getAllSpots(): Promise<LifestyleSpotItem[]> {
  const first = await db.findSpots({ page: 1, limit: 100, includeDrafts: true });
  const spots = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) {
    spots.push(...(await db.findSpots({ page, limit: 100, includeDrafts: true })).items);
  }
  return spots;
}

// The app stores Bangkok as "กรุงเทพฯ"; some imports use the official long name
const normalizeProvince = (name: string) => (name === 'กรุงเทพมหานคร' ? 'กรุงเทพฯ' : name);

/**
 * Spot coverage for the admin.
 * - default: published spots per province × the 7 frontend vibes, plus drafts per province
 * - ?view=points: every spot (published and draft) as a light map point
 */
export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;

  const spots = await getAllSpots();
  const view = new URL(request.url).searchParams.get('view');

  if (view === 'points') {
    return NextResponse.json(
      {
        success: true,
        points: spots.map((spot) => ({
          id: spot.id,
          title: spot.title,
          province: normalizeProvince(spot.province),
          vibe: getSpotVibeCategory(spot),
          status: spot.publicationStatus === 'draft' ? 'draft' : 'published',
          lat: spot.latitude,
          lng: spot.longitude,
          validCoordinates: isThaiCoordinate(spot.latitude, spot.longitude),
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const vibes = MASTER_SPOT_CATEGORIES.map((category) => ({ id: category.id, label: category.name }));
  const emptyVibes = () => Object.fromEntries(vibes.map((vibe) => [vibe.id, 0])) as Record<SpotVibeId, number>;
  const rows = new Map(MASTER_77_PROVINCES.map((province) => [province, { province, total: 0, drafts: 0, vibes: emptyVibes() }]));
  const unknownProvinces = new Set<string>();

  for (const spot of spots) {
    const province = normalizeProvince(spot.province);
    const row = rows.get(province);
    if (!row) {
      unknownProvinces.add(spot.province);
      continue;
    }
    if (spot.publicationStatus === 'draft') {
      row.drafts += 1;
      continue;
    }
    row.total += 1;
    row.vibes[getSpotVibeCategory(spot)] += 1;
  }

  const provinces = [...rows.values()];
  const vibeTotals = emptyVibes();
  for (const row of provinces) for (const vibe of vibes) vibeTotals[vibe.id] += row.vibes[vibe.id];

  return NextResponse.json(
    {
      success: true,
      vibes,
      provinces,
      totals: {
        published: provinces.reduce((sum, row) => sum + row.total, 0),
        drafts: provinces.reduce((sum, row) => sum + row.drafts, 0),
        vibes: vibeTotals,
        emptyCells: provinces.reduce((sum, row) => sum + vibes.filter((vibe) => row.vibes[vibe.id] === 0).length, 0),
      },
      unknownProvinces: [...unknownProvinces],
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

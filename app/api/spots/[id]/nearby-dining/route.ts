import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getNearbyDiningSync } from '@/lib/nearbyDiningService';
import { GOOGLE_ATTRIBUTION, MIN_GOOGLE_RATING, MIN_GOOGLE_REVIEWS, searchHighlyRatedDining } from '@/lib/googlePlaces';
import type { LifestyleSpotItem } from '@/data/spotsData';

export const dynamic = 'force-dynamic';

async function getPublishedSpots(): Promise<LifestyleSpotItem[]> {
  const first = await db.findSpots({ page: 1, limit: 100 });
  const spots = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) {
    spots.push(...(await db.findSpots({ page, limit: 100 })).items);
  }
  return spots;
}

/**
 * Cafes and restaurants around a published spot.
 * With GOOGLE_PLACES_API_KEY: live Google Places results rated >= 4.5 with >= 50 reviews (nothing stored).
 * Otherwise (no key, monthly cap reached, Google error): nearby cafes from our own catalog, without ratings.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const spot = await db.findSpotById(decodeURIComponent(id));
    if (!spot || spot.publicationStatus === 'draft') {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    const requested = Number.parseInt(request.nextUrl.searchParams.get('limit') || '6', 10);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 12) : 6;
    const catalog = await getPublishedSpots();

    const google = await searchHighlyRatedDining(spot, limit, catalog);
    const fromGoogle = google !== null;

    return NextResponse.json(
      {
        spotId: spot.id,
        spotTitle: spot.title,
        district: spot.district,
        province: spot.province,
        source: fromGoogle ? 'google' : 'catalog',
        ...(fromGoogle && {
          attribution: GOOGLE_ATTRIBUTION,
          filter: { minRating: MIN_GOOGLE_RATING, minReviews: MIN_GOOGLE_REVIEWS },
        }),
        data: fromGoogle ? google : getNearbyDiningSync(spot, limit, catalog),
      },
      // Google content must not be cached by us or by intermediaries
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[API nearby-dining] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

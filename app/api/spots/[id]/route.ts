import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** One published spot by id (drafts are hidden). Used by the spot detail page. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const spot = await db.findSpotById(decodeURIComponent(id));
    if (!spot || spot.publicationStatus === 'draft') {
      return NextResponse.json({ success: false, error: 'Spot not found' }, { status: 404 });
    }
    return NextResponse.json(
      { success: true, spot },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('Error in /api/spots/[id] GET:', error);
    return NextResponse.json({ success: false, error: 'Failed to load spot' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { MOCK_SPOTS } from '@/data/spotsData';
import { getNearbyDining } from '@/lib/nearbyDiningService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    const spot = MOCK_SPOTS.find((s) => s.id === decodedId);
    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    const diningItems = await getNearbyDining(spot, limit);

    return NextResponse.json({
      spotId: spot.id,
      spotTitle: spot.title,
      district: spot.district,
      province: spot.province,
      data: diningItems,
    });
  } catch (error) {
    console.error('[API nearby-dining] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

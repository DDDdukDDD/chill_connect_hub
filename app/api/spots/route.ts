import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const province = searchParams.get('province');
    const category = searchParams.get('category');
    const vibeTag = searchParams.get('vibe');
    const searchQuery = searchParams.get('q');
    const hasImageOnly = searchParams.get('hasImageOnly') === 'true';

    const result = await db.findSpots({
      page,
      limit,
      province,
      category,
      vibeTag,
      searchQuery,
      hasImageOnly,
    });

    return NextResponse.json(
      {
        success: true,
        spots: result.items,
        pagination: {
          totalCount: result.totalCount,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          nextCursor: result.nextCursor,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error in /api/spots GET:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพิกัดสถานที่' },
      { status: 500 }
    );
  }
}

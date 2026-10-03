import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function parsePositiveInteger(value: string | null, fallback: number, max?: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await db.findQuests({
      page: parsePositiveInteger(searchParams.get('page'), 1),
      limit: parsePositiveInteger(searchParams.get('limit'), 12, 100),
      category: searchParams.get('category'),
      searchQuery: searchParams.get('q'),
    });

    return NextResponse.json(
      {
        success: true,
        quests: result.items,
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
    console.error('Error in /api/quests GET:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลชาเลนจ์' },
      { status: 500 }
    );
  }
}
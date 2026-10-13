import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember } from '@/lib/members/session';
import { spotsSuggestedBy, suggestSpot } from '@/lib/members/submissions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ?mine=1 → what the signed-in member sent in, any review state (for My Hub)
    if (searchParams.get('mine') === '1') {
      const viewer = await getSessionMember(request);
      const spots = viewer ? await spotsSuggestedBy(viewer.id) : [];
      return NextResponse.json({ success: true, spots }, { headers: { 'Cache-Control': 'no-store' } });
    }
    // ?ids=a,b,c (≤ 30) → those published places, in the order asked; unknown and draft ids are left out
    const ids = searchParams.get('ids');
    if (ids !== null) {
      const wanted = Array.from(new Set(ids.split(',').map((id) => id.trim()).filter(Boolean))).slice(0, 30);
      const found = await Promise.all(wanted.map((id) => db.findSpotById(id)));
      return NextResponse.json(
        { success: true, spots: found.filter((spot) => spot && spot.publicationStatus !== 'draft') },
        { headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

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

/**
 * A signed-in, verified member suggests a place. It is saved as a draft and published by staff after review.
 */
export async function POST(request: Request) {
  try {
    const member = await getSessionMember(request);
    if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ success: false, message: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    const spot = await suggestSpot(member, body as Record<string, unknown>);
    return NextResponse.json({ success: true, spot, message: 'ส่งให้ทีมงานตรวจแล้ว' }, { status: 201 });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('Error in member submission POST:', error);
    return NextResponse.json({ success: false, message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}

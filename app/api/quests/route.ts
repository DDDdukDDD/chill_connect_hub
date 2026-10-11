import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember } from '@/lib/members/session';
import { proposeQuest, questsProposedBy } from '@/lib/members/submissions';

function parsePositiveInteger(value: string | null, fallback: number, max?: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ?mine=1 → what the signed-in member sent in, any review state (for My Hub)
    if (searchParams.get('mine') === '1') {
      const viewer = await getSessionMember(request);
      const quests = viewer ? await questsProposedBy(viewer.id) : [];
      return NextResponse.json({ success: true, quests }, { headers: { 'Cache-Control': 'no-store' } });
    }
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

/**
 * A signed-in, verified member proposes a challenge. It is saved as a draft and published by staff after review.
 */
export async function POST(request: Request) {
  try {
    const member = await getSessionMember(request);
    if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ success: false, message: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    const quest = await proposeQuest(member, body as Record<string, unknown>);
    return NextResponse.json({ success: true, quest, message: 'ส่งให้ทีมงานตรวจแล้ว' }, { status: 201 });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('Error in member submission POST:', error);
    return NextResponse.json({ success: false, message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}

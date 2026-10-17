import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionMember } from '@/lib/members/session';
import { buildQuestDetail } from '@/lib/social/questDetail';

/** One challenge for its detail view (see `buildQuestDetail`); the member's part comes from the session. */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const quest = await db.findQuestById(decodeURIComponent(id));
    if (!quest || quest.status === 'draft') return NextResponse.json({ success: false, message: 'ไม่พบชาเลนจ์นี้' }, { status: 404 });

    const detail = await buildQuestDetail(quest, await getSessionMember(request));
    return NextResponse.json(detail, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Error in /api/quests/[id] GET:', error);
    return NextResponse.json({ success: false, message: 'โหลดชาเลนจ์ไม่สำเร็จ' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { friendsDoing } from '@/lib/social/circleActions';

type Context = { params: Promise<{ id: string }> };

/** GET /api/quests/:id/friends: "คุณแนน คุณวิน และเพื่อนอีก 2 คนทำอยู่ · ทั้งหมด 1,000 คน" for the reader */
export async function GET(request: Request, context: Context) {
  const viewer = await getSessionMember(request);
  const result = await friendsDoing(viewer, (await context.params).id);
  if (!result) return NextResponse.json({ success: false, message: 'ไม่พบชาเลนจ์' }, { status: 404 });
  return NextResponse.json({ success: true, ...result }, { headers: { 'Cache-Control': 'private, no-store' } });
}

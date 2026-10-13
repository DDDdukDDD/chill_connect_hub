import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { QuestJoinError, joinQuest, leaveQuest } from '@/lib/social/questJoins';
import { rewardsOf } from '@/lib/social/rewardsLedger';

// { questId, action: 'join' | 'leave' } → the member's points, progress and joined challenges after the change
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  if (member.status !== 'active') return NextResponse.json({ success: false, message: 'บัญชีนี้ยังใช้งานส่วนนี้ไม่ได้' }, { status: 403 });
  if (isRateLimited(`quest-join:${member.id}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const questId = typeof body.questId === 'string' ? body.questId.trim().slice(0, 120) : '';
    if (!questId || (body.action !== 'join' && body.action !== 'leave')) {
      return NextResponse.json({ success: false, message: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
    if (body.action === 'join') await joinQuest(member.id, questId);
    else await leaveQuest(member.id, questId);
    return NextResponse.json({ success: true, ...(await rewardsOf(member.id)) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof QuestJoinError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('Error in /api/quests/join POST:', error);
    return NextResponse.json({ success: false, message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { joinEvent } from '@/lib/members/activity';
import { createFairGroup, fairGroupsOf, joinFairGroup, leaveFairGroup } from '@/lib/social/fairGroups';

type Context = { params: Promise<{ id: string }> };

// Meet-up groups members opened inside this fair
export async function GET(request: Request, context: Context) {
  const viewer = await getSessionMember(request);
  return NextResponse.json({ success: true, groups: await fairGroupsOf((await context.params).id, viewer) }, { headers: { 'Cache-Control': 'no-store' } });
}

/**
 * { action: 'create', title, meetupPoint, time, note?, maxMembers? }
 * { action: 'join' | 'leave', groupId }   (leaving one's own group closes it)
 * Creating or joining a group also puts the fair in the member's plan.
 */
export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  if (isRateLimited(`fair-group:${member.id}`, 30, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
  const { id: fairId } = await context.params;
  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === 'create') {
      const group = await createFairGroup(member, fairId, body);
      await joinEvent(member, fairId);
      return NextResponse.json({ success: true, groupId: group.id, groups: await fairGroupsOf(fairId, member) }, { status: 201 });
    }
    if (body.action === 'join') {
      await joinFairGroup(member, String(body.groupId ?? ''));
      await joinEvent(member, fairId);
      return NextResponse.json({ success: true, groups: await fairGroupsOf(fairId, member) });
    }
    if (body.action === 'leave') {
      const result = await leaveFairGroup(member, String(body.groupId ?? ''));
      return NextResponse.json({ success: true, ...result, groups: await fairGroupsOf(fairId, member) });
    }
    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ' }, { status: 400 });
  }
}

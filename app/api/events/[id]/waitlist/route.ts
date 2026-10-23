import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { joinWaitlist, leaveWaitlist, waitlistStatus } from '@/lib/social/waitlist';
import { isRateLimited } from '@/lib/rateLimit';

type Context = { params: Promise<{ id: string }> };

// The signed-in member's place on the waiting list of a full ตี้: { inLine, position?, offeredUntil?, waiting }
export async function GET(request: Request, context: Context) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  return NextResponse.json({ success: true, ...(await waitlistStatus(member, (await context.params).id)) }, { headers: { 'Cache-Control': 'no-store' } });
}

// { action: 'join' | 'leave' }
export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  if (isRateLimited(`waitlist:${member.id}`, 30, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
  const eventId = (await context.params).id;
  try {
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    const result = body.action === 'leave' ? await leaveWaitlist(member, eventId) : await joinWaitlist(member, eventId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ' }, { status: 400 });
  }
}

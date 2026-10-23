import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { meetAgainOf, setMeetAgain } from '@/lib/social/meetAgain';
import { isRateLimited } from '@/lib/rateLimit';

type Context = { params: Promise<{ id: string }> };

const fail = (error: unknown) =>
  error instanceof MemberAuthError
    ? NextResponse.json({ success: false, message: error.message }, { status: error.status })
    : NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ' }, { status: 400 });

// The people the signed-in member met at this ตี้ (host + checked-in participants), with their own picks and mutual ones.
// Picks by others are never listed unless they are mutual.
export async function GET(request: Request, context: Context) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    return NextResponse.json({ success: true, ...(await meetAgainOf(member, (await context.params).id)) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return fail(error);
  }
}

// { userId, want?: boolean (default true) } → { picked, matched, roomId? }
export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  if (isRateLimited(`meet-again:${member.id}`, 60, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
  try {
    const body = (await request.json().catch(() => ({}))) as { userId?: unknown; want?: unknown };
    return NextResponse.json({ success: true, ...(await setMeetAgain(member, (await context.params).id, body)) });
  } catch (error) {
    return fail(error);
  }
}

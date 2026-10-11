import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { checkInByHost, participantsForHost } from '@/lib/members/activity';
import { isRateLimited } from '@/lib/rateLimit';

type Context = { params: Promise<{ id: string }> };

// Who joined, for the member who created the event
export async function GET(request: Request, context: Context) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    return NextResponse.json({ success: true, ...(await participantsForHost(member, (await context.params).id)) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ' }, { status: 400 });
  }
}

// Host check-in: { action: 'check_in', code } · { action: 'check_in' | 'undo', userId }
export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  // Codes are short; a limit stops guessing
  if (isRateLimited(`check-in:${member.id}`, 120, 10 * 60 * 1000)) return NextResponse.json({ success: false, message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (body.action !== 'check_in' && body.action !== 'undo') return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  try {
    const target = { code: typeof body.code === 'string' ? body.code : undefined, userId: typeof body.userId === 'string' ? body.userId : undefined };
    return NextResponse.json({ success: true, participant: await checkInByHost(member, (await context.params).id, target, body.action === 'check_in') });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ' }, { status: 400 });
  }
}

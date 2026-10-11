import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { ticketOf } from '@/lib/members/activity';

// The signed-in member's ticket for this event: { code, joinedAt, checkedInAt, isHost, hasHostCheckIn }
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    return NextResponse.json({ success: true, ticket: await ticketOf(member, (await context.params).id) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ' }, { status: 400 });
  }
}

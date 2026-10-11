import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { markNotificationsRead, notificationsFor } from '@/lib/social/notifications';

// The signed-in member's notifications (follows, likes and comments on their moments), newest first
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: true, items: [], unread: 0, requiresLogin: true }, { headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ success: true, ...(await notificationsFor(member)) }, { headers: { 'Cache-Control': 'no-store' } });
}

// Marks every notification as read
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  await markNotificationsRead(member.id);
  return NextResponse.json({ success: true });
}

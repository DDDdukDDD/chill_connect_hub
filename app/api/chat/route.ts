import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { chatInbox } from '@/lib/social/chat';

// The member's chat rooms with what is unread (the "แชต" button in the top bar)
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    return NextResponse.json({ success: true, ...(await chatInbox(member)) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('CHAT INBOX FAILED:', error);
    return NextResponse.json({ success: false, message: 'โหลดแชตไม่สำเร็จ' }, { status: 500 });
  }
}

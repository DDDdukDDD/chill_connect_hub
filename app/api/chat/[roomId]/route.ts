import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { chatMessages, deleteChatMessage, sendChatMessage } from '@/lib/social/chat';

type Context = { params: Promise<{ roomId: string }> };

// Messages of a room the member belongs to. ?after=<ISO time> returns only newer ones (for polling).
export async function GET(request: Request, context: Context) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    const after = new URL(request.url).searchParams.get('after') || undefined;
    return NextResponse.json({ success: true, ...(await chatMessages(member, (await context.params).roomId, after)) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ' }, { status: 400 });
  }
}

// { text } sends a message · { action: 'delete', id } removes one's own message
export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === 'delete') {
      await deleteChatMessage(member, String(body.id ?? ''));
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(`chat:${member.id}`, 30, 60 * 1000)) return NextResponse.json({ success: false, message: 'ส่งข้อความเร็วเกินไป รอสักครู่นะ' }, { status: 429 });
    const message = await sendChatMessage(member, (await context.params).roomId, body.text);
    return NextResponse.json({ success: true, message: { id: message.id, createdAt: message.createdAt } }, { status: 201 });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ' }, { status: 400 });
  }
}

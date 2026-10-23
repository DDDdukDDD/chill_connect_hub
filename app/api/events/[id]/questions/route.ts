import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { answerQuestion, askQuestion, questionsOf, removeQuestion } from '@/lib/social/eventQuestions';
import { isRateLimited } from '@/lib/rateLimit';

type Context = { params: Promise<{ id: string }> };

// Public: the questions on a ตี้ and the host's answers
export async function GET(request: Request, context: Context) {
  const viewer = await getSessionMember(request);
  const result = await questionsOf((await context.params).id, viewer);
  if (!result) return NextResponse.json({ success: false, message: 'ไม่พบตี้นี้' }, { status: 404 });
  return NextResponse.json({ success: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
}

// { action: 'ask', text } (members) · { action: 'answer', id, text } (host) · { action: 'remove', id } (asker or host)
export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  if (isRateLimited(`event-question:${member.id}`, 20, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
  const eventId = (await context.params).id;
  try {
    const body = (await request.json().catch(() => ({}))) as { action?: string; id?: unknown; text?: unknown };
    if (body.action === 'ask') await askQuestion(member, eventId, body.text);
    else if (body.action === 'answer') await answerQuestion(member, eventId, body.id, body.text);
    else if (body.action === 'remove') await removeQuestion(member, eventId, body.id);
    else return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    return NextResponse.json({ success: true, ...(await questionsOf(eventId, member)) });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ' }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { deleteStory, markStoryViewed, reportStory } from '@/lib/social/stories';

type Context = { params: Promise<{ id: string }> };

// {} marks the story as seen by the signed-in member (signed-out views are not counted)
// { action: 'report', reason } reports it (once per member)
export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  if (body?.action === 'report') {
    if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    if (isRateLimited(`story-report:${member.id}`, 10, 24 * 60 * 60 * 1000)) {
      return NextResponse.json({ success: false, message: 'รายงานบ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
    }
    try {
      return NextResponse.json({ success: true, ...(await reportStory(member, id, body.reason)) });
    } catch (error) {
      if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
      return NextResponse.json({ success: false, message: 'รายงานไม่สำเร็จ' }, { status: 400 });
    }
  }
  if (member) await markStoryViewed(member, id);
  return NextResponse.json({ success: true });
}

// Delete own story
export async function DELETE(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    await deleteStory(member, (await context.params).id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ลบไม่สำเร็จ' }, { status: 400 });
  }
}

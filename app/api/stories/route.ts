import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { guardPosting } from '@/lib/members/safety';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { activeStories, createStory } from '@/lib/social/stories';

// Stories that are still within their 24 hours, grouped by author
export async function GET(request: Request) {
  const viewer = await getSessionMember(request);
  return NextResponse.json({ success: true, groups: await activeStories(viewer) }, { headers: { 'Cache-Control': 'no-store' } });
}

// { image (from /api/upload), caption?, target?: { type: community|fair|spot, id, title } } → a story that disappears after 24 hours. Same trust rules as a moment.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนโพสต์' }, { status: 401 });
  if (isRateLimited(`story-post:${member.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'โพสต์บ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  try {
    const input = await request.json();
    await guardPosting(member, 'moment', typeof input?.caption === 'string' ? input.caption : '');
    return NextResponse.json({ success: true, story: await createStory(member, input) }, { status: 201 });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'โพสต์สตอรี่ไม่สำเร็จ' }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { ensureSampleMembers } from '@/lib/members/sampleMembers';
import { captionMentions, createMoment, withoutMentions, listMoments, loadPeople, MomentError, toFeedItem } from '@/lib/moments/service';
import { MemberAuthError } from '@/lib/members/accounts';
import { guardPosting } from '@/lib/members/safety';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { notify } from '@/lib/social/notifications';
import { isRateLimited } from '@/lib/rateLimit';
import { recordAchievement } from '@/lib/social/achievement';
import { notePlanVisit } from '@/lib/social/friendPlans';
import { traceAction } from '@/lib/social/actionLog';

/**
 * Moments feed. ?tab=all|popular|following|saved|mine &author=<memberId> &category=heal|move|chill|learn
 * &location &targetType &targetId &q &tag &media=clip &page &limit(≤30) &cursor (pagination.nextCursor of the page before)
 * Posts by members the viewer has blocked are left out.
 * "saved", "mine" and "following" need a signed-in member (otherwise an empty list with requiresLogin).
 */
export async function GET(request: Request) {
  await ensureSampleMembers(); // development sample accounts for the sample posts
  const { searchParams } = new URL(request.url);
  const viewer = await getSessionMember(request);
  const { moments, requiresLogin, pagination } = await listMoments(viewer, {
    tab: searchParams.get('tab') ?? 'all',
    author: searchParams.get('author') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    targetType: searchParams.get('targetType') ?? undefined,
    targetId: searchParams.get('targetId') ?? undefined,
    location: searchParams.get('location') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    tag: searchParams.get('tag') ?? undefined,
    media: searchParams.get('media') ?? undefined,
    cursor: searchParams.get('cursor') ?? undefined,
    page: Number.parseInt(searchParams.get('page') || '1', 10) || 1,
    limit: Number.parseInt(searchParams.get('limit') || '12', 10) || 12,
  });
  return NextResponse.json({ success: true, moments, ...(requiresLogin && { requiresLogin }), pagination }, { headers: { 'Cache-Control': 'no-store' } });
}
// Create a moment: { caption?, images: string[] (from /api/upload), location?, category?, targetType?, targetId?, targetTitle? }
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนโพสต์' }, { status: 401 });
  if (await isRateLimited(`moment-post:${member.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'โพสต์บ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  try {
    const input = await request.json();
    // Trust rules: verified members only; new accounts have a daily limit and cannot post contact details
    const caption = typeof input?.caption === 'string' ? input.caption : '';
    await guardPosting(member, 'moment', withoutMentions(caption, await captionMentions(member, caption, [...(Array.isArray(input?.taggedIds) ? input.taggedIds : []), ...(Array.isArray(input?.mentions) ? input.mentions : [])])));
    // The challenge line is worked out once, here (FEED_PLAN step 3.5)
    const moment = await recordAchievement(member.id, await createMoment(member, input));
    await Promise.all((moment.taggedIds ?? []).map((id) => notify(id, member, 'tagged', moment.id)));
    // Posting at the place of a "ไปกัน" plan marks the member as having been (lib/social/friendPlans.ts)
    await notePlanVisit(member, moment).catch((error) => console.error('[moments] plan visit failed', error));
    // A post at a place, ตี้ or อีเวนต์ is a visit: credited to whoever brought the member there (docs/TRACEABILITY.md)
    if (moment.targetId && (moment.targetType === 'spot' || moment.targetType === 'community' || moment.targetType === 'fair')) {
      await traceAction(member, 'visit', { type: moment.targetType, ref: moment.targetId });
    }
    const people = await loadPeople([moment]);
    return NextResponse.json({ success: true, moment: toFeedItem(moment, member, people) }, { status: 201 });
  } catch (error) {
    if (error instanceof MomentError || error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('[moments] post failed', error);
    return NextResponse.json({ success: false, message: 'โพสต์ไม่สำเร็จ' }, { status: 500 });
  }
}

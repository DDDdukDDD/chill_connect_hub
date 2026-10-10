import { NextResponse } from 'next/server';
import { momentRepository, MomentTargetType } from '@/lib/moments';
import { createMoment, isPubliclyVisible, loadPeople, MomentError, toFeedItem } from '@/lib/moments/service';
import { MemberAuthError } from '@/lib/members/accounts';
import { guardPosting } from '@/lib/members/safety';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';

const TARGET_TYPES = new Set(['spot', 'community', 'fair', 'challenge', 'general']);

/**
 * Moments feed. ?tab=all|popular|saved|mine &author=<memberId> &location &targetType &targetId &q &page &limit(≤30)
 * Posts by members the viewer has blocked are left out.
 * "saved" and "mine" need a signed-in member (otherwise an empty list with requiresLogin).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const viewer = await getSessionMember(request);
  const tab = searchParams.get('tab') ?? 'all';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(30, Math.max(1, Number.parseInt(searchParams.get('limit') || '12', 10) || 12));
  const targetType = searchParams.get('targetType');

  if ((tab === 'saved' || tab === 'mine') && !viewer) {
    return NextResponse.json({ success: true, moments: [], requiresLogin: true, pagination: { totalCount: 0, page: 1, limit, totalPages: 1, hasNextPage: false, hasPrevPage: false } });
  }

  const result = await momentRepository.query({
    statuses: ['published'],
    authorId: tab === 'mine' ? viewer!.id : searchParams.get('author') || undefined,
    savedBy: tab === 'saved' ? viewer!.id : undefined,
    targetType: targetType && TARGET_TYPES.has(targetType) ? (targetType as MomentTargetType) : undefined,
    targetId: searchParams.get('targetId') || undefined,
    location: searchParams.get('location') || undefined,
    q: searchParams.get('q') || undefined,
    sort: tab === 'popular' ? 'popular' : 'newest',
    page: 1,
    limit: 10_000,
  });
  const people = await loadPeople(result.items);
  const blocked = new Set(viewer?.blockedIds ?? []);
  const visible = result.items.filter((moment) => isPubliclyVisible(moment, people) && !(moment.authorId && blocked.has(moment.authorId)));
  const totalPages = Math.max(1, Math.ceil(visible.length / limit));
  return NextResponse.json(
    {
      success: true,
      moments: visible.slice((page - 1) * limit, page * limit).map((moment) => toFeedItem(moment, viewer, people)),
      pagination: { totalCount: visible.length, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

// Create a moment: { caption, images: string[] (from /api/upload), location?, category?, targetType?, targetId?, targetTitle? }
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนโพสต์' }, { status: 401 });
  if (isRateLimited(`moment-post:${member.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'โพสต์บ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  try {
    const input = await request.json();
    // Trust rules: verified members only; new accounts have a daily limit and cannot post contact details
    await guardPosting(member, 'moment', typeof input?.caption === 'string' ? input.caption : '');
    const moment = await createMoment(member, input);
    const people = await loadPeople([moment]);
    return NextResponse.json({ success: true, moment: toFeedItem(moment, member, people) }, { status: 201 });
  } catch (error) {
    if (error instanceof MomentError || error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'โพสต์ไม่สำเร็จ' }, { status: 400 });
  }
}

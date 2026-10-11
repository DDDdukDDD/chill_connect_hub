import { NextResponse } from 'next/server';
import { ensureSampleMembers } from '@/lib/members/sampleMembers';
import { memberRepository } from '@/lib/members';
import { followerCount, publicProfileOf } from '@/lib/members/safety';
import { hostReviewSummary } from '@/lib/social/reviews';
import { getSessionMember, refreshMemberStatus } from '@/lib/members/session';

// Public profile of a member: only what they chose to show, plus badges the server really checked
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureSampleMembers(); // development sample accounts for the sample posts
  const { id } = await context.params;
  const viewer = await getSessionMember(request);
  const found = await memberRepository.findById(id);
  const member = found ? await refreshMemberStatus(found) : null;
  // Banned and suspended accounts have no public profile
  if (!member || (member.status !== 'active' && viewer?.id !== member.id)) return NextResponse.json({ success: false, message: 'ไม่พบสมาชิก' }, { status: 404 });
  return NextResponse.json(
    { success: true, profile: { ...publicProfileOf(member, viewer), followerCount: await followerCount(member.id), followingCount: member.followingIds?.length ?? 0, hostReviews: await hostReviewSummary(member.id) } },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

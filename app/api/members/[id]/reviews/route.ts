import { NextResponse } from 'next/server';
import { memberRepository } from '@/lib/members';
import { getSessionMember } from '@/lib/members/session';
import { hostReviewSummary } from '@/lib/social/reviews';

const MAX_REVIEWS = 200;

// Every review of the ตี้ a member hosted, for "ดูรีวิวทั้งหมด" on the profile (the profile itself carries the latest 4)
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const viewer = await getSessionMember(request);
  const member = await memberRepository.findById(id);
  if (!member || (member.status !== 'active' && viewer?.id !== member.id)) return NextResponse.json({ success: false, message: 'ไม่พบสมาชิก' }, { status: 404 });
  return NextResponse.json({ success: true, reviews: await hostReviewSummary(member.id, MAX_REVIEWS) }, { headers: { 'Cache-Control': 'no-store' } });
}

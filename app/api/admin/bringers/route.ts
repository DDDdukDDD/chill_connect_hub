import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { creatorPosts, topBringers } from '@/lib/social/actionLog';

/**
 * GET ?days=30 → { bringers: Bringer[] }: the members whose posts, profiles and invitations brought the most different
 * people out, and the members whose posts were seen the most (docs/TRACEABILITY.md). The base for choosing creators and,
 * later, a creator share.
 * GET ?days=30&member=<id> → { posts: CreatorPost[] }: that member's posts seen or bringing someone in the range.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const denied = await requireAdminApiAccess(request, 'content.view');
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  const days = Math.min(Math.max(Number(params.get('days')) || 30, 1), 365);
  const member = params.get('member');
  const headers = { 'Cache-Control': 'no-store' };
  if (member) {
    if (!/^[\w.:-]{1,120}$/.test(member)) return NextResponse.json({ success: false, message: 'member ไม่ถูกต้อง' }, { status: 400, headers });
    return NextResponse.json({ success: true, days, posts: await creatorPosts(member, days) }, { headers });
  }
  return NextResponse.json({ success: true, days, bringers: await topBringers(days, 20) }, { headers });
}

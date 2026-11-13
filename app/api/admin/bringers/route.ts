import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { creatorPosts, topBringers } from '@/lib/social/actionLog';
import { topOutbound } from '@/lib/social/linkClicks';

/**
 * Creator and outbound numbers for /admin (docs/TRACEABILITY.md). Every list reads a small daily table and comes a page
 * at a time, so it stays quick at any member count.
 * GET ?days=30&sort=people|views&offset=0 → { bringers: Bringer[] } (20 a page, from app.creator_daily)
 * GET ?days=30&member=<id> → { posts: CreatorPost[] }: that member's posts seen or bringing someone in the range
 * GET ?days=30&view=outbound&offset=0 → { targets: OutboundTarget[] }: where people left the site from most
 */
export const dynamic = 'force-dynamic';

const PAGE = 20;
const MAX_OFFSET = 500;

export async function GET(request: Request) {
  const denied = await requireAdminApiAccess(request, 'content.view');
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  const days = Math.min(Math.max(Number(params.get('days')) || 30, 1), 365);
  const offset = Math.min(Math.max(Math.floor(Number(params.get('offset')) || 0), 0), MAX_OFFSET);
  const member = params.get('member');
  const headers = { 'Cache-Control': 'no-store' };
  if (member) {
    if (!/^[\w.:-]{1,120}$/.test(member)) return NextResponse.json({ success: false, message: 'member ไม่ถูกต้อง' }, { status: 400, headers });
    return NextResponse.json({ success: true, days, posts: await creatorPosts(member, days) }, { headers });
  }
  if (params.get('view') === 'outbound') {
    const targets = await topOutbound(days, { limit: PAGE, offset });
    return NextResponse.json({ success: true, days, targets, hasMore: targets.length === PAGE && offset + PAGE <= MAX_OFFSET }, { headers });
  }
  const sort = params.get('sort') === 'views' ? 'views' : 'people';
  const bringers = await topBringers(days, { sort, limit: PAGE, offset });
  return NextResponse.json({ success: true, days, bringers, hasMore: bringers.length === PAGE && offset + PAGE <= MAX_OFFSET }, { headers });
}

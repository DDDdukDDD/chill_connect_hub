import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { circleItems, wantsFindPeople } from '@/lib/social/circles';

/**
 * GET /api/circles: Circles on the member home (finished challenges and challenge steps of the
 * last 14 days). Signed in only; it is personal (the reader and people they follow come first), so it is never cached.
 * `findPeople`: the row ends with a "หาเพื่อน" Circle (the reader follows few people).
 */
export async function GET(request: Request) {
  const viewer = await getSessionMember(request);
  if (!viewer) return NextResponse.json({ success: true, items: [], findPeople: false }, { headers: { 'Cache-Control': 'private, no-store' } });
  return NextResponse.json({ success: true, items: await circleItems(viewer), findPeople: wantsFindPeople(viewer) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

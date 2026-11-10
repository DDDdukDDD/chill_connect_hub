import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { achievementsRow } from '@/lib/social/achievementsRow';

/**
 * GET /api/achievements: the "เพื่อนๆ ทำสำเร็จ" row on the member home (finished challenges and challenge steps of the
 * last 14 days). Signed in only; it is personal (the reader and people they follow come first), so it is never cached.
 */
export async function GET(request: Request) {
  const viewer = await getSessionMember(request);
  if (!viewer) return NextResponse.json({ success: true, items: [] }, { headers: { 'Cache-Control': 'private, no-store' } });
  return NextResponse.json({ success: true, items: await achievementsRow(viewer) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

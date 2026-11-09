import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { activityCounts, recentActivity } from '@/lib/social/liveActivity';

/**
 * GET  "ตอนนี้ในชิลล์" for the home page.
 * Plain: { mode: 'public', counts: LiveCounts }, last week's numbers with no names, the same for everyone.
 * ?mine=1, signed in: { mode: 'member', items: LiveItem[] }, the newest named lines (never the viewer's own or blocked people).
 *
 * The two answers have their own URLs because Vercel's CDN does not look at cookies: one URL that answered by session
 * served the cached visitor answer to members (found 2026-11-09).
 */
export async function GET(request: Request) {
  try {
    const viewer = new URL(request.url).searchParams.get('mine') === '1' ? await getSessionMember(request) : null;
    if (viewer) {
      return NextResponse.json({ success: true, mode: 'member', items: await recentActivity(viewer) }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    return NextResponse.json(
      { success: true, mode: 'public', counts: await activityCounts() },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('Error in /api/activity GET:', error);
    return NextResponse.json({ success: false, error: 'Failed to load activity' }, { status: 500 });
  }
}

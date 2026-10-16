import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { activityCounts, recentActivity } from '@/lib/social/liveActivity';

/**
 * GET  "ตอนนี้ในชิลล์" for the home page.
 * Signed in: { mode: 'member', items: LiveItem[] }, the newest named lines (never the viewer's own or blocked people).
 * Signed out: { mode: 'public', counts: LiveCounts }, last week's numbers with no names.
 */
export async function GET(request: Request) {
  try {
    const viewer = await getSessionMember(request);
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

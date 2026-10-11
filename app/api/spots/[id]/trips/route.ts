import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionMember } from '@/lib/members/session';
import { trustLevel } from '@/lib/members/trust';
import { spotAllowsMeetups, spotTripHostStatus } from '@/lib/social/spotTrips';

/**
 * Spot Buddy on one place: whether the place is open for meet-ups, the trips people can join,
 * and whether the viewer may open one. The answer depends on who asks, so it is never shared-cached.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const spot = await db.findSpotById(decodeURIComponent(id));
    if (!spot || spot.publicationStatus === 'draft') {
      return NextResponse.json({ success: false, error: 'Spot not found' }, { status: 404 });
    }
    const headers = { 'Cache-Control': 'private, no-store' };
    if (!spotAllowsMeetups(spot)) return NextResponse.json({ success: true, meetupAllowed: false, trips: [] }, { headers });

    const viewer = await getSessionMember(request);
    const blocked = new Set(viewer?.blockedIds ?? []);
    const found = await db.findEvents({ page: 1, limit: 20, eventType: 'community', spotId: spot.id, sortBy: 'date', approvalStatus: 'approved' });
    const trips = found.items.filter((ev) => !blocked.has((ev as { createdByMemberId?: string }).createdByMemberId ?? ''));

    let host: { canHost: boolean; reason?: string } | undefined;
    if (viewer) {
      host = viewer.status !== 'active' || trustLevel(viewer) === 'new'
        ? { canHost: false, reason: 'ยืนยันอีเมลและรับคำมั่นของคอมมูนิตี้ก่อนนะ (ดูที่หน้าโปรไฟล์)' }
        : await spotTripHostStatus(viewer);
    }
    return NextResponse.json({ success: true, meetupAllowed: true, trips, host }, { headers });
  } catch (error) {
    console.error('Error in /api/spots/[id]/trips GET:', error);
    return NextResponse.json({ success: false, error: 'Failed to load trips' }, { status: 500 });
  }
}

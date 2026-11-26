import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { guardPosting } from '@/lib/members/safety';
import { isRateLimited } from '@/lib/rateLimit';
import { activeTrip, createTrip, recentTrips, tripsOf } from '@/lib/trips/service';
import { FORBIDDEN, NO_STORE, SIGN_IN, tripFailure } from '@/lib/trips/http';

/**
 * Trip stories (docs/API.md "Trips"):
 * GET ?author=<memberId> → { trips } that member's trips the viewer may see; GET ?mine=1 → { trips } own trips, drafts too;
 * GET ?active=YYYY-MM-DD → { trip: { id, title } | null } the trip going on that day (the phone's date), for posting;
 * GET (nothing) → { trips } newest published trips.
 * POST { title, startsOn, endsOn, intro?, visibility?, taggedIds? } → { id }
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const viewer = await getSessionMember(request);
  const params = new URL(request.url).searchParams;
  try {
    const active = params.get('active');
    if (active !== null) return NextResponse.json({ success: true, trip: viewer ? await activeTrip(viewer, active) : null }, { headers: NO_STORE });
    if (params.get('mine')) {
      if (!viewer) return SIGN_IN();
      return NextResponse.json({ success: true, trips: await tripsOf(viewer.id, viewer) }, { headers: NO_STORE });
    }
    const author = params.get('author');
    const trips = author ? await tripsOf(author.slice(0, 100), viewer) : await recentTrips(viewer, 10);
    return NextResponse.json({ success: true, trips }, { headers: NO_STORE });
  } catch (error) {
    return tripFailure(error, 'list');
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return FORBIDDEN();
  const member = await getSessionMember(request);
  if (!member) return SIGN_IN();
  if (await isRateLimited(`trip-create:${member.id}`, 10, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'สร้างทริปบ่อยเกินไป ลองใหม่อีกสักครู่นะ' }, { status: 429 });
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    await guardPosting(member, 'moment', `${body.title ?? ''} ${body.intro ?? ''}`);
    return NextResponse.json({ success: true, id: await createTrip(member, body) }, { status: 201 });
  } catch (error) {
    return tripFailure(error, 'create');
  }
}

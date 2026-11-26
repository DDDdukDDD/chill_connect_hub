import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { getTrip } from '@/lib/trips/service';
import { resolveTripPlaces } from '@/lib/trips/geo';
import { FORBIDDEN, SIGN_IN, tripFailure } from '@/lib/trips/http';

/**
 * POST → { waiting } names the cities of photos that have a location (a few lookups a call, lib/trips/geo.ts);
 * the editor calls again while waiting > 0. The author only.
 */
export const maxDuration = 30;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return FORBIDDEN();
  const member = await getSessionMember(request);
  if (!member) return SIGN_IN();
  const { id } = await params;
  try {
    const trip = await getTrip(id, member);
    if (!trip?.isOwner) return NextResponse.json({ success: false, message: 'ไม่พบทริปนี้' }, { status: 404 });
    return NextResponse.json({ success: true, ...(await resolveTripPlaces(id)) });
  } catch (error) {
    return tripFailure(error, 'places');
  }
}

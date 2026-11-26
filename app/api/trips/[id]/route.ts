import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { guardPosting } from '@/lib/members/safety';
import { isRateLimited } from '@/lib/rateLimit';
import { deleteTrip, getTrip, updateTrip } from '@/lib/trips/service';
import { FORBIDDEN, NO_STORE, SIGN_IN, tripFailure } from '@/lib/trips/http';

/**
 * GET → { trip } (TripView, lib/trips/story.ts) when the viewer may see it.
 * PATCH { title?, intro?, startsOn?, endsOn?, visibility?, coverItemId?, dayPlaces?, taggedIds?, status?: 'published' | 'draft' } → { trip }; the author only.
 * DELETE → { success } deletes the trip and the photos picked for it; the author only.
 */
type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const trip = await getTrip(id, await getSessionMember(request));
    if (!trip) return NextResponse.json({ success: false, message: 'ไม่พบทริปนี้' }, { status: 404 });
    return NextResponse.json({ success: true, trip }, { headers: NO_STORE });
  } catch (error) {
    return tripFailure(error, 'read');
  }
}

export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return FORBIDDEN();
  const member = await getSessionMember(request);
  if (!member) return SIGN_IN();
  if (await isRateLimited(`trip-edit:${member.id}`, 300, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'แก้บ่อยเกินไป ลองใหม่อีกสักครู่นะ' }, { status: 429 });
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if ('title' in body || 'intro' in body || body.status === 'published') await guardPosting(member, 'moment', `${body.title ?? ''} ${body.intro ?? ''}`);
    await updateTrip(member, id, body);
    return NextResponse.json({ success: true, trip: await getTrip(id, member) }, { headers: NO_STORE });
  } catch (error) {
    return tripFailure(error, 'update');
  }
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return FORBIDDEN();
  const member = await getSessionMember(request);
  if (!member) return SIGN_IN();
  const { id } = await params;
  try {
    await deleteTrip(member, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return tripFailure(error, 'delete');
  }
}

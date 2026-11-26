import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { addTripItems } from '@/lib/trips/service';
import { FORBIDDEN, SIGN_IN, tripFailure } from '@/lib/trips/http';

/**
 * POST { items: [{ mediaUrl, takenLocal: 'YYYY-MM-DDTHH:MM', lat?, lng?, ratio?, caption?, kind?, posterUrl? }] } → { ids }
 * Photos picked from the phone (uploaded first to /api/upload with folder 'trips'); at most 60 a call. The author only.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return FORBIDDEN();
  const member = await getSessionMember(request);
  if (!member) return SIGN_IN();
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as { items?: unknown };
    return NextResponse.json({ success: true, ids: await addTripItems(member, id, body.items) }, { status: 201 });
  } catch (error) {
    return tripFailure(error, 'add items');
  }
}

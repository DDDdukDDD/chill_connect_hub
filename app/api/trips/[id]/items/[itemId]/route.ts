import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { removeTripItem, updateTripItem } from '@/lib/trips/service';
import { FORBIDDEN, SIGN_IN, tripFailure } from '@/lib/trips/http';

/** PATCH { caption?, hidden?, takenLocal? } → { success }; DELETE → { success } (a picked photo's file goes too). The author only. */
type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return FORBIDDEN();
  const member = await getSessionMember(request);
  if (!member) return SIGN_IN();
  const { id, itemId } = await params;
  try {
    await updateTripItem(member, id, itemId, (await request.json().catch(() => ({}))) as Record<string, unknown>);
    return NextResponse.json({ success: true });
  } catch (error) {
    return tripFailure(error, 'update item');
  }
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return FORBIDDEN();
  const member = await getSessionMember(request);
  if (!member) return SIGN_IN();
  const { id, itemId } = await params;
  try {
    await removeTripItem(member, id, itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return tripFailure(error, 'remove item');
  }
}

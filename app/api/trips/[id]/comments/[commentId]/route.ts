import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { deleteTripComment } from '@/lib/trips/social';
import { FORBIDDEN, SIGN_IN, tripFailure } from '@/lib/trips/http';

/** DELETE: the writer or the trip's author removes a comment */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  if (!isSameOrigin(request)) return FORBIDDEN();
  const member = await getSessionMember(request);
  if (!member) return SIGN_IN();
  const { id, commentId } = await params;
  try {
    await deleteTripComment(member, id, commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return tripFailure(error, 'delete comment');
  }
}

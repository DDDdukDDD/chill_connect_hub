import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { guardPosting } from '@/lib/members/safety';
import { isRateLimited } from '@/lib/rateLimit';
import { addTripComment, tripComments } from '@/lib/trips/social';
import { FORBIDDEN, NO_STORE, SIGN_IN, tripFailure } from '@/lib/trips/http';

/**
 * Comments on a published trip (docs/API.md "Trips"): GET → { comments } oldest first;
 * POST { text } → { comment }, checked like a moment comment (new accounts: no contact details, a daily limit).
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getSessionMember(request);
  const { id } = await params;
  try {
    return NextResponse.json({ success: true, comments: await tripComments(id, viewer) }, { headers: NO_STORE });
  } catch (error) {
    return tripFailure(error, 'comments');
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return FORBIDDEN();
  const member = await getSessionMember(request);
  if (!member) return SIGN_IN();
  if (await isRateLimited(`trip-comment:${member.id}`, 30, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'คอมเมนต์บ่อยเกินไป ลองใหม่อีกสักครู่นะ' }, { status: 429 });
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as { text?: unknown };
    const text = typeof body.text === 'string' ? body.text : '';
    await guardPosting(member, 'comment', text);
    return NextResponse.json({ success: true, comment: await addTripComment(member, id, text) }, { status: 201 });
  } catch (error) {
    return tripFailure(error, 'comment');
  }
}

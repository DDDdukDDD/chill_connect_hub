import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { setTripLike } from '@/lib/trips/social';
import { FORBIDDEN, NO_STORE, SIGN_IN, tripFailure } from '@/lib/trips/http';

/** A heart on a published trip: POST { liked: boolean } → { liked, likeCount } */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return FORBIDDEN();
  const member = await getSessionMember(request);
  if (!member) return SIGN_IN();
  if (await isRateLimited(`trip-like:${member.id}`, 120, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'กดบ่อยเกินไป ลองใหม่อีกสักครู่นะ' }, { status: 429 });
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as { liked?: unknown };
    return NextResponse.json({ success: true, ...(await setTripLike(member, id, body.liked !== false)) }, { headers: NO_STORE });
  } catch (error) {
    return tripFailure(error, 'like');
  }
}

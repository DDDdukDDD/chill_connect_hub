import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { guardPosting } from '@/lib/members/safety';
import { isRateLimited } from '@/lib/rateLimit';
import { createSuggestedTrip, tripSuggestion } from '@/lib/trips/suggest';
import { FORBIDDEN, NO_STORE, SIGN_IN, tripFailure } from '@/lib/trips/http';

/**
 * A trip from everyday life (lib/trips/suggest.ts): GET → { suggestion: { from, to, places, momentCount, covers } | null }
 * when the member posted at 3 or more places on one day or weekend; POST { from, to } → { id } a draft made from them.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: true, suggestion: null }, { headers: NO_STORE });
  try {
    return NextResponse.json({ success: true, suggestion: await tripSuggestion(member) }, { headers: NO_STORE });
  } catch (error) {
    return tripFailure(error, 'suggest');
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return FORBIDDEN();
  const member = await getSessionMember(request);
  if (!member) return SIGN_IN();
  if (await isRateLimited(`trip-create:${member.id}`, 10, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'สร้างทริปบ่อยเกินไป ลองใหม่อีกสักครู่นะ' }, { status: 429 });
  try {
    const body = (await request.json().catch(() => ({}))) as { from?: unknown; to?: unknown };
    await guardPosting(member, 'moment', '');
    return NextResponse.json({ success: true, id: await createSuggestedTrip(member, body.from, body.to) }, { status: 201 });
  } catch (error) {
    return tripFailure(error, 'create suggested');
  }
}

import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { guardPosting } from '@/lib/members/safety';
import { isRateLimited } from '@/lib/rateLimit';
import { followTrip } from '@/lib/trips/service';
import { FORBIDDEN, SIGN_IN, tripFailure } from '@/lib/trips/http';

/**
 * "ไปตามรอยทริปนี้": POST { startsOn: 'YYYY-MM-DD', legId? } → { id, existing } a draft trip for the member with the same
 * sub-trips moved to their days; existing = they had already planned it, and that trip is returned. legId: follow one sub-trip only.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return FORBIDDEN();
  const member = await getSessionMember(request);
  if (!member) return SIGN_IN();
  if (await isRateLimited(`trip-create:${member.id}`, 10, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'สร้างทริปบ่อยเกินไป ลองใหม่อีกสักครู่นะ' }, { status: 429 });
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as { startsOn?: unknown; legId?: unknown };
    await guardPosting(member, 'moment', '');
    const result = await followTrip(member, id, body.startsOn, body.legId);
    return NextResponse.json({ success: true, ...result }, { status: result.existing ? 200 : 201 });
  } catch (error) {
    return tripFailure(error, 'follow');
  }
}

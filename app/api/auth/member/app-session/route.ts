import { NextResponse } from 'next/server';
import { memberRepository } from '@/lib/members';
import { readHandoff } from '@/lib/members/appAuth';
import { isSameOrigin, setMemberSessionCookie } from '@/lib/members/session';
import { readCookie } from '@/lib/adminSession';
import { clientIp, isRateLimited } from '@/lib/rateLimit';
import { INVITE_COOKIE, attachInviter } from '@/lib/social/friends';
import { safeReturnTo } from '../oauth/shared';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

/**
 * POST /api/auth/member/app-session { t, verifier }: the store app's web view trades the code its sign-in sheet brought
 * back (chillwaa://auth?t=…) for its own session (lib/members/appAuth.ts). Answers `{ next }`, where to go now.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  if (await isRateLimited(`app-session:${clientIp(request)}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ลองหลายครั้งเกินไป กรุณารอสักครู่' }, { status: 429, headers: NO_STORE });
  }
  const body = await request.json().catch(() => ({}));
  const handoff = readHandoff(body?.t, body?.verifier);
  const member = handoff ? await memberRepository.findById(handoff.sub) : null;
  // A code from before a password change or "sign out everywhere" no longer counts
  if (!handoff || !member || member.sessionVersion !== handoff.ver || member.status === 'banned') {
    return NextResponse.json({ success: false, message: 'ลิงก์เข้าสู่ระบบหมดอายุ กรุณาลองใหม่' }, { status: 401, headers: NO_STORE });
  }
  if (handoff.created) await attachInviter(member, readCookie(request, INVITE_COOKIE));
  const response = NextResponse.json({ success: true, next: safeReturnTo(handoff.next) }, { headers: NO_STORE });
  setMemberSessionCookie(response, member);
  if (handoff.created) response.cookies.delete(INVITE_COOKIE);
  return response;
}

import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { MemberAuthError, registerWithEmail } from '@/lib/members/accounts';
import { getSessionSecret, isSameOrigin, setMemberSessionCookie } from '@/lib/members/session';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

// { displayName, email, password, consent: true } → creates the account and signs it in
export async function POST(request: Request) {
  if (!getSessionSecret()) return NextResponse.json({ success: false, message: 'ระบบสมาชิกยังไม่ได้ตั้งค่า (AUTH_SECRET)' }, { status: 503 });
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  if (isRateLimited(`register:${clientIp(request)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'สมัครบ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  try {
    const member = await registerWithEmail(await request.json());
    const response = NextResponse.json({ success: true, member: toPublicMember(member) });
    setMemberSessionCookie(response, member);
    return response;
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'สมัครสมาชิกไม่สำเร็จ' }, { status: 400 });
  }
}

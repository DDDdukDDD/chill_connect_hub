import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { loginWithEmail, MemberAuthError } from '@/lib/members/accounts';
import { getSessionSecret, isSameOrigin, setMemberSessionCookie } from '@/lib/members/session';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

// { email, password } → signs in with email + password
export async function POST(request: Request) {
  if (!getSessionSecret()) return NextResponse.json({ success: false, message: 'ระบบสมาชิกยังไม่ได้ตั้งค่า (AUTH_SECRET)' }, { status: 503 });
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  if (isRateLimited(`member-login:${clientIp(request)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  try {
    const { email, password } = await request.json();
    const member = await loginWithEmail(email, password);
    const response = NextResponse.json({ success: true, member: toPublicMember(member) });
    setMemberSessionCookie(response, member);
    return response;
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'เข้าสู่ระบบไม่สำเร็จ' }, { status: 400 });
  }
}

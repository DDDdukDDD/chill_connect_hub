import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { MemberAuthError, resetPasswordWithToken } from '@/lib/members/accounts';
import { getSessionSecret, isSameOrigin, setMemberSessionCookie } from '@/lib/members/session';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

// { token, password } → sets the new password, ends other sessions and signs this browser in
export async function POST(request: Request) {
  if (!getSessionSecret()) return NextResponse.json({ success: false, message: 'ระบบสมาชิกยังไม่ได้ตั้งค่า (AUTH_SECRET)' }, { status: 503 });
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  if (isRateLimited(`member-reset-confirm:${clientIp(request)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ลองหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  try {
    const { token, password } = await request.json();
    const member = await resetPasswordWithToken(token, password);
    const response = NextResponse.json({ success: true, member: toPublicMember(member) });
    setMemberSessionCookie(response, member);
    return response;
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ตั้งรหัสผ่านไม่สำเร็จ' }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { MemberAuthError, registerWithEmail } from '@/lib/members/accounts';
import { applySignupChecks, hashIp } from '@/lib/members/safety';
import { getSessionSecret, isSameOrigin, setMemberSessionCookie } from '@/lib/members/session';
import { sendVerification } from '../verify-email/send';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

// { displayName, email, password, consent: true, ageConfirmed: true } → creates the account, signs it in and emails a verification link
export async function POST(request: Request) {
  if (!getSessionSecret()) return NextResponse.json({ success: false, message: 'ระบบสมาชิกยังไม่ได้ตั้งค่า (AUTH_SECRET)' }, { status: 503 });
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  // 10 sign-ups an hour per address in production; relaxed in development so the flow can be tested repeatedly
  if (isRateLimited(`register:${clientIp(request)}`, process.env.NODE_ENV === 'production' ? 10 : 300, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'สมัครบ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  try {
    const created = await registerWithEmail(await request.json());
    // Warning signs for staff (throwaway email, many accounts from one place, risky name); never blocks sign-up
    const member = await applySignupChecks(created, hashIp(clientIp(request), getSessionSecret() ?? ''));
    const verification = await sendVerification(request, member);
    const response = NextResponse.json({ success: true, member: toPublicMember(member), verification });
    setMemberSessionCookie(response, member);
    return response;
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'สมัครสมาชิกไม่สำเร็จ' }, { status: 400 });
  }
}

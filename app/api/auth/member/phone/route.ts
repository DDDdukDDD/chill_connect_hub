import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { MemberAuthError } from '@/lib/members/accounts';
import { isRateLimited } from '@/lib/rateLimit';
import { requestPhoneCode } from '@/lib/members/safety';

// Sends a code to the number the signed-in member gives
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  if (isRateLimited(`verify-phone:${member.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ขอรหัสบ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as { phone?: unknown };
  try {
    return NextResponse.json({ success: true, ...(await requestPhoneCode(member, body.phone)) });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('Error in /api/auth/member/phone:', error);
    return NextResponse.json({ success: false, message: 'ส่งรหัสไม่สำเร็จ ลองใหม่อีกครั้งนะ' }, { status: 500 });
  }
}

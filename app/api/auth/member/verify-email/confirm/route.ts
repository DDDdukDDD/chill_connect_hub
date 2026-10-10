import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { MemberAuthError } from '@/lib/members/accounts';
import { verifyEmailWithToken } from '@/lib/members/safety';
import { isSameOrigin } from '@/lib/members/session';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

// { token } → marks the email as verified. Works whether or not the browser is signed in.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  if (isRateLimited(`verify-confirm:${clientIp(request)}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ลองหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  try {
    const { token } = await request.json();
    const member = await verifyEmailWithToken(token);
    return NextResponse.json({ success: true, member: toPublicMember(member) });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ยืนยันอีเมลไม่สำเร็จ' }, { status: 400 });
  }
}

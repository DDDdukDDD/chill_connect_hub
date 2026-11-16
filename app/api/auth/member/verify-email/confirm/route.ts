import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { MemberAuthError } from '@/lib/members/accounts';
import { joinEvent } from '@/lib/members/activity';
import { verifyEmailWithToken } from '@/lib/members/safety';
import { settlePendingJoins } from '@/lib/social/pendingJoins';
import { isSameOrigin } from '@/lib/members/session';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

// { token } → marks the email as verified. Works whether or not the browser is signed in.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  if (await isRateLimited(`verify-confirm:${clientIp(request)}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ลองหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  try {
    const { token } = await request.json();
    const member = await verifyEmailWithToken(token);
    // ตี้ the member signed up for before confirming (BE-392): a seat if still free, else the waiting list
    const settled = await settlePendingJoins(member, joinEvent);
    return NextResponse.json({ success: true, member: toPublicMember(member), settled });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ยืนยันอีเมลไม่สำเร็จ' }, { status: 400 });
  }
}

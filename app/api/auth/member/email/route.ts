import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { MemberAuthError, addEmail } from '@/lib/members/accounts';
import { isMailerConfigured } from '@/lib/members/mailer';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { sendVerification } from '../verify-email/send';

/**
 * { email, returnTo? } → puts the email on the signed-in account (one without a password, e.g. LINE) and sends the
 * link that confirms it. Sending again with the same email sends a new link. A confirmed email lets the member open
 * ตี้, challenges, trips and groups while the live site has no SMS (lib/members/trust.ts organizerNeeds).
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  // Never mark it confirmed without a real link (SKIP_EMAIL_VERIFICATION does not apply here): with no mailer on the
  // live site the address could not be proven
  if (!isMailerConfigured() && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, message: 'ระบบส่งอีเมลยังไม่พร้อม ลองใหม่ภายหลังนะ' }, { status: 503 });
  }
  if (await isRateLimited(`add-email:${member.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ขอลิงก์บ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as { email?: unknown; returnTo?: unknown };
  try {
    const updated = await addEmail(member, body.email);
    const result = await sendVerification(request, updated, typeof body.returnTo === 'string' ? body.returnTo : undefined);
    if (!result.sent && !result.devVerifyUrl) {
      return NextResponse.json({ success: false, message: 'ส่งอีเมลไม่สำเร็จ ลองใหม่อีกครั้งนะ' }, { status: 502 });
    }
    return NextResponse.json({ success: true, member: toPublicMember(updated), ...result });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('Error in /api/auth/member/email:', error);
    return NextResponse.json({ success: false, message: 'บันทึกอีเมลไม่สำเร็จ ลองใหม่อีกครั้งนะ' }, { status: 500 });
  }
}

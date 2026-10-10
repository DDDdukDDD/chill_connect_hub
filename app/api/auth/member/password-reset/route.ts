import { NextResponse } from 'next/server';
import { createPasswordReset, MemberAuthError, PASSWORD_RESET_MINUTES } from '@/lib/members/accounts';
import { isMailerConfigured, passwordResetEmail, sendMail } from '@/lib/members/mailer';
import { isSameOrigin } from '@/lib/members/session';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

// { email } → emails a one-time "set a new password" link. Always answers the same way, so it cannot be
// used to find out which emails have accounts. Without a mailer (development) the link is logged on the
// server and returned as devResetUrl.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  if (isRateLimited(`member-reset:${clientIp(request)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ขอลิงก์บ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  try {
    const { email } = await request.json();
    const reset = await createPasswordReset(email);
    let devResetUrl: string | undefined;
    if (reset?.member.email) {
      const origin = process.env.APP_URL?.replace(/\/+$/, '') || new URL(request.url).origin;
      const url = `${origin}/reset-password?token=${encodeURIComponent(reset.token)}`;
      if (isMailerConfigured()) {
        await sendMail({ to: reset.member.email, ...passwordResetEmail(reset.member.displayName, url, PASSWORD_RESET_MINUTES) });
      } else if (process.env.NODE_ENV !== 'production') {
        console.info(`[password reset] ${url}`);
        devResetUrl = url;
      }
    }
    return NextResponse.json({ success: true, minutes: PASSWORD_RESET_MINUTES, ...(devResetUrl && { devResetUrl }) });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ส่งลิงก์ไม่สำเร็จ' }, { status: 400 });
  }
}

import type { Member } from '@/lib/members';
import { isMailerConfigured, sendMail, verifyEmailMessage } from '@/lib/members/mailer';
import { EMAIL_VERIFY_HOURS, createEmailVerification } from '@/lib/members/safety';

/**
 * Creates a verification link and emails it. Without a mailer (development) the link is logged on the
 * server and returned as devVerifyUrl so the flow can still be tested.
 */
export async function sendVerification(request: Request, member: Member): Promise<{ sent: boolean; devVerifyUrl?: string }> {
  const token = await createEmailVerification(member);
  if (!token || !member.email) return { sent: false };
  const origin = process.env.APP_URL?.replace(/\/+$/, '') || new URL(request.url).origin;
  const url = `${origin}/verify-email?token=${encodeURIComponent(token)}`;
  if (isMailerConfigured()) {
    return { sent: await sendMail({ to: member.email, ...verifyEmailMessage(member.displayName, url, EMAIL_VERIFY_HOURS) }) };
  }
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[verify email] ${url}`);
    return { sent: false, devVerifyUrl: url };
  }
  return { sent: false };
}

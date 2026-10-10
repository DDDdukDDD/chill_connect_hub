import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { sendVerification } from './send';

// Sends (again) the "confirm your email" link to the signed-in member
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  if (member.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true });
  if (!member.email) return NextResponse.json({ success: false, message: 'บัญชีนี้ยังไม่มีอีเมล' }, { status: 400 });
  if (isRateLimited(`verify-email:${member.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ขอลิงก์บ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
  }
  const result = await sendVerification(request, member);
  return NextResponse.json({ success: true, ...result });
}

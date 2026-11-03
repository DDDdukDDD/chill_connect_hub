import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { MemberAuthError } from '@/lib/members/accounts';
import { confirmPhoneCode } from '@/lib/members/safety';
import { toPublicMember } from '@/lib/members/types';

// Checks the code the member typed; a right code marks their number as verified
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { code?: unknown };
  try {
    return NextResponse.json({ success: true, member: toPublicMember(await confirmPhoneCode(member, body.code)) });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('Error in /api/auth/member/phone/confirm:', error);
    return NextResponse.json({ success: false, message: 'ตรวจรหัสไม่สำเร็จ ลองใหม่อีกครั้งนะ' }, { status: 500 });
  }
}

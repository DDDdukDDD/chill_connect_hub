import { NextResponse } from 'next/server';
import { changePassword, MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin, setMemberSessionCookie } from '@/lib/members/session';

// { currentPassword?, newPassword } → changes (or, for social-only accounts with an email, sets) the password.
// Other sessions end; this browser stays signed in.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    const { currentPassword, newPassword } = await request.json();
    const updated = await changePassword(member, currentPassword, newPassword);
    const response = NextResponse.json({ success: true });
    setMemberSessionCookie(response, updated);
    return response;
  } catch (error) {
    const message = error instanceof MemberAuthError ? error.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ';
    return NextResponse.json({ success: false, message }, { status: error instanceof MemberAuthError ? error.status : 400 });
  }
}

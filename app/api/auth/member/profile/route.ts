import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { MemberAuthError, updateProfile } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';

// { displayName?, avatarUrl? } → updates the signed-in member's profile
export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    const updated = await updateProfile(member, await request.json());
    return NextResponse.json({ success: true, member: toPublicMember(updated) });
  } catch (error) {
    const message = error instanceof MemberAuthError ? error.message : 'บันทึกโปรไฟล์ไม่สำเร็จ';
    return NextResponse.json({ success: false, message }, { status: error instanceof MemberAuthError ? error.status : 400 });
  }
}

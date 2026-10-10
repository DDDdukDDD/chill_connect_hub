import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { MemberAuthError, updateProfile } from '@/lib/members/accounts';
import { publicProfileOf, updateProfileDetails } from '@/lib/members/safety';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { PROFILE_HIDDEN_BY_DEFAULT } from '@/lib/members/types';

// My own profile: everything I filled in (including hidden fields), my answers, and how others see me
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  return NextResponse.json(
    {
      success: true,
      member: toPublicMember(member),
      details: member.profile ?? { hidden: [...PROFILE_HIDDEN_BY_DEFAULT] },
      preferences: member.preferences ?? null,
      hostApplication: member.hostApplication ?? null,
      publicView: publicProfileOf(member, member),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

// { displayName?, avatarUrl?, bio?, occupation?, workplace?, education?, hometown?, livingArea?, relationshipStatus?, connectGoal?, hidden?: string[] }
export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    const body = await request.json();
    const withDetails = await updateProfileDetails(member, body);
    const updated = await updateProfile(withDetails, body);
    return NextResponse.json({ success: true, member: toPublicMember(updated), details: updated.profile });
  } catch (error) {
    const message = error instanceof MemberAuthError ? error.message : 'บันทึกโปรไฟล์ไม่สำเร็จ';
    return NextResponse.json({ success: false, message }, { status: error instanceof MemberAuthError ? error.status : 400 });
  }
}

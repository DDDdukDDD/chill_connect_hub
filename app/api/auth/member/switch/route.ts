import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin, setMemberSessionCookie } from '@/lib/members/session';
import { switchTarget } from '@/lib/members/subAccounts';

// { memberId } → this browser now uses that account; only the owner and sub-accounts of one family (BE-393)
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    const { memberId } = await request.json().catch(() => ({}));
    const { account, owner } = await switchTarget(member, memberId);
    const response = NextResponse.json({ success: true, member: toPublicMember(account) });
    setMemberSessionCookie(response, account, owner);
    return response;
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'สลับบัญชีไม่สำเร็จ' }, { status: 400 });
  }
}

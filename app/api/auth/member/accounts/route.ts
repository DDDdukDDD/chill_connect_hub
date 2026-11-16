import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin, setMemberSessionCookie } from '@/lib/members/session';
import { accountChoices, createSubAccount } from '@/lib/members/subAccounts';
import { isRateLimited } from '@/lib/rateLimit';

// The signed-in member's accounts (owner and sub-accounts) for the account switcher (BE-393)
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  return NextResponse.json({ success: true, ...(await accountChoices(member)) }, { headers: { 'Cache-Control': 'no-store' } });
}

// { displayName, consent: true } → makes a sub-account and switches this browser to it
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  if (await isRateLimited(`sub-account:${member.ownerId ?? member.id}`, 5, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'สร้างบัญชีวันนี้ครบแล้ว ลองใหม่พรุ่งนี้นะ' }, { status: 429 });
  }
  try {
    const { account, owner } = await createSubAccount(member, await request.json().catch(() => ({})));
    const response = NextResponse.json({ success: true, member: toPublicMember(account) });
    setMemberSessionCookie(response, account, owner);
    return response;
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'สร้างบัญชีไม่สำเร็จ' }, { status: 400 });
  }
}

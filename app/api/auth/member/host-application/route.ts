import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { MemberAuthError } from '@/lib/members/accounts';
import { submitHostApplication } from '@/lib/members/safety';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';

// My host application (null when none)
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  return NextResponse.json({ success: true, application: member.hostApplication ?? null }, { headers: { 'Cache-Control': 'no-store' } });
}

// { kind: host|venue|organizer, about (30–600), link? (https) } → sends the request to staff
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    const updated = await submitHostApplication(member, await request.json().catch(() => null));
    return NextResponse.json({ success: true, application: updated.hostApplication, member: toPublicMember(updated) });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ส่งคำขอไม่สำเร็จ' }, { status: 400 });
  }
}

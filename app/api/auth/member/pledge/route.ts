import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { acceptPledge } from '@/lib/members/safety';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';

// { accept: true } → records that the member accepted the community pledge (no selling, real identity, respect)
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body?.accept !== true) return NextResponse.json({ success: false, message: 'กรุณากดรับคำมั่น' }, { status: 400 });
  return NextResponse.json({ success: true, member: toPublicMember(await acceptPledge(member)) });
}

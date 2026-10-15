import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { ensureDemoMember, isDemoLoginEnabled } from '@/lib/members/demoLogin';
import { getSessionSecret, isSameOrigin, setMemberSessionCookie } from '@/lib/members/session';

// PROTOTYPE ONLY: signs in as the shared test account (lib/members/demoLogin.ts); 404 unless DEMO_LOGIN=on (or local dev)
export async function POST(request: Request) {
  if (!isDemoLoginEnabled()) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  if (!getSessionSecret()) return NextResponse.json({ success: false, message: 'ระบบสมาชิกยังไม่ได้ตั้งค่า (AUTH_SECRET)' }, { status: 503 });
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await ensureDemoMember();
  if (member.status !== 'active') return NextResponse.json({ success: false, message: 'บัญชีทดลองถูกปิดอยู่' }, { status: 403 });
  const response = NextResponse.json({ success: true, member: toPublicMember(member) });
  setMemberSessionCookie(response, member);
  return response;
}

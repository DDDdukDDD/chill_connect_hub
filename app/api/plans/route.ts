import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { plansOf } from '@/lib/social/friendPlans';

/** GET → { plans }: the member's "ไปกัน" plans for My Hub (lib/social/friendPlans.ts) */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  return NextResponse.json({ success: true, plans: await plansOf(member) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

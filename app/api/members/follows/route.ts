import { NextResponse } from 'next/server';
import { followLists } from '@/lib/members/safety';
import { getSessionMember } from '@/lib/members/session';

// The signed-in member's own followers and following; another member's lists are not available
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  return NextResponse.json({ success: true, ...(await followLists(member)) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

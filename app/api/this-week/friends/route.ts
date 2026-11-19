import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { weekFriends } from '@/lib/thisWeekFriends';

// "เพื่อนๆ จะไปกัน" on สัปดาห์นี้: personal, so never cached, and empty for a visitor
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: true, items: [], requiresLogin: true }, { headers: { 'Cache-Control': 'no-store' } });
  try {
    return NextResponse.json({ success: true, items: await weekFriends(member) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[this-week friends]', error);
    return NextResponse.json({ success: false, items: [] }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

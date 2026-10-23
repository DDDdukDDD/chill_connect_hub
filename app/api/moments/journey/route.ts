import { NextResponse } from 'next/server';
import { momentJourneyOf } from '@/lib/moments/service';
import { getSessionMember } from '@/lib/members/session';

// The signed-in member's steps on the moments path of the home journey band (follow → like or comment → post)
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, requiresLogin: true }, { status: 401 });
  return NextResponse.json({ success: true, ...(await momentJourneyOf(member)) }, { headers: { 'Cache-Control': 'no-store' } });
}

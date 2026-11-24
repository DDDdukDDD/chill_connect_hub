import { NextResponse } from 'next/server';
import { suggestedMembers } from '@/lib/members/safety';
import { getSessionMember } from '@/lib/members/session';

// Members worth following (verified members who post), without the viewer and people they follow or blocked
export async function GET(request: Request) {
  const viewer = await getSessionMember(request);
  return NextResponse.json({ success: true, members: await suggestedMembers(viewer) }, { headers: { 'Cache-Control': 'no-store' } });
}

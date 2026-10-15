import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { attendeesOf } from '@/lib/members/activity';

type Context = { params: Promise<{ id: string }> };

// Who is going to a meetup: open to everyone; the session only marks "me" and drops people the viewer blocked
export async function GET(request: Request, context: Context) {
  const viewer = await getSessionMember(request);
  const result = await attendeesOf((await context.params).id, viewer);
  if (!result) return NextResponse.json({ success: false, message: 'ไม่พบกิจกรรม' }, { status: 404 });
  return NextResponse.json({ success: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
}

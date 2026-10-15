import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { questMembersOf } from '@/lib/members/activity';

type Context = { params: Promise<{ id: string }> };

// Who joined a challenge: open to everyone, like the people going to a meetup
export async function GET(request: Request, context: Context) {
  const viewer = await getSessionMember(request);
  const result = await questMembersOf((await context.params).id, viewer);
  if (!result) return NextResponse.json({ success: false, message: 'ไม่พบชาเลนจ์' }, { status: 404 });
  return NextResponse.json({ success: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
}

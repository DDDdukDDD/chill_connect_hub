import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { faceStacksOf } from '@/lib/members/activity';

const MAX_IDS = 60;

// The first faces of many ตี้ for list tiles (?ids=a,b,c): open to everyone; the session only drops people the viewer blocked
export async function GET(request: Request) {
  const ids = [...new Set((new URL(request.url).searchParams.get('ids') ?? '').split(',').map((id) => id.trim()).filter(Boolean))].slice(0, MAX_IDS);
  if (ids.length === 0) return NextResponse.json({ success: true, stacks: {} });
  const viewer = await getSessionMember(request);
  const stacks = await faceStacksOf(ids, viewer);
  return NextResponse.json({ success: true, stacks }, { headers: { 'Cache-Control': 'no-store' } });
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionMember } from '@/lib/members/session';
import { checklistOf } from '@/lib/social/questProgress';

type Context = { params: Promise<{ id: string }> };

// The signed-in member's checklist for one challenge: { items: [{ title, href, status: counted|pending|rejected, note }], current, total }
export async function GET(request: Request, context: Context) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const quest = await db.findQuestById((await context.params).id);
  if (!quest) return NextResponse.json({ success: false, message: 'ไม่พบชาเลนจ์นี้' }, { status: 404 });
  const result = await checklistOf(quest, member.id);
  return NextResponse.json({ success: true, ...(result ?? { items: [], current: 0, total: 0 }) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

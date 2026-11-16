import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { MemberAuthError } from '@/lib/members/accounts';
import { QuestJoinError } from '@/lib/social/questJoins';
import { isRateLimited } from '@/lib/rateLimit';
import { circleAct, circleDetail, type CircleAction } from '@/lib/social/circleActions';

type Context = { params: Promise<{ id: string }> };
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const ACTIONS: CircleAction[] = ['together', 'try', 'invite'];

function failure(error: unknown, where: string) {
  if (error instanceof MemberAuthError || error instanceof QuestJoinError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
  console.error(`Error in ${where}:`, error);
  return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
}

/** GET /api/circles/:id: what one Circle shows when opened (docs/API.md "Circles") */
export async function GET(request: Request, context: Context) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  try {
    const detail = await circleDetail(member, decodeURIComponent((await context.params).id));
    return NextResponse.json({ success: true, detail }, { headers: NO_STORE });
  } catch (error) {
    return failure(error, 'GET /api/circles/[id]');
  }
}

/** POST /api/circles/:id { action: 'together' | 'try' | 'invite' }: the Circle's main button */
export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  if (member.status !== 'active') return NextResponse.json({ success: false, message: 'บัญชีนี้ยังใช้งานส่วนนี้ไม่ได้' }, { status: 403 });
  if (await isRateLimited(`circle-act:${member.id}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  const action = ACTIONS.find((a) => a === body?.action);
  if (!action) return NextResponse.json({ success: false, message: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
  try {
    const result = await circleAct(member, decodeURIComponent((await context.params).id), action);
    return NextResponse.json({ success: true, ...result }, { headers: NO_STORE });
  } catch (error) {
    return failure(error, 'POST /api/circles/[id]');
  }
}

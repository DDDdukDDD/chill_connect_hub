import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { MemberAuthError } from '@/lib/members/accounts';
import { QuestJoinError } from '@/lib/social/questJoins';
import { isRateLimited } from '@/lib/rateLimit';
import { challengeCircleDetail, circleAct, circleDetail, type CircleAction } from '@/lib/social/circleActions';
import { circleKindOf, recordCircleEvent } from '@/lib/social/circleStats';

type Context = { params: Promise<{ id: string }> };
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const ACTIONS: CircleAction[] = ['together', 'try', 'invite', 'cheer'];

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
    const id = decodeURIComponent((await context.params).id);
    // c:<questId>: friends on one challenge; its buttons act on each person's own Circle id
    const detail = id.startsWith('c:') ? await challengeCircleDetail(member, id) : await circleDetail(member, id);
    return NextResponse.json({ success: true, detail }, { headers: NO_STORE });
  } catch (error) {
    return failure(error, 'GET /api/circles/[id]');
  }
}

/** POST /api/circles/:id { action: 'together' | 'try' | 'invite' | 'cheer' }: the Circle's buttons */
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
    const id = decodeURIComponent((await context.params).id);
    const result = await circleAct(member, id, action);
    // What people do in Circles, for the admin numbers (BE-420)
    const kind = circleKindOf(id, result.detail?.kind);
    if (kind) await recordCircleEvent(member.id, kind, action);
    return NextResponse.json({ success: true, ...result }, { headers: NO_STORE });
  } catch (error) {
    return failure(error, 'POST /api/circles/[id]');
  }
}

import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { MomentError } from '@/lib/moments/service';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { answerInvite, declineInvite } from '@/lib/social/friendPlans';
import { QuestJoinError } from '@/lib/social/questJoins';

/**
 * POST { token } (a link) or { planId } (asked in the app, from My Hub) → { planId }: "ไปกัน" on an invitation joins its
 * group plan and chat (lib/social/friendPlans.ts). With `answer: 'no'` → { success }: "รอบนี้ไม่สะดวก", the host is told.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  if (await isRateLimited(`invite-answer:${member.id}`, 20, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'ตอบบ่อยเกินไป ลองใหม่ภายหลังนะ' }, { status: 429 });
  try {
    const body = (await request.json().catch(() => ({}))) as { token?: unknown; planId?: unknown; answer?: unknown };
    if (body.answer === 'no') {
      await declineInvite(member, body);
      return NextResponse.json({ success: true });
    }
    const plan = await answerInvite(member, body);
    return NextResponse.json({ success: true, planId: plan.id });
  } catch (error) {
    if (error instanceof MemberAuthError || error instanceof MomentError || error instanceof QuestJoinError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('[invites] answer failed', error);
    return NextResponse.json({ success: false, message: 'ตอบไม่สำเร็จ ลองอีกครั้งนะ' }, { status: 500 });
  }
}

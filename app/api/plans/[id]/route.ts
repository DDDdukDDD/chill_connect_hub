import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { leavePlan, setPlanDate } from '@/lib/social/friendPlans';
import { isRateLimited } from '@/lib/rateLimit';

/**
 * PATCH { date: 'YYYY-MM-DD' | null } → { plan } sets or clears the day (from the plan's chat);
 * PATCH { action: 'leave' } → { success, result: 'cancelled' | 'left' }: the host calls the plan off for everyone, a
 * friend leaves it (or turns an invitation down). Only people in the plan.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  if (await isRateLimited(`plan-edit:${member.id}`, 30, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'เปลี่ยนบ่อยเกินไป ลองใหม่อีกสักครู่นะ' }, { status: 429 });
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as { date?: unknown; action?: unknown };
    if (body.action === 'leave' || body.action === 'cancel') {
      return NextResponse.json({ success: true, result: await leavePlan(member, id) });
    }
    if (!('date' in body)) return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    return NextResponse.json({ success: true, plan: await setPlanDate(member, id, body.date) });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('[plans] update failed', error);
    return NextResponse.json({ success: false, message: 'บันทึกไม่สำเร็จ ลองอีกครั้งนะ' }, { status: 500 });
  }
}

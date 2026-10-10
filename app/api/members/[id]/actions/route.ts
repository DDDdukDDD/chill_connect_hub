import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { MEMBER_REPORT_REASONS, reportMember, setBlocked } from '@/lib/members/safety';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';

// Reasons offered by the report dialog
export async function GET() {
  return NextResponse.json({ success: true, reasons: MEMBER_REPORT_REASONS });
}

// { action: 'report', reason } (once per member) · { action: 'block' } · { action: 'unblock' }
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === 'report') {
      if (isRateLimited(`member-report:${member.id}`, 10, 24 * 60 * 60 * 1000)) {
        return NextResponse.json({ success: false, message: 'รายงานบ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
      }
      await reportMember(member, id, body.reason);
      return NextResponse.json({ success: true });
    }
    if (body.action === 'block' || body.action === 'unblock') {
      await setBlocked(member, id, body.action === 'block');
      return NextResponse.json({ success: true, blocked: body.action === 'block' });
    }
    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ' }, { status: 400 });
  }
}

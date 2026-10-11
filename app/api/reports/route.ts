import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember } from '@/lib/members/session';
import { fileContentReport } from '@/lib/social/contentReports';

/** A signed-in member reports an event, a fair or a place to staff. */
export async function POST(request: Request) {
  try {
    const member = await getSessionMember(request);
    if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ success: false, message: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    await fileContentReport(member, body as Record<string, unknown>);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('Error in /api/reports POST:', error);
    return NextResponse.json({ success: false, message: 'ส่งรายงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}

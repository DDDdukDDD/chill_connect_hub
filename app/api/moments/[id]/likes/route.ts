import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { getSessionMember } from '@/lib/members/session';
import { momentLikers } from '@/lib/moments/likers';

type Context = { params: Promise<{ id: string }> };

// Who liked the signed-in member's own moment (lib/moments/likers.ts); 403 for anyone else's
export async function GET(request: Request, context: Context) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const { id } = await context.params;
  try {
    return NextResponse.json({ success: true, people: await momentLikers(member, id) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('Error in /api/moments/[id]/likes GET:', error);
    return NextResponse.json({ success: false, message: 'โหลดรายชื่อไม่สำเร็จ' }, { status: 500 });
  }
}

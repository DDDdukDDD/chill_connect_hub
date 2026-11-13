import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { momentRepository } from '@/lib/moments';
import { sourceImpact } from '@/lib/social/actionLog';

type Context = { params: Promise<{ id: string }> };

/**
 * What the signed-in member's own post brought (docs/TRACEABILITY.md): different people who joined, saved, went or said
 * "ไปกัน" after coming from it. Only the author sees it; who those people are is never shown.
 */
export async function GET(request: Request, context: Context) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const { id } = await context.params;
  const moment = await momentRepository.findById(id);
  if (!moment || moment.status === 'removed') return NextResponse.json({ success: false, message: 'ไม่พบโมเมนต์' }, { status: 404 });
  if (moment.authorId !== member.id) return NextResponse.json({ success: false, message: 'ดูได้เฉพาะเจ้าของโมเมนต์' }, { status: 403 });
  return NextResponse.json({ success: true, impact: await sourceImpact('moment', id) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

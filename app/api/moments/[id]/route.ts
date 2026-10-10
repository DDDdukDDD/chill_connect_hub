import { NextResponse } from 'next/server';
import { momentRepository } from '@/lib/moments';
import { deleteOwnMoment, editMoment, isPubliclyVisible, loadPeople, MomentError, toFeedItem } from '@/lib/moments/service';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';

type Context = { params: Promise<{ id: string }> };

const errorResponse = (error: unknown, fallback: string) =>
  error instanceof MomentError
    ? NextResponse.json({ success: false, message: error.message }, { status: error.status })
    : NextResponse.json({ success: false, message: fallback }, { status: 400 });

// One moment (published, or the viewer's own)
export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const viewer = await getSessionMember(request);
  const moment = await momentRepository.findById(id);
  const people = moment ? await loadPeople([moment]) : new Map();
  if (!moment || (!isPubliclyVisible(moment, people) && !(viewer && moment.authorId === viewer.id && moment.status !== 'removed'))) {
    return NextResponse.json({ success: false, message: 'ไม่พบโมเมนต์' }, { status: 404 });
  }
  return NextResponse.json({ success: true, moment: toFeedItem(moment, viewer, people) }, { headers: { 'Cache-Control': 'no-store' } });
}

// Edit own moment: { caption?, location? }
export async function PATCH(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const { id } = await context.params;
  try {
    const moment = await editMoment(member, id, await request.json());
    return NextResponse.json({ success: true, moment: toFeedItem(moment, member, await loadPeople([moment])) });
  } catch (error) {
    return errorResponse(error, 'แก้ไขไม่สำเร็จ');
  }
}

// Delete own moment
export async function DELETE(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const { id } = await context.params;
  try {
    await deleteOwnMoment(member, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'ลบไม่สำเร็จ');
  }
}

import { NextResponse } from 'next/server';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { chatRoomOfReport, closeContentReport, listContentReports, openContentReportCount, removeChatMessageOfReport, removeReportedContent } from '@/lib/social/contentReports';

/**
 * Safety reports about events, fairs, places, reviews and chat messages. ?status=open (default) | closed | all
 * ?room=<reportId> → the whole chat room of a reported message (community.review; each read is in the audit log)
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const roomReportId = params.get('room');
  if (roomReportId) {
    const roomDenied = requireAdminApiAccess(request, 'community.review');
    if (roomDenied) return roomDenied;
    const room = await chatRoomOfReport(roomReportId);
    if (!room) return NextResponse.json({ success: false, error: 'ไม่พบรายงาน หรือไม่ใช่รายงานข้อความแชต' }, { status: 404 });
    recordAudit(getAdminActor(request), 'report.read_chat', `เปิดอ่านแชตทั้งห้องจากรายงาน: ${room.report.targetTitle}`, { type: 'report', id: room.report.id });
    return NextResponse.json(
      { success: true, reportedMessageId: room.report.targetId, messages: room.messages },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;
  const param = params.get('status');
  const status = param === 'closed' || param === 'all' ? param : 'open';
  return NextResponse.json(
    { success: true, reports: await listContentReports(status), counts: { open: openContentReportCount() } },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

// { action: 'close', id, note? }
export async function POST(request: Request) {
  const denied = requireAdminApiAccess(request, 'community.review');
  if (denied) return denied;
  const actor = getAdminActor(request);
  const body = await request.json().catch(() => null) as { action?: unknown; id?: unknown; note?: unknown; messageId?: unknown } | null;
  // { action: 'remove_chat_message', id: reportId, messageId } deletes another message of the reported room; the report stays open
  if (body?.action === 'remove_chat_message' && typeof body.id === 'string' && typeof body.messageId === 'string') {
    const removed = await removeChatMessageOfReport(body.id, body.messageId);
    if (!removed) return NextResponse.json({ success: false, error: 'ไม่พบข้อความนี้ในห้องของรายงาน' }, { status: 404 });
    recordAudit(actor, 'report.remove_chat_message', `ลบข้อความแชตจาก${removed.report.targetTitle}: "${removed.text.slice(0, 80)}"`, { type: 'report', id: removed.report.id });
    return NextResponse.json({ success: true });
  }
  if ((body?.action !== 'close' && body?.action !== 'remove_content') || typeof body.id !== 'string') {
    return NextResponse.json({ success: false, error: 'ต้องระบุ action (close หรือ remove_content) และ id' }, { status: 400 });
  }
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
  // remove_content deletes the reported review or chat message and closes every open report about it
  if (body.action === 'remove_content') {
    const removed = await removeReportedContent(body.id, actor?.name ?? 'staff', note);
    if (!removed) return NextResponse.json({ success: false, error: 'ไม่พบรายงาน ปิดไปแล้ว หรือไม่ใช่รายงานรีวิวหรือข้อความแชต' }, { status: 404 });
    recordAudit(actor, 'report.remove_content', `ลบ${removed.targetType === 'review' ? 'รีวิว' : 'ข้อความแชต'}ที่ถูกรายงาน: ${removed.targetTitle}${note ? ` · ${note}` : ''}`, { type: 'report', id: removed.id });
    return NextResponse.json({ success: true, report: removed });
  }
  const report = await closeContentReport(body.id, actor?.name ?? 'staff', note);
  if (!report) return NextResponse.json({ success: false, error: 'ไม่พบรายงาน หรือปิดไปแล้ว' }, { status: 404 });
  recordAudit(actor, 'report.close', `ปิดรายงานความปลอดภัยของ "${report.targetTitle}"${note ? ` · ${note}` : ''}`, { type: 'report', id: report.id });
  return NextResponse.json({ success: true, report });
}

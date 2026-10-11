import { NextResponse } from 'next/server';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { closeContentReport, listContentReports, openContentReportCount } from '@/lib/social/contentReports';

/** Safety reports about events, fairs and places. ?status=open (default) | closed | all */
export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;
  const param = new URL(request.url).searchParams.get('status');
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
  const body = await request.json().catch(() => null) as { action?: unknown; id?: unknown; note?: unknown } | null;
  if (body?.action !== 'close' || typeof body.id !== 'string') {
    return NextResponse.json({ success: false, error: 'ต้องระบุ action: close และ id' }, { status: 400 });
  }
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
  const report = await closeContentReport(body.id, actor?.name ?? 'staff', note);
  if (!report) return NextResponse.json({ success: false, error: 'ไม่พบรายงาน หรือปิดไปแล้ว' }, { status: 404 });
  recordAudit(actor, 'report.close', `ปิดรายงานความปลอดภัยของ "${report.targetTitle}"${note ? ` · ${note}` : ''}`, { type: 'report', id: report.id });
  return NextResponse.json({ success: true, report });
}

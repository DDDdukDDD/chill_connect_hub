import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { retentionByWeek } from '@/lib/members/activeDays';

/** GET → { weeks: RetentionWeek[] }: do new members come back (owner 2026-11-11). Totals per sign-up week only. */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const denied = await requireAdminApiAccess(request, 'content.view');
  if (denied) return denied;
  try {
    return NextResponse.json({ success: true, weeks: await retentionByWeek(8) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[admin] retention failed', error);
    return NextResponse.json({ success: false, error: 'โหลดตัวเลขไม่สำเร็จ' }, { status: 500 });
  }
}

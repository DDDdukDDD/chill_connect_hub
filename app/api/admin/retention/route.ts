import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { retentionByWeek } from '@/lib/members/activeDays';
import { inviteFunnel } from '@/lib/social/inviteFunnel';

/**
 * GET → { weeks: RetentionWeek[], invites: InviteFunnel | null }: do new members come back (owner 2026-11-11), and
 * "ชวนไป" step by step over 30 days (2026-11-12). Totals only. The funnel failing (0047 not run) leaves it null.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const denied = await requireAdminApiAccess(request, 'content.view');
  if (denied) return denied;
  try {
    const [weeks, invites] = await Promise.all([retentionByWeek(8), inviteFunnel(30).catch((error) => (console.error('[admin] invite funnel failed', error), null))]);
    return NextResponse.json({ success: true, weeks, invites }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[admin] retention failed', error);
    return NextResponse.json({ success: false, error: 'โหลดตัวเลขไม่สำเร็จ' }, { status: 500 });
  }
}

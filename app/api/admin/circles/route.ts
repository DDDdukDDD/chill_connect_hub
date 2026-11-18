import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { circleStats } from '@/lib/social/circleStats';

/**
 * Circles numbers for /admin (BE-420): GET ?days=14 → { rows: [{ kind, events: { open?, cheer?, try?, together?,
 * invite?, view_post? } }] }, person-days per Circle kind and event, from the small app.circle_events table.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const denied = await requireAdminApiAccess(request, 'content.view');
  if (denied) return denied;
  const days = Math.min(Math.max(Number(new URL(request.url).searchParams.get('days')) || 14, 1), 180);
  return NextResponse.json({ success: true, days, rows: await circleStats(days) }, { headers: { 'Cache-Control': 'no-store' } });
}

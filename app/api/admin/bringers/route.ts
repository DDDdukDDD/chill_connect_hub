import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { topBringers } from '@/lib/social/actionLog';

/**
 * GET ?days=30 → { bringers: Bringer[] }: the members whose posts, profiles and invitations brought the most different
 * people out (docs/TRACEABILITY.md). The base for choosing creators and, later, a creator share.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const denied = await requireAdminApiAccess(request, 'content.view');
  if (denied) return denied;
  const days = Math.min(Math.max(Number(new URL(request.url).searchParams.get('days')) || 30, 1), 365);
  return NextResponse.json({ success: true, days, bringers: await topBringers(days, 20) }, { headers: { 'Cache-Control': 'no-store' } });
}

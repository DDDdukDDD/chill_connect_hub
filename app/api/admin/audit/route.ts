import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { queryAudit } from '@/lib/auditLog';

function parsePositiveInteger(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

// Audit log, newest first. Filters: actorId, action (exact or prefix such as "event"), q (summary / target id)
export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request, 'audit.view');
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const result = queryAudit({
    actorId: searchParams.get('actorId'),
    action: searchParams.get('action'),
    q: searchParams.get('q'),
    page: parsePositiveInteger(searchParams.get('page'), 1, 10_000),
    limit: parsePositiveInteger(searchParams.get('limit'), 30, 100),
  });
  return NextResponse.json(
    {
      success: true,
      entries: result.items,
      pagination: {
        totalCount: result.totalCount,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { circleKindOf, recordCircleEvent } from '@/lib/social/circleStats';

/**
 * POST /api/circles/events { id, kind?, event: 'open' | 'view_post' } (BE-420): a Circle opened, or its post opened
 * from it, counted for the admin Circles numbers (lib/social/circleStats.ts). The buttons are counted by
 * POST /api/circles/:id itself. Answers 204 whatever happens: counting never gets in the reader's way.
 */
const EVENTS = ['open', 'view_post'] as const;

export async function POST(request: Request) {
  const done = new NextResponse(null, { status: 204 });
  if (!isSameOrigin(request)) return done;
  const member = await getSessionMember(request);
  if (!member || member.status !== 'active') return done;
  if (await isRateLimited(`circle-events:${member.id}`, 300, 60 * 60 * 1000)) return done;
  const body = await request.json().catch(() => ({}));
  const event = EVENTS.find((e) => e === body?.event);
  const kind = typeof body?.id === 'string' && body.id.length <= 200 ? circleKindOf(body.id, typeof body.kind === 'string' ? body.kind : undefined) : null;
  if (event && kind) await recordCircleEvent(member.id, kind, event);
  return done;
}

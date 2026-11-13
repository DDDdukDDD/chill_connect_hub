import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { clientIp } from '@/lib/rateLimit';
import { traceAction } from '@/lib/social/actionLog';
import { countLinkClick } from '@/lib/social/linkClicks';
import { CLICK_REF, CLICK_TARGET_TYPES, LINK_KINDS, type ClickTargetType, type LinkKind } from '@/lib/social/linkKinds';

/**
 * POST { kind, type, ref }: a tap that left the site from a place, อีเวนต์, ตี้ or challenge page, or a sponsored card
 * seen or tapped (lib/social/trackClient.ts, docs/TRACEABILITY.md step 4). Counted for everyone with nobody named;
 * a signed-in member's tap also goes to the action log, so the post that brought them gets the credit.
 * Answers 204 whatever happens: nothing waits on it.
 */

/** Per server, per address: enough for anyone browsing, not enough to pump a sponsor's numbers */
const PER_HOUR = 120;
const hits = new Map<string, { at: number; n: number }>();
function overLimit(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.at > 3600_000) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { at: now, n: 1 });
    return false;
  }
  row.n += 1;
  return row.n > PER_HOUR;
}

const done = () => new NextResponse(null, { status: 204 });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  if (overLimit(clientIp(request))) return done();
  const input = await request.json().catch(() => null);
  const kind = input?.kind as LinkKind;
  const type = input?.type as ClickTargetType;
  const ref = input?.ref;
  if (!LINK_KINDS.includes(kind) || !(CLICK_TARGET_TYPES as readonly string[]).includes(type) || typeof ref !== 'string' || !CLICK_REF.test(ref)) return done();
  await countLinkClick(kind, type, ref);
  if (kind !== 'sponsored_view') {
    const member = await getSessionMember(request).catch(() => null);
    if (member) await traceAction(member, kind === 'sponsored_click' ? 'sponsored_click' : 'outbound', { type, ref }, undefined, { kind });
  }
  return done();
}

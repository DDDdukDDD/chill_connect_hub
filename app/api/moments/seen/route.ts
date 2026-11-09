import { NextResponse } from 'next/server';
import { momentRepository } from '@/lib/moments';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';

/** Most posts one batch may carry; the browser sends about 20 at a time (lib/moments/seenTracker.ts) */
const MAX_IDS = 50;
const MOMENT_ID = /^[\w-]{1,80}$/;

/**
 * Posts a signed-in member had on screen: { ids: string[] }. The "สำหรับคุณ" feed then ranks them lower.
 * Sent in batches, never one request per post. Answers 204 whatever happens: this is a hint, nothing waits on it.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return new NextResponse(null, { status: 204 });
  const input = await request.json().catch(() => null);
  const ids = Array.isArray(input?.ids) ? [...new Set(input.ids.filter((id: unknown): id is string => typeof id === 'string' && MOMENT_ID.test(id)))].slice(0, MAX_IDS) : [];
  try {
    await momentRepository.markSeen(member.id, ids as string[]);
  } catch (error) {
    // e.g. before migration 0039 on this database
    console.warn('Moments seen:', (error as Error).message);
  }
  return new NextResponse(null, { status: 204 });
}

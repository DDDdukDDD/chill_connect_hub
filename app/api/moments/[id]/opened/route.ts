import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { USE_POSTGRES, sql } from '@/lib/db/postgres/client';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { SHARE_COOKIE, SHARE_DAYS, SHARE_REF, encodeShare, parseShare } from '@/lib/social/shareLink';

type Context = { params: Promise<{ id: string }> };

/**
 * POST { sharer }: someone opened a post from a link a member shared (/moments/<id>?s=<member>, docs/TRACEABILITY.md
 * step 5). Counts one open per browser per sharer, post and day in app.share_opens_daily, and remembers the share in the
 * httpOnly cookie cw_share for 30 days so later joins, visits and a sign-up credit the sharer. The sharer opening their
 * own link counts nothing. Answers 204 whatever happens.
 */
export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const done = new NextResponse(null, { status: 204 });
  const { id } = await context.params;
  const input = await request.json().catch(() => null);
  const sharer = input?.sharer;
  if (typeof sharer !== 'string' || !SHARE_REF.test(sharer) || !SHARE_REF.test(id)) return done;
  const viewer = await getSessionMember(request).catch(() => null);
  if (viewer?.id === sharer) return done;

  const now = Math.floor(Date.now() / 1000);
  const before = parseShare((await cookies()).get(SHARE_COOKIE)?.value);
  const today = (at: number) => new Date(at * 1000 + 7 * 3600_000).toISOString().slice(0, 10);
  const counted = before?.sharer === sharer && before.moment === id && today(before.at) === today(now);
  if (!counted && USE_POSTGRES) {
    try {
      await sql()`
        insert into app.share_opens_daily (day, moment_id, sharer_id, opens)
        select (now() at time zone 'Asia/Bangkok')::date, m.id, s.id, 1
        from app.moments m, app.members s where m.slug = ${id} and s.legacy_id = ${sharer} and m.status = 'published'
        on conflict (sharer_id, moment_id, day) do update set opens = app.share_opens_daily.opens + 1`;
    } catch (error) {
      // 42P01: migration 0055 not run yet
      if ((error as { code?: string }).code !== '42P01') console.warn('[share-open] not counted', error);
    }
  }
  done.cookies.set(SHARE_COOKIE, encodeShare({ sharer, moment: id, at: counted && before ? before.at : now }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SHARE_DAYS * 86400,
  });
  return done;
}

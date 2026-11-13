import { USE_POSTGRES, sql } from '../db/postgres/client';

/**
 * Rebuilds app.creator_daily (migration 0054, sign-ups and shared-link opens since 0055) for today and yesterday, Bangkok time, from app.action_log and
 * app.moment_daily_views, so /admin reads one small row per creator per day instead of the whole log
 * (docs/TRACEABILITY.md). Run by the hourly job; safe to run twice. The first run, on an empty table, fills the last
 * BACKFILL_DAYS days. Each day is rebuilt in one transaction (delete, then insert), so readers never see half a day.
 */
const BACKFILL_DAYS = 90;

export async function rebuildCreatorDaily(): Promise<{ days: number } | { skipped: string }> {
  if (!USE_POSTGRES) return { skipped: 'no database' };
  const db = sql();
  let empty: boolean;
  try {
    const [row] = await db`select not exists (select 1 from app.creator_daily) as empty`;
    empty = row.empty;
  } catch (error) {
    if ((error as { code?: string }).code === '42P01') return { skipped: 'migration 0054 not run' };
    throw error;
  }
  const back = empty ? BACKFILL_DAYS : 1;
  for (let ago = back; ago >= 0; ago -= 1) {
    await db.begin(async (tx) => {
      // A bad day must not hold the connection: give up on it and try again next hour
      await tx`set local statement_timeout = '20s'`;
      await tx`
        with d as (select ((now() at time zone 'Asia/Bangkok')::date - ${ago}::int) as day)
        delete from app.creator_daily where day = (select day from d)`;
      await tx`
        with d as (
          select ((now() at time zone 'Asia/Bangkok')::date - ${ago}::int) as day,
            (((now() at time zone 'Asia/Bangkok')::date - ${ago}::int)::timestamp at time zone 'Asia/Bangkok') as from_at
        ),
        brought as (
          select l.credited_id as member_id,
            count(distinct l.member_id) as people,
            count(distinct l.member_id) filter (where l.action = 'visit') as visits,
            count(distinct l.member_id) filter (where l.action = 'join') as joins,
            count(distinct l.member_id) filter (where l.action = 'save') as saves,
            count(distinct l.member_id) filter (where l.action = 'invite_yes') as invite_yes,
            count(distinct l.member_id) filter (where l.action = 'challenge_join') as challenge_joins,
            count(distinct l.member_id) filter (where l.action = 'outbound') as outbound,
            count(distinct l.member_id) filter (where l.action = 'signup') as signups
          from app.action_log l, d
          where l.credited_id is not null and l.created_at >= d.from_at and l.created_at < d.from_at + interval '1 day'
          group by l.credited_id
        ),
        seen as (
          select m.author_id as member_id, sum(v.viewers) as views, count(*) as posts_seen
          from app.moment_daily_views v join app.moments m on m.id = v.moment_id, d
          where v.day = d.day and m.author_id is not null
          group by m.author_id
        ),
        opened as (
          select o.sharer_id as member_id, sum(o.opens) as share_opens
          from app.share_opens_daily o, d where o.day = d.day
          group by o.sharer_id
        ),
        ids as (select member_id from brought union select member_id from seen union select member_id from opened)
        insert into app.creator_daily (day, member_id, people, visits, joins, saves, invite_yes, challenge_joins, outbound, signups, views, posts_seen, share_opens)
        select (select day from d), i.member_id,
          coalesce(b.people, 0), coalesce(b.visits, 0), coalesce(b.joins, 0), coalesce(b.saves, 0), coalesce(b.invite_yes, 0),
          coalesce(b.challenge_joins, 0), coalesce(b.outbound, 0), coalesce(b.signups, 0), coalesce(s.views, 0), coalesce(s.posts_seen, 0),
          coalesce(o.share_opens, 0)
        from ids i
        left join brought b on b.member_id = i.member_id
        left join seen s on s.member_id = i.member_id
        left join opened o on o.member_id = i.member_id`;
    });
  }
  return { days: back + 1 };
}

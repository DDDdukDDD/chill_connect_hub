import { USE_POSTGRES, sql } from '../db/postgres/client';

/**
 * Active days for retention (owner 2026-11-11, db/migrations/0044_member_days.sql): the first signed-in request of a
 * Bangkok day writes one row. Each server keeps the days it already wrote, so a member costs one insert a day per
 * server at most, and a failure never touches the request. Without a database there is nothing to measure.
 */

const BANGKOK_MS = 7 * 60 * 60 * 1000;
const written = new Set<string>();
let writtenDay = '';

export function noteActiveDay(memberId: string): void {
  if (!USE_POSTGRES) return;
  const day = new Date(Date.now() + BANGKOK_MS).toISOString().slice(0, 10);
  // A new day starts a new list, so the set never grows past one day of members
  if (day !== writtenDay) {
    written.clear();
    writtenDay = day;
  }
  const key = `${memberId}:${day}`;
  if (written.has(key)) return;
  written.add(key);
  const db = sql();
  void db`insert into app.member_days (member_id, day) select id, ${day}::date from app.members where legacy_id = ${memberId} on conflict do nothing`.catch(() => written.delete(key));
}

export interface RetentionWeek {
  /** Monday of the sign-up week (Bangkok), "YYYY-MM-DD" */
  week: string;
  signups: number;
  /** Came back on a later day within 1 day, and within 7 days, of signing up */
  back1: number;
  back7: number;
  /** Posted a moment, and made a "ไปกัน" plan, within 7 days */
  posted7: number;
  planned7: number;
  /** Finished a starter challenge (QuestRule.posts) */
  starter: number;
}

/**
 * Retention by sign-up week for the last `weeks` weeks, totals only. Sample and closed accounts are left out. A week
 * whose 7 days have not passed yet still shows, its later columns filling in as the days pass.
 */
export async function retentionByWeek(weeks = 8): Promise<RetentionWeek[]> {
  if (!USE_POSTGRES) return [];
  const db = sql();
  const rows = await db`
    with cohort as (
      select m.id, (m.created_at at time zone 'Asia/Bangkok')::date as joined,
             date_trunc('week', (m.created_at at time zone 'Asia/Bangkok'))::date as week
      from app.members m
      where not m.is_sample and coalesce(m.email, '') not like '%@sample.invalid'
        and m.created_at >= now() - make_interval(weeks => ${weeks})
    )
    select c.week::text as week,
      count(*)::int as signups,
      count(*) filter (where exists (select 1 from app.member_days d where d.member_id = c.id and d.day = c.joined + 1))::int as back1,
      count(*) filter (where exists (select 1 from app.member_days d where d.member_id = c.id and d.day between c.joined + 1 and c.joined + 7))::int as back7,
      count(*) filter (where exists (select 1 from app.moments mo where mo.author_id = c.id and not mo.is_sample and (mo.created_at at time zone 'Asia/Bangkok')::date <= c.joined + 7))::int as posted7,
      count(*) filter (where exists (select 1 from app.friend_plan_members pm where pm.member_id = c.id and pm.state = 'going' and (pm.created_at at time zone 'Asia/Bangkok')::date <= c.joined + 7 and (select count(*) from app.friend_plan_members x where x.plan_id = pm.plan_id and x.state = 'going') > 1))::int as planned7,
      count(*) filter (where exists (select 1 from app.quest_participants f join app.quests q on q.id = f.quest_id where f.member_id = c.id and f.finished_at is not null and q.rule ? 'posts'))::int as starter
    from cohort c
    group by c.week
    order by c.week desc`;
  return rows.map((r) => ({ week: r.week, signups: r.signups, back1: r.back1, back7: r.back7, posted7: r.posted7, planned7: r.planned7, starter: r.starter }));
}

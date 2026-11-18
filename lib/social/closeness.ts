import { USE_POSTGRES, sql } from '../db/postgres/client';
import { CLOSENESS_POINTS, CLOSENESS_WINDOW_DAYS } from './socialRules';

/**
 * How close the reader is to each person they follow, for the order of Circles (owner 2026-11-18, Circles at scale):
 * things done together count most (same ตี้, a "ไปกัน" plan, a shared chat), then talking to each other's posts
 * (comments, likes, both ways), then following back. Each signal has a cap so one busy chat cannot outweigh everything.
 * Points live in socialRules.ts and the admin topic Circles reads them from there.
 *
 * One query for the reader and all their candidates; every join uses an index that already exists (member_id /
 * author_id indexes), so the cost grows with the reader's own history, not with the size of the site.
 * Without a database only following back counts.
 */
export async function closenessOf(readerId: string, candidateIds: string[], mutual: Set<string>): Promise<Map<string, number>> {
  const scores = new Map<string, number>(candidateIds.map((id) => [id, mutual.has(id) ? CLOSENESS_POINTS.mutual : 0]));
  if (!USE_POSTGRES || candidateIds.length === 0) return scores;
  const P = CLOSENESS_POINTS;
  const since = new Date(Date.now() - CLOSENESS_WINDOW_DAYS * 86_400_000);
  const db = sql();
  const rows = await db`
    with me as (select id from app.members where legacy_id = ${readerId}),
    them as (select id, legacy_id from app.members where legacy_id = any(${db.array(candidateIds)}::text[])),
    tee as (
      select o.member_id, count(distinct o.event_id)::int as n
      from app.event_participants mine join app.event_participants o on o.event_id = mine.event_id and o.member_id <> mine.member_id
      where mine.member_id = (select id from me) and mine.status = 'joined' and o.status = 'joined' and mine.joined_at >= ${since}
      group by o.member_id
    ),
    plans as (
      select o.member_id, count(distinct o.plan_id)::int as n
      from app.friend_plan_members mine join app.friend_plan_members o on o.plan_id = mine.plan_id and o.member_id <> mine.member_id
      where mine.member_id = (select id from me) and mine.state = 'going' and o.state = 'going' and mine.created_at >= ${since}
      group by o.member_id
    ),
    chats as (
      select o.member_id, count(distinct o.room_id)::int as n
      from app.chat_room_members mine join app.chat_room_members o on o.room_id = mine.room_id and o.member_id <> mine.member_id
      where mine.member_id = (select id from me)
      group by o.member_id
    ),
    liked_by_me as (
      select m.author_id as member_id, count(*)::int as n
      from app.moment_likes l join app.moments m on m.id = l.moment_id
      where l.member_id = (select id from me) and l.created_at >= ${since}
      group by m.author_id
    ),
    liked_me as (
      select l.member_id, count(*)::int as n
      from app.moments m join app.moment_likes l on l.moment_id = m.id
      where m.author_id = (select id from me) and l.created_at >= ${since}
      group by l.member_id
    ),
    commented_by_me as (
      select m.author_id as member_id, count(*)::int as n
      from app.moment_comments c join app.moments m on m.id = c.moment_id
      where c.author_id = (select id from me) and not c.hidden and c.created_at >= ${since}
      group by m.author_id
    ),
    commented_me as (
      select c.author_id as member_id, count(*)::int as n
      from app.moments m join app.moment_comments c on c.moment_id = m.id
      where m.author_id = (select id from me) and not c.hidden and c.created_at >= ${since}
      group by c.author_id
    )
    select t.legacy_id,
      least(coalesce(tee.n, 0) * ${P.tee}::numeric, ${P.teeMax}::numeric)
      + least(coalesce(plans.n, 0) * ${P.plan}::numeric, ${P.planMax}::numeric)
      + least(coalesce(chats.n, 0) * ${P.chat}::numeric, ${P.chatMax}::numeric)
      + least((coalesce(cbm.n, 0) + coalesce(cm.n, 0)) * ${P.comment}::numeric, ${P.commentMax}::numeric)
      + least((coalesce(lbm.n, 0) + coalesce(lm.n, 0)) * ${P.like}::numeric, ${P.likeMax}::numeric) as score
    from them t
      left join tee on tee.member_id = t.id
      left join plans on plans.member_id = t.id
      left join chats on chats.member_id = t.id
      left join liked_by_me lbm on lbm.member_id = t.id
      left join liked_me lm on lm.member_id = t.id
      left join commented_by_me cbm on cbm.member_id = t.id
      left join commented_me cm on cm.member_id = t.id`;
  for (const row of rows) {
    const id = String(row.legacy_id);
    scores.set(id, (scores.get(id) ?? 0) + Number(row.score));
  }
  return scores;
}

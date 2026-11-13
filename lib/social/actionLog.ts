import { cookies } from 'next/headers';
import { USE_POSTGRES, sql } from '../db/postgres/client';
import { memberRepository } from '../members';
import type { Member } from '../members/types';
import { momentRepository } from '../moments';
import { VIA_COOKIE, VIA_DAYS, parseVia, viaFamily, type ViaFamily } from './via';

/**
 * The action log (docs/TRACEABILITY.md): who did what, to what, where they came from and who gets the credit. It feeds
 * "what did this post bring" and, later, revenue and a creator share. Logging never gets in the way of the action: any
 * failure is swallowed, and a database without migration 0052 simply logs nothing.
 */

export type TracedAction = 'join' | 'save' | 'challenge_join' | 'visit' | 'invite_yes' | 'outbound' | 'sponsored_click';
export type TracedTargetType = 'spot' | 'community' | 'fair' | 'challenge' | 'plan';
export type TraceSourceType = 'moment' | 'profile' | 'invite' | 'share';
export interface TraceSource {
  type: TraceSourceType;
  ref: string;
  /** Who gets the credit, when the caller already knows (the person who invited); otherwise worked out from the source */
  creditedId?: string;
}

/** Credit follows a member from a save or a join to the visit that comes after, for this long */
const CARRY_DAYS = 60;

interface LogRow {
  memberId: string;
  action: TracedAction;
  targetType: TracedTargetType;
  targetRef: string;
  source?: TraceSource;
  creditedId?: string;
  meta?: Record<string, string>;
  createdAt: number;
}
/** The no-database mode keeps the log in this server's memory */
const memoryLog: LogRow[] = [];

const familyOf = (type: TracedTargetType): ViaFamily | null => (type === 'plan' ? null : viaFamily(type));

/** The newest remembered tap on a link to this target (cookie `cw_via`, set by lib/social/viaClient.ts) */
async function viaFromCookie(type: TracedTargetType, ref: string): Promise<TraceSource | null> {
  const family = familyOf(type);
  if (!family) return null;
  try {
    const raw = (await cookies()).get(VIA_COOKIE)?.value;
    const oldest = Date.now() / 1000 - VIA_DAYS * 86400;
    const hit = parseVia(raw).filter((t) => t.family === family && t.ref === ref && t.at >= oldest).sort((a, b) => b.at - a.at)[0];
    return hit ? { type: hit.sourceType, ref: hit.sourceRef } : null;
  } catch {
    // Outside a request (scripts, jobs) there are no cookies
    return null;
  }
}

/** The member's first credited row for this target in the last CARRY_DAYS: a visit after a save keeps the save's credit */
async function carriedSource(member: Member, type: TracedTargetType, ref: string): Promise<TraceSource | null> {
  const family = familyOf(type);
  const types = family === 'event' ? ['community', 'fair'] : [type];
  if (!USE_POSTGRES) {
    const since = Date.now() - CARRY_DAYS * 86400_000;
    const row = memoryLog.find((r) => r.memberId === member.id && r.targetRef === ref && types.includes(r.targetType) && r.source && r.createdAt >= since);
    return row?.source ? { ...row.source, creditedId: row.creditedId } : null;
  }
  const db = sql();
  const [row] = await db`
    select l.source_type, l.source_ref, c.legacy_id as credited
    from app.action_log l left join app.members c on c.id = l.credited_id
    where l.member_id = (select id from app.members where legacy_id = ${member.id}) and l.target_ref = ${ref}
      and l.target_type in ${db(types)} and l.source_type is not null and l.created_at > now() - make_interval(days => ${CARRY_DAYS})
    order by l.created_at asc limit 1`;
  return row ? { type: row.source_type, ref: row.source_ref, ...(row.credited ? { creditedId: row.credited } : {}) } : null;
}

/** Whose credit a source is: a post's author, a profile's owner; never the member themselves */
async function creditFor(member: Member, source: TraceSource): Promise<string | undefined> {
  let credited = source.creditedId;
  if (!credited && source.type === 'moment') credited = (await momentRepository.findById(source.ref))?.authorId ?? undefined;
  if (!credited && source.type === 'profile') credited = (await memberRepository.findById(source.ref)) ? source.ref : undefined;
  return credited && credited !== member.id ? credited : undefined;
}

/**
 * Logs one action. The source is the caller's when it knows it (an invitation, saving a post), else the tapped link
 * remembered in the cookie, else the credit of the member's earlier row for the same target.
 */
export async function traceAction(
  member: Member,
  action: TracedAction,
  target: { type: TracedTargetType; ref: string },
  known?: TraceSource,
  meta?: Record<string, string>,
): Promise<void> {
  try {
    if (!target.ref) return;
    const source = known ?? (await viaFromCookie(target.type, target.ref)) ?? (await carriedSource(member, target.type, target.ref));
    const creditedId = source ? await creditFor(member, source) : undefined;
    if (!USE_POSTGRES) {
      memoryLog.push({ memberId: member.id, action, targetType: target.type, targetRef: target.ref, source: source ?? undefined, creditedId, meta, createdAt: Date.now() });
      if (memoryLog.length > 5000) memoryLog.shift();
      return;
    }
    const db = sql();
    await db`
      insert into app.action_log (member_id, action, target_type, target_ref, source_type, source_ref, credited_id, meta)
      select m.id, ${action}, ${target.type}, ${target.ref}, ${source?.type ?? null}, ${source?.ref ?? null},
        (select c.id from app.members c where c.legacy_id = ${creditedId ?? null}), ${meta ? db.json(meta) : null}
      from app.members m where m.legacy_id = ${member.id}`;
  } catch (error) {
    // 42P01: migration 0052 not run yet
    if ((error as { code?: string }).code !== '42P01') console.warn('[action-log] not logged', action, target.type, error);
  }
}

export interface SourceImpact {
  /** Different people this source brought to do anything */
  people: number;
  join: number;
  save: number;
  challengeJoin: number;
  visit: number;
  inviteYes: number;
  /** Tapped through to the place's map, website, tickets or LINE */
  outbound: number;
}
const EMPTY_IMPACT: SourceImpact = { people: 0, join: 0, save: 0, challengeJoin: 0, visit: 0, inviteYes: 0, outbound: 0 };

/** What one post (or profile, or invitation) brought: different people per action */
export async function sourceImpact(type: TraceSourceType, ref: string): Promise<SourceImpact> {
  try {
    if (!USE_POSTGRES) {
      const rows = memoryLog.filter((r) => r.source?.type === type && r.source.ref === ref && r.creditedId);
      const people = (action?: TracedAction) => new Set(rows.filter((r) => !action || r.action === action).map((r) => r.memberId)).size;
      return { people: people(), join: people('join'), save: people('save'), challengeJoin: people('challenge_join'), visit: people('visit'), inviteYes: people('invite_yes'), outbound: people('outbound') };
    }
    const db = sql();
    const [row] = await db`
      select count(distinct member_id)::int as people,
        count(distinct member_id) filter (where action = 'join')::int as join,
        count(distinct member_id) filter (where action = 'save')::int as save,
        count(distinct member_id) filter (where action = 'challenge_join')::int as challenge_join,
        count(distinct member_id) filter (where action = 'visit')::int as visit,
        count(distinct member_id) filter (where action = 'invite_yes')::int as invite_yes,
        count(distinct member_id) filter (where action = 'outbound')::int as outbound
      from app.action_log where source_type = ${type} and source_ref = ${ref} and credited_id is not null`;
    return { people: row.people, join: row.join, save: row.save, challengeJoin: row.challenge_join, visit: row.visit, inviteYes: row.invite_yes, outbound: row.outbound };
  } catch {
    return EMPTY_IMPACT;
  }
}

export interface Bringer {
  memberId: string;
  name: string;
  avatar: string;
  /** Person-days: different members each day, added over the range (app.creator_daily) */
  people: number;
  visits: number;
  joins: number;
  saves: number;
  inviteYes: number;
  outbound: number;
  /** Viewer-days of their posts in the range */
  views: number;
}
export type BringerSort = 'people' | 'views';

/**
 * Creators over the last `days` days, from app.creator_daily (migration 0054), which the hourly job rebuilds
 * (lib/social/creatorDaily.ts): the page reads one small row per creator per day however large the log grows.
 */
export async function topBringers(
  days: number,
  { sort = 'people', limit = 20, offset = 0 }: { sort?: BringerSort; limit?: number; offset?: number } = {},
): Promise<Bringer[]> {
  try {
    if (!USE_POSTGRES) {
      const since = Date.now() - days * 86400_000;
      const by = new Map<string, LogRow[]>();
      for (const r of memoryLog) if (r.creditedId && r.createdAt >= since) by.set(r.creditedId, [...(by.get(r.creditedId) ?? []), r]);
      const people = await memberRepository.findByIds([...by.keys()]);
      const count = (rows: LogRow[], action?: TracedAction) => new Set(rows.filter((r) => !action || r.action === action).map((r) => r.memberId)).size;
      return [...by.entries()]
        .map(([id, rows]) => ({
          memberId: id,
          name: people.get(id)?.displayName ?? '',
          avatar: people.get(id)?.avatarUrl ?? '',
          people: count(rows),
          visits: count(rows, 'visit'),
          joins: count(rows, 'join'),
          saves: count(rows, 'save'),
          inviteYes: count(rows, 'invite_yes'),
          outbound: count(rows, 'outbound'),
          views: 0,
        }))
        .sort((a, b) => b.people - a.people)
        .slice(offset, offset + limit);
    }
    const db = sql();
    const order = sort === 'views' ? db`views desc, people desc, member_id` : db`people desc, views desc, member_id`;
    const rows = await db`
      select c.legacy_id, coalesce(c.display_name, '') as name, coalesce(c.avatar_url, '') as avatar, t.*
      from (
        select member_id, sum(people)::int as people, sum(visits)::int as visits, sum(joins)::int as joins, sum(saves)::int as saves,
          sum(invite_yes)::int as invite_yes, sum(outbound)::int as outbound, sum(views)::int as views
        from app.creator_daily
        where day > (now() at time zone 'Asia/Bangkok')::date - ${days}::int
        group by member_id order by ${order} limit ${limit} offset ${offset}
      ) t join app.members c on c.id = t.member_id
      order by ${order}`;
    return rows.map((r) => ({
      memberId: r.legacy_id,
      name: r.name,
      avatar: r.avatar,
      people: r.people,
      visits: r.visits,
      joins: r.joins,
      saves: r.saves,
      inviteYes: r.invite_yes,
      outbound: r.outbound,
      views: r.views,
    }));
  } catch {
    // 42P01: migration 0054 not run yet
    return [];
  }
}

export interface CreatorPost {
  /** The post's id as the site uses it (/moments/[id]) */
  id: string;
  caption: string;
  createdAt: string;
  status: string;
  views: number;
  people: number;
  visits: number;
}

/**
 * One member's posts that were seen or brought someone in the last `days` days (admin, under a row of topBringers).
 * Both parts start from this member (their posts, rows credited to them), never from the whole log.
 */
export async function creatorPosts(memberId: string, days: number, limit = 30): Promise<CreatorPost[]> {
  if (!USE_POSTGRES) return [];
  try {
    const db = sql();
    const rows = await db`
      with me as (select id from app.members where legacy_id = ${memberId}),
      seen as (
        select v.moment_id, sum(v.viewers)::int as views
        from app.moment_daily_views v join app.moments m on m.id = v.moment_id
        where m.author_id = (select id from me) and v.day > (now() at time zone 'Asia/Bangkok')::date - ${days}::int
        group by v.moment_id
      ),
      brought as (
        select source_ref, count(distinct member_id)::int as people, count(distinct member_id) filter (where action = 'visit')::int as visits
        from app.action_log
        where credited_id = (select id from me) and source_type = 'moment' and created_at > now() - make_interval(days => ${days})
        group by source_ref
      )
      select m.slug, left(m.caption, 120) as caption, m.created_at, m.status,
        coalesce(s.views, 0) as views, coalesce(b.people, 0) as people, coalesce(b.visits, 0) as visits
      from app.moments m
      left join seen s on s.moment_id = m.id
      left join brought b on b.source_ref = m.slug
      where m.author_id = (select id from me) and m.status <> 'removed' and (s.views is not null or b.people is not null)
      order by people desc, views desc, m.created_at desc limit ${limit}`;
    return rows.map((r) => ({ id: String(r.slug), caption: r.caption ?? '', createdAt: new Date(r.created_at).toISOString(), status: r.status, views: r.views, people: r.people, visits: r.visits }));
  } catch {
    return [];
  }
}

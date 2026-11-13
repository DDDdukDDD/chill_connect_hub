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

export type TracedAction = 'join' | 'save' | 'challenge_join' | 'visit' | 'invite_yes';
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
export async function traceAction(member: Member, action: TracedAction, target: { type: TracedTargetType; ref: string }, known?: TraceSource): Promise<void> {
  try {
    if (!target.ref) return;
    const source = known ?? (await viaFromCookie(target.type, target.ref)) ?? (await carriedSource(member, target.type, target.ref));
    const creditedId = source ? await creditFor(member, source) : undefined;
    if (!USE_POSTGRES) {
      memoryLog.push({ memberId: member.id, action, targetType: target.type, targetRef: target.ref, source: source ?? undefined, creditedId, createdAt: Date.now() });
      if (memoryLog.length > 5000) memoryLog.shift();
      return;
    }
    const db = sql();
    await db`
      insert into app.action_log (member_id, action, target_type, target_ref, source_type, source_ref, credited_id)
      select m.id, ${action}, ${target.type}, ${target.ref}, ${source?.type ?? null}, ${source?.ref ?? null},
        (select c.id from app.members c where c.legacy_id = ${creditedId ?? null})
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
}
const EMPTY_IMPACT: SourceImpact = { people: 0, join: 0, save: 0, challengeJoin: 0, visit: 0, inviteYes: 0 };

/** What one post (or profile, or invitation) brought: different people per action */
export async function sourceImpact(type: TraceSourceType, ref: string): Promise<SourceImpact> {
  try {
    if (!USE_POSTGRES) {
      const rows = memoryLog.filter((r) => r.source?.type === type && r.source.ref === ref && r.creditedId);
      const people = (action?: TracedAction) => new Set(rows.filter((r) => !action || r.action === action).map((r) => r.memberId)).size;
      return { people: people(), join: people('join'), save: people('save'), challengeJoin: people('challenge_join'), visit: people('visit'), inviteYes: people('invite_yes') };
    }
    const db = sql();
    const [row] = await db`
      select count(distinct member_id)::int as people,
        count(distinct member_id) filter (where action = 'join')::int as join,
        count(distinct member_id) filter (where action = 'save')::int as save,
        count(distinct member_id) filter (where action = 'challenge_join')::int as challenge_join,
        count(distinct member_id) filter (where action = 'visit')::int as visit,
        count(distinct member_id) filter (where action = 'invite_yes')::int as invite_yes
      from app.action_log where source_type = ${type} and source_ref = ${ref} and credited_id is not null`;
    return { people: row.people, join: row.join, save: row.save, challengeJoin: row.challenge_join, visit: row.visit, inviteYes: row.invite_yes };
  } catch {
    return EMPTY_IMPACT;
  }
}

export interface Bringer {
  memberId: string;
  name: string;
  avatar: string;
  people: number;
  visits: number;
  joins: number;
  saves: number;
  inviteYes: number;
  /** Viewer-days of their posts in the range (app.moment_daily_views, migration 0053) */
  views: number;
  /** Their posts that someone saw in the range */
  postsSeen: number;
}

/** "Since this many days" as a Bangkok date, for app.moment_daily_views */
const BKK_TODAY = "(now() at time zone 'Asia/Bangkok')::date";

/**
 * The members who brought the most different people in the last `days` days, and the members whose posts were seen the
 * most (admin). Each list is cut at `limit`, then merged, so a creator with reach but nobody brought yet still shows.
 */
export async function topBringers(days: number, limit = 20): Promise<Bringer[]> {
  try {
    if (!USE_POSTGRES) {
      const since = Date.now() - days * 86400_000;
      const by = new Map<string, LogRow[]>();
      for (const r of memoryLog) if (r.creditedId && r.createdAt >= since) by.set(r.creditedId, [...(by.get(r.creditedId) ?? []), r]);
      const people = await memberRepository.findByIds([...by.keys()]);
      const count = (rows: LogRow[], action?: TracedAction) => new Set(rows.filter((r) => !action || r.action === action).map((r) => r.memberId)).size;
      return [...by.entries()]
        .map(([id, rows]) => ({ memberId: id, name: people.get(id)?.displayName ?? '', avatar: people.get(id)?.avatarUrl ?? '', people: count(rows), visits: count(rows, 'visit'), joins: count(rows, 'join'), saves: count(rows, 'save'), inviteYes: count(rows, 'invite_yes'), views: 0, postsSeen: 0 }))
        .sort((a, b) => b.people - a.people)
        .slice(0, limit);
    }
    const db = sql();
    const brought = await db`
      select c.legacy_id, coalesce(c.display_name, '') as name, coalesce(c.avatar_url, '') as avatar,
        count(distinct l.member_id)::int as people,
        count(distinct l.member_id) filter (where l.action = 'visit')::int as visits,
        count(distinct l.member_id) filter (where l.action = 'join')::int as joins,
        count(distinct l.member_id) filter (where l.action = 'save')::int as saves,
        count(distinct l.member_id) filter (where l.action = 'invite_yes')::int as invite_yes
      from app.action_log l join app.members c on c.id = l.credited_id
      where l.created_at > now() - make_interval(days => ${days})
      group by c.id order by people desc, visits desc limit ${limit}`;
    const out = new Map<string, Bringer>(
      brought.map((r) => [r.legacy_id, { memberId: r.legacy_id, name: r.name, avatar: r.avatar, people: r.people, visits: r.visits, joins: r.joins, saves: r.saves, inviteYes: r.invite_yes, views: 0, postsSeen: 0 }]),
    );
    try {
      const ids = [...out.keys()];
      const since = db`${db.unsafe(BKK_TODAY)} - ${days}::int`;
      const byAuthor = (where: ReturnType<typeof db>, cap: number) => db`
        select c.legacy_id, coalesce(c.display_name, '') as name, coalesce(c.avatar_url, '') as avatar,
          sum(v.viewers)::int as views, count(distinct v.moment_id)::int as posts
        from app.moment_daily_views v join app.moments m on m.id = v.moment_id join app.members c on c.id = m.author_id
        where v.day > ${since} and ${where}
        group by c.id order by views desc limit ${cap}`;
      // The most seen authors, and the view counts of the members already listed for what they brought
      const seen = [...(await byAuthor(db`true`, limit)), ...(ids.length ? await byAuthor(db`c.legacy_id in ${db(ids)}`, ids.length) : [])];
      for (const r of seen) {
        const row = out.get(r.legacy_id) ?? { memberId: r.legacy_id, name: r.name, avatar: r.avatar, people: 0, visits: 0, joins: 0, saves: 0, inviteYes: 0, views: 0, postsSeen: 0 };
        out.set(r.legacy_id, { ...row, views: r.views, postsSeen: r.posts });
      }
    } catch {
      // 42P01: migration 0053 not run yet, so no view counts
    }
    return [...out.values()].sort((a, b) => b.people - a.people || b.views - a.views);
  } catch {
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

/** One member's posts that were seen or brought someone in the last `days` days (admin, under a row of topBringers) */
export async function creatorPosts(memberId: string, days: number, limit = 30): Promise<CreatorPost[]> {
  if (!USE_POSTGRES) return [];
  const db = sql();
  const brought = (views: boolean) => db`
    select m.slug, left(m.caption, 120) as caption, m.created_at, m.status,
      ${views ? db`coalesce((select sum(v.viewers) from app.moment_daily_views v where v.moment_id = m.id and v.day > ${db.unsafe(BKK_TODAY)} - ${days}::int), 0)::int` : db`0`} as views,
      coalesce(b.people, 0)::int as people, coalesce(b.visits, 0)::int as visits
    from app.moments m
    left join (
      select source_ref, count(distinct member_id) as people, count(distinct member_id) filter (where action = 'visit') as visits
      from app.action_log where source_type = 'moment' and credited_id is not null and created_at > now() - make_interval(days => ${days})
      group by source_ref
    ) b on b.source_ref = m.slug
    where m.author_id = (select id from app.members where legacy_id = ${memberId}) and m.status <> 'removed'
    order by people desc, views desc, m.created_at desc limit ${limit}`;
  try {
    let rows;
    try {
      rows = await brought(true);
    } catch (error) {
      if ((error as { code?: string }).code !== '42P01') throw error;
      rows = await brought(false);
    }
    return rows
      .filter((r) => r.views > 0 || r.people > 0)
      .map((r) => ({ id: String(r.slug), caption: r.caption ?? '', createdAt: new Date(r.created_at).toISOString(), status: r.status, views: r.views, people: r.people, visits: r.visits }));
  } catch {
    return [];
  }
}

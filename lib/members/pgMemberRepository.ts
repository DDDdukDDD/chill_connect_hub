import { randomBytes } from 'node:crypto';
import type { PendingQuery, Row as PgRow } from 'postgres';
import { sql, type Sql } from '../db/postgres/client';
import { memberToRows, rowToMember, toDate, uuidV7 } from '../db/postgres/rows.mjs';
import type { Member, MemberQuery, MemberRepository, MemberStatus, OAuthProvider } from './types';

/**
 * Members in Postgres (docs/DATABASE_DESIGN.md §4.1–4.2). The app keeps using today's member ids ("mem_…"),
 * stored as members.legacy_id, until every store has moved. One Member object is spread over the member tables;
 * reads gather it in one query, writes only rewrite the tables whose fields changed.
 */

type Row = Record<string, unknown>;

/** One row per member with everything rowToMember needs (lib/db/postgres/rows.mjs) */
type Fragment = PendingQuery<PgRow[]>;
const hydrate = (tx: Sql, where: Fragment) => tx`
  select m.*, c.password_hash, inviter.legacy_id as invited_by_legacy,
    pr.bio, pr.occupation, pr.workplace, pr.education, pr.hometown, pr.living_area, pr.relationship_status, pr.connect_goal,
    pr.birth_year, pr.gender, pr.province_code, pr.intent, pr.goals, pr.hidden_fields, pr.preferences_at,
    (select coalesce(json_agg(json_build_object('provider', a.provider, 'subject', a.subject, 'linked_at', a.linked_at) order by a.linked_at), '[]')
       from app.member_auth_providers a where a.member_id = m.id) as providers,
    (select coalesce(json_agg(json_build_object('purpose', t.purpose, 'token_hash', t.token_hash, 'expires_at', t.expires_at) order by t.created_at desc), '[]')
       from app.member_tokens t where t.member_id = m.id and t.used_at is null) as tokens,
    (select coalesce(json_agg(json_build_object('pillar', i.pillar, 'code', i.code)), '[]') from app.member_interests i where i.member_id = m.id) as interests,
    (select coalesce(json_agg(json_build_object('kind', k.kind, 'version', k.version, 'source', k.source, 'accepted_at', k.accepted_at)), '[]')
       from app.member_consents k where k.member_id = m.id) as consents,
    (select coalesce(json_agg(json_build_object('code', f.code, 'detail', f.detail, 'created_at', f.created_at) order by f.created_at), '[]')
       from app.member_risk_flags f where f.member_id = m.id) as risk_flags,
    (select row_to_json(h) from app.host_applications h where h.member_id = m.id order by h.submitted_at desc limit 1) as host_application,
    (select coalesce(json_agg(json_build_object('by_id', rm.legacy_id, 'reason', r.reason, 'created_at', r.created_at) order by r.created_at), '[]')
       from app.content_reports r join app.members rm on rm.id = r.reporter_id
       where r.target_type = 'member' and r.target_id = m.legacy_id) as reports_received,
    array(select o.legacy_id from app.blocks b join app.members o on o.id = b.blocked_id where b.blocker_id = m.id order by b.created_at) as blocked_ids,
    array(select o.legacy_id from app.follows f join app.members o on o.id = f.followee_id where f.follower_id = m.id order by f.created_at) as following_ids,
    array(select p.slug from app.saved_items s join app.places p on p.id = s.place_id where s.member_id = m.id order by s.created_at desc) as saved_spot_ids,
    array(select e.slug from app.saved_items s join app.events e on e.id = s.event_id where s.member_id = m.id order by s.created_at desc) as saved_event_ids,
    (select coalesce(json_agg(json_build_object('event_id', e.slug, 'at', p.cancelled_at) order by p.cancelled_at desc), '[]')
       from app.event_participants p join app.events e on e.id = p.event_id where p.member_id = m.id and p.status = 'cancelled') as cancelled_events
  from app.members m
  left join app.member_credentials c on c.member_id = m.id
  left join app.member_profiles pr on pr.member_id = m.id
  left join app.members inviter on inviter.id = m.invited_by
  where ${where}`;

async function findOne(tx: Sql, where: Fragment): Promise<Member | null> {
  const [row] = await hydrate(tx, where);
  return row ? (rowToMember(row) as Member) : null;
}

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // lib/social/friends.ts
async function freeInviteCode(tx: Sql, wanted?: string): Promise<string> {
  const candidate = wanted?.trim().toUpperCase();
  if (candidate && /^[A-Z0-9]{4,12}$/.test(candidate)) {
    const [taken] = await tx`select 1 from app.members where invite_code = ${candidate}`;
    if (!taken) return candidate;
  }
  for (;;) {
    const code = Array.from(randomBytes(6), (b) => INVITE_CHARS[b % INVITE_CHARS.length]).join('');
    const [taken] = await tx`select 1 from app.members where invite_code = ${code}`;
    if (!taken) return code;
  }
}

const idsOf = async (tx: Sql, table: 'members' | 'places' | 'events', key: 'legacy_id' | 'slug', values: string[]) => {
  if (values.length === 0) return new Map<string, string>();
  const rows = await tx`select id, ${tx(key)} as key from ${tx(`app.${table}`)} where ${tx(key)} in ${tx(values)}`;
  return new Map(rows.map((r) => [r.key as string, r.id as string]));
};

async function insertRows(tx: Sql, table: string, rows: Row[]): Promise<void> {
  if (rows.length) await tx`insert into ${tx(`app.${table}`)} ${tx(rows as never)}`;
}

/** Which member tables a changed field lives in */
const GROUPS: Record<string, string> = {
  passwordHash: 'credentials',
  providers: 'providers',
  passwordReset: 'tokens',
  emailVerification: 'tokens',
  consentAt: 'consents',
  consent: 'consents',
  pledgeAcceptedAt: 'consents',
  pledgeVersion: 'consents',
  profile: 'profile',
  preferences: 'profile',
  riskFlags: 'riskFlags',
  hostApplication: 'hostApplication',
  followingIds: 'follows',
  blockedIds: 'blocks',
  savedSpotIds: 'saved',
  savedEventIds: 'saved',
  cancelledEvents: 'cancelled',
  reportsReceived: 'reports',
};

/** Writes the member tables in `groups` from the full member object */
async function writeParts(tx: Sql, member: Member, dbId: string, groups: Set<string>, isNew: boolean): Promise<void> {
  const [current] = isNew ? [] : await tx`select invite_code from app.members where id = ${dbId}`;
  const invitedBy = member.invitedBy ? (await idsOf(tx, 'members', 'legacy_id', [member.invitedBy])).get(member.invitedBy) : undefined;
  const [province] = member.preferences?.province ? await tx`select code from app.provinces where code = ${member.preferences.province}` : [];
  const parts = memberToRows(member, {
    id: dbId,
    inviteCode: current && (!member.inviteCode || member.inviteCode === current.invite_code) ? current.invite_code : await freeInviteCode(tx, member.inviteCode),
    invitedBy,
    provinceCode: province?.code ?? null,
  });

  if (isNew) {
    await insertRows(tx, 'members', [parts.member]);
  } else {
    const { id: _id, legacy_id: _legacy, created_at: _created, ...columns } = parts.member;
    void _id; void _legacy; void _created;
    await tx`update app.members set ${tx(columns as never)} where id = ${dbId}`;
  }
  const all = isNew || groups.has('*');
  const touches = (group: string) => all || groups.has(group);

  if (touches('credentials')) {
    if (parts.credentials.length) {
      await tx`insert into app.member_credentials ${tx(parts.credentials[0] as never)}
               on conflict (member_id) do update set password_hash = excluded.password_hash,
                 password_changed_at = case when app.member_credentials.password_hash = excluded.password_hash then app.member_credentials.password_changed_at else now() end`;
    } else if (!isNew) await tx`delete from app.member_credentials where member_id = ${dbId}`;
  }
  if (touches('providers')) {
    if (!isNew) await tx`delete from app.member_auth_providers where member_id = ${dbId}`;
    await insertRows(tx, 'member_auth_providers', parts.providers);
  }
  if (touches('tokens')) {
    // Only the live link of each kind is kept; a replaced link stops working
    if (!isNew) await tx`delete from app.member_tokens where member_id = ${dbId} and used_at is null`;
    await insertRows(tx, 'member_tokens', parts.tokens);
  }
  if (touches('consents')) {
    // History: add what is new, never rewrite what was accepted
    const known = isNew ? [] : await tx`select kind, version, accepted_at from app.member_consents where member_id = ${dbId}`;
    const seen = new Set(known.map((k) => `${k.kind}|${k.version}|${(k.accepted_at as Date).getTime()}`));
    await insertRows(tx, 'member_consents', parts.consents.filter((c: Row) => !seen.has(`${c.kind}|${c.version}|${(c.accepted_at as Date).getTime()}`)));
  }
  if (touches('profile')) {
    await tx`insert into app.member_profiles ${tx(parts.profile as never)} on conflict (member_id) do update set ${tx(
      Object.fromEntries(Object.entries(parts.profile).filter(([key]) => key !== 'member_id')) as never,
    )}`;
    if (!isNew) await tx`delete from app.member_interests where member_id = ${dbId}`;
    await insertRows(tx, 'member_interests', parts.interests);
  }
  if (touches('riskFlags')) {
    if (!isNew) await tx`delete from app.member_risk_flags where member_id = ${dbId}`;
    await insertRows(tx, 'member_risk_flags', parts.riskFlags);
  }
  if (touches('hostApplication')) {
    if (!isNew) await tx`delete from app.host_applications where member_id = ${dbId}`;
    await insertRows(tx, 'host_applications', parts.hostApplications);
  }
  if (touches('follows') || touches('blocks')) {
    const others = await idsOf(tx, 'members', 'legacy_id', [...parts.followingIds, ...parts.blockedIds]);
    if (touches('follows')) {
      if (!isNew) await tx`delete from app.follows where follower_id = ${dbId}`;
      await insertRows(tx, 'follows', parts.followingIds.filter((o: string) => others.has(o)).map((o: string, i: number) => ({ follower_id: dbId, followee_id: others.get(o), created_at: new Date(Date.now() + i) })));
    }
    if (touches('blocks')) {
      if (!isNew) await tx`delete from app.blocks where blocker_id = ${dbId}`;
      await insertRows(tx, 'blocks', parts.blockedIds.filter((o: string) => others.has(o)).map((o: string, i: number) => ({ blocker_id: dbId, blocked_id: others.get(o), created_at: new Date(Date.now() + i) })));
    }
  }
  if (touches('saved')) {
    const places = await idsOf(tx, 'places', 'slug', parts.savedSpotIds);
    const events = await idsOf(tx, 'events', 'slug', parts.savedEventIds);
    if (!isNew) await tx`delete from app.saved_items where member_id = ${dbId}`;
    // Newest first, as the arrays are kept
    await insertRows(tx, 'saved_items', [
      ...parts.savedSpotIds.filter((s: string) => places.has(s)).map((s: string, i: number) => ({ member_id: dbId, place_id: places.get(s), event_id: null, created_at: new Date(Date.now() - i) })),
      ...parts.savedEventIds.filter((e: string) => events.has(e)).map((e: string, i: number) => ({ member_id: dbId, place_id: null, event_id: events.get(e), created_at: new Date(Date.now() - i) })),
    ]);
  }
  if (touches('cancelled')) {
    // A cancelled ตี้ is the member's participant row with status "cancelled"; a joined row is never touched here
    const events = await idsOf(tx, 'events', 'slug', parts.cancelledEvents.map((c: { eventId: string }) => c.eventId));
    if (!isNew) await tx`delete from app.event_participants where member_id = ${dbId} and status = 'cancelled'`;
    for (const c of parts.cancelledEvents as { eventId: string; at: string }[]) {
      const eventId = events.get(c.eventId);
      if (!eventId) continue;
      const at = toDate(c.at) ?? new Date();
      await tx`
        insert into app.event_participants (event_id, member_id, status, ticket_code, joined_at, cancelled_at)
        values (${eventId}, ${dbId}, 'cancelled', ${'X' + randomBytes(5).toString('hex').toUpperCase()}, ${at}, ${at})
        on conflict (event_id, member_id) do nothing`;
    }
  }
  if (touches('reports')) {
    const reporters = await idsOf(tx, 'members', 'legacy_id', parts.reportsReceived.map((r: { byId: string }) => r.byId));
    if (!isNew) await tx`delete from app.content_reports where target_type = 'member' and target_id = ${member.id}`;
    await insertRows(tx, 'content_reports', (parts.reportsReceived as { byId: string; reason: string; at: string }[])
      .filter((r) => reporters.has(r.byId))
      .map((r) => ({ id: uuidV7(r.at), target_type: 'member', target_id: member.id, reporter_id: reporters.get(r.byId), reason: r.reason ?? '', created_at: toDate(r.at) ?? new Date() })));
  }
}

export const pgMemberRepository: MemberRepository = {
  async findById(id) {
    return findOne(sql(), sql()`m.legacy_id = ${id}`);
  },
  async findByEmail(email) {
    return findOne(sql(), sql()`m.email = ${email.trim().toLowerCase()}`);
  },
  async findByProvider(provider: OAuthProvider, subject: string) {
    return findOne(sql(), sql()`m.id = (select member_id from app.member_auth_providers where provider = ${provider} and subject = ${subject})`);
  },
  async create(member) {
    const created = await sql().begin(async (tx) => {
      if (member.email) {
        const [taken] = await tx`select 1 from app.members where email = ${member.email.trim().toLowerCase()}`;
        if (taken) throw new Error('อีเมลนี้มีบัญชีอยู่แล้ว');
      }
      const dbId = uuidV7(member.createdAt);
      await writeParts(tx, member, dbId, new Set(['*']), true);
      return findOne(tx, sql()`m.id = ${dbId}`);
    });
    return created!;
  },
  async update(id, changes) {
    const updated = await sql().begin(async (tx) => {
      const [row] = await tx`select id from app.members where legacy_id = ${id} for update`;
      if (!row) throw new Error('ไม่พบสมาชิก');
      const current = await findOne(tx, sql()`m.id = ${row.id}`);
      const merged: Member = { ...current!, ...changes, id };
      const groups = new Set(Object.keys(changes).map((key) => GROUPS[key]).filter(Boolean));
      await writeParts(tx, merged, row.id, groups, false);
      return findOne(tx, sql()`m.id = ${row.id}`);
    });
    return updated!;
  },
  async remove(id) {
    const removed = await sql().begin(async (tx) => {
      await tx`delete from app.content_reports where target_type = 'member' and target_id = ${id}`;
      return (await tx`delete from app.members where legacy_id = ${id}`).count > 0;
    });
    return removed;
  },
  async query({ q, status = 'all', page, limit }: MemberQuery) {
    const text = q?.trim().toLowerCase();
    const where = sql()`(${status === 'all'} or m.status = ${status})
      and (${!text} or m.display_name ilike ${'%' + (text ?? '') + '%'} or m.email::text ilike ${'%' + (text ?? '') + '%'} or m.legacy_id = ${text ?? ''})`;
    const [totals, [{ total }], page_] = await Promise.all([
      sql()`select status, count(*)::int as n from app.members group by status`,
      sql()`select count(*)::int as total from app.members m where ${where}`,
      sql()`select m.id from app.members m where ${where} order by m.created_at desc limit ${limit} offset ${(page - 1) * limit}`,
    ]);
    const counts = { all: 0, active: 0, suspended: 0, banned: 0 } as Record<MemberStatus | 'all', number>;
    for (const t of totals) {
      counts[t.status as MemberStatus] = t.n;
      counts.all += t.n;
    }
    const ids = page_.map((r) => r.id as string);
    const rows = ids.length ? await hydrate(sql(), sql()`m.id in ${sql()(ids)}`) : [];
    const byId = new Map(rows.map((r) => [r.id as string, rowToMember(r) as Member]));
    return { items: ids.map((i) => byId.get(i)!).filter(Boolean), totalCount: total, counts };
  },
};

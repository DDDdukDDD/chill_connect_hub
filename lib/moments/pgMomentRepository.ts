import type { PendingQuery, Row as PgRow } from 'postgres';
import { sql, type Sql } from '../db/postgres/client';
import { iso, toDate, uuidV7 } from '../db/postgres/rows.mjs';
import type { Moment, MomentComment, MomentQuery, MomentReport, MomentRepository, MomentStatus } from './types';

/**
 * Moments in Postgres (docs/DATABASE_DESIGN.md §4.6). The app keeps its own ids: moments.slug is Moment.id,
 * moment_comments.slug is MomentComment.id, members are their legacy_id. One Moment is spread over the moment
 * tables; reads gather it in one query, writes only rewrite what changed.
 */

type Row = Record<string, unknown>;
type Fragment = PendingQuery<PgRow[]>;

const hydrate = (tx: Sql, where: Fragment) => tx`
  select m.*, a.legacy_id as author_legacy, a.display_name as author_display_name, a.avatar_url as author_avatar_url,
    array(select i.url from app.moment_images i where i.moment_id = m.id order by i.position) as images,
    array(select x.legacy_id from app.moment_likes l join app.members x on x.id = l.member_id where l.moment_id = m.id order by l.created_at) as liked_by,
    array(select x.legacy_id from app.moment_saves s join app.members x on x.id = s.member_id where s.moment_id = m.id order by s.created_at) as saved_by,
    (select coalesce(json_agg(json_build_object('id', coalesce(c.slug, c.id::text), 'author_id', x.legacy_id, 'author_name', coalesce(x.display_name, c.author_name),
        'author_avatar', coalesce(x.avatar_url, c.author_avatar), 'body', c.body, 'hidden', c.hidden, 'created_at', c.created_at) order by c.created_at, c.id), '[]')
       from app.moment_comments c left join app.members x on x.id = c.author_id where c.moment_id = m.id) as comments,
    (select coalesce(json_agg(json_build_object('member_id', x.legacy_id, 'reason', r.reason, 'created_at', r.created_at) order by r.created_at), '[]')
       from app.moment_reports r join app.members x on x.id = r.member_id where r.moment_id = m.id) as reports
  from app.moments m
  left join app.members a on a.id = m.author_id
  where ${where}`;

const orUndefined = <T>(value: T | null | undefined): T | undefined => value ?? undefined;

function rowToMoment(r: PgRow): Moment {
  return {
    id: r.slug,
    authorId: r.author_legacy ?? null,
    authorName: r.author_display_name ?? r.author_name ?? '',
    authorAvatar: orUndefined(r.author_avatar_url ?? r.author_avatar),
    authorBadge: orUndefined(r.author_badge),
    caption: r.caption,
    images: r.images,
    imageRatio: orUndefined(r.image_ratio),
    video: r.video_url ? { url: r.video_url, durationS: r.video_duration_s } : undefined,
    location: r.location_text,
    category: orUndefined(r.category),
    targetType: r.target_type,
    targetId: orUndefined(r.target_ref),
    targetTitle: orUndefined(r.target_title),
    likedBy: r.liked_by,
    savedBy: r.saved_by,
    sampleLikes: r.sample_likes,
    comments: (r.comments as Row[]).map((c) => ({
      id: c.id as string,
      authorId: (c.author_id as string | null) ?? null,
      authorName: (c.author_name as string | null) ?? '',
      authorAvatar: orUndefined(c.author_avatar as string | null),
      text: c.body as string,
      createdAt: iso(c.created_at) as string,
      ...(c.hidden ? { hidden: true } : {}),
    })),
    reports: (r.reports as Row[]).map((x) => ({ memberId: x.member_id as string, reason: x.reason as string, createdAt: iso(x.created_at) as string })),
    status: r.status,
    hiddenBy: orUndefined(r.hidden_by),
    moderationNote: orUndefined(r.moderation_note),
    evidenceRejected: r.evidence_rejected_at ? { at: iso(r.evidence_rejected_at) as string, note: r.evidence_note ?? '' } : undefined,
    evidence: r.evidence_status
      ? { status: r.evidence_status, at: iso(r.evidence_at) as string, distanceM: orUndefined(r.evidence_distance_m), reason: orUndefined(r.evidence_reason) }
      : undefined,
    isSample: r.is_sample,
    createdAt: iso(r.created_at) as string,
    updatedAt: iso(r.edited_at),
  };
}

const memberIdsOf = async (tx: Sql, legacyIds: string[]) => {
  if (legacyIds.length === 0) return new Map<string, string>();
  const rows = await tx`select id, legacy_id from app.members where legacy_id in ${tx(legacyIds)}`;
  return new Map(rows.map((r) => [r.legacy_id as string, r.id as string]));
};

/** The foreign key of the moment's target; a target that does not resolve stays only as target_type + target_ref */
async function targetColumns(tx: Sql, moment: Moment) {
  const columns = { place_id: null as string | null, event_id: null as string | null, quest_id: null as string | null };
  if (!moment.targetId) return columns;
  if (moment.targetType === 'spot') columns.place_id = (await tx`select id from app.places where slug = ${moment.targetId}`)[0]?.id ?? null;
  else if (moment.targetType === 'community' || moment.targetType === 'fair') columns.event_id = (await tx`select id from app.events where slug = ${moment.targetId}`)[0]?.id ?? null;
  else if (moment.targetType === 'challenge') columns.quest_id = (await tx`select id from app.quests where slug = ${moment.targetId}`)[0]?.id ?? null;
  return columns;
}

/** The columns of app.moments that come straight from the Moment */
const momentColumns = (m: Moment) => ({
  author_badge: m.authorBadge ?? null,
  caption: m.caption,
  location_text: m.location,
  category: m.category ?? null,
  target_type: m.targetType,
  target_ref: m.targetId ?? null,
  target_title: m.targetTitle ?? null,
  status: m.status,
  hidden_by: m.hiddenBy ?? null,
  moderation_note: m.moderationNote ?? null,
  evidence_status: m.evidence?.status ?? null,
  evidence_at: toDate(m.evidence?.at),
  evidence_distance_m: m.evidence?.distanceM === undefined ? null : Math.round(m.evidence.distanceM),
  evidence_reason: m.evidence?.reason ?? null,
  evidence_rejected_at: toDate(m.evidenceRejected?.at),
  evidence_note: m.evidenceRejected?.note ?? null,
  image_ratio: m.imageRatio ?? null,
  video_url: m.video?.url ?? null,
  video_duration_s: m.video?.durationS ?? null,
  like_count: m.likedBy.length,
  comment_count: m.comments.length,
  save_count: m.savedBy.length,
  sample_likes: m.sampleLikes,
  edited_at: toDate(m.updatedAt),
});

async function insertImages(tx: Sql, momentId: string, images: string[]) {
  if (images.length) await tx`insert into app.moment_images ${tx(images.map((url, position) => ({ moment_id: momentId, position, url })))}`;
}

async function insertComments(tx: Sql, momentId: string, comments: MomentComment[]) {
  if (comments.length === 0) return;
  const members = await memberIdsOf(tx, comments.flatMap((c) => (c.authorId ? [c.authorId] : [])));
  const rows = comments.map((c) => {
    const authorId = c.authorId ? members.get(c.authorId) ?? null : null;
    return {
      id: uuidV7(c.createdAt), slug: c.id, moment_id: momentId, author_id: authorId, author_name: authorId ? null : c.authorName, author_avatar: authorId ? null : c.authorAvatar ?? null,
      body: c.text, hidden: Boolean(c.hidden), created_at: toDate(c.createdAt) as Date,
    };
  });
  await tx`insert into app.moment_comments ${tx(rows)}`;
}

/** Brings a likes or saves table in line with the moment's list */
async function syncPeople(tx: Sql, table: 'moment_likes' | 'moment_saves', momentId: string, before: string[], after: string[]) {
  const added = after.filter((id) => !before.includes(id));
  const removed = before.filter((id) => !after.includes(id));
  const members = await memberIdsOf(tx, [...added, ...removed]);
  const addedRows = added.flatMap((id) => (members.has(id) ? [{ moment_id: momentId, member_id: members.get(id) as string }] : []));
  const removedIds = removed.flatMap((id) => (members.has(id) ? [members.get(id) as string] : []));
  if (addedRows.length) await tx`insert into ${tx(`app.${table}`)} ${tx(addedRows)} on conflict do nothing`;
  if (removedIds.length) await tx`delete from ${tx(`app.${table}`)} where moment_id = ${momentId} and member_id in ${tx(removedIds)}`;
}

async function syncComments(tx: Sql, momentId: string, before: MomentComment[], after: MomentComment[]) {
  const afterIds = new Set(after.map((c) => c.id));
  const beforeById = new Map(before.map((c) => [c.id, c]));
  const removed = before.filter((c) => !afterIds.has(c.id)).map((c) => c.id);
  if (removed.length) await tx`delete from app.moment_comments where moment_id = ${momentId} and coalesce(slug, id::text) in ${tx(removed)}`;
  for (const comment of after) {
    const old = beforeById.get(comment.id);
    if (old && (old.text !== comment.text || Boolean(old.hidden) !== Boolean(comment.hidden))) {
      await tx`update app.moment_comments set body = ${comment.text}, hidden = ${Boolean(comment.hidden)} where moment_id = ${momentId} and coalesce(slug, id::text) = ${comment.id}`;
    }
  }
  await insertComments(tx, momentId, after.filter((c) => !beforeById.has(c.id)));
}

async function syncReports(tx: Sql, momentId: string, before: MomentReport[], after: MomentReport[]) {
  const afterIds = new Set(after.map((r) => r.memberId));
  const beforeIds = new Set(before.map((r) => r.memberId));
  const added = after.filter((r) => !beforeIds.has(r.memberId));
  const removed = before.filter((r) => !afterIds.has(r.memberId)).map((r) => r.memberId);
  const members = await memberIdsOf(tx, [...added.map((r) => r.memberId), ...removed]);
  const rows = added.flatMap((r) => (members.has(r.memberId) ? [{ moment_id: momentId, member_id: members.get(r.memberId) as string, reason: r.reason, created_at: toDate(r.createdAt) as Date }] : []));
  const removedIds = removed.flatMap((id) => (members.has(id) ? [members.get(id) as string] : []));
  if (rows.length) await tx`insert into app.moment_reports ${tx(rows)} on conflict do nothing`;
  if (removedIds.length) await tx`delete from app.moment_reports where moment_id = ${momentId} and member_id in ${tx(removedIds)}`;
}

/** Counters follow the likes, saves and comments after rows were removed across many moments */
async function recountMoments(tx: Sql, ids: string[]) {
  if (ids.length === 0) return;
  await tx`update app.moments m set
      like_count = (select count(*) from app.moment_likes l where l.moment_id = m.id),
      save_count = (select count(*) from app.moment_saves s where s.moment_id = m.id),
      comment_count = (select count(*) from app.moment_comments c where c.moment_id = m.id)
    where m.id in ${tx(ids)}`;
}

const contains = (value: string) => `%${value.replace(/[\\%_]/g, '\\$&')}%`;

function filters(tx: Sql, query: MomentQuery): Fragment {
  const q = query.q?.trim();
  const location = query.location?.trim();
  return tx`m.status in ${tx(query.statuses)}
    ${query.authorId ? tx`and a.legacy_id = ${query.authorId}` : tx``}
    ${query.savedBy ? tx`and exists (select 1 from app.moment_saves s join app.members x on x.id = s.member_id where s.moment_id = m.id and x.legacy_id = ${query.savedBy})` : tx``}
    ${query.targetType ? tx`and m.target_type = ${query.targetType}` : tx``}
    ${query.targetId ? tx`and m.target_ref = ${query.targetId}` : tx``}
    ${location ? tx`and (m.location_text ilike ${contains(location)} or m.target_title ilike ${contains(location)})` : tx``}
    ${query.reportedOnly ? tx`and exists (select 1 from app.moment_reports r where r.moment_id = m.id)` : tx``}
    ${q ? tx`and (m.caption ilike ${contains(q)} or coalesce(a.display_name, m.author_name) ilike ${contains(q)} or m.location_text ilike ${contains(q)})` : tx``}` as unknown as Fragment;
}

export const pgMomentRepository: MomentRepository = {
  async findById(id) {
    const db = sql();
    const [row] = await hydrate(db, db`m.slug = ${id}` as unknown as Fragment);
    return row ? rowToMoment(row) : null;
  },
  async create(moment) {
    await sql().begin(async (tx) => {
      const id = uuidV7(moment.createdAt);
      const authorId = moment.authorId ? (await memberIdsOf(tx, [moment.authorId])).get(moment.authorId) ?? null : null;
      const row = {
        id, slug: moment.id, author_id: authorId, author_name: authorId ? null : moment.authorName, author_avatar: authorId ? null : moment.authorAvatar ?? null,
        is_sample: moment.isSample, created_at: toDate(moment.createdAt) as Date, ...momentColumns(moment), ...(await targetColumns(tx, moment)),
      };
      await tx`insert into app.moments ${tx(row)}`;
      await insertImages(tx, id, moment.images);
      await syncPeople(tx, 'moment_likes', id, [], moment.likedBy);
      await syncPeople(tx, 'moment_saves', id, [], moment.savedBy);
      await insertComments(tx, id, moment.comments);
      await syncReports(tx, id, [], moment.reports);
    });
    return moment;
  },
  async mutate(id, change) {
    return sql().begin(async (tx) => {
      // The row lock is what makes the change atomic across servers
      const [locked] = await tx`select id from app.moments where slug = ${id} for update`;
      if (!locked) throw new Error('ไม่พบโมเมนต์');
      const [row] = await hydrate(tx, tx`m.id = ${locked.id}` as unknown as Fragment);
      const before = rowToMoment(row);
      const after = change(structuredClone(before));
      await tx`update app.moments set ${tx({ ...momentColumns(after), ...(await targetColumns(tx, after)) })} where id = ${locked.id}`;
      if (before.images.join('\n') !== after.images.join('\n')) {
        await tx`delete from app.moment_images where moment_id = ${locked.id}`;
        await insertImages(tx, locked.id, after.images);
      }
      await syncPeople(tx, 'moment_likes', locked.id, before.likedBy, after.likedBy);
      await syncPeople(tx, 'moment_saves', locked.id, before.savedBy, after.savedBy);
      await syncComments(tx, locked.id, before.comments, after.comments);
      await syncReports(tx, locked.id, before.reports, after.reports);
      return after;
    }) as Promise<Moment>;
  },
  async remove(id) {
    const result = await sql()`delete from app.moments where slug = ${id}`;
    return result.count > 0;
  },
  async removeByAuthor(authorId) {
    const result = await sql()`delete from app.moments m using app.members a where a.id = m.author_id and a.legacy_id = ${authorId}`;
    return result.count;
  },
  async removeCommentsByAuthor(authorId) {
    return sql().begin(async (tx) => {
      const member = (await memberIdsOf(tx, [authorId])).get(authorId);
      if (!member) return 0;
      const comments = await tx`delete from app.moment_comments where author_id = ${member} returning moment_id`;
      // Their likes, saves and reports go too
      const likes = await tx`delete from app.moment_likes where member_id = ${member} returning moment_id`;
      const saves = await tx`delete from app.moment_saves where member_id = ${member} returning moment_id`;
      await tx`delete from app.moment_reports where member_id = ${member}`;
      await recountMoments(tx, [...new Set([...comments, ...likes, ...saves].map((r) => r.moment_id as string))]);
      return comments.length;
    }) as Promise<number>;
  },
  async query(query) {
    const db = sql();
    const order = query.sort === 'popular' ? db`m.like_count + m.sample_likes + m.comment_count desc, m.created_at desc` : db`m.created_at desc`;
    const page = await db`
      select m.id, count(*) over () as total from app.moments m left join app.members a on a.id = m.author_id
      where ${filters(db, query)} order by ${order} limit ${query.limit} offset ${(query.page - 1) * query.limit}`;
    if (page.length === 0) {
      if (query.page <= 1) return { items: [], totalCount: 0 };
      const [{ total }] = await db`select count(*) as total from app.moments m left join app.members a on a.id = m.author_id where ${filters(db, query)}`;
      return { items: [], totalCount: Number(total) };
    }
    const rows = await hydrate(db, db`m.id in ${db(page.map((r) => r.id as string))}` as unknown as Fragment);
    const byId = new Map(rows.map((r) => [r.id as string, r]));
    return { items: page.flatMap((r) => (byId.has(r.id) ? [rowToMoment(byId.get(r.id) as PgRow)] : [])), totalCount: Number(page[0].total) };
  },
  async counts() {
    const [row] = await sql()`
      select count(*) filter (where status = 'published') as published, count(*) filter (where status = 'hidden') as hidden, count(*) filter (where status = 'removed') as removed,
        count(*) filter (where is_sample) as samples,
        count(*) filter (where status <> 'removed' and exists (select 1 from app.moment_reports r where r.moment_id = m.id)) as reported
      from app.moments m`;
    return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)])) as Record<MomentStatus | 'reported' | 'samples', number>;
  },
};

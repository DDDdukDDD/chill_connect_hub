import { randomUUID } from 'node:crypto';
import type { PendingQuery, Row } from 'postgres';
import { momentRepository } from '../moments';
import { USE_POSTGRES, sql, type Sql } from '../db/postgres/client';
import { createJsonStore } from './jsonStore';

export type NotificationType = 'follow' | 'like' | 'comment' | 'reply' | 'comment_like' | 'tagged' | 'challenge' | 'evidence' | 'match' | 'seat' | 'question' | 'answer' | 'approved' | 'rejected' | 'joined' | 'draw_won' | 'draw_result' | 'tee_changed' | 'trip_cancelled' | 'invite' | 'invite_yes' | 'friend_going' | 'plan_soon' | 'plan_after' | 'plan_together';

export interface StoredNotification {
  id: string;
  /** Who receives it */
  memberId: string;
  type: NotificationType;
  actorId: string;
  momentId?: string;
  /** Which comment, for 'comment': deleting the comment removes the notice */
  commentId?: string;
  /** Start of the comment, for 'comment' */
  preview?: string;
  /** For 'challenge': the challenge the member finished (actorId is the member themselves) */
  questId?: string;
  /** For 'match': the ตี้ where the two met */
  eventId?: string;
  /** For 'approved': the published page (/community/… or /events/…) */
  path?: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
}

/** A stored notice with the first picture of its moment, for the list */
export type NotificationView = StoredNotification & { momentImage?: string };

/** Which notices a removal covers; every field given must match */
export interface NotificationMatch {
  memberId?: string;
  actorId?: string;
  types?: NotificationType[];
  momentId?: string;
  commentId?: string;
  eventId?: string;
  questId?: string;
}

// How long notices stay (owner 2026-11-02). A notice past these is no longer listed, and goes at the member's next new notice
export const READ_KEEP_DAYS = 30;
export const UNREAD_KEEP_DAYS = 90;
export const KEEP_PER_MEMBER = 100;

interface NotificationStore {
  /** Saves a notice, first removing what `replace` covers, and clears out the member's old ones */
  add(notice: Omit<StoredNotification, 'read' | 'readAt'>, replace?: NotificationMatch): Promise<void>;
  /** The same notice from the site to many members in one write (their old ones go at their next new notice) */
  addToMany(memberIds: string[], notice: Pick<StoredNotification, 'type' | 'preview' | 'path'>): Promise<void>;
  exists(match: NotificationMatch): Promise<boolean>;
  /** The member's current notices, newest first */
  list(memberId: string): Promise<NotificationView[]>;
  markRead(memberId: string): Promise<void>;
  remove(match: NotificationMatch): Promise<void>;
  /** Everything addressed to, or caused by, this member */
  removeInvolving(memberId: string): Promise<void>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const matches = (n: StoredNotification, m: NotificationMatch) =>
  (!m.memberId || n.memberId === m.memberId) &&
  (!m.actorId || n.actorId === m.actorId) &&
  (!m.types || m.types.includes(n.type)) &&
  (!m.momentId || n.momentId === m.momentId) &&
  (!m.commentId || n.commentId === m.commentId) &&
  (!m.eventId || n.eventId === m.eventId) &&
  (!m.questId || n.questId === m.questId);

const isCurrent = (n: StoredNotification, now: number) =>
  n.read ? now - new Date(n.readAt ?? n.createdAt).getTime() < READ_KEEP_DAYS * DAY_MS : now - new Date(n.createdAt).getTime() < UNREAD_KEEP_DAYS * DAY_MS;

function jsonStore(): NotificationStore {
  const store = createJsonStore<StoredNotification>('notifications');
  return {
    async add(notice, replace) {
      await store.update((items) => {
        const now = Date.now();
        const rest = replace ? items.filter((n) => !matches(n, replace)) : items;
        let kept = 0;
        return [{ ...notice, read: false }, ...rest].filter((n) => n.memberId !== notice.memberId || (isCurrent(n, now) && ++kept <= KEEP_PER_MEMBER));
      });
    },
    async addToMany(memberIds, notice) {
      const createdAt = new Date().toISOString();
      await store.update((items) => [...memberIds.map((memberId) => ({ ...notice, id: `ntf_${randomUUID()}`, memberId, actorId: memberId, createdAt, read: false })), ...items]);
    },
    async exists(match) {
      return store.read().some((n) => matches(n, match));
    },
    async list(memberId) {
      const now = Date.now();
      const mine = store.read().filter((n) => n.memberId === memberId && isCurrent(n, now)).slice(0, KEEP_PER_MEMBER);
      return Promise.all(mine.map(async (n) => (n.momentId ? { ...n, momentImage: (await momentRepository.findById(n.momentId))?.images[0] } : n)));
    },
    async markRead(memberId) {
      if (!store.read().some((n) => n.memberId === memberId && !n.read)) return;
      const readAt = new Date().toISOString();
      await store.update((items) => items.map((n) => (n.memberId === memberId && !n.read ? { ...n, read: true, readAt } : n)));
    },
    async remove(match) {
      await store.update((items) => items.filter((n) => !matches(n, match)));
    },
    async removeInvolving(memberId) {
      await store.update((items) => items.filter((n) => n.memberId !== memberId && n.actorId !== memberId));
    },
  };
}

type Fragment = PendingQuery<Row[]>;

/** The app's own ids are looked up where the database keeps its own: members by legacy_id, the rest by slug */
const memberRow = (tx: Sql, id: string) => tx`(select id from app.members where legacy_id = ${id})`;

function matchSql(tx: Sql, m: NotificationMatch): Fragment {
  const parts: Fragment[] = [];
  if (m.memberId) parts.push(tx`n.recipient_id = ${memberRow(tx, m.memberId)}` as unknown as Fragment);
  if (m.actorId) parts.push(tx`n.actor_id = ${memberRow(tx, m.actorId)}` as unknown as Fragment);
  if (m.types) parts.push(tx`n.type in ${tx(m.types)}` as unknown as Fragment);
  if (m.momentId) parts.push(tx`n.moment_id = (select id from app.moments where slug = ${m.momentId})` as unknown as Fragment);
  if (m.commentId) parts.push(tx`n.comment_ref = ${m.commentId}` as unknown as Fragment);
  if (m.eventId) parts.push(tx`n.event_id = (select id from app.events where slug = ${m.eventId})` as unknown as Fragment);
  if (m.questId) parts.push(tx`n.quest_id = (select id from app.quests where slug = ${m.questId})` as unknown as Fragment);
  return parts.reduce((all, part) => tx`${all} and ${part}` as unknown as Fragment, tx`true` as unknown as Fragment);
}

const isCurrentSql = (tx: Sql) => tx`(
  (n.read_at is null and n.created_at > now() - ${UNREAD_KEEP_DAYS} * interval '1 day')
  or (n.read_at is not null and n.read_at > now() - ${READ_KEEP_DAYS} * interval '1 day')
)`;

function postgresStore(): NotificationStore {
  return {
    async add(notice, replace) {
      await sql().begin(async (tx) => {
        if (replace) await tx`delete from app.notifications n where ${matchSql(tx, replace)}`;
        await tx`
          insert into app.notifications (recipient_id, type, actor_id, moment_id, event_id, quest_id, preview, comment_ref, path)
          select r.id, ${notice.type}::text, ${memberRow(tx, notice.actorId)},
            (select id from app.moments where slug = ${notice.momentId ?? null}),
            (select id from app.events where slug = ${notice.eventId ?? null}),
            (select id from app.quests where slug = ${notice.questId ?? null}),
            ${notice.preview ?? null}::text, ${notice.commentId ?? null}::text, ${notice.path ?? null}::text
          from app.members r where r.legacy_id = ${notice.memberId}`;
        // Past their time, or past the most one member keeps
        await tx`
          delete from app.notifications n
          where n.recipient_id = ${memberRow(tx, notice.memberId)}
            and (not ${isCurrentSql(tx)} or n.id not in (
              select x.id from app.notifications x where x.recipient_id = n.recipient_id order by x.created_at desc limit ${KEEP_PER_MEMBER}
            ))`;
      });
    },
    async addToMany(memberIds, notice) {
      if (memberIds.length === 0) return;
      const db = sql();
      await db`
        insert into app.notifications (recipient_id, type, actor_id, preview, path)
        select r.id, ${notice.type}::text, r.id, ${notice.preview ?? null}::text, ${notice.path ?? null}::text
        from app.members r where r.legacy_id in ${db(memberIds)}`;
    },
    async exists(match) {
      const db = sql();
      const rows = await db`select 1 from app.notifications n where ${matchSql(db, match)} limit 1`;
      return rows.length > 0;
    },
    async list(memberId) {
      const db = sql();
      const rows = await db`
        select n.id::text, n.type, a.legacy_id as actor, m.slug as moment, e.slug as event, q.slug as quest, n.preview, n.path, n.comment_ref, n.created_at, n.read_at,
          (select i.url from app.moment_images i where i.moment_id = n.moment_id order by i.position limit 1) as moment_image
        from app.notifications n
        left join app.members a on a.id = n.actor_id
        left join app.moments m on m.id = n.moment_id
        left join app.events e on e.id = n.event_id
        left join app.quests q on q.id = n.quest_id
        where n.recipient_id = ${memberRow(db, memberId)} and ${isCurrentSql(db)} and (n.moment_id is null or m.status <> 'removed')
        order by n.created_at desc
        limit ${KEEP_PER_MEMBER}`;
      return rows.map((r) => ({
        id: r.id,
        memberId,
        type: r.type,
        actorId: r.actor ?? memberId,
        momentId: r.moment ?? undefined,
        commentId: r.comment_ref ?? undefined,
        preview: r.preview ?? undefined,
        questId: r.quest ?? undefined,
        eventId: r.event ?? undefined,
        path: r.path ?? undefined,
        createdAt: new Date(r.created_at).toISOString(),
        read: Boolean(r.read_at),
        readAt: r.read_at ? new Date(r.read_at).toISOString() : undefined,
        momentImage: r.moment_image ?? undefined,
      }));
    },
    async markRead(memberId) {
      const db = sql();
      await db`update app.notifications set read_at = now() where recipient_id = ${memberRow(db, memberId)} and read_at is null`;
    },
    async remove(match) {
      const db = sql();
      await db`delete from app.notifications n where ${matchSql(db, match)}`;
    },
    async removeInvolving(memberId) {
      const db = sql();
      await db`delete from app.notifications where recipient_id = ${memberRow(db, memberId)} or actor_id = ${memberRow(db, memberId)}`;
    },
  };
}

export const notificationStore: NotificationStore = USE_POSTGRES ? postgresStore() : jsonStore();

import { uuidV7 } from '../db/postgres/rows.mjs';
import { sql, type Sql } from '../db/postgres/client';
import { memberRepository } from '../members';
import type { Member } from '../members/types';
import { thaiTimeAgo } from '../moments/service';
import { notifyTrip, removeNotifications } from '../social/notifications';
import { publishedTripFor, TripError } from './service';
import { MAX_TRIP_COMMENT } from './story';

/**
 * Readers answer a trip (owner 2026-11-27): a heart and comments, on the trip as a whole (photos picked for a trip are
 * not posts of their own). Only on published trips the reader may see; the author hears about each.
 */

export interface TripCommentView {
  id: string;
  author: { id: string; name: string; avatar?: string };
  text: string;
  timeAgo: string;
  createdAt: string;
  /** The reader wrote it, or owns the trip: they may delete it */
  canDelete: boolean;
}

const memberRow = (db: Sql, id: string) => db`(select id from app.members where legacy_id = ${id})`;

async function readable(id: string, viewer: Member | null) {
  const trip = await publishedTripFor(id, viewer);
  if (!trip) throw new TripError('ไม่พบทริปนี้', 404);
  return trip;
}

/** Gives or takes back the reader's heart; the count after */
export async function setTripLike(member: Member, id: string, liked: boolean): Promise<{ liked: boolean; likeCount: number }> {
  const trip = await readable(id, member);
  const db = sql();
  if (liked) {
    const added = await db`insert into app.trip_likes (trip_id, member_id) values (${id}, ${memberRow(db, member.id)}) on conflict do nothing returning 1`;
    if (added.length) await notifyTrip('trip_like', trip.authorId, member, trip);
  } else {
    await db`delete from app.trip_likes where trip_id = ${id} and member_id = ${memberRow(db, member.id)}`;
    await removeNotifications({ memberId: trip.authorId, actorId: member.id, types: ['trip_like'], path: `/trips/${encodeURIComponent(id)}` });
  }
  const [{ count }] = await db<{ count: number }[]>`select count(*)::int as count from app.trip_likes where trip_id = ${id}`;
  return { liked, likeCount: count };
}

/** The trip's comments, oldest first, without people the reader or the author blocked or banned accounts */
export async function tripComments(id: string, viewer: Member | null): Promise<TripCommentView[]> {
  const trip = await readable(id, viewer);
  const rows = await sql()`
    select c.id, c.body, c.created_at, m.legacy_id as author
    from app.trip_comments c join app.members m on m.id = c.member_id
    where c.trip_id = ${id} order by c.created_at limit 300`;
  const people = await memberRepository.findByIds(rows.map((r) => r.author as string));
  const blocked = new Set(viewer?.blockedIds ?? []);
  return rows
    .filter((r) => {
      const who = people.get(r.author as string);
      return who && who.status !== 'banned' && !blocked.has(who.id) && !trip.authorBlocked.has(who.id);
    })
    .map((r) => {
      const who = people.get(r.author as string)!;
      const createdAt = new Date(r.created_at as string).toISOString();
      return {
        id: r.id as string,
        author: { id: who.id, name: who.displayName, ...(who.avatarUrl ? { avatar: who.avatarUrl } : {}) },
        text: r.body as string,
        timeAgo: thaiTimeAgo(createdAt),
        createdAt,
        canDelete: Boolean(viewer && (viewer.id === who.id || viewer.id === trip.authorId)),
      };
    });
}

/** Adds a comment (the route checks it like a moment comment first) */
export async function addTripComment(member: Member, id: string, input: unknown): Promise<TripCommentView> {
  const trip = await readable(id, member);
  const text = typeof input === 'string' ? input.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_TRIP_COMMENT) : '';
  if (!text) throw new TripError('พิมพ์ความคิดเห็นก่อนนะ');
  const commentId = uuidV7();
  const db = sql();
  const [row] = await db`
    insert into app.trip_comments (id, trip_id, member_id, body) values (${commentId}, ${id}, ${memberRow(db, member.id)}, ${text})
    returning created_at`;
  await notifyTrip('trip_comment', trip.authorId, member, trip, { id: commentId, text });
  const createdAt = new Date(row.created_at as string).toISOString();
  return { id: commentId, author: { id: member.id, name: member.displayName, ...(member.avatarUrl ? { avatar: member.avatarUrl } : {}) }, text, timeAgo: thaiTimeAgo(createdAt), createdAt, canDelete: true };
}

/** The writer, or the trip's author, deletes a comment */
export async function deleteTripComment(member: Member, id: string, commentId: string): Promise<void> {
  const trip = await readable(id, member);
  if (!/^[0-9a-f-]{36}$/i.test(commentId)) throw new TripError('ไม่พบความคิดเห็นนี้', 404);
  const db = sql();
  const deleted = await db`
    delete from app.trip_comments c where c.id = ${commentId} and c.trip_id = ${id}
      ${member.id === trip.authorId ? db`` : db`and c.member_id = ${memberRow(db, member.id)}`}
    returning 1`;
  if (!deleted.length) throw new TripError('ไม่พบความคิดเห็นนี้', 404);
  await removeNotifications({ commentId, types: ['trip_comment'] });
}

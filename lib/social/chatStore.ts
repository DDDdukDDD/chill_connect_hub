import { USE_POSTGRES, sql } from '../db/postgres/client';
import { toDate } from '../db/postgres/rows.mjs';
import { createJsonStore } from './jsonStore';

export interface ChatMessage {
  id: string;
  roomId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

interface RoomQuery {
  /** Only messages newer than this time */
  after?: string;
  /** Leaves out these authors (people the reader blocked) */
  withoutAuthors?: string[];
  /** The newest this many, oldest first */
  limit: number;
}

interface ChatStore {
  listRoom(roomId: string, query: RoomQuery): Promise<ChatMessage[]>;
  /** Adds the message and keeps only the newest `keep` in its room */
  append(message: ChatMessage, keep: number): Promise<void>;
  find(messageId: string): Promise<ChatMessage | null>;
  remove(messageId: string): Promise<boolean>;
  removeByAuthor(authorId: string): Promise<void>;
  /** The member has read the room up to this time (never moves back) */
  markRead(roomId: string, memberId: string, at: string): Promise<void>;
  /** How far the others have read: one time per member */
  readTimes(roomId: string, exceptMemberId: string): Promise<{ memberId: string; at: string }[]>;
}

const jsonStore = createJsonStore<ChatMessage>('chat_messages');
const jsonReads = createJsonStore<{ roomId: string; memberId: string; at: string }>('chat_reads');

const jsonChatStore: ChatStore = {
  async listRoom(roomId, { after, withoutAuthors = [], limit }) {
    return jsonStore.read().filter((m) => m.roomId === roomId && !withoutAuthors.includes(m.authorId) && (!after || m.createdAt > after)).slice(-limit);
  },
  async append(message, keep) {
    await jsonStore.update((items) => {
      const next = [...items, message];
      const inRoom = next.filter((m) => m.roomId === message.roomId);
      if (inRoom.length <= keep) return next;
      const drop = new Set(inRoom.slice(0, inRoom.length - keep).map((m) => m.id));
      return next.filter((m) => !drop.has(m.id));
    });
  },
  async find(messageId) {
    return jsonStore.read().find((m) => m.id === messageId) ?? null;
  },
  async remove(messageId) {
    if (!jsonStore.read().some((m) => m.id === messageId)) return false;
    await jsonStore.update((items) => items.filter((m) => m.id !== messageId));
    return true;
  },
  async removeByAuthor(authorId) {
    await jsonStore.update((items) => items.filter((m) => m.authorId !== authorId));
  },
  async markRead(roomId, memberId, at) {
    const had = jsonReads.read().find((r) => r.roomId === roomId && r.memberId === memberId);
    if (had && had.at >= at) return;
    await jsonReads.update((items) => [...items.filter((r) => !(r.roomId === roomId && r.memberId === memberId)), { roomId, memberId, at }]);
  },
  async readTimes(roomId, exceptMemberId) {
    return jsonReads.read().filter((r) => r.roomId === roomId && r.memberId !== exceptMemberId).map(({ memberId, at }) => ({ memberId, at }));
  },
};

// Older links can carry the JSON store's msg_… ids, which are not valid here
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const rowToMessage = (r: Record<string, unknown>): ChatMessage => ({
  id: r.id as string,
  roomId: r.room_legacy as string,
  authorId: (r.author_legacy as string | null) ?? '',
  text: r.body as string,
  createdAt: (r.created_at as Date).toISOString(),
});

/** Rooms and messages in Postgres (docs/DATABASE_DESIGN.md §4.9). Rooms are found by today's room id (legacy_id) and made on the first message. */
const pgChatStore: ChatStore = {
  async listRoom(roomId, { after, withoutAuthors = [], limit }) {
    const db = sql();
    const since = toDate(after);
    const rows = await db`
      select m.id, m.body, m.created_at, r.legacy_id as room_legacy, a.legacy_id as author_legacy
      from app.chat_messages m
      join app.chat_rooms r on r.id = m.room_id
      left join app.members a on a.id = m.author_id
      where r.legacy_id = ${roomId}
        ${since ? db`and m.created_at > ${since}` : db``}
        ${withoutAuthors.length ? db`and (a.legacy_id is null or a.legacy_id not in ${db(withoutAuthors)})` : db``}
      order by m.id desc limit ${limit}`;
    return rows.map(rowToMessage).reverse();
  },
  async append(message, keep) {
    await sql().begin(async (tx) => {
      const createdAt = toDate(message.createdAt) as Date;
      // A 'ไปกัน' plan room (plan~) is tied to no event or fair group, like a pair room
      const kind = message.roomId.startsWith('pair~') || message.roomId.startsWith('plan~') ? 'direct' : message.roomId.startsWith('grp_') ? 'fair_group' : 'event';
      const [event] = kind === 'event' ? await tx`select id from app.events where slug = ${message.roomId}` : [];
      const [room] = await tx`
        insert into app.chat_rooms (legacy_id, kind, event_id, last_message_at)
        values (${message.roomId}, ${kind}, ${event?.id ?? null}, ${createdAt})
        on conflict (legacy_id) do update set last_message_at = excluded.last_message_at
        returning id`;
      await tx`
        insert into app.chat_messages (id, room_id, author_id, body, created_at)
        values (${message.id}, ${room.id}, (select id from app.members where legacy_id = ${message.authorId}), ${message.text}, ${createdAt})`;
      await tx`
        delete from app.chat_messages where room_id = ${room.id}
          and id < (select id from app.chat_messages where room_id = ${room.id} order by id desc offset ${keep - 1} limit 1)`;
    });
  },
  async find(messageId) {
    if (!UUID.test(messageId)) return null;
    const [row] = await sql()`
      select m.id, m.body, m.created_at, r.legacy_id as room_legacy, a.legacy_id as author_legacy
      from app.chat_messages m
      join app.chat_rooms r on r.id = m.room_id
      left join app.members a on a.id = m.author_id
      where m.id = ${messageId}`;
    return row ? rowToMessage(row) : null;
  },
  async remove(messageId) {
    if (!UUID.test(messageId)) return false;
    return (await sql()`delete from app.chat_messages where id = ${messageId}`).count > 0;
  },
  async removeByAuthor(authorId) {
    await sql()`delete from app.chat_messages m using app.members a where a.id = m.author_id and a.legacy_id = ${authorId}`;
  },
  // chat_room_members.last_read_at (0008); a room exists once it has its first message
  async markRead(roomId, memberId, at) {
    const time = toDate(at) as Date;
    await sql()`
      insert into app.chat_room_members (room_id, member_id, last_read_at)
      select r.id, a.id, ${time} from app.chat_rooms r, app.members a where r.legacy_id = ${roomId} and a.legacy_id = ${memberId}
      on conflict (room_id, member_id) do update set last_read_at = excluded.last_read_at
        where app.chat_room_members.last_read_at is null or app.chat_room_members.last_read_at < excluded.last_read_at`;
  },
  async readTimes(roomId, exceptMemberId) {
    const rows = await sql()`
      select a.legacy_id, m.last_read_at from app.chat_room_members m
      join app.chat_rooms r on r.id = m.room_id join app.members a on a.id = m.member_id
      where r.legacy_id = ${roomId} and m.last_read_at is not null and a.legacy_id <> ${exceptMemberId}`;
    return rows.map((r) => ({ memberId: r.legacy_id as string, at: (r.last_read_at as Date).toISOString() }));
  },
};

export const chatStore: ChatStore = USE_POSTGRES ? pgChatStore : jsonChatStore;

import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { fairGroupById, isFairGroupMember } from './fairGroups';
import { createJsonStore } from './jsonStore';
import { guardMemberText } from './textRules';

/**
 * Group chat of an event (room id = event id) or of a fair meet-up group (room id = grp_…).
 * Only the people who joined, and the event's host, can read or write.
 */
interface ChatMessage {
  id: string;
  roomId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

const store = createJsonStore<ChatMessage>('chat_messages');
export const MAX_CHAT_LENGTH = 500;
const KEEP_PER_ROOM = 500;
const PAGE = 100;

async function roomOf(member: Member, roomId: string): Promise<{ title: string; members: number }> {
  if (roomId.startsWith('grp_')) {
    const group = fairGroupById(roomId);
    if (!group || !isFairGroupMember(roomId, member.id)) throw new MemberAuthError('แชตนี้สำหรับสมาชิกของกลุ่มเท่านั้น', 403);
    return { title: group.title, members: group.memberIds.length };
  }
  const event = await db.findEventById(roomId);
  if (!event) throw new MemberAuthError('ไม่พบห้องแชต', 404);
  const isHost = (event as { createdByMemberId?: string }).createdByMemberId === member.id;
  if (!isHost && !(await db.getParticipant(roomId, member.id))) throw new MemberAuthError('แชตนี้สำหรับคนที่เข้าร่วมกิจกรรมเท่านั้น', 403);
  return { title: event.title, members: (await db.listParticipants(roomId)).length };
}

export async function chatMessages(member: Member, roomId: string, after?: string) {
  const room = await roomOf(member, roomId);
  const blocked = new Set(member.blockedIds ?? []);
  const all = store.read().filter((m) => m.roomId === roomId && !blocked.has(m.authorId) && (!after || m.createdAt > after));
  const authors = new Map<string, Member | null>();
  for (const id of new Set(all.map((m) => m.authorId))) authors.set(id, await memberRepository.findById(id));
  const messages = all.slice(-PAGE).map((m) => {
    const author = authors.get(m.authorId);
    const active = author?.status === 'active';
    return {
      id: m.id,
      authorId: active ? m.authorId : null,
      authorName: active ? tidyDisplayName(author!.displayName).trim() || author!.displayName : 'สมาชิก',
      authorAvatar: active ? author!.avatarUrl ?? '' : '',
      text: m.text,
      createdAt: m.createdAt,
      isMine: m.authorId === member.id,
    };
  });
  return { room, messages };
}

export async function sendChatMessage(member: Member, roomId: string, input: unknown) {
  await roomOf(member, roomId);
  const text = typeof input === 'string' ? input.replace(/[ \t]+/g, ' ').trim().slice(0, MAX_CHAT_LENGTH) : '';
  if (!text) throw new MemberAuthError('พิมพ์ข้อความก่อนนะ');
  await guardMemberText(member, text, 'แชตกลุ่ม');
  const message: ChatMessage = { id: `msg_${randomUUID()}`, roomId, authorId: member.id, text, createdAt: new Date().toISOString() };
  await store.update((items) => {
    const next = [...items, message];
    const inRoom = next.filter((m) => m.roomId === roomId);
    if (inRoom.length <= KEEP_PER_ROOM) return next;
    const drop = new Set(inRoom.slice(0, inRoom.length - KEEP_PER_ROOM).map((m) => m.id));
    return next.filter((m) => !drop.has(m.id));
  });
  return message;
}

export async function deleteChatMessage(member: Member, messageId: string): Promise<void> {
  const found = store.read().find((m) => m.id === messageId);
  if (!found || found.authorId !== member.id) throw new MemberAuthError('ลบได้เฉพาะข้อความของตัวเอง', 403);
  await store.update((items) => items.filter((m) => m.id !== messageId));
}

export async function removeChatMessagesBy(memberId: string): Promise<void> {
  await store.update((items) => items.filter((m) => m.authorId !== memberId));
}

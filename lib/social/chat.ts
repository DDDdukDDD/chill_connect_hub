import { db } from '../db';
import { uuidV7 } from '../db/postgres/rows.mjs';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { fairGroupById, isFairGroupMember } from './fairGroups';
import { isMutual, pairMembersOf } from './meetAgain';
import { chatStore, type ChatMessage } from './chatStore';
import { guardMemberText } from './textRules';

/**
 * Group chat of an event (room id = event id) or of a fair meet-up group (room id = grp_…), and the two-person
 * room of a mutual "อยากเจออีก" (room id = pair~a~b). Only the people who joined, the event's host, or the pair
 * can read or write.
 */
export const MAX_CHAT_LENGTH = 500;
const KEEP_PER_ROOM = 500;
const PAGE = 100;

async function roomOf(member: Member, roomId: string): Promise<{ title: string; members: number }> {
  // Two people who picked each other after a ตี้ ("อยากเจออีก", lib/social/meetAgain.ts)
  const pair = pairMembersOf(roomId);
  if (pair) {
    const otherId = pair[0] === member.id ? pair[1] : pair[1] === member.id ? pair[0] : null;
    if (!otherId || !isMutual(member.id, otherId)) throw new MemberAuthError('แชตนี้เปิดเมื่อเลือกอยากเจอกันอีกทั้งสองฝ่าย', 403);
    const other = await memberRepository.findById(otherId);
    if (!other || other.status !== 'active' || other.blockedIds?.includes(member.id) || member.blockedIds?.includes(otherId)) throw new MemberAuthError('ห้องแชตนี้ปิดแล้ว', 403);
    return { title: tidyDisplayName(other.displayName).trim() || other.displayName, members: 2 };
  }
  if (roomId.startsWith('grp_')) {
    const group = fairGroupById(roomId);
    if (!group || !isFairGroupMember(roomId, member.id)) throw new MemberAuthError('แชตนี้สำหรับสมาชิกของกลุ่มเท่านั้น', 403);
    return { title: group.title, members: group.memberIds.length };
  }
  const event = await db.findEventById(roomId);
  if (!event) throw new MemberAuthError('ไม่พบห้องแชต', 404);
  const isHost = (event as { createdByMemberId?: string }).createdByMemberId === member.id;
  if (!isHost && !(await db.getParticipant(roomId, member.id))) throw new MemberAuthError('แชตนี้สำหรับคนที่เข้าร่วมตี้เท่านั้น', 403);
  return { title: event.title, members: (await db.listParticipants(roomId)).length };
}

export async function chatMessages(member: Member, roomId: string, after?: string) {
  const room = await roomOf(member, roomId);
  const latest = await chatStore.listRoom(roomId, { after, withoutAuthors: member.blockedIds ?? [], limit: PAGE });
  const authors = await memberRepository.findByIds(latest.map((m) => m.authorId));
  const messages = latest.map((m) => {
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
  const createdAt = new Date().toISOString();
  const message: ChatMessage = { id: uuidV7(createdAt), roomId, authorId: member.id, text, createdAt };
  await chatStore.append(message, KEEP_PER_ROOM);
  return message;
}

export async function deleteChatMessage(member: Member, messageId: string): Promise<void> {
  const found = await chatStore.find(messageId);
  if (!found || found.authorId !== member.id) throw new MemberAuthError('ลบได้เฉพาะข้อความของตัวเอง', 403);
  await chatStore.remove(messageId);
}

/** A message someone in the same room reports; only people who can read the room can report from it */
export async function chatMessageForReport(member: Member, messageId: string): Promise<{ message: ChatMessage; roomTitle: string }> {
  const message = await chatStore.find(messageId);
  if (!message) throw new MemberAuthError('ไม่พบข้อความนี้ อาจถูกลบไปแล้ว', 404);
  const room = await roomOf(member, message.roomId);
  return { message, roomTitle: room.title };
}

/**
 * The whole room for staff who are handling a report from it: a reported line often only makes sense
 * with what was said around it. Names are shown even for suspended accounts, since staff need them.
 */
export async function chatRoomForStaff(roomId: string) {
  const all = await chatStore.listRoom(roomId, { limit: KEEP_PER_ROOM });
  const authors = await memberRepository.findByIds(all.map((m) => m.authorId));
  const names = new Map<string, string>();
  for (const id of new Set(all.map((m) => m.authorId))) {
    const author = authors.get(id);
    names.set(id, author ? tidyDisplayName(author.displayName).trim() || author.displayName : 'บัญชีที่ลบแล้ว');
  }
  return all.map((m) => ({ id: m.id, authorId: m.authorId, authorName: names.get(m.authorId) ?? '', text: m.text, createdAt: m.createdAt }));
}

/** Staff take a message down after a report; returns false when it is already gone */
export async function removeChatMessageAsStaff(messageId: string): Promise<boolean> {
  return chatStore.remove(messageId);
}

export async function removeChatMessagesBy(memberId: string): Promise<void> {
  await chatStore.removeByAuthor(memberId);
}

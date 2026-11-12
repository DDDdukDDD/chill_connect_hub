import { db } from '../db';
import { uuidV7 } from '../db/postgres/rows.mjs';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { fairGroupById } from './fairGroups';
import { isMutual, pairMembersOf } from './meetAgain';
import { chatStore, type ChatMessage } from './chatStore';
import { friendPlanStore } from './friendPlanStore';
import { guardMemberText } from './textRules';
import { afterResponse, pushConfigured, sendPush } from './push';
import { pushStore } from './pushStore';

/**
 * Group chat of an event (room id = event id) or of a fair meet-up group (room id = grp_…), and the two-person
 * room of a mutual "อยากเจออีก" (room id = pair~a~b). Only the people who joined, the event's host, or the pair
 * can read or write.
 */
export const MAX_CHAT_LENGTH = 500;
const KEEP_PER_ROOM = 500;
const PAGE = 100;

/** A "ไปกัน" plan's chat reads as what they are going to do */
const planTitle = (plan: { targetType: string; title: string }) => (plan.targetType === 'quest' ? `ทำชาเลนจ์ ${plan.title}` : `ไป${plan.title}`);

/**
 * Where a notice about a room leads. A plan's chat opens over its plan in My Hub; any other room opens where the
 * reader is (components/ChatInbox.tsx reads ?chat=).
 */
export const chatHref = (roomId: string) => (roomId.startsWith('plan~') ? `/myhub?plan=${encodeURIComponent(roomId.slice(5))}&chat=1` : `/myhub?chat=${encodeURIComponent(roomId)}`);

/** Everyone who can read a room, for its notices; null when the room is gone */
export async function roomPeople(roomId: string): Promise<{ title: string; memberIds: string[]; isPair: boolean } | null> {
  if (roomId.startsWith('plan~')) {
    const plan = await friendPlanStore.byId(roomId.slice(5));
    if (!plan || plan.status === 'cancelled') return null;
    return { title: planTitle(plan), memberIds: plan.members.filter((m) => m.state === 'going').map((m) => m.memberId), isPair: false };
  }
  const pair = pairMembersOf(roomId);
  if (pair) return (await isMutual(pair[0], pair[1])) ? { title: '', memberIds: [...pair], isPair: true } : null;
  if (roomId.startsWith('grp_')) {
    const group = await fairGroupById(roomId);
    return group ? { title: group.title, memberIds: group.memberIds, isPair: false } : null;
  }
  const event = await db.findEventById(roomId);
  if (!event) return null;
  const hostId = (event as { createdByMemberId?: string }).createdByMemberId;
  const ids = new Set((await db.listParticipants(roomId)).map((p) => p.userId));
  if (hostId) ids.add(hostId);
  return { title: event.title, memberIds: [...ids], isPair: false };
}

async function roomOf(member: Member, roomId: string): Promise<{ title: string; members: number }> {
  // A "ไปกัน" group plan (room id = plan~<planId>, lib/social/friendPlans.ts): everyone going, the host included
  if (roomId.startsWith('plan~')) {
    const plan = await friendPlanStore.byId(roomId.slice(5));
    const going = plan && plan.status !== 'cancelled' ? plan.members.filter((m) => m.state === 'going') : [];
    if (!plan || !going.some((m) => m.memberId === member.id)) throw new MemberAuthError('แชตนี้สำหรับคนที่ตอบว่าไปกันเท่านั้น', 403);
    return { title: planTitle(plan), members: going.length };
  }
  // Two people who picked each other after a ตี้ ("อยากเจออีก", lib/social/meetAgain.ts)
  const pair = pairMembersOf(roomId);
  if (pair) {
    const otherId = pair[0] === member.id ? pair[1] : pair[1] === member.id ? pair[0] : null;
    if (!otherId || !(await isMutual(member.id, otherId))) throw new MemberAuthError('แชตนี้เปิดเมื่อเลือกอยากเจอกันอีกทั้งสองฝ่าย', 403);
    const other = await memberRepository.findById(otherId);
    if (!other || other.status !== 'active' || other.blockedIds?.includes(member.id) || member.blockedIds?.includes(otherId)) throw new MemberAuthError('ห้องแชตนี้ปิดแล้ว', 403);
    return { title: tidyDisplayName(other.displayName).trim() || other.displayName, members: 2 };
  }
  if (roomId.startsWith('grp_')) {
    const group = await fairGroupById(roomId);
    if (!group || !group.memberIds.includes(member.id)) throw new MemberAuthError('แชตนี้สำหรับสมาชิกของกลุ่มเท่านั้น', 403);
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
      ...(m.kind === 'event' ? { kind: 'event' as const } : {}),
    };
  });
  // Reading marks the room read up to the newest message shown; a refresh with nothing new writes nothing
  if (latest.length) await chatStore.markRead(roomId, member.id, latest[latest.length - 1].createdAt);
  // How far each other person has read, for "อ่านแล้ว" under one's own messages (people the member blocked left out)
  const blocked = new Set(member.blockedIds ?? []);
  const reads = (await chatStore.readTimes(roomId, member.id)).filter((r) => !blocked.has(r.memberId)).map((r) => r.at);
  // Whether this member turned the room's phone notices off; read on the first load, not on every poll
  const muted = after ? undefined : Boolean((await chatStore.memberStates(roomId, [member.id]))[0]?.muted);
  return { room, messages, reads, ...(muted === undefined ? {} : { muted }) };
}

/** Turns the room's phone notices off or on for this member; its unread count still shows */
export async function muteChat(member: Member, roomId: string, muted: boolean): Promise<void> {
  await roomOf(member, roomId);
  if (!(await chatStore.setMuted(roomId, member.id, muted))) throw new MemberAuthError('ยังไม่มีข้อความในห้องนี้', 409);
}

const INBOX_DAYS = 60;
const INBOX_ROOMS = 20;

/**
 * "แชต" in the top bar: the member's rooms with talk in the last 60 days, newest first, each with what is unread
 * and the last line. A room they can no longer read (left the ตี้, plan called off) is left out.
 */
export async function chatInbox(member: Member) {
  const since = new Date(Date.now() - INBOX_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const found = await chatStore.roomsOf(member.id, { withoutAuthors: member.blockedIds ?? [], since, limit: INBOX_ROOMS });
  const checked = await Promise.all(found.map((r) => roomOf(member, r.roomId).then((room) => ({ ...r, room }), () => null)));
  const rooms = checked.filter((r) => r !== null);
  const authors = await memberRepository.findByIds(rooms.map((r) => r.lastAuthorId).filter(Boolean));
  const items = rooms.map((r) => {
    const author = authors.get(r.lastAuthorId);
    const name = r.lastAuthorId === member.id ? 'คุณ' : author?.status === 'active' ? tidyDisplayName(author.displayName).trim() || author.displayName : 'สมาชิก';
    return {
      roomId: r.roomId,
      title: r.room.title,
      kind: r.roomId.startsWith('plan~') ? 'plan' : pairMembersOf(r.roomId) ? 'pair' : r.roomId.startsWith('grp_') ? 'group' : 'event',
      planId: r.roomId.startsWith('plan~') ? r.roomId.slice(5) : undefined,
      unread: r.unread,
      muted: r.muted,
      lastText: `${name}: ${r.lastText}`.slice(0, 120),
      lastAt: r.lastAt,
    };
  });
  // Muted rooms keep their count in the list but do not light up the top bar
  return { unread: items.reduce((sum, r) => sum + (r.muted ? 0 : r.unread), 0), rooms: items };
}

/** `quiet`: a line the site writes for the member (a plan's day set, "ไปด้วยนะ!"): unread for the others, no buzz */
export async function sendChatMessage(member: Member, roomId: string, input: unknown, options: { quiet?: boolean } = {}) {
  await roomOf(member, roomId);
  const text = typeof input === 'string' ? input.replace(/[ \t]+/g, ' ').trim().slice(0, MAX_CHAT_LENGTH) : '';
  if (!text) throw new MemberAuthError('พิมพ์ข้อความก่อนนะ');
  await guardMemberText(member, text, 'แชตกลุ่ม');
  const createdAt = new Date().toISOString();
  // A line the site writes for the member is a grey note in the chat, not a bubble they typed (BE-359)
  const message: ChatMessage = { id: uuidV7(createdAt), roomId, authorId: member.id, text, createdAt, ...(options.quiet ? { kind: 'event' as const } : {}) };
  await chatStore.append(message, KEEP_PER_ROOM);
  // The sender has read everything up to their own message
  await chatStore.markRead(roomId, member.id, createdAt);
  // The others see it as unread, and a phone that is not in the room hears about it (after the answer)
  tellChatRoom(member, message, !options.quiet);
  return message;
}

// Someone whose last read message is this fresh is in the room right now (the chat polls every few seconds)
const READING_MS = 30 * 1000;
// Told about a room and not read it since: the phone stays quiet, unless the talk goes on this long
const REMIND_MS = 15 * 60 * 1000;

/**
 * A new message (owner 2026-11-12): everyone else in the room gets it as unread, and a phone is told once per
 * unread stretch, never while its owner is reading the room, never for a muted room or someone blocked either way.
 * One notification per room on the device (tag), so a busy chat does not pile up.
 */
function tellChatRoom(sender: Member, message: ChatMessage, push: boolean): void {
  afterResponse(async () => {
    const room = await roomPeople(message.roomId);
    const others = room?.memberIds.filter((id) => id !== sender.id) ?? [];
    if (!room || others.length === 0) return;
    await chatStore.addMembers(message.roomId, others);
    if (!push || !pushConfigured) return;
    const at = Date.parse(message.createdAt);
    const due = (await chatStore.memberStates(message.roomId, others))
      .filter((s) => !s.muted)
      .filter((s) => !(s.lastReadAt && at - Date.parse(s.lastReadAt) < READING_MS))
      .filter((s) => !(s.notifiedAt && (!s.lastReadAt || s.notifiedAt > s.lastReadAt) && at - Date.parse(s.notifiedAt) < REMIND_MS))
      .map((s) => s.memberId);
    if (due.length === 0) return;
    const people = await memberRepository.findByIds(due);
    const told = due.filter((id) => {
      const person = people.get(id);
      return person?.status === 'active' && !person.blockedIds?.includes(sender.id) && !sender.blockedIds?.includes(id);
    });
    const devices = await pushStore.listFor(told);
    if (devices.length === 0) return;
    await chatStore.markNotified(message.roomId, [...new Set(devices.map((d) => d.memberId))], message.createdAt);
    const name = tidyDisplayName(sender.displayName).trim() || sender.displayName;
    await sendPush(devices, () => ({
      // A two-person room is the other person; a group says which group, then who wrote
      title: room.isPair ? name : room.title.slice(0, 60),
      body: (room.isPair ? message.text : `${name}: ${message.text}`).slice(0, 140),
      url: chatHref(message.roomId),
      tag: `chat:${message.roomId}`,
    }));
  });
}

export async function deleteChatMessage(member: Member, messageId: string): Promise<void> {
  const found = await chatStore.find(messageId);
  if (!found || found.authorId !== member.id) throw new MemberAuthError('ลบได้เฉพาะข้อความของตัวเอง', 403);
  // The plan's record of what changed (the day, who joined) stays
  if (found.kind === 'event') throw new MemberAuthError('ข้อความนี้ลบไม่ได้', 403);
  // Once someone has read it, it stays (owner 2026-11-12): it cannot be unseen, and a report needs it
  const reads = await chatStore.readTimes(found.roomId, member.id);
  if (reads.some((r) => r.at >= found.createdAt)) throw new MemberAuthError('เพื่อนอ่านข้อความนี้แล้ว ลบไม่ได้', 409);
  await chatStore.remove(messageId);
}

/** A message someone in the same room reports; only people who can read the room can report from it */
export async function chatMessageForReport(member: Member, messageId: string): Promise<{ message: ChatMessage; roomTitle: string }> {
  const message = await chatStore.find(messageId);
  if (!message) throw new MemberAuthError('ไม่พบข้อความนี้ อาจถูกลบไปแล้ว', 404);
  // The site wrote it, not the member: nothing to report
  if (message.kind === 'event') throw new MemberAuthError('ข้อความนี้รายงานไม่ได้', 400);
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

import { db } from '../db';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { createJsonStore } from './jsonStore';
import { notifyMatch } from './notifications';

/**
 * "อยากเจออีก" after a ตี้ (owner 2026-10-23, from Timeleft/222): each person privately picks who they would like
 * to meet again. Only when two people pick each other can they talk, in a two-person chat room. A pick that is
 * not returned is never shown to the other person.
 *
 * Only people who really met can pick: the host and the participants the host checked in (the check-in is the
 * proof of going). Sample and official events have no host check-in, so they have no picks.
 */
interface MeetAgainPick {
  eventId: string;
  fromId: string;
  toId: string;
  at: string;
}

const store = createJsonStore<MeetAgainPick>('meet_again');
const hostOf = (event: { createdByMemberId?: string }) => event.createdByMemberId;

/** Member ids never contain "~", so the room id splits back into its two members */
export const pairRoomId = (a: string, b: string) => `pair~${[a, b].sort().join('~')}`;

export function pairMembersOf(roomId: string): [string, string] | null {
  if (!roomId.startsWith('pair~')) return null;
  const parts = roomId.slice(5).split('~');
  return parts.length === 2 && parts[0] && parts[1] ? [parts[0], parts[1]] : null;
}

/** True when the two picked each other at any ตี้ */
export function isMutual(a: string, b: string): boolean {
  const picks = store.read();
  return picks.some((p) => p.fromId === a && p.toId === b && picks.some((q) => q.eventId === p.eventId && q.fromId === b && q.toId === a));
}

async function peopleWhoMet(eventId: string) {
  const event = await db.findEventById(eventId);
  if (!event || event.eventType === 'public_venue') throw new MemberAuthError('ไม่พบตี้นี้', 404);
  const host = hostOf(event as { createdByMemberId?: string });
  if (!host) throw new MemberAuthError('ตี้นี้ไม่มีการเช็กชื่อ จึงเลือกคนที่อยากเจออีกไม่ได้', 400);
  const confirmed = (await db.listParticipants(eventId)).filter((p) => p.checkedInAt).map((p) => p.userId);
  return new Set([host, ...confirmed]);
}

/** The people the member met at this ตี้, with the member's own picks and the mutual ones */
export async function meetAgainOf(member: Member, eventId: string) {
  const met = await peopleWhoMet(eventId);
  if (!met.has(member.id)) throw new MemberAuthError('เลือกได้หลังคนจัดยืนยันว่าคุณมาแล้ว', 403);
  const picks = store.read().filter((p) => p.eventId === eventId);
  const mine = new Set(picks.filter((p) => p.fromId === member.id).map((p) => p.toId));
  const pickedMe = new Set(picks.filter((p) => p.toId === member.id).map((p) => p.fromId));
  const blocked = new Set(member.blockedIds ?? []);
  const others = [...met].filter((id) => id !== member.id && !blocked.has(id));
  const found = await Promise.all(others.map((id) => memberRepository.findById(id)));
  const people = others.flatMap((id, i) => {
    const other = found[i];
    if (!other || other.status !== 'active' || other.blockedIds?.includes(member.id)) return [];
    const picked = mine.has(id);
    const matched = picked && pickedMe.has(id);
    return [{ id, name: tidyDisplayName(other.displayName).trim() || other.displayName, avatar: other.avatarUrl ?? '', picked, matched, roomId: matched ? pairRoomId(member.id, id) : undefined }];
  });
  return { people };
}

export async function setMeetAgain(member: Member, eventId: string, input: { userId?: unknown; want?: unknown }) {
  const toId = typeof input.userId === 'string' ? input.userId : '';
  const want = input.want !== false;
  const met = await peopleWhoMet(eventId);
  if (!met.has(member.id)) throw new MemberAuthError('เลือกได้หลังคนจัดยืนยันว่าคุณมาแล้ว', 403);
  if (!toId || toId === member.id || !met.has(toId)) throw new MemberAuthError('เลือกได้เฉพาะคนที่ไปตี้นี้ด้วยกัน', 400);
  if (member.blockedIds?.includes(toId)) throw new MemberAuthError('คุณบล็อกคนนี้อยู่', 400);
  const was = store.read().some((p) => p.eventId === eventId && p.fromId === member.id && p.toId === toId);
  await store.update((items) => {
    const rest = items.filter((p) => !(p.eventId === eventId && p.fromId === member.id && p.toId === toId));
    return want ? [...rest, { eventId, fromId: member.id, toId, at: new Date().toISOString() }] : rest;
  });
  const matched = want && store.read().some((p) => p.eventId === eventId && p.fromId === toId && p.toId === member.id);
  // Tell the other person once, at the moment the pick becomes mutual
  if (matched && !was) await notifyMatch(toId, member, eventId);
  return { picked: want, matched, roomId: matched ? pairRoomId(member.id, toId) : undefined };
}

/** Account deletion: the member's picks, both ways, go with the account */
export async function removeMeetAgainOf(memberId: string): Promise<void> {
  await store.update((items) => items.filter((p) => p.fromId !== memberId && p.toId !== memberId));
}

import type { EventItem } from '@/data/mockData';
import { db } from '../db';
import { isClosedToJoin } from '../dateUtils';
import { MemberAuthError } from '../members/accounts';
import { hasConfirmedIdentity } from '../members/trust';
import type { Member } from '../members/types';
import { isSeries, nextDatesOf } from './recurring';
import { type PendingJoin, pendingJoinStore } from './stores';
import { joinWaitlist } from './waitlist';

/**
 * A ตี้ sign-up made before the member confirmed their email (owner 2026-11-16). Pressing join saves it to My Hub as
 * "รอยืนยันอีเมล" and sends the link. It holds no seat and the host does not see it, so people who never confirm
 * cannot block a small group. Confirming the email joins them if a seat is still free; a full ตี้ puts them on its
 * waiting list instead. A sign-up for a ตี้ that has started is dropped.
 */
const MAX_PENDING = 5;

/** Only the email stands in the way: a member who has an email to confirm and nothing else unconfirmed */
export const canWaitForEmail = (member: Member): boolean => Boolean(member.email) && !hasConfirmedIdentity(member);

const stillOpen = (event: EventItem | null | undefined, date?: string): event is EventItem =>
  Boolean(event && event.approvalStatus === 'approved' && event.eventType !== 'public_venue') &&
  (isSeries(event as EventItem) ? Boolean(date && nextDatesOf(event as EventItem).includes(date)) : !isClosedToJoin(event as EventItem));

/** Saves the sign-up. Refuses what a join would refuse anyway (not found, started, full) so nobody waits for nothing */
export async function savePendingJoin(member: Member, eventId: string, date?: string): Promise<EventItem> {
  const event = await db.findEventById(eventId);
  if (!event || event.approvalStatus !== 'approved' || event.eventType === 'public_venue') throw new MemberAuthError('ไม่พบตี้นี้ หรือตี้ยังไม่เปิดให้เข้าร่วม', 404);
  if (isSeries(event) && (!date || !nextDatesOf(event).includes(date))) throw new MemberAuthError('เลือกวันที่จะไปก่อนนะ', 400);
  if (!stillOpen(event, date)) throw new MemberAuthError('ตี้นี้เริ่มไปแล้ว ปิดรับคนเพิ่มแล้ว', 409);
  if (!isSeries(event) && (event.participantsCount ?? 0) >= (event.maxParticipants ?? 0)) throw new MemberAuthError('ตี้นี้เต็มแล้ว ยืนยันอีเมลแล้วต่อคิวสำรองได้นะ', 409);
  const mine = await pendingJoinStore.ofMember(member.id);
  if (!mine.some((p) => p.eventId === eventId) && mine.length >= MAX_PENDING) throw new MemberAuthError(`รอยืนยันได้ไม่เกิน ${MAX_PENDING} ตี้ ยืนยันอีเมลก่อนนะ`, 409);
  await pendingJoinStore.add({ eventId, memberId: member.id, date });
  return event;
}

/** Takes a sign-up back; true when there was one */
export async function removePendingJoin(member: Member, eventId: string): Promise<boolean> {
  if (!(await pendingJoinStore.ofMember(member.id)).some((p) => p.eventId === eventId)) return false;
  await pendingJoinStore.remove(eventId, member.id);
  return true;
}

/** The member's sign-ups still worth waiting for, with their ตี้; those that started are dropped here */
export async function pendingJoinsOf(memberId: string): Promise<{ entry: PendingJoin; event: EventItem }[]> {
  const entries = await pendingJoinStore.ofMember(memberId);
  const live: { entry: PendingJoin; event: EventItem }[] = [];
  for (const entry of entries) {
    const event = await db.findEventById(entry.eventId);
    if (stillOpen(event, entry.date)) live.push({ entry, event });
    else await pendingJoinStore.remove(entry.eventId, memberId);
  }
  return live;
}

export interface SettledJoin {
  eventId: string;
  title: string;
  outcome: 'joined' | 'waitlist' | 'closed';
}

/**
 * Turns the sign-ups into joins once the identity is confirmed: a seat if one is free, else the waiting list. A member
 * who still has to accept the pledge keeps them, and the ตี้ page asks for the pledge. `join` is joinEvent, passed in
 * (lib/members/activity.ts imports this file)
 */
export async function settlePendingJoins(
  member: Member,
  join: (member: Member, eventId: string, date?: string) => Promise<{ status: string; event?: EventItem }>
): Promise<SettledJoin[]> {
  if (!hasConfirmedIdentity(member) || !member.pledgeAcceptedAt) return [];
  const settled: SettledJoin[] = [];
  for (const { entry, event } of await pendingJoinsOf(member.id)) {
    const result = await join(member, entry.eventId, entry.date);
    let outcome: SettledJoin['outcome'] = 'closed';
    if (result.status === 'joined' || result.status === 'already_joined') outcome = 'joined';
    else if (result.status === 'event_full') {
      // The waiting list is per date: a recurring ตี้ queues on that date's own event, which the join just made
      const queueId = result.event?.id ?? entry.eventId;
      outcome = await joinWaitlist(member, queueId).then(() => 'waitlist' as const, () => 'closed' as const);
    }
    await pendingJoinStore.remove(entry.eventId, member.id);
    settled.push({ eventId: entry.eventId, title: event.title, outcome });
  }
  return settled;
}

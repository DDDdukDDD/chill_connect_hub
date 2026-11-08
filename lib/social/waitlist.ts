import { db } from '../db';
import { hasMeetupStarted, isEventEnded } from '../dateUtils';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { waitlistStore } from './stores';
import { notifySeat } from './notifications';

/**
 * Waiting list of a full ตี้ (owner 2026-10-23, from Eventbrite). When a seat frees up, the first person in line is
 * offered it and the seat is held for them for OFFER_HOURS (others cannot take it). If they do not join in time the
 * offer passes to the next person. The queue moves whenever someone reads or changes it, and every hour from
 * app/api/cron/hourly (moveAllQueues), so a lapsed offer reaches the next person even when nobody opens the page.
 */
export interface WaitlistEntry {
  eventId: string;
  memberId: string;
  at: string;
  /** When a seat was offered to this person */
  offeredAt?: string;
}

export const OFFER_HOURS = 2;
const OFFER_MS = OFFER_HOURS * 60 * 60 * 1000;
const MAX_QUEUE = 50;

const isLive = (entry: WaitlistEntry, now = Date.now()) => Boolean(entry.offeredAt) && now - Date.parse(entry.offeredAt!) < OFFER_MS;

/** Seats held for people offered one, not counting `forMemberId`'s own offer */
export async function heldSeats(eventId: string, forMemberId?: string): Promise<number> {
  await moveQueue(eventId);
  return (await waitlistStore.line(eventId)).filter((e) => e.memberId !== forMemberId && isLive(e)).length;
}

/** Drops offers that ran out and offers free seats to the next people in line */
export async function moveQueue(eventId: string): Promise<void> {
  const entries = await waitlistStore.line(eventId);
  if (entries.length === 0) return;
  const event = await db.findEventById(eventId);
  if (!event || isEventEnded(event)) {
    await waitlistStore.clear(eventId);
    return;
  }
  const now = Date.now();
  const expired = entries.filter((e) => e.offeredAt && !isLive(e, now));
  const live = entries.filter((e) => isLive(e, now));
  const free = Math.max(0, (event.maxParticipants ?? 0) - (event.participantsCount ?? 0) - live.length);
  const waiting = entries.filter((e) => !e.offeredAt).sort((a, b) => a.at.localeCompare(b.at));
  const offerTo = waiting.slice(0, free);
  if (expired.length === 0 && offerTo.length === 0) return;
  await waitlistStore.move(eventId, expired.map((e) => e.memberId), offerTo.map((e) => e.memberId));
  for (const entry of offerTo) await notifySeat(entry.memberId, eventId);
}

/** Hourly job: moves every line on (lapsed offers out, free seats offered and the people told) */
export async function moveAllQueues(): Promise<{ events: number }> {
  const ids = await waitlistStore.eventIds();
  for (const id of ids) await moveQueue(id);
  return { events: ids.length };
}

export async function joinWaitlist(member: Member, eventId: string) {
  const event = await db.findEventById(eventId);
  if (!event || event.eventType === 'public_venue' || event.approvalStatus !== 'approved') throw new MemberAuthError('ไม่พบตี้นี้', 404);
  if (isEventEnded(event)) throw new MemberAuthError('ตี้นี้จบแล้ว', 400);
  if (hasMeetupStarted(event)) throw new MemberAuthError('ตี้นี้เริ่มไปแล้ว ปิดรับคนเพิ่มแล้ว', 400);
  if (await db.getParticipant(eventId, member.id)) throw new MemberAuthError('คุณเข้าร่วมตี้นี้อยู่แล้ว', 409);
  const mine = await waitlistStore.line(eventId);
  if (!mine.some((e) => e.memberId === member.id)) {
    if (mine.length >= MAX_QUEUE) throw new MemberAuthError('รายชื่อสำรองเต็มแล้ว', 409);
    await waitlistStore.add(eventId, member.id);
  }
  await moveQueue(eventId);
  return waitlistStatus(member, eventId);
}

export async function leaveWaitlist(member: Member, eventId: string) {
  await waitlistStore.remove(eventId, member.id);
  await moveQueue(eventId);
  return waitlistStatus(member, eventId);
}

/** Where the member stands: not in line, waiting (position), or offered a seat until a time */
export async function waitlistStatus(member: Member, eventId: string) {
  await moveQueue(eventId);
  const line = await waitlistStore.line(eventId);
  const index = line.findIndex((e) => e.memberId === member.id);
  if (index < 0) return { inLine: false, waiting: line.length };
  const entry = line[index];
  const offeredUntil = entry.offeredAt && isLive(entry) ? new Date(Date.parse(entry.offeredAt) + OFFER_MS).toISOString() : undefined;
  return { inLine: true, position: line.filter((e) => !e.offeredAt).findIndex((e) => e.memberId === member.id) + 1, offeredUntil, waiting: line.length };
}

/** After joining, the member is out of the line */
export async function leftLineByJoining(eventId: string, memberId: string): Promise<void> {
  await waitlistStore.remove(eventId, memberId);
}

export async function removeWaitlistOf(memberId: string): Promise<void> {
  await waitlistStore.removeOf(memberId);
}

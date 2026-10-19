import type { EventItem } from '@/data/mockData';
import { db } from '../db';
import { isEventEnded } from '../dateUtils';
import { myFairGroups } from '../social/fairGroups';
import { addReview, hasReviewed, MAX_REVIEW_LENGTH, reviewedEventIdsOf } from '../social/reviews';
import { MemberAuthError } from './accounts';
import { guardPosting } from './safety';
import { memberRepository } from './index';
import { trustLevel } from './trust';
import { tidyDisplayName } from '../displayName';
import { joinersOf } from '../social/questJoins';
import type { Member } from './types';

/**
 * What a member does with events and places: join, cancel, save for later.
 * The server is the only source of truth; My Hub and every "join" button read and write through here.
 */
const MAX_SAVED = 500;
const MAX_CANCELLED_HISTORY = 100;

export type JoinStatus = 'joined' | 'already_joined' | 'event_full' | 'event_ended' | 'not_found' | 'not_allowed';

const isCommunity = (event: EventItem) => event.eventType !== 'public_venue';
const hostOf = (event: EventItem) => (event as { createdByMemberId?: string }).createdByMemberId;

export async function joinEvent(member: Member, eventId: string): Promise<{ status: JoinStatus; message: string; event?: EventItem }> {
  const event = await db.findEventById(eventId);
  if (!event || event.approvalStatus !== 'approved') return { status: 'not_found', message: 'ไม่พบตี้นี้ หรือตี้ยังไม่เปิดให้เข้าร่วม' };
  // Meeting strangers in person needs a verified account; saving a public fair to one's plan does not
  if (isCommunity(event) && trustLevel(member) === 'new') {
    return {
      status: 'not_allowed',
      message: member.emailVerified ? 'รับคำมั่นของคอมมูนิตี้ก่อนนะ แล้วจะเข้าร่วมตี้ได้ (ดูที่หน้าโปรไฟล์)' : 'ยืนยันอีเมลก่อนนะ แล้วจะเข้าร่วมตี้ได้ (ดูที่หน้าโปรไฟล์)',
    };
  }
  const result = await db.atomicJoinEvent(eventId, { userId: member.id, userName: member.displayName, userAvatar: member.avatarUrl });
  if (result.success || result.status === 'already_joined') {
    // Joining again clears the "cancelled" mark
    if (member.cancelledEvents?.some((c) => c.eventId === eventId)) {
      await memberRepository.update(member.id, { cancelledEvents: member.cancelledEvents.filter((c) => c.eventId !== eventId) });
    }
  }
  return { status: (result.status ?? (result.success ? 'joined' : 'not_found')) as JoinStatus, message: result.message, event: result.updatedEvent ?? event };
}

export async function leaveEvent(member: Member, eventId: string): Promise<{ event: EventItem | null }> {
  const event = await db.findEventById(eventId);
  if (event && hostOf(event) === member.id) throw new MemberAuthError('คุณเป็นคนจัดตี้นี้ จึงยกเลิกการเข้าร่วมไม่ได้ ถ้าจะยกเลิกตี้ ให้แจ้งทีมงาน', 409);
  const result = await db.atomicLeaveEvent(eventId, member.id);
  if (!result.success) throw new MemberAuthError(result.message, 404);
  const history = [{ eventId, at: new Date().toISOString() }, ...(member.cancelledEvents ?? []).filter((c) => c.eventId !== eventId)].slice(0, MAX_CANCELLED_HISTORY);
  await memberRepository.update(member.id, { cancelledEvents: history });
  return { event: await db.findEventById(eventId) };
}

/** Removes a cancelled event from the member's history */
export async function forgetCancelled(member: Member, eventId: string): Promise<void> {
  await memberRepository.update(member.id, { cancelledEvents: (member.cancelledEvents ?? []).filter((c) => c.eventId !== eventId) });
}

export async function setSaved(member: Member, kind: 'spot' | 'event', id: string, saved: boolean): Promise<Member> {
  const cleanId = id.trim().slice(0, 120);
  if (!cleanId) throw new MemberAuthError('ไม่พบรายการ');
  const key = kind === 'spot' ? 'savedSpotIds' : 'savedEventIds';
  const current = new Set(member[key] ?? []);
  if (saved) current.add(cleanId);
  else current.delete(cleanId);
  return memberRepository.update(member.id, { [key]: [...current].slice(-MAX_SAVED) });
}

/** Everything My Hub shows about one member */
export async function activityOf(member: Member) {
  const [participations, all] = await Promise.all([db.listParticipations(member.id), db.listAllEvents()]);
  const byId = new Map(all.map((e) => [e.id, e]));
  const joined = [];
  for (const p of participations) {
    const event = byId.get(p.eventId);
    if (!event) continue;
    const record = await db.getParticipant(p.eventId, member.id);
    // hasHostCheckIn: the event is run by a member, so attendance is confirmed by their check-in
    joined.push({ ...event, joinedAt: p.joinedAt, isHost: hostOf(event) === member.id, checkedInAt: record?.checkedInAt, hasHostCheckIn: Boolean(hostOf(event)) });
  }
  const joinedIds = new Set(joined.map((e) => e.id));
  // Events the member created that are still waiting for review are theirs too, even before anyone can join
  const hosted = all.filter((e) => hostOf(e) === member.id).map((e) => ({ ...e, isHost: true }));
  const cancelled = (member.cancelledEvents ?? [])
    .filter((c) => !joinedIds.has(c.eventId) && byId.has(c.eventId))
    .map((c) => ({ ...byId.get(c.eventId)!, cancelledAt: c.at }));
  return {
    joined,
    hosted,
    cancelled,
    joinedIds: [...joinedIds],
    savedSpotIds: member.savedSpotIds ?? [],
    savedEventIds: member.savedEventIds ?? [],
    reviewedEventIds: reviewedEventIdsOf(member.id),
    fairGroups: await myFairGroups(member.id),
  };
}

/** The member's own ticket for an event they joined */
export async function ticketOf(member: Member, eventId: string) {
  const [event, record] = await Promise.all([db.findEventById(eventId), db.getParticipant(eventId, member.id)]);
  if (!event || !record) throw new MemberAuthError('คุณยังไม่ได้เข้าร่วมตี้นี้', 404);
  return {
    code: record.ticketCode ?? '',
    joinedAt: record.joinedAt,
    checkedInAt: record.checkedInAt,
    isHost: hostOf(event) === member.id,
    /** False for official and sample events: nobody checks tickets there */
    hasHostCheckIn: Boolean(hostOf(event)),
  };
}

/**
 * Who is going, for anyone who opens a meetup (owner 2026-10-16: open to everyone, nobody can hide).
 * Only name, photo and a checked badge leave the server; profile fields stay behind the profile's own rules.
 * `total` is the event's count, which can be larger than the list for sample events without join records.
 */
export async function attendeesOf(eventId: string, viewer: Member | null) {
  const event = await db.findEventById(eventId);
  if (!event || event.eventType === 'public_venue') return null;
  const records = await db.listParticipants(eventId);
  const attendees = await publicPeople(records.map((p) => ({ userId: p.userId, userName: p.userName, userAvatar: p.userAvatar, joinedAt: p.joinedAt })), viewer, hostOf(event));
  return { total: Math.max(event.participantsCount ?? 0, attendees.length), attendees };
}

/** The same open list for a challenge: who joined it (owner 2026-10-16) */
export async function questMembersOf(questId: string, viewer: Member | null) {
  const quest = await db.findQuestById(questId);
  if (!quest) return null;
  const people = await publicPeople(joinersOf(questId).map((join) => ({ userId: join.memberId, joinedAt: join.joinedAt })), viewer);
  // Sample challenges carry a starting count on top of real joins, as the list page shows
  return { total: (quest.participantsCount ?? 0) + people.length, attendees: people };
}

/** Name, photo and a checked badge of each person; host first, then in the order they joined; people the viewer blocked left out */
async function publicPeople(records: { userId: string; userName?: string; userAvatar?: string; joinedAt?: string }[], viewer: Member | null, hostId?: string) {
  const members = await Promise.all(records.map((p) => memberRepository.findById(p.userId)));
  return records
    .map((record, i) => ({ record, member: members[i] }))
    .filter(({ record, member }) => (member || record.userName) && !viewer?.blockedIds?.includes(record.userId))
    .sort((a, b) => Number(b.record.userId === hostId) - Number(a.record.userId === hostId) || (a.record.joinedAt ?? '').localeCompare(b.record.joinedAt ?? ''))
    .map(({ record, member }) => ({
      id: record.userId,
      name: tidyDisplayName(member?.displayName ?? record.userName ?? '').trim() || record.userName || 'สมาชิก',
      avatar: member?.avatarUrl ?? record.userAvatar ?? '',
      verified: Boolean(member?.emailVerified && member.pledgeAcceptedAt),
      isHost: Boolean(hostId) && record.userId === hostId,
      isMe: record.userId === viewer?.id,
    }));
}

async function requireHost(member: Member, eventId: string) {
  const event = await db.findEventById(eventId);
  if (!event) throw new MemberAuthError('ไม่พบตี้', 404);
  if (hostOf(event) !== member.id) throw new MemberAuthError('เฉพาะคนจัดตี้นี้เท่านั้น', 403);
  return event;
}

/** Who joined, for the host. Ticket codes are never listed: the participant shows theirs. */
export async function participantsForHost(member: Member, eventId: string) {
  const event = await requireHost(member, eventId);
  const list = await db.listParticipants(eventId);
  return {
    event: { id: event.id, title: event.title, date: event.date, time: event.time, participantsCount: event.participantsCount, maxParticipants: event.maxParticipants },
    participants: list.map((p) => ({ userId: p.userId, userName: p.userName, userAvatar: p.userAvatar ?? '', joinedAt: p.joinedAt, checkedInAt: p.checkedInAt, isHost: p.userId === member.id })),
  };
}

export async function checkInByHost(member: Member, eventId: string, target: { code?: string; userId?: string }, checkedIn: boolean) {
  await requireHost(member, eventId);
  const record = await db.setCheckIn(eventId, target, checkedIn);
  if (!record) throw new MemberAuthError(target.code ? 'ไม่พบรหัสบัตรนี้ในตี้ ลองตรวจตัวอักษรอีกครั้ง' : 'ไม่พบผู้เข้าร่วมคนนี้', 404);
  return { userId: record.userId, userName: record.userName, checkedInAt: record.checkedInAt };
}

/** One review per participant per event, after the event (or after being checked in) */
export async function reviewEvent(member: Member, eventId: string, input: Record<string, unknown>) {
  const [event, record] = await Promise.all([db.findEventById(eventId), db.getParticipant(eventId, member.id)]);
  if (!event || !record) throw new MemberAuthError('รีวิวได้เฉพาะตี้ที่คุณเข้าร่วม', 403);
  if (hostOf(event) === member.id) throw new MemberAuthError('รีวิวตี้ของตัวเองไม่ได้');
  if (!record.checkedInAt && !isEventEnded(event)) throw new MemberAuthError('รีวิวได้หลังตี้จบ หรือหลังเช็กอินแล้ว');
  if (hostOf(event) && !record.checkedInAt) throw new MemberAuthError('รีวิวได้เฉพาะคนที่โฮสต์เช็กอินให้แล้ว', 403);
  if (hasReviewed(member.id, eventId)) throw new MemberAuthError('คุณรีวิวตี้นี้ไปแล้ว', 409);
  const rating = Math.round(Number(input.rating));
  if (!(rating >= 1 && rating <= 5)) throw new MemberAuthError('ให้คะแนน 1 ถึง 5 ดาว');
  const text = typeof input.text === 'string' ? input.text.replace(/\s+/g, ' ').trim().slice(0, MAX_REVIEW_LENGTH) : '';
  if (text) await guardPosting(member, 'comment', text);
  return addReview({ eventId, eventTitle: event.title, hostId: hostOf(event), authorId: member.id, rating, text });
}

import { MASTER_77_PROVINCES } from '../../data/masterHub';
import type { EventItem } from '../../data/mockData';
import { db } from '../db';
import { isEventEnded, isValidTimeRange, meetupTimes } from '../dateUtils';
import { MemberAuthError } from '../members/accounts';
import { guardOrganizer } from '../members/submissions';
import type { Member } from '../members/types';
import { placeName } from '../placeName';
import { isRateLimited } from '../rateLimit';
import { notifyTeeChanged } from './notifications';
import { isSeries, thaiDateOf } from './recurring';
import { waitlistStore } from './stores';

/** Words a ตี้ may not carry, when it is created and when its place is changed */
export const BANNED_KEYWORDS = ['เว็บพนัน', 'คาสิโน', 'บาคาร่า', 'สล็อต', 'ลูกโซ่', 'เงินกู้', 'ดอกเบี้ยโหด', 'ยาเสพติด', 'ขายตัว', 'หลอกลวง'];

export interface TeeEdit {
  /** YYYY-MM-DD */
  date?: unknown;
  /** HH:MM */
  startTime?: unknown;
  endTime?: unknown;
  // In-person ตี้ only; an online ตี้ changes its date and time
  province?: unknown;
  district?: unknown;
  locationName?: unknown;
  meetingPoint?: unknown;
  placeId?: unknown;
}

const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const refuse = (message: string, status = 400): never => {
  throw new MemberAuthError(message, status);
};
const isRealDate = (ymd: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const parsed = new Date(`${ymd}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === ymd;
};
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Dates of a series are made from its schedule and a trip's rules are set by the server, so neither is edited here */
export const canEditTee = (event: EventItem) => event.eventType !== 'public_venue' && !event.seriesId && !isSeries(event) && !event.spotId;

/**
 * The host moves the date, time or place of their own ตี้, up to the moment it starts. Title and description stay as
 * staff saw them. Everyone in the ตี้ and in its waiting line hears about it, so they can decide again.
 */
export async function editTee(member: Member, eventId: string, edit: TeeEdit): Promise<{ event: EventItem; changed: boolean; notified: number }> {
  guardOrganizer(member);
  const event = await db.findEventById(eventId);
  // The same answer for "no such ตี้" and "not yours"
  if (!event || (event as { createdByMemberId?: string }).createdByMemberId !== member.id) return refuse('ไม่พบตี้นี้ในรายการที่คุณจัด', 404);
  if (!canEditTee(event)) return refuse('ตี้แบบนี้แก้เวลาและสถานที่เองไม่ได้', 409);
  if (event.approvalStatus === 'rejected') return refuse('ตี้นี้ทีมงานยังไม่อนุมัติ จึงแก้ไม่ได้', 409);
  const before = meetupTimes(event);
  if (isEventEnded(event) || (before && Date.now() >= before.start)) return refuse('ตี้นี้เริ่มไปแล้ว แก้เวลาและสถานที่ไม่ได้', 409);

  const ymd = clean(edit.date, 10);
  const startTime = clean(edit.startTime, 5);
  const endTime = clean(edit.endTime, 5);
  if (!isRealDate(ymd)) refuse('เลือกวันให้ครบก่อนนะ');
  if (!CLOCK.test(startTime) || !CLOCK.test(endTime)) refuse('ใส่เวลาเริ่มและเวลาเลิกให้ครบก่อนนะ');
  if (!isValidTimeRange(startTime, endTime)) refuse('เวลาเลิกต้องไม่ตรงกับเวลาเริ่ม');
  const date = thaiDateOf(ymd);
  const time = `${startTime} - ${endTime} น.`;
  const after = meetupTimes({ eventType: 'community', date, time });
  if (!after || after.start <= Date.now()) refuse('เลือกวันและเวลาที่ยังมาไม่ถึงนะ');

  const next: Partial<EventItem> = { date, time };
  const online = event.locationType === 'online' || event.province === 'ออนไลน์';
  if (!online) {
    const province = clean(edit.province, 60);
    const zone = clean(edit.district, 40);
    const name = clean(edit.locationName, 100);
    const meetingPoint = clean(edit.meetingPoint, 100);
    if (!MASTER_77_PROVINCES.includes(province)) refuse('เลือกจังหวัดก่อนนะ');
    if (zone.length < 2) refuse('กรุณาระบุย่านหรือเขตของตี้ เช่น อารีย์ หรือ คลองเตย');
    if (name.length < 2) refuse('ใส่ชื่อสถานที่ก่อนนะ');
    if (meetingPoint.length < 2) refuse('บอกจุดนัดพบที่หาง่ายก่อนนะ');
    const words = `${name} ${meetingPoint} ${zone}`.toLowerCase();
    if (BANNED_KEYWORDS.some((word) => words.includes(word))) refuse('ขออภัย ตรวจพบข้อความที่ไม่สอดคล้องกับข้อกำหนดความปลอดภัยของคอมมูนิตี้');
    // Linked only to a published place; its title comes from the record
    const placeId = clean(edit.placeId, 80);
    const place = placeId ? await db.findSpotById(placeId) : null;
    const linked = place && place.publicationStatus !== 'draft' ? place : null;
    Object.assign(next, { province, zone, meetingPoint, location: `${name} (จุดนัดพบ: ${meetingPoint})`, placeId: linked?.id, placeTitle: linked?.title });
  }

  const changedKeys = (Object.keys(next) as Array<keyof EventItem>).filter((key) => (next[key] ?? '') !== (event[key] ?? ''));
  if (changedKeys.length === 0) return { event, changed: false, notified: 0 };

  // Each real change rings everyone in the ตี้, so it cannot be repeated without end; a form error costs nothing
  if (await isRateLimited(`edit-tee:${member.id}`, 10, 60 * 60 * 1000)) refuse('แก้บ่อยเกินไปแล้ว พักสักครู่แล้วลองใหม่นะ', 429);

  const saved = (await db.updateEvent(eventId, next)) ?? event;

  // Only a saved ตี้ that people can see has people to tell
  let notified = 0;
  if (event.approvalStatus === 'approved') {
    const [joined, line] = await Promise.all([db.listParticipants(eventId), waitlistStore.line(eventId)]);
    const people = [...new Set([...joined.map((p) => p.userId), ...line.map((e) => e.memberId)])].filter((id) => id !== member.id);
    const summary = `${event.title.slice(0, 60)} · ${date} · ${time}${online ? '' : ` · ${placeName(saved.location)}`}`;
    await Promise.all(people.map((id) => notifyTeeChanged(id, member, eventId, summary)));
    notified = people.length;
  }
  return { event: saved, changed: true, notified };
}

import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { db } from '../db';
import { formatThaiDateBE, isEventEnded } from '../dateUtils';
import { MemberAuthError } from '../members/accounts';
import { hasOpenRisk } from '../members/trust';
import type { Member } from '../members/types';
import { myFairGroups } from './fairGroups';
import {
  MAX_OPEN_SPOT_TRIPS, SPOT_TRIP_EARLIEST, SPOT_TRIP_LATEST, SPOT_TRIP_MAX_PEOPLE,
  SPOT_TRIP_MEETING_POINTS, SPOT_TRIP_MIN_PEOPLE, SPOT_TRIP_TRANSPORT,
} from '../spotTripRules';

/**
 * Spot Buddy trips: a member invites others to a place from the Spots pillar.
 * Meeting strangers away from a public event is the riskiest thing the platform allows,
 * so the rules live here and the server applies them; the form only mirrors them.
 */
const TIME_RANGE = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const hostOf = (event: EventItem) => (event as { createdByMemberId?: string }).createdByMemberId;
const minutes = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));

/** Staff opened the place for meet-ups; nightlife venues and hidden drafts never qualify */
export function spotAllowsMeetups(spot: Pick<LifestyleSpotItem, 'meetupAllowed' | 'category' | 'publicationStatus'>): boolean {
  return spot.meetupAllowed === true && spot.category !== 'bar' && spot.publicationStatus !== 'draft';
}

async function openTripsOf(memberId: string): Promise<number> {
  return (await db.listAllEvents()).filter((ev) => ev.spotId && hostOf(ev) === memberId && ev.approvalStatus !== 'rejected' && !isEventEnded(ev)).length;
}

/** Has the member been to something before: checked in by a host, or a fair (their plan or a meet-up group) that is over */
async function hasAttendedBefore(member: Member): Promise<boolean> {
  for (const p of await db.listParticipations(member.id)) {
    const event = await db.findEventById(p.eventId);
    if (!event || hostOf(event) === member.id) continue;
    if (event.eventType === 'public_venue') {
      if (isEventEnded(event)) return true;
      continue;
    }
    if ((await db.getParticipant(p.eventId, member.id))?.checkedInAt) return true;
  }
  for (const group of await myFairGroups(member.id)) {
    const fair = await db.findEventById(group.fairId);
    if (fair && isEventEnded(fair)) return true;
  }
  return false;
}

/** Whether this member may open a trip right now, with the reason shown to them when they may not */
export async function spotTripHostStatus(member: Member): Promise<{ canHost: boolean; reason?: string }> {
  if (hasOpenRisk(member)) return { canHost: false, reason: 'สิทธิ์ชวนเพื่อนถูกพักไว้ระหว่างที่ทีมงานตรวจสอบบัญชีนี้' };
  if ((await openTripsOf(member.id)) >= MAX_OPEN_SPOT_TRIPS) return { canHost: false, reason: `เปิดทริปค้างไว้ได้ไม่เกิน ${MAX_OPEN_SPOT_TRIPS} ทริป รอให้ทริปเดิมจบก่อนนะ` };
  // Hosts the team approved are already vetted; everyone else joins something first
  if (member.hostApplication?.status !== 'approved' && !(await hasAttendedBefore(member))) {
    return { canHost: false, reason: 'ไปร่วมตี้หรืออีเวนต์สักครั้งก่อนนะ แล้วจะชวนเพื่อนไปที่ต่างๆ ได้' };
  }
  return { canHost: true };
}

/**
 * Checks a trip request and returns the fields the server sets itself.
 * The place, meeting point, travel and group size come from here, not from what the form sent.
 */
export async function prepareSpotTrip(member: Member | null, eventData: Record<string, unknown>): Promise<Partial<EventItem>> {
  const spot = typeof eventData.spotId === 'string' ? await db.findSpotById(eventData.spotId) : null;
  if (!spot || spot.publicationStatus === 'draft') throw new MemberAuthError('ไม่พบสถานที่นี้', 404);
  if (!spotAllowsMeetups(spot)) throw new MemberAuthError('สถานที่นี้ยังไม่เปิดให้นัดเจอ', 403);

  if (member) {
    const host = await spotTripHostStatus(member);
    if (!host.canHost) throw new MemberAuthError(host.reason ?? 'ยังชวนเพื่อนไม่ได้', 403);
  }

  const date = typeof eventData.date === 'string' ? eventData.date : '';
  if (!ISO_DAY.test(date) || date < new Date().toISOString().slice(0, 10)) throw new MemberAuthError('เลือกวันนัดเป็นวันนี้หรือหลังจากนี้');
  const range = TIME_RANGE.exec(typeof eventData.time === 'string' ? eventData.time : '');
  if (!range) throw new MemberAuthError('ระบุเวลาเริ่มและเวลาจบของทริป');
  const start = Number(range[1]) * 60 + Number(range[2]);
  const end = Number(range[3]) * 60 + Number(range[4]);
  if (start < minutes(SPOT_TRIP_EARLIEST) || end > minutes(SPOT_TRIP_LATEST) || end <= start) {
    throw new MemberAuthError(`ทริปชวนเพื่อนนัดได้เฉพาะช่วงกลางวัน ${SPOT_TRIP_EARLIEST} - ${SPOT_TRIP_LATEST} น. และจบในวันเดียว`);
  }

  const wanted = Math.round(Number(eventData.maxParticipants));
  const maxParticipants = Number.isFinite(wanted) ? Math.min(SPOT_TRIP_MAX_PEOPLE, Math.max(SPOT_TRIP_MIN_PEOPLE, wanted)) : SPOT_TRIP_MIN_PEOPLE;

  const meetingPoint = SPOT_TRIP_MEETING_POINTS.find((point) => point === eventData.meetingSpot) ?? SPOT_TRIP_MEETING_POINTS[0];

  return {
    eventType: 'community',
    locationType: 'physical',
    scheduleType: 'single',
    // Stored like every other ตี้ ("12 ต.ค. 2569"); the form sends the date input value "2026-10-12"
    date: formatThaiDateBE(date),
    endDate: undefined,
    spotId: spot.id,
    spotTitle: spot.title,
    location: `${spot.title}, ${[spot.district, spot.province].filter(Boolean).join(', ')}`,
    province: spot.province,
    meetingPoint: `${meetingPoint} ${spot.title}`,
    latitude: spot.latitude,
    longitude: spot.longitude,
    transportation: SPOT_TRIP_TRANSPORT,
    contactChannel: undefined,
    maxParticipants,
    minParticipants: SPOT_TRIP_MIN_PEOPLE,
  };
}

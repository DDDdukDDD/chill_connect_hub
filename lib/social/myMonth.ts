import { db } from '../db';
import { parseEventDateToTimestamp } from '../dateUtils';
import { tidyDisplayName } from '../displayName';
import { momentRepository } from '../moments';
import { targetKey, visitsOf, type VisitTargetType } from './visits';

/** Thailand has no daylight saving: the month turns at midnight UTC+7 */
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const PEOPLE_SHOWN = 3;

export interface MonthItem {
  targetType: VisitTargetType;
  targetId: string;
  title: string;
  image?: string;
  /** "สวนเบญจกิติ, กรุงเทพฯ" for places, the meeting point for events */
  place?: string;
  /** When the member was there (ISO) */
  at: string;
  /** The member already shared a moment from here */
  hasMoment: boolean;
  /** Meetups only: who else joined, a few faces and the count */
  people?: { name: string; avatar?: string }[];
  peopleCount?: number;
}

export interface MyMonth {
  /** "2026-10" */
  month: string;
  /** Places and fairs the member has been to this month */
  chill: MonthItem[];
  /** Meetups the member went to this month */
  connect: MonthItem[];
}

const monthKeyOf = (time: number) => new Date(time + BANGKOK_OFFSET_MS).toISOString().slice(0, 7);

/**
 * The member's month behind "Chill · Connect" on the home page.
 * Chill = places and fairs with a visit this month (marked, a moment or a check-in).
 * Connect = meetups they joined that took place this month, checked in or not; cancelled seats are no longer a
 * participation, so they do not count.
 */
export async function monthOf(memberId: string, now: number = Date.now()): Promise<MyMonth> {
  const month = monthKeyOf(now);
  const [visits, moments, participations] = await Promise.all([
    visitsOf(memberId),
    momentRepository.query({ statuses: ['published'], authorId: memberId, sort: 'newest', page: 1, limit: 500 }),
    db.listParticipations(memberId),
  ]);
  const shared = new Set(moments.items.flatMap((m) => (m.targetType && m.targetId ? [targetKey(m.targetType as VisitTargetType, m.targetId)] : [])));

  const chill: MonthItem[] = [];
  for (const visit of visits) {
    if (visit.targetType === 'community' || monthKeyOf(Date.parse(visit.at)) !== month) continue;
    const hasMoment = shared.has(targetKey(visit.targetType, visit.targetId));
    if (visit.targetType === 'spot') {
      const spot = await db.findSpotById(visit.targetId);
      if (!spot || spot.publicationStatus === 'draft') continue;
      chill.push({ targetType: 'spot', targetId: spot.id, title: spot.title, image: spot.image, place: [spot.district, spot.province].filter(Boolean).join(', '), at: visit.at, hasMoment });
    } else {
      const fair = await db.findEventById(visit.targetId);
      if (!fair) continue;
      chill.push({ targetType: 'fair', targetId: fair.id, title: fair.title, image: fair.image, place: fair.location, at: visit.at, hasMoment });
    }
  }

  const connect: MonthItem[] = [];
  for (const { eventId } of participations) {
    const event = await db.findEventById(eventId);
    if (!event || event.eventType !== 'community') continue;
    const day = parseEventDateToTimestamp(event.date);
    // Only meetups that already took place count as "been"
    if (!day || day > now || monthKeyOf(day) !== month) continue;
    const others = (await db.listParticipants(eventId)).filter((p) => p.userId !== memberId);
    connect.push({
      targetType: 'community',
      targetId: event.id,
      title: event.title,
      image: event.image,
      place: event.location,
      at: new Date(day).toISOString(),
      hasMoment: shared.has(targetKey('community', event.id)),
      people: others.slice(0, PEOPLE_SHOWN).map((p) => ({ name: tidyDisplayName(p.userName), avatar: p.userAvatar })),
      peopleCount: others.length,
    });
  }

  const newestFirst = (a: MonthItem, b: MonthItem) => b.at.localeCompare(a.at);
  return { month, chill: chill.sort(newestFirst), connect: connect.sort(newestFirst) };
}

import type { EventItem } from '@/data/mockData';
import { db } from '../db';
import { meetupTimes } from '../dateUtils';
import { isTripConfirmed, SPOT_TRIP_MIN_PEOPLE, TRIP_CANCEL_BEFORE_MS } from '../spotTripRules';
import { notifyTripCancelled } from './notifications';
import { waitlistStore } from './stores';

/**
 * A Spot Buddy trip that still has fewer than 3 people (host included) 2 hours before it starts is called off,
 * and everyone in it or queued for it is told (launch checklist, 2026-11-07). Meeting one stranger alone at a place
 * is what the 3-person rule is there to prevent, so the trip never goes ahead short.
 * Run by the hourly job (app/api/cron/hourly); doing it again finds nothing new.
 */
export { TRIP_CANCEL_BEFORE_MS };

const hostOf = (event: EventItem) => (event as { createdByMemberId?: string }).createdByMemberId;

export function isTripDueToCancel(event: EventItem, now: number): boolean {
  if (!event.spotId || event.eventType !== 'community') return false;
  if (event.status === 'cancelled' || event.status === 'ended' || event.approvalStatus === 'rejected') return false;
  const times = meetupTimes(event);
  if (!times || now < times.start - TRIP_CANCEL_BEFORE_MS || now > times.end) return false;
  return !isTripConfirmed({ participantsCount: event.participantsCount, minParticipants: event.minParticipants ?? SPOT_TRIP_MIN_PEOPLE });
}

export async function cancelShortTrips(now: number = Date.now()): Promise<{ cancelled: string[]; notified: number }> {
  const due = (await db.listAllEvents()).filter((event) => isTripDueToCancel(event, now));
  let notified = 0;
  for (const trip of due) {
    await db.updateEvent(trip.id, { status: 'cancelled', cancelledReason: 'not_enough_people', registrationOpen: false } as never);
    const [joined, line] = await Promise.all([db.listParticipants(trip.id), waitlistStore.line(trip.id)]);
    const people = new Set([hostOf(trip), ...joined.map((p) => p.userId), ...line.map((w) => w.memberId)].filter((id): id is string => !!id));
    for (const memberId of people) await notifyTripCancelled(memberId, trip.id, trip.title);
    notified += people.size;
  }
  return { cancelled: due.map((trip) => trip.id), notified };
}

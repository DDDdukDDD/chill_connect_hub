import type { EventItem } from '@/data/mockData';
import { db } from '@/lib/db';
import { isEventEnded } from '@/lib/dateUtils';
import { eventListItem } from '@/lib/listItems';
import { visitsOf } from '@/lib/social/visits';

/** How many a profile's "ตี้ที่ไป" tab holds at most */
const PAST_MEETUPS_SHOWN = 24;

/**
 * The ตี้ a member went to (a host check-in or a moment from there), for the profile's "ตี้ที่ไป" tab, newest first.
 * Only ended ones: a profile never says where its member will be next (owner 2026-11-01).
 */
export async function pastMeetupsOf(memberId: string): Promise<EventItem[]> {
  const went = (await visitsOf(memberId)).filter((visit) => visit.targetType === 'community');
  if (went.length === 0) return [];
  const byId = new Map((await db.listAllEvents()).map((event) => [event.id, event]));
  return went
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((visit) => byId.get(visit.targetId))
    .filter((event): event is EventItem => Boolean(event && event.approvalStatus === 'approved' && isEventEnded(event)))
    .slice(0, PAST_MEETUPS_SHOWN)
    .map(eventListItem);
}

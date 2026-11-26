import { sql } from '../db/postgres/client';
import { notifyTripReminder } from '../social/notifications';
import { TRIPS_ENABLED } from './service';
import { TRIP_DAY_HOUR, TRIP_ENDED_HOUR, TRIP_ENDED_NUDGE_DAYS } from './story';

/**
 * Nudges about one's own trip (owner 2026-11-27), run by the hourly job (app/api/cron/hourly):
 * - during the trip, once a day from 18:00 Bangkok time, when nothing was added to it that day: keep today's moments;
 * - the day after it ends, from 10:00, when it is still a draft: tell the story. Only trips that ended in the last week.
 * Without a nudge most trips are never told. Days are Bangkok days; a trip abroad is a few hours apart at most.
 */
const BANGKOK_MS = 7 * 60 * 60 * 1000;

export async function runTripReminders(now = new Date()): Promise<{ day: number; ended: number }> {
  if (!TRIPS_ENABLED) return { day: 0, ended: 0 };
  const local = new Date(now.getTime() + BANGKOK_MS);
  const today = local.toISOString().slice(0, 10);
  const hour = local.getUTCHours();
  const db = sql();
  let day = 0;
  let ended = 0;

  if (hour >= TRIP_DAY_HOUR) {
    const rows = await db`
      update app.trips t set nudged_on = ${today}::date
      from app.members a
      where a.id = t.author_id and t.status in ('draft', 'published')
        and ${today}::date between t.starts_on and t.ends_on
        and (t.nudged_on is null or t.nudged_on < ${today}::date)
        and not exists (select 1 from app.trip_items i where i.trip_id = t.id and i.taken_local::date = ${today}::date)
      returning t.id, t.title, a.legacy_id as author`;
    for (const r of rows) {
      await notifyTripReminder('trip_day', r.author as string, { id: r.id as string, title: r.title as string }, '/');
      day += 1;
    }
  }

  if (hour >= TRIP_ENDED_HOUR) {
    // Published already: nothing to say, just mark it
    await db`update app.trips set story_nudged = true where not story_nudged and status = 'published' and ends_on < ${today}::date`;
    const rows = await db`
      update app.trips t set story_nudged = true
      from app.members a
      where a.id = t.author_id and not t.story_nudged and t.status = 'draft'
        and t.ends_on < ${today}::date and t.ends_on >= ${today}::date - ${TRIP_ENDED_NUDGE_DAYS}::int
      returning t.id, t.title, a.legacy_id as author`;
    for (const r of rows) {
      await notifyTripReminder('trip_ended', r.author as string, { id: r.id as string, title: r.title as string }, `/trips/${r.id}/edit`);
      ended += 1;
    }
  }
  return { day, ended };
}

import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cronAuth';
import { cancelShortTrips } from '@/lib/social/tripAutoCancel';
import { endPastEvents } from '@/lib/db/endPastEvents';
import { copyEventPosters } from '@/lib/media/eventPosterBackfill';
import { moveAllQueues } from '@/lib/social/waitlist';
import { cleanMomentOrphans } from '@/lib/media/orphanCleanup';
import { runPlanReminders } from '@/lib/social/friendPlans';
import { rebuildCreatorDaily } from '@/lib/social/creatorDaily';
import { runTripReminders } from '@/lib/trips/reminders';

/**
 * Work that must happen at a time, not when someone opens a page. Called every hour at :07 by Vercel Cron (vercel.json,
 * Pro plan since 2026-11-25), which sends `Authorization: Bearer <CRON_SECRET>`; .github/workflows/hourly-jobs.yml can
 * call it by hand with the same header. Each job is safe to run twice.
 */
export const dynamic = 'force-dynamic';
// Photo copies take up to a minute of a run; the caller waits 120 s
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const results: Record<string, unknown> = {};
  const run = async (name: string, job: () => Promise<unknown>) => {
    try {
      results[name] = await job();
    } catch (error) {
      console.error(`[cron] ${name} failed`, error);
      results[name] = { error: true };
    }
  };
  await run('shortTrips', () => cancelShortTrips());
  // ตี้ and อีเวนต์ past their end get status ended (after trips are called off, so those stay cancelled)
  await run('endPastEvents', () => endPastEvents());
  // อีเวนต์ posters onto our own storage, 25 an hour (BE-459)
  await run('eventPosters', () => copyEventPosters());
  // Place photos moved to GitHub Actions on 2026-11-24 (.github/workflows/place-photos.yml): webp work is CPU time
  // After trips are called off, so seats freed there are offered in the same run
  await run('waitlists', () => moveAllQueues());
  // "ไปกัน" plans: the day-before reminder and the day-after question
  await run('friendPlans', () => runPlanReminders());
  // Trip stories: "keep today's moments" during a trip, "tell the story" after it (lib/trips/reminders.ts)
  await run('tripReminders', () => runTripReminders());
  // Once a day: moment files no post points to
  await run('momentOrphans', () => cleanMomentOrphans());
  // Admin creator numbers: today and yesterday from the action log and post views (docs/TRACEABILITY.md)
  await run('creatorDaily', () => rebuildCreatorDaily());
  return NextResponse.json({ success: true, results }, { headers: { 'Cache-Control': 'no-store' } });
}

import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cronAuth';
import { cancelShortTrips } from '@/lib/social/tripAutoCancel';
import { endPastEvents } from '@/lib/db/endPastEvents';
import { moveAllQueues } from '@/lib/social/waitlist';
import { cleanMomentOrphans } from '@/lib/media/orphanCleanup';
import { runPlanReminders } from '@/lib/social/friendPlans';
import { rebuildCreatorDaily } from '@/lib/social/creatorDaily';

/**
 * Work that must happen at a time, not when someone opens a page. Called every hour by the GitHub Actions schedule
 * (.github/workflows/hourly-jobs.yml) and once a day by Vercel Cron as a back-up (vercel.json); Vercel Hobby
 * allows only daily crons. Both send `Authorization: Bearer <CRON_SECRET>`. Each job is safe to run twice.
 */
export const dynamic = 'force-dynamic';

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
  // After trips are called off, so seats freed there are offered in the same run
  await run('waitlists', () => moveAllQueues());
  // "ไปกัน" plans: the day-before reminder and the day-after question
  await run('friendPlans', () => runPlanReminders());
  // Once a day: moment files no post points to
  await run('momentOrphans', () => cleanMomentOrphans());
  // Admin creator numbers: today and yesterday from the action log and post views (docs/TRACEABILITY.md)
  await run('creatorDaily', () => rebuildCreatorDaily());
  return NextResponse.json({ success: true, results }, { headers: { 'Cache-Control': 'no-store' } });
}

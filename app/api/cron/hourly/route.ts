import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { cancelShortTrips } from '@/lib/social/tripAutoCancel';
import { moveAllQueues } from '@/lib/social/waitlist';
import { cleanMomentOrphans } from '@/lib/media/orphanCleanup';
import { runPlanReminders } from '@/lib/social/friendPlans';

/**
 * Work that must happen at a time, not when someone opens a page. Called every hour by the GitHub Actions schedule
 * (.github/workflows/hourly-jobs.yml) and once a day by Vercel Cron as a back-up (vercel.json); Vercel Hobby
 * allows only daily crons. Both send `Authorization: Bearer <CRON_SECRET>`. Each job is safe to run twice.
 */
export const dynamic = 'force-dynamic';

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(request.headers.get('authorization') ?? '');
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
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
  // After trips are called off, so seats freed there are offered in the same run
  await run('waitlists', () => moveAllQueues());
  // "ไปกัน" plans: the day-before reminder and the day-after question
  await run('friendPlans', () => runPlanReminders());
  // Once a day: moment files no post points to
  await run('momentOrphans', () => cleanMomentOrphans());
  return NextResponse.json({ success: true, results }, { headers: { 'Cache-Control': 'no-store' } });
}

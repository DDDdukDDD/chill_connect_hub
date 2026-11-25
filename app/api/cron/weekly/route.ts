import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cronAuth';
import { runWeeklyEventScrape } from '@/lib/weeklyEventScrape';

/**
 * Weekly work, called Monday 03:17 Bangkok by Vercel Cron (vercel.json) with `Authorization: Bearer <CRON_SECRET>`;
 * .github/workflows/weekly-jobs.yml can call it by hand.
 * Apart from the hourly route because a scrape of every source takes minutes. Safe to call twice (6-day guard).
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const eventScrape = await runWeeklyEventScrape();
    return NextResponse.json({ success: true, results: { eventScrape } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[cron] weekly eventScrape failed', error);
    return NextResponse.json({ success: false, results: { eventScrape: { error: true } } }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

import { recordAudit } from './auditLog';
import { sql, USE_POSTGRES } from './db/postgres/client';
import { runScraperAndAIEngine } from './eventsStore';
import { WEEKLY_SCRAPE_GAP_DAYS } from './eventImportRules';

const MIN_GAP_MS = WEEKLY_SCRAPE_GAP_DAYS * 24 * 60 * 60 * 1000;
const SETTING_KEY = 'weekly_event_scrape';

/**
 * Runs every active อีเวนต์ source once a week (owner 2026-11-23: no source had run for seven weeks, BE-455).
 * New items arrive as the admin button makes them: pending for review unless auto-publish is on.
 * The last run is kept in app.app_settings, not the JSON store, which on Vercel is per server.
 */
export async function runWeeklyEventScrape(now: Date = new Date()) {
  if (!USE_POSTGRES) return { skipped: 'no database' };
  const [row] = await sql()`select value from app.app_settings where key = ${SETTING_KEY}`;
  const lastRunAt = Date.parse((row?.value as { lastRunAt?: string } | undefined)?.lastRunAt ?? '');
  if (Number.isFinite(lastRunAt) && now.getTime() - lastRunAt < MIN_GAP_MS) return { skipped: 'ran this week', lastRunAt: new Date(lastRunAt).toISOString() };

  // Claimed before the run, so a slow or failed run is not started again by the next call
  await sql()`insert into app.app_settings (key, value) values (${SETTING_KEY}, ${sql().json({ lastRunAt: now.toISOString() })})
              on conflict (key) do update set value = excluded.value, updated_at = now()`;
  const result = await runScraperAndAIEngine();
  const failed = result.sourceResults.filter((s) => s.error).map((s) => s.sourceId);
  const skipped = result.sourceResults.reduce((n, s) => n + s.skipped, 0);
  recordAudit(null, 'scrape.events', `ดึงอีเวนต์รายสัปดาห์: พบ ${result.totalScanned} นำเข้า ${result.newCount} ซ้ำ ${result.duplicateCount} ข้าม ${skipped}${failed.length ? ` แหล่งที่ผิดพลาด ${failed.join(', ')}` : ''}`, { type: 'source' });
  return { newCount: result.newCount, duplicateCount: result.duplicateCount, skipped, failedSources: failed };
}

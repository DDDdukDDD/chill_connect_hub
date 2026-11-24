import { cacheManager } from '../cache';
import { ROLLING_SAMPLE_IDS } from '../sampleEventDates';
import { sql, USE_POSTGRES } from './postgres/client';

/**
 * Sets `status: 'ended'` on ตี้ and อีเวนต์ whose end has passed (AGENTS.md "Ended Events Filter"). Pages already hide
 * them by date (isEventEnded), but admin lists, JSON-LD and anything reading the stored status see the truth too.
 * - `ends_at` is the end time of a ตี้, or 23:59:59 Bangkok on the last day when there is no time (lib/db/postgres/rows.mjs).
 * - The seed ตี้ whose dates roll forward when shown are left alone (ROLLING_SAMPLE_IDS, lib/sampleEventDates.ts).
 *   Not `is_sample`: that also marks staff-made ตี้ without a host, which do end.
 * - Recurring events and ones already ended or cancelled are skipped. Safe to run twice.
 * The write moves app.table_versions (migration 0035), so every server's cached list refreshes by itself.
 */
export async function endPastEvents(): Promise<{ ended: number } | { skipped: 'no database' }> {
  if (!USE_POSTGRES) return { skipped: 'no database' };
  const rows = await sql()`
    update app.events
       set details = details || '{"status":"ended"}'::jsonb, registration_open = false
     where ends_at < now()
       and not (event_type = 'community' and slug = any(${ROLLING_SAMPLE_IDS as string[]}))
       and coalesce(details->>'status', '') not in ('ended', 'cancelled')
       and coalesce(details->>'scheduleType', '') <> 'recurring'
    returning id`;
  if (rows.length) cacheManager.invalidateTag('events');
  return { ended: rows.length };
}

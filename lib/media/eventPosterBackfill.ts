import { cacheManager } from '../cache';
import { sql, USE_POSTGRES } from '../db/postgres/client';
import { OWN_MEDIA_HOSTS } from './ownMedia';
import { copyPosterToOwnMedia, eachLimited } from './posterCopy';

/** Posters copied per hourly run: about 1 s each, four at a time, well inside the cron's time */
const PER_RUN = 25;
/** A poster that could not be copied (site refuses, link gone) is tried again after this */
const RETRY_AFTER = '7 days';

/**
 * Moves the posters of ตี้ and อีเวนต์ that have not ended yet onto our own storage (BE-459), a few each hour, so
 * events imported before the copy existed, or whose copy failed at import, stop depending on the organiser's site and
 * on Vercel's resize quota. Sample rows with posters in /public are left alone (they are not links).
 */
export async function copyEventPosters(): Promise<{ copied: number; failed: number } | { skipped: string }> {
  if (!USE_POSTGRES) return { skipped: 'no database' };
  const ownPrefixes = OWN_MEDIA_HOSTS.map((host) => `https://${host}/%`);
  const rows = await sql()`
    select id, cover_image_url as url from app.events
     where ends_at > now()
       and approval_status in ('approved', 'pending')
       and cover_image_url like 'http%'
       and not (cover_image_url like any(${ownPrefixes}))
       and coalesce((details->>'posterCopyFailedAt')::timestamptz, 'epoch') < now() - ${RETRY_AFTER}::interval
     order by starts_at
     limit ${PER_RUN}`;
  let copied = 0;
  let failed = 0;
  await eachLimited(rows as unknown as { id: string; url: string }[], 4, async (row) => {
    const own = await copyPosterToOwnMedia(row.url);
    if (own && own !== row.url) {
      // Only if staff did not change the poster in the meantime
      await sql()`update app.events set cover_image_url = ${own} where id = ${row.id} and cover_image_url = ${row.url}`;
      copied++;
    } else if (!own) {
      await sql()`update app.events set details = details || jsonb_build_object('posterCopyFailedAt', now()) where id = ${row.id}`;
      failed++;
    }
  });
  if (copied || failed) cacheManager.invalidateTag('events');
  return { copied, failed };
}

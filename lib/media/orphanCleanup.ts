import { mediaStorage } from './index';
import { sql, USE_POSTGRES } from '../db/postgres/client';

/**
 * Deletes moment photos and clips no post points to (owner 2026-11-08): uploads of a post that then failed, photos
 * added in an edit that was not saved, a clip uploaded before its post went through. Runs from the hourly job but
 * works at most once a day.
 *
 * Only the `moments` folder: avatar links are copied onto ตี้, comments and notifications, so an "unused" avatar may
 * still show somewhere. Files are matched by path (/moments/name.webp), never by host, and must be 3 days old, so a
 * post still uploading is never touched.
 */
const FOLDER = 'moments';
const MIN_AGE_MS = 3 * 24 * 60 * 60 * 1000;
const EVERY_MS = 20 * 60 * 60 * 1000;
const MAX_DELETES = 300;
const STAMP_KEY = 'moment_orphans_cleaned_at';

const pathOf = (url: string) => {
  try {
    return decodeURIComponent(new URL(url, 'https://x.invalid').pathname).replace(/^\/uploads\//, '/');
  } catch {
    return url;
  }
};

/** `dryRun`: count only, delete nothing and leave the daily stamp alone */
export async function cleanMomentOrphans({ now = Date.now(), dryRun = false } = {}) {
  if (!USE_POSTGRES || !mediaStorage.listFiles) return { skipped: 'no database or listing' };
  const db = sql();
  const [stamp] = await db`select value from app.app_settings where key = ${STAMP_KEY}`;
  const last = typeof stamp?.value?.at === 'string' ? Date.parse(stamp.value.at) : 0;
  if (!dryRun && now - last < EVERY_MS) return { skipped: 'ran today' };

  const files = (await mediaStorage.listFiles()).filter((file) => file.folder === FOLDER);
  // Every post in any state counts, so a hidden or removed moment never loses its files here
  const rows = await db`
    select url from app.moment_images
    union select video_url from app.moments where video_url is not null
    union select video_preview_url from app.moments where video_preview_url is not null`;
  const used = new Set(rows.map((r) => pathOf(r.url as string)));
  const old = files.filter((file) => now - Date.parse(file.createdAt) > MIN_AGE_MS);
  const unused = old.filter((file) => !used.has(pathOf(file.url)));

  // A wrong read (empty list, other host) would look like "nothing is used": stop instead of deleting half the folder
  if (old.length > 20 && unused.length > old.length / 2) {
    console.error(`[orphans] ${unused.length} of ${old.length} moment files look unused; nothing deleted`);
    return { stopped: true, unused: unused.length, files: old.length };
  }
  if (dryRun) return { dryRun: true, unused: unused.length, checked: old.length, total: files.length, sample: unused.slice(0, 3).map((f) => pathOf(f.url)) };
  let deleted = 0;
  let freedBytes = 0;
  for (const file of unused.slice(0, MAX_DELETES)) {
    if (await mediaStorage.delete(file.key)) {
      deleted += 1;
      freedBytes += file.size;
    }
  }
  await db`insert into app.app_settings (key, value) values (${STAMP_KEY}, ${db.json({ at: new Date(now).toISOString(), deleted })})
           on conflict (key) do update set value = excluded.value, updated_at = now()`;
  return { deleted, freedBytes, checked: old.length };
}

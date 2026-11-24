import { cacheManager } from '../cache';
import { sql, USE_POSTGRES } from '../db/postgres/client';
import { copyPosterToOwnMedia, eachLimited, isOwnMedia } from './posterCopy';

/**
 * Copies place photos from Wikimedia and the TAT Data API onto our own storage (R2, `places/<hash>.o.webp` with its
 * `.s.webp` small copy), owner 2026-11-23. Wikimedia photos went through Vercel's image resizer, whose monthly quota
 * ran out (402, broken photos); TAT pictures were hotlinked from dmc.tatdataapi.io at up to ~3 MB each.
 *
 * - Published places only; the cover and the first gallery photos (GALLERY_KEEP), so R2 stays well inside its free
 *   10 GB. Later gallery photos keep their link.
 * - Every write to app.places makes every server read the whole catalog again (lib/db/postgres/tableVersions.ts,
 *   Supabase egress), so a run copies a large batch and writes it in ONE transaction, never row by row.
 * - A run stops starting copies after TIME_BUDGET_MS: the hourly cron is called with a 120 s limit.
 * - A place whose photo cannot be copied is marked and tried again after RETRY_AFTER; its link stays as it was.
 * Thailand Tourism Directory photos are left alone: that server sends an incomplete certificate chain, which Node
 * refuses (browsers fill it in), and there are 10,000+ of them.
 */
const COPY_HOSTS = ['upload.wikimedia.org', 'thumb.wikimedia.org', 'commons.wikimedia.org', 'dmc.tatdataapi.io'];
const GALLERY_KEEP = 3;
const PLACES_PER_RUN = 60;
const PHOTOS_PER_RUN = 150;
const TIME_BUDGET_MS = 60_000;
const RETRY_AFTER = '7 days';

const shouldCopy = (url: unknown): url is string => {
  if (typeof url !== 'string' || isOwnMedia(url)) return false;
  try {
    return COPY_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
};

interface PlaceRow {
  id: string;
  image: string | null;
  gallery: unknown;
}

export async function copyPlacePhotos(): Promise<{ places: number; copied: number; failed: number } | { skipped: string }> {
  if (!USE_POSTGRES) return { skipped: 'no database' };
  const hostPatterns = COPY_HOSTS.map((host) => `https://${host}/%`);
  const rows = (await sql()`
    select id, details->>'image' as image, details->'galleryImages' as gallery from app.places
     where publication_status = 'published'
       and coalesce(details->>'publicationStatus', 'published') <> 'draft'
       and coalesce((details->>'photoCopyFailedAt')::timestamptz, 'epoch') < now() - ${RETRY_AFTER}::interval
       and (details->>'image' like any(${hostPatterns})
            or exists (select 1 from jsonb_array_elements_text(case when jsonb_typeof(details->'galleryImages') = 'array' then details->'galleryImages' else '[]'::jsonb end) with ordinality g(url, n)
                        where g.n <= ${GALLERY_KEEP} and g.url like any(${hostPatterns})))
     order by popularity desc, slug
     limit ${PLACES_PER_RUN}`) as unknown as PlaceRow[];
  if (rows.length === 0) return { places: 0, copied: 0, failed: 0 };

  // Links to copy this run, each once even when several places share a photo
  const wanted: string[] = [];
  for (const row of rows) {
    const gallery = Array.isArray(row.gallery) ? row.gallery.slice(0, GALLERY_KEEP) : [];
    for (const url of [row.image, ...gallery]) if (shouldCopy(url) && !wanted.includes(url)) wanted.push(url);
  }
  const started = Date.now();
  const copies = new Map<string, string | null>();
  await eachLimited(wanted.slice(0, PHOTOS_PER_RUN), 6, async (url) => {
    if (Date.now() - started > TIME_BUDGET_MS) return;
    copies.set(url, await copyPosterToOwnMedia(url, 'places'));
  });

  let copied = 0;
  let failed = 0;
  const swap = (url: unknown) => (typeof url === 'string' && copies.get(url)) || url;
  await sql().begin(async (tx) => {
    for (const row of rows) {
      const gallery = Array.isArray(row.gallery) ? (row.gallery as unknown[]) : [];
      const urls = [row.image, ...gallery.slice(0, GALLERY_KEEP)].filter(shouldCopy);
      if (urls.length === 0 || !urls.every((url) => copies.has(url))) continue; // not reached this run
      if (urls.some((url) => copies.get(url) === null)) {
        failed++;
        await tx`update app.places set details = details || jsonb_build_object('photoCopyFailedAt', now()) where id = ${row.id}`;
      }
      const image = swap(row.image) as string | null;
      const nextGallery = gallery.map((url, index) => (index < GALLERY_KEEP ? swap(url) : url));
      if (image === row.image && nextGallery.every((url, index) => url === gallery[index])) continue;
      copied++;
      // Only if staff did not change the photos in the meantime
      if (Array.isArray(row.gallery)) {
        await tx`
          update app.places set details = details || ${tx.json({ image, galleryImages: nextGallery } as never)}
           where id = ${row.id} and details->>'image' is not distinct from ${row.image} and details->'galleryImages' = ${tx.json(gallery as never)}`;
      } else {
        await tx`
          update app.places set details = details || jsonb_build_object('image', ${image}::text)
           where id = ${row.id} and details->>'image' is not distinct from ${row.image}`;
      }
    }
  });
  if (copied || failed) cacheManager.invalidateTag('spots');
  return { places: rows.length, copied, failed };
}

import { createHash } from 'node:crypto';
import { OWN_MEDIA_HOSTS, smallCopyKeys } from './ownMedia';
import { r2Config, r2Fetch, r2ObjectUrl, R2_CACHE_CONTROL, type R2Config } from './r2';

/**
 * Our own copy of an อีเวนต์ poster on R2 (owner 2026-11-23, BE-459). Posters used to load from the organiser's site
 * through Vercel's image resizer, whose 5,000 monthly resizes ran out (every poster answered 402); some sites also
 * refuse other sites' pages (ThaiTicketMajor: 403) or delete old posters. A copy kept as `posters/<hash>.o.webp`
 * (at most 1600 px) with a small copy `.s.webp` (800 px) is served from media.chillwaa.com: no resize quota, no
 * egress charge, and lib/optimizedImage.ts gives 640 px-or-less screens the small copy.
 * The name is a hash of the source link, so the same poster is stored once however often it is imported.
 */

const FOLDER = 'posters';
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20_000;
const ORIGINAL_LONG_SIDE = 1600;
const SMALL_LONG_SIDE = 800;

export const isOwnMedia = (url: string) => {
  try {
    return (OWN_MEDIA_HOSTS as readonly string[]).includes(new URL(url).hostname);
  } catch {
    return false;
  }
};

/**
 * Bigger versions of a link to try before the link itself: Visit Bangkok (Strapi) feeds link a 156 px `thumbnail_`
 * file, and the same name without the prefix is the full poster. The copy's name stays the hash of `src`.
 */
function fullSizeFirst(src: string): string[] {
  const full = src.replace(/^(https:\/\/cms-visit\.bangkok\.go\.th\/uploads\/)thumbnail_/, '$1');
  return full === src ? [src] : [full, src];
}

/** The organiser's file, as a browser on their own site would ask for it (some sites check the Referer) */
async function download(src: string): Promise<Buffer | null> {
  const url = new URL(src);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChillwaaBot/1.0)', Accept: 'image/avif,image/webp,image/*,*/*;q=0.8', Referer: `${url.origin}/` },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok || !(response.headers.get('content-type') ?? '').startsWith('image/')) return null;
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > MAX_SOURCE_BYTES) return null;
  const body = Buffer.from(await response.arrayBuffer());
  return body.byteLength > 0 && body.byteLength <= MAX_SOURCE_BYTES ? body : null;
}

async function put(config: R2Config, key: string, body: Buffer): Promise<boolean> {
  const response = await r2Fetch(config, r2ObjectUrl(config, key), {
    method: 'PUT',
    body: new Uint8Array(body),
    headers: { 'content-type': 'image/webp', 'content-length': String(body.byteLength), 'cache-control': R2_CACHE_CONTROL },
  });
  return response.ok;
}

/**
 * The link of our copy of `src` (made now if it is not stored yet), `src` itself when it is already ours, or null when
 * the poster cannot be copied (no R2 settings, the site refuses, not an image). Never throws. Place photos use the same
 * copy in their own `folder` (lib/media/placePhotoBackfill.ts).
 */
export async function copyPosterToOwnMedia(src: string | undefined, folder = FOLDER): Promise<string | null> {
  if (!src) return null;
  if (isOwnMedia(src)) return src;
  const config = r2Config();
  if (!config) return null;
  try {
    const { original, small } = smallCopyKeys(`${folder}/${createHash('sha256').update(src).digest('hex').slice(0, 32)}.webp`);
    const publicUrl = `${config.publicUrl}/${original}`;
    // Already copied by an earlier import: nothing to download
    const head = await r2Fetch(config, r2ObjectUrl(config, original), { method: 'HEAD' });
    if (head.ok) return publicUrl;
    let source: Buffer | null = null;
    for (const candidate of fullSizeFirst(src)) {
      source = await download(candidate).catch(() => null);
      if (source) break;
    }
    if (!source) return null;
    const { default: sharp } = await import('sharp');
    const image = sharp(source, { failOn: 'error', limitInputPixels: 80_000_000 }).rotate();
    const [big, little] = await Promise.all([
      image.clone().resize({ width: ORIGINAL_LONG_SIDE, height: ORIGINAL_LONG_SIDE, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
      image.clone().resize({ width: SMALL_LONG_SIDE, height: SMALL_LONG_SIDE, fit: 'inside', withoutEnlargement: true }).webp({ quality: 75 }).toBuffer(),
    ]);
    // The small copy first: a stored original always has its copy (lib/media/ownMedia.ts smallCopyOf)
    if (!(await put(config, small, little))) return null;
    if (!(await put(config, original, big))) return null;
    return publicUrl;
  } catch (error) {
    console.error('[posters] copy failed', src, error);
    return null;
  }
}

/** Runs `job` over `items` with at most `limit` at a time */
export async function eachLimited<T>(items: T[], limit: number, job: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await job(items[next++]);
  }));
}

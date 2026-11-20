/**
 * Where our own uploads live, for checks that run in the browser too (no settings needed): Cloudflare R2 behind our
 * domain (live, and the dev bucket), plus Vercel Blob until every old file has moved (db/move-media-to-r2.mjs).
 */
export const OWN_MEDIA_HOSTS = ['media.chillwaa.com', 'media-dev.chillwaa.com'] as const;
export const BLOB_MEDIA_HOST = 'wf6n42ar74k77ycg.public.blob.vercel-storage.com';

const BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/([\w-]+)\//i;

/**
 * Small copies (owner 2026-11-20): the phone makes a second, smaller file of each photo (lib/media/uploadPhoto.ts) and R2
 * keeps both, `name.o.webp` and `name.s.webp`. Only a name with `.o.` has a copy, so older photos are never asked for a
 * file that does not exist. Screens that need 640 px or less get the copy (lib/optimizedImage.ts) instead of a resize
 * on Vercel's monthly quota.
 */
const WITH_SMALL_COPY = /\.o\.(webp|jpg|png|avif)$/i;
const SMALL_COPY = /\.s\.(webp|jpg|png|avif)$/i;

/** The link of a photo's small copy, or null when it has none (another host, an older upload) */
export function smallCopyOf(url: string): string | null {
  if (!WITH_SMALL_COPY.test(url)) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !(OWN_MEDIA_HOSTS as readonly string[]).includes(parsed.hostname) || parsed.search) return null;
    return url.replace(WITH_SMALL_COPY, '.s.$1');
  } catch {
    return null;
  }
}

/** For a small copy's path or link, the original's; null for anything else (cleanup keeps a copy while its original is used) */
export function originalOfSmallCopy(path: string): string | null {
  return SMALL_COPY.test(path) ? path.replace(SMALL_COPY, '.o.$1') : null;
}

/** The storage key of a photo stored with a small copy, and the copy's (lib/media/adapters/r2StorageAdapter.ts) */
export function smallCopyKeys(key: string): { original: string; small: string } {
  const dot = key.lastIndexOf('.');
  return { original: `${key.slice(0, dot)}.o${key.slice(dot)}`, small: `${key.slice(0, dot)}.s${key.slice(dot)}` };
}

/** The folder of one of our uploaded files ('moments', 'avatars', 'events'…), or null for any other link */
export function ownUploadFolder(url: string): string | null {
  const local = /^\/uploads\/([\w-]+)\//.exec(url);
  if (local) return local[1];
  const blob = BLOB_URL.exec(url);
  if (blob) return blob[1];
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !(OWN_MEDIA_HOSTS as readonly string[]).includes(parsed.hostname)) return null;
    return /^\/([\w-]+)\//.exec(parsed.pathname)?.[1] ?? null;
  } catch {
    return null;
  }
}

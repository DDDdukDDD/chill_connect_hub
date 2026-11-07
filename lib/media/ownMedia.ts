/**
 * Where our own uploads live, for checks that run in the browser too (no settings needed): Cloudflare R2 behind our
 * domain (live, and the dev bucket), plus Vercel Blob until every old file has moved (db/move-media-to-r2.mjs).
 */
export const OWN_MEDIA_HOSTS = ['media.chillwaa.com', 'media-dev.chillwaa.com'] as const;
export const BLOB_MEDIA_HOST = 'wf6n42ar74k77ycg.public.blob.vercel-storage.com';

const BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/([\w-]+)\//i;

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

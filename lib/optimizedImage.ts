import { smallCopyOf } from './media/ownMedia';

/**
 * Photos kept in /public are often ~1 MB originals, and organisers' posters (ThaiRun, IMPACT, QSNCC) are as big.
 * They go through the Next.js image optimizer at the width a card shows (AVIF/WebP, tens of KB).
 * Remote images are resized only from the hosts below (also `images.remotePatterns` in next.config.ts), so the
 * optimizer is never an open proxy; other links (Unsplash with its own sizes) stay as they are.
 * Members' uploads on Vercel Blob are listed by our own store's host, not `*.blob.vercel-storage.com`, which would
 * resize files from anyone's store on our quota.
 * Uploads on Cloudflare R2 (media.chillwaa.com, lib/media/ownMedia.ts) are NOT resized since 2026-11-20: the month's
 * 5,000 Vercel resizes ran out and every new photo answered 402, so new posts showed broken on /moments. They are
 * already made small on the phone (lib/media/compressor.ts: at most 1600 px and 1 MB) and R2 serves them with no
 * egress charge, so they go out as they are. Since the same day each new photo also has a small copy made on the phone
 * (lib/media/uploadPhoto.ts), which screens asking for 640 px or less get instead.
 * `width` must be one of the optimizer sizes in next.config.ts: 64, 96, 128, 256, 384, 640, 828, 1080 (1920 for a
 * full-width photo). Each width is a separate resize on Vercel's monthly quota, so reuse these rather than add one.
 */
export const OPTIMIZED_REMOTE_IMAGES = [
  { hostname: 'wf6n42ar74k77ycg.public.blob.vercel-storage.com', pathname: '/**' },
  { hostname: 'storage.googleapis.com', pathname: '/s.race.thai.run/**' },
  { hostname: 'www.impact.co.th', pathname: '/**' },
  { hostname: 'images.prismic.io', pathname: '/qsncc/**' },
  { hostname: 'cms-visit.bangkok.go.th', pathname: '/**' },
  // Places imported from OpenStreetMap/Wikidata: Wikimedia refuses link-preview crawlers (LINE, Facebook: 403), so
  // share cards must load these through our own domain, and the originals run to 3840 px / ~3 MB
  { hostname: 'upload.wikimedia.org', pathname: '/**' },
  { hostname: 'thumb.wikimedia.org', pathname: '/**' },
] as const;

export function isOptimizedRemote(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && OPTIMIZED_REMOTE_IMAGES.some((p) => url.hostname === p.hostname && url.pathname.startsWith(p.pathname.replace('/**', '/')));
  } catch {
    return false;
  }
}

/** Only web, site-local, inline-image and blob links reach an `src`; anything else (`javascript:`, odd schemes) is dropped. */
const SAFE_IMAGE_SRC = /^(?:https?:\/\/|\/(?!\/)|data:image\/|blob:)/i;

/** A link for an `<img src>` as it is (photo previews, account pictures): unsafe schemes dropped, the rest escaped. */
export function safeImageSrc(src: string | null | undefined): string {
  return src && SAFE_IMAGE_SRC.test(src) ? encodeImageLink(src) : '';
}

/** Up to this width a photo's small copy (800 px, 384 for a profile picture) is sharp enough */
const SMALL_COPY_MAX_WIDTH = 640;

export function optimizedImage(src: string | undefined, width: number): string {
  if (!src || !SAFE_IMAGE_SRC.test(src)) return '';
  // An upload made since 2026-11-20 carries the phone's small copy (lib/media/uploadPhoto.ts): no resize needed
  const small = width <= SMALL_COPY_MAX_WIDTH ? smallCopyOf(src) : null;
  if (small) return encodeImageLink(small);
  // The app icons are already small (192 px at most): resizing them only spent the monthly quota
  const local = src.startsWith('/') && !src.startsWith('/_next/') && !src.startsWith('//') && !src.startsWith('/icons/');
  if (local || isOptimizedRemote(src)) return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
  return encodeImageLink(unsplashAtWidth(src, width));
}

/** A member's face: shown at 48 px or less on most screens, while the file behind it can be 800 px (one was 1 MB, 2026-11-03) */
export function avatarImage(src: string | null | undefined, width = 128): string | undefined {
  return optimizedImage(src ?? undefined, width) || undefined;
}

/**
 * Unsplash resizes by its own link parameters: ask for the card's width in WebP/AVIF instead of the 800–1200 px JPEG
 * the sample data names (the landing's sample photos were ~220 KB each on a phone, 2026-10-29).
 */
function unsplashAtWidth(src: string, width: number): string {
  if (!src.startsWith('https://images.unsplash.com/')) return src;
  try {
    const url = new URL(src);
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', '70');
    url.searchParams.set('auto', 'format');
    return url.toString();
  } catch {
    return src;
  }
}

/** Escapes spaces, quotes and angle brackets in a passed-through link; escapes already in it (`%20`, `%2F`) stay as they are. */
function encodeImageLink(src: string): string {
  return encodeURI(src).replace(/%25([0-9A-Fa-f]{2})/g, '%$1');
}

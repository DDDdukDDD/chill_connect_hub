/**
 * Photos kept in /public are often ~1 MB originals, and organisers' posters (ThaiRun, IMPACT, QSNCC) are as big.
 * They go through the Next.js image optimizer at the width a card shows (AVIF/WebP, tens of KB).
 * Remote images are resized only from the hosts below (also `images.remotePatterns` in next.config.ts), so the
 * optimizer is never an open proxy; other links (Unsplash with its own sizes, member uploads) stay as they are.
 * `width` must be one of the optimizer sizes: 96, 128, 256, 384, 640, 750, 828, 1080.
 */
export const OPTIMIZED_REMOTE_IMAGES = [
  { hostname: 'storage.googleapis.com', pathname: '/s.race.thai.run/**' },
  { hostname: 'www.impact.co.th', pathname: '/**' },
  { hostname: 'images.prismic.io', pathname: '/qsncc/**' },
  { hostname: 'cms-visit.bangkok.go.th', pathname: '/**' },
] as const;

function isOptimizedRemote(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && OPTIMIZED_REMOTE_IMAGES.some((p) => url.hostname === p.hostname && url.pathname.startsWith(p.pathname.replace('/**', '/')));
  } catch {
    return false;
  }
}

/** Only web, site-local, inline-image and blob links reach an `src`; anything else (`javascript:`, odd schemes) is dropped. */
const SAFE_IMAGE_SRC = /^(?:https?:\/\/|\/(?!\/)|data:image\/|blob:)/i;

export function optimizedImage(src: string | undefined, width: number): string {
  if (!src || !SAFE_IMAGE_SRC.test(src)) return '';
  const local = src.startsWith('/') && !src.startsWith('/_next/') && !src.startsWith('//');
  return local || isOptimizedRemote(src) ? `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75` : src;
}

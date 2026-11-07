import { MAX_VIDEO_SECONDS } from '@/lib/moments/types';

/**
 * Shrinks a member's clip on their own phone before it uploads (owner 2026-11-07, after Blob transfer reached 75% of
 * the free 10 GB): only the chosen 15-second part, at most 720 px on the short side, H.264 in MP4. A phone clip of
 * 20–40 MB becomes a few MB, and every view downloads that instead of the original. MP4/H.264 also plays on every
 * device, which iPhone `.mov` (often HEVC) does not.
 *
 * Uses the browser's own encoder (WebCodecs) through Mediabunny, loaded only when a clip is posted. When this device
 * cannot do it (an older browser, a codec it cannot read), the answer is null and the original uploads as before.
 */

const SHORT_SIDE = 720;
const MAX_FRAME_RATE = 30;
/** The silent loop feeds and grids autoplay (docs/VIDEO_PLAN.md, stage 1): about 150–300 KB */
const PREVIEW_SECONDS = 3;
const PREVIEW_SHORT_SIDE = 360;
const PREVIEW_FRAME_RATE = 24;

export type CompressedClip = { file: File; durationS: number; preview: File | null };
type Mediabunny = typeof import('mediabunny');

/** Width and height with the short side at most `shortSide`, both even (H.264 encoders refuse odd sizes) */
function fitShortSide(width: number, height: number, shortSide: number) {
  const scale = Math.min(1, shortSide / Math.max(1, Math.min(width, height)));
  const even = (n: number) => Math.max(2, Math.round((n * scale) / 2) * 2);
  return { width: even(width), height: even(height) };
}

export async function compressClip(file: File, startS: number, fullSeconds: number, onProgress?: (share: number) => void): Promise<CompressedClip | null> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoDecoder === 'undefined') return null;
  try {
    const mb = await import('mediabunny');
    if (!(await mb.canEncodeVideo('avc'))) return null;
    const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
    const target = new mb.BufferTarget();
    const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target });
    const end = Math.min(fullSeconds, startS + MAX_VIDEO_SECONDS);
    const conversion = await mb.Conversion.init({
      input,
      output,
      trim: { start: startS, end },
      video: async (track) => ({
        ...fitShortSide(await track.getDisplayWidth(), await track.getDisplayHeight(), SHORT_SIDE),
        fit: 'fill',
        codec: 'avc',
        quality: new mb.Quality('medium'),
        frameRate: MAX_FRAME_RATE,
        forceTranscode: true,
      }),
      // Sound is copied as it is when the file allows (iPhone AAC), otherwise re-encoded to AAC
      audio: { codec: 'aac' },
      showWarnings: false,
    });
    // A clip that would lose its picture or its sound here is better sent whole
    if (!conversion.isValid || conversion.discardedTracks.some((t) => t.reason !== 'discarded_by_user' && t.reason !== 'max_track_count_of_type_reached')) return null;
    conversion.onProgress = (share) => onProgress?.(share);
    await conversion.execute();
    if (!target.buffer || target.buffer.byteLength >= file.size) return null;
    const small = new File([target.buffer], 'clip.mp4', { type: 'video/mp4' });
    return { file: small, durationS: end - startS, preview: await makePreview(mb, small) };
  } catch {
    return null;
  }
}

/** The first seconds of the small clip, smaller still and silent; null when it fails, and the post then simply has none */
async function makePreview(mb: Mediabunny, clip: File): Promise<File | null> {
  try {
    const target = new mb.BufferTarget();
    const conversion = await mb.Conversion.init({
      input: new mb.Input({ source: new mb.BlobSource(clip), formats: mb.ALL_FORMATS }),
      output: new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target }),
      trim: { start: 0, end: PREVIEW_SECONDS },
      video: async (track) => ({
        ...fitShortSide(await track.getDisplayWidth(), await track.getDisplayHeight(), PREVIEW_SHORT_SIDE),
        fit: 'fill',
        codec: 'avc',
        quality: new mb.Quality('low'),
        frameRate: PREVIEW_FRAME_RATE,
        forceTranscode: true,
      }),
      audio: { discard: true },
      showWarnings: false,
    });
    if (!conversion.isValid || conversion.discardedTracks.some((t) => t.track.type === 'video')) return null;
    await conversion.execute();
    return target.buffer ? new File([target.buffer], 'clip-preview.mp4', { type: 'video/mp4' }) : null;
  } catch {
    return null;
  }
}

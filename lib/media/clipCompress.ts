import { MAX_VIDEO_SECONDS } from '@/lib/moments/types';
import { drawOverlays, type FunSticker, type PhotoText } from './photoEdit';
import { canvasHasFilter, drawFiltered } from './clipFilter';
import { findTrack, type ClipMusic, type MusicTrack } from './musicLibrary';

/**
 * Shrinks a member's clip on their own phone before it uploads (owner 2026-11-07, after Blob transfer reached 75% of
 * the free 10 GB): only the chosen part (up to 30 s since 2026-11-09), at most 720 px on the short side, H.264 in MP4. A phone clip of
 * 20–40 MB becomes a few MB, and every view downloads that instead of the original. MP4/H.264 also plays on every
 * device, which iPhone `.mov` (often HEVC) does not.
 *
 * Uses the browser's own encoder (WebCodecs) through Mediabunny, loaded only when a clip is posted. When this device
 * cannot do it (an older browser, a codec it cannot read), the answer is null and the original uploads as before.
 *
 * The clip editor's edits are done here too (owner 2026-11-07, filter and stickers 2026-11-09): every frame is drawn
 * through the filter with the text and stickers on top, and "no sound" leaves the sound track out, so the post stays
 * one plain MP4 that looks and sounds the same everywhere. A song from lib/media/musicLibrary.ts (owner 2026-11-21) is
 * mixed with the clip's own sound here as well and replaces its sound track, so playing a post needs nothing new.
 */

const SHORT_SIDE = 720;
const MAX_FRAME_RATE = 30;
/** The silent loop feeds and grids autoplay (docs/VIDEO_PLAN.md, stage 1): 6 s since 2026-11-09 (was 3, felt like a GIF), about 300–600 KB */
const PREVIEW_SECONDS = 6;
const PREVIEW_SHORT_SIDE = 360;
const PREVIEW_FRAME_RATE = 24;

export type CompressedClip = { file: File; durationS: number; preview: File | null };
/** What the member changed in the clip editor */
export type ClipEdits = { texts?: PhotoText[]; stickers?: FunSticker[]; filter?: string; muted?: boolean; music?: ClipMusic | null };

/** The sound of a clip with a song is drawn at this rate; AAC encoders take it everywhere */
const MIX_RATE = 44100;
/** The song fades in and out over these, so it does not start or stop with a jolt */
const MUSIC_FADE_IN_S = 0.2;
const MUSIC_FADE_OUT_S = 1;

/** Whether this device can shrink a clip, and so also edit it (filter, text, stickers, no sound, music) */
export const canShrinkClips = () => typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';
type Mediabunny = typeof import('mediabunny');

/** Width and height with the short side at most `shortSide`, both even (H.264 encoders refuse odd sizes) */
function fitShortSide(width: number, height: number, shortSide: number) {
  const scale = Math.min(1, shortSide / Math.max(1, Math.min(width, height)));
  const even = (n: number) => Math.max(2, Math.round((n * scale) / 2) * 2);
  return { width: even(width), height: even(height) };
}

export async function compressClip(file: File, startS: number, endS: number, onProgress?: (share: number) => void, edits: ClipEdits = {}): Promise<CompressedClip | null> {
  if (!canShrinkClips()) return null;
  const texts = edits.texts?.filter((t) => t.text.trim()) ?? [];
  const stickers = edits.stickers ?? [];
  const filter = edits.filter && edits.filter !== 'none' ? edits.filter : '';
  const drawn = texts.length > 0 || stickers.length > 0 || Boolean(filter);
  const track = findTrack(edits.music?.trackId);
  const music = track && edits.music ? { ...edits.music, track } : null;
  const edited = drawn || Boolean(edits.muted) || Boolean(music);
  try {
    const mb = await import('mediabunny');
    if (!(await mb.canEncodeVideo('avc'))) return null;
    const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
    const target = new mb.BufferTarget();
    const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target });
    const end = Math.min(endS, startS + MAX_VIDEO_SECONDS);
    const conversion = await mb.Conversion.init({
      input,
      output,
      trim: { start: startS, end },
      video: async (track) => {
        const size = fitShortSide(await track.getDisplayWidth(), await track.getDisplayHeight(), SHORT_SIDE);
        return {
          ...size,
          fit: 'fill' as const,
          codec: 'avc' as const,
          quality: new mb.Quality('medium'),
          frameRate: MAX_FRAME_RATE,
          forceTranscode: true,
          ...(drawn ? { process: editedFrames(size.width, size.height, { texts, stickers }, filter) } : {}),
        };
      },
      // Sound is copied as it is when the file allows (iPhone AAC), otherwise re-encoded to AAC. With a song the sound
      // is made separately below and added to the finished picture
      audio: edits.muted || music ? { discard: true } : { codec: 'aac' },
      showWarnings: false,
    });
    // A clip that would lose its picture or its sound here is better sent whole
    if (!conversion.isValid || conversion.discardedTracks.some((t) => t.reason !== 'discarded_by_user' && t.reason !== 'max_track_count_of_type_reached')) return null;
    conversion.onProgress = (share) => onProgress?.(music ? share * 0.9 : share);
    await conversion.execute();
    let buffer = target.buffer;
    if (buffer && music) {
      const sound = await mixSound(mb, file, startS, end, !edits.muted, music);
      buffer = await withSound(mb, buffer, sound);
      onProgress?.(1);
    }
    // Edits must go through even when the result is not smaller; without them a bigger file is not worth it
    if (!buffer || (!edited && buffer.byteLength >= file.size)) return null;
    const small = new File([buffer], 'clip.mp4', { type: 'video/mp4' });
    return { file: small, durationS: end - startS, preview: await makePreview(mb, small) };
  } catch {
    return null;
  }
}

/**
 * Draws each frame through the filter with the text and stickers on top. The overlay is drawn once and laid over every
 * frame; one canvas is reused, since the encoder copies each frame before the next one.
 */
function editedFrames(width: number, height: number, overlays: { texts: PhotoText[]; stickers: FunSticker[] }, filter: string) {
  const canvas = Object.assign(document.createElement('canvas'), { width, height });
  // Read back per frame only where the filter is worked out by hand (Safari)
  const probe = document.createElement('canvas').getContext('2d');
  const hasFilter = probe ? canvasHasFilter(probe) : false;
  const ctx = canvas.getContext('2d', { willReadFrequently: Boolean(filter) && !hasFilter });
  const layer = Object.assign(document.createElement('canvas'), { width, height });
  const layerCtx = layer.getContext('2d');
  const hasLayer = overlays.texts.length > 0 || overlays.stickers.length > 0;
  if (layerCtx && hasLayer) drawOverlays(layerCtx, overlays, width, height);
  return (sample: import('mediabunny').VideoSample) => {
    if (!ctx) return sample;
    drawFiltered(ctx, () => sample.draw(ctx, 0, 0, width, height), filter, hasFilter);
    if (hasLayer) ctx.drawImage(layer, 0, 0);
    return canvas;
  };
}

/**
 * The clip's new sound: the song from the chosen point, looped when the clip is longer, faded in and out, with the
 * clip's own sound on top unless the member turned it off. A clip without sound simply gets the song.
 */
async function mixSound(mb: Mediabunny, file: File, startS: number, endS: number, keepOwn: boolean, music: ClipMusic & { track: MusicTrack }): Promise<AudioBuffer> {
  const length = endS - startS;
  const ctx = new OfflineAudioContext(2, Math.ceil(length * MIX_RATE), MIX_RATE);
  const response = await fetch(music.track.src);
  if (!response.ok) throw new Error('song not found');
  const song = await ctx.decodeAudioData(await response.arrayBuffer());
  const volume = Math.max(0, Math.min(1, music.volume));
  // A loud clip plus the song can pass full scale; this holds the peaks down instead of letting them crackle
  const limiter = new DynamicsCompressorNode(ctx, { threshold: -3, knee: 3, ratio: 20, attack: 0.003, release: 0.1 });
  limiter.connect(ctx.destination);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, 0);
  gain.gain.linearRampToValueAtTime(volume, Math.min(MUSIC_FADE_IN_S, length / 2));
  gain.gain.setValueAtTime(volume, Math.max(length / 2, length - MUSIC_FADE_OUT_S));
  gain.gain.linearRampToValueAtTime(0, length);
  gain.connect(limiter);
  const songNode = ctx.createBufferSource();
  songNode.buffer = song;
  songNode.loop = true;
  songNode.connect(gain);
  songNode.start(0, Math.max(0, music.startS) % song.duration);

  if (keepOwn) {
    const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
    const own = await input.getPrimaryAudioTrack();
    if (own && (await own.canDecode())) {
      for await (const { buffer, timestamp } of new mb.AudioBufferSink(own).buffers(startS, endS)) {
        const node = ctx.createBufferSource();
        node.buffer = buffer;
        node.connect(limiter);
        const at = timestamp - startS;
        if (at >= 0) node.start(at);
        else node.start(0, -at);
      }
    }
  }
  return ctx.startRendering();
}

let aacReady: Promise<boolean> | null = null;
/**
 * Whether AAC can be made here. Safari before 26 and Firefox have no AAC encoder of their own, so a song could not be
 * put on a clip there (a member's report 2026-11-23, BE-457); FFmpeg's encoder in WebAssembly (about 1 MB) is loaded
 * for them, only when a clip with a song is posted. Needs 'wasm-unsafe-eval' and worker-src blob: in the CSP.
 */
function aacEncoderReady(mb: Mediabunny): Promise<boolean> {
  aacReady ??= (async () => {
    if (await mb.canEncodeAudio('aac')) return true;
    const { registerAacEncoder } = await import('@mediabunny/aac-encoder');
    registerAacEncoder();
    return mb.canEncodeAudio('aac');
  })().catch(() => {
    aacReady = null;
    return false;
  });
  return aacReady;
}

/** The finished picture, copied as it is, with the mixed sound as its one sound track; null when this device cannot make AAC */
async function withSound(mb: Mediabunny, picture: ArrayBuffer, sound: AudioBuffer): Promise<ArrayBuffer | null> {
  if (!(await aacEncoderReady(mb))) return null;
  const input = new mb.Input({ source: new mb.BlobSource(new Blob([picture])), formats: mb.ALL_FORMATS });
  const video = await input.getPrimaryVideoTrack();
  const decoderConfig = await video?.getDecoderConfig();
  if (!video || !decoderConfig) return null;
  const target = new mb.BufferTarget();
  const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target });
  const videoSource = new mb.EncodedVideoPacketSource('avc');
  const audioSource = new mb.AudioBufferSource({ codec: 'aac', quality: new mb.Quality('medium') });
  output.addVideoTrack(videoSource, { rotation: await video.getRotation() });
  output.addAudioTrack(audioSource);
  await output.start();
  let first = true;
  for await (const packet of new mb.EncodedPacketSink(video).packets()) {
    await videoSource.add(packet, first ? { decoderConfig } : undefined);
    first = false;
  }
  videoSource.close();
  await audioSource.add(sound);
  audioSource.close();
  await output.finalize();
  return target.buffer;
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

import { VIDEO_TYPES } from '@/lib/moments/types';
import { drawOverlays, type FunSticker, type PhotoText } from './photoEdit';
import { canvasHasFilter, drawFiltered } from './clipFilter';

/**
 * Reading a member's clip on their own device, before anything uploads. A phone's camera roll is less tidy than a
 * freshly recorded clip: browsers may report no file type at all, and some files never finish loading or cannot be
 * decoded here. Every step therefore ends with an answer instead of leaving the form waiting.
 */

const READ_TIMEOUT_MS = 15_000;
const MAX_HEADER_BYTES = 8 * 1024 * 1024;
const BY_EXTENSION: Record<string, (typeof VIDEO_TYPES)[number]> = { mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', qt: 'video/quicktime', webm: 'video/webm' };

/** The clip with a type the upload accepts, judged by its name when the browser gave none; null when it is not one we take */
export function withClipType(file: File): File | null {
  if ((VIDEO_TYPES as readonly string[]).includes(file.type)) return file;
  const type = BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''];
  return type ? new File([file], file.name, { type }) : null;
}

function openClip(file: File) {
  const src = URL.createObjectURL(file);
  const el = document.createElement('video');
  el.muted = true;
  el.playsInline = true;
  el.preload = 'auto';
  // A blob: link from the browser, which encodeURI leaves as it is; CodeQL needs it for text that started in a file input
  el.src = encodeURI(src);
  return { el, close: () => URL.revokeObjectURL(src) };
}

/**
 * The length written in an MP4 or MOV file's own header, which needs no decoder: a browser that cannot show a clip
 * (HEVC from a phone, on a computer) can still post it for the phones that can. Null when the header does not say.
 */
export async function readContainerDuration(file: File): Promise<number | null> {
  const bytes = async (from: number, length: number) => new DataView(await file.slice(from, from + length).arrayBuffer());
  const typeAt = (view: DataView, at: number) => String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3));
  let at = 0;
  // The boxes at the top of the file; the header box may come after the video data, so each jump skips a box whole
  while (at + 8 <= file.size) {
    const head = await bytes(at, 16);
    if (head.byteLength < 8) return null;
    const type = typeAt(head, 4);
    const size32 = head.getUint32(0);
    const headLength = size32 === 1 ? 16 : 8;
    const size = size32 === 1 ? Number(head.getBigUint64(8)) : size32 === 0 ? file.size - at : size32;
    if (size < headLength) return null;
    if (type === 'moov') {
      const moov = await bytes(at + headLength, Math.min(size - headLength, MAX_HEADER_BYTES));
      for (let inner = 0; inner + 8 <= moov.byteLength; ) {
        const innerSize = moov.getUint32(inner);
        if (typeAt(moov, inner + 4) === 'mvhd') {
          const isLong = moov.getUint8(inner + 8) === 1;
          const timescale = moov.getUint32(inner + (isLong ? 28 : 20));
          const duration = isLong ? Number(moov.getBigUint64(inner + 32)) : moov.getUint32(inner + 24);
          return timescale > 0 && duration > 0 ? duration / timescale : null;
        }
        if (innerSize < 8) return null;
        inner += innerSize;
      }
      return null;
    }
    at += size;
  }
  return null;
}

/** The clip's length in seconds; rejects when neither its header nor this device can tell */
export async function readClipDuration(file: File): Promise<number> {
  const fromHeader = await readContainerDuration(file).catch(() => null);
  return fromHeader ?? readDurationByPlaying(file);
}

function readDurationByPlaying(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const { el, close } = openClip(file);
    const finish = (done: () => void) => {
      clearTimeout(timer);
      close();
      done();
    };
    const timer = setTimeout(() => finish(() => reject(new Error('unreadable'))), READ_TIMEOUT_MS);
    el.onerror = () => finish(() => reject(new Error('unreadable')));
    el.onloadedmetadata = () => {
      if (Number.isFinite(el.duration)) return finish(() => resolve(el.duration));
      // Some recorders leave the length out of the file; jumping far past the end makes the browser work it out
      el.ondurationchange = () => Number.isFinite(el.duration) && finish(() => resolve(el.duration));
      el.currentTime = 1e7;
    };
  });
}

/** One frame as a data URL for the cover; null when the device cannot show this clip's picture */
export function clipFrame(file: File, atSeconds: number): Promise<string | null> {
  return new Promise((resolve) => {
    const { el, close } = openClip(file);
    const finish = (frame: string | null) => {
      clearTimeout(timer);
      close();
      resolve(frame);
    };
    const timer = setTimeout(() => finish(null), READ_TIMEOUT_MS);
    el.onerror = () => finish(null);
    el.onloadedmetadata = () => {
      el.currentTime = Math.max(0.1, atSeconds);
    };
    el.onseeked = () => {
      const scale = Math.min(1, 1080 / Math.max(el.videoWidth, el.videoHeight, 1));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(el.videoWidth * scale);
      canvas.height = Math.round(el.videoHeight * scale);
      if (!canvas.width) return finish(null);
      canvas.getContext('2d')?.drawImage(el, 0, 0, canvas.width, canvas.height);
      finish(canvas.toDataURL('image/jpeg', 0.82));
    };
  });
}

/** A plain cover for a clip whose picture this device cannot draw, so posting still works */
export function plainCover(): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 720, 720);
  }
  return canvas.toDataURL('image/jpeg', 0.8);
}

/** The cover with the clip's filter, text and stickers on it, so grids show the same picture the clip starts with */
export async function coverWithEdits(cover: string, edits: { texts: PhotoText[]; stickers: FunSticker[]; filter: string }): Promise<string> {
  const texts = edits.texts.filter((t) => t.text.trim());
  if (!texts.length && !edits.stickers.length && edits.filter === 'none') return cover;
  const image = new Image();
  image.src = cover;
  try {
    await image.decode();
  } catch {
    return cover;
  }
  const canvas = Object.assign(document.createElement('canvas'), { width: image.naturalWidth, height: image.naturalHeight });
  const ctx = canvas.getContext('2d');
  if (!ctx) return cover;
  drawFiltered(ctx, () => ctx.drawImage(image, 0, 0), edits.filter, canvasHasFilter(ctx));
  drawOverlays(ctx, { texts, stickers: edits.stickers }, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.86);
}

/**
 * Small frames spread over the whole clip, for the editor's filmstrip. They arrive one by one through `onFrame`;
 * the answer stops the work (the editor closed or the clip changed). A clip this device cannot draw gives none.
 */
export function clipStrip(file: File, fullSeconds: number, count: number, onFrame: (index: number, frame: string) => void): () => void {
  const { el, close } = openClip(file);
  let index = 0;
  let stopped = false;
  const stop = () => {
    stopped = true;
    close();
  };
  const next = () => {
    if (stopped || index >= count) return stop();
    el.currentTime = Math.min(fullSeconds - 0.05, ((index + 0.5) / count) * fullSeconds);
  };
  el.onerror = stop;
  el.onloadedmetadata = next;
  el.onseeked = () => {
    if (stopped) return;
    const scale = 160 / Math.max(1, Math.min(el.videoWidth, el.videoHeight));
    const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(el.videoWidth * scale), height: Math.round(el.videoHeight * scale) });
    if (!canvas.width) return stop();
    canvas.getContext('2d')?.drawImage(el, 0, 0, canvas.width, canvas.height);
    onFrame(index, canvas.toDataURL('image/jpeg', 0.7));
    index += 1;
    next();
  };
  return stop;
}

export const clipClock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

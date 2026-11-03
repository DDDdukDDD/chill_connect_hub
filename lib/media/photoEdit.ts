/**
 * The photo editor's drawing, used for both the preview and the file that uploads, so what the member sees is what
 * gets posted. Everything is baked into the picture: posts stay plain images. Colours are worked out pixel by pixel
 * because Safari's canvas has no `filter`. Every post shows in a square frame, so the result is always square.
 */

export interface PhotoText {
  id: string;
  text: string;
  /** Centre of the text, 0..1 of the frame */
  x: number;
  y: number;
  color: string;
  /** Letter size as a share of the frame */
  size: number;
  boxed: boolean;
}

export interface PhotoSticker {
  title: string;
  x: number;
  y: number;
}

export interface Tone {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  /** Lifts the blacks, for a faded look */
  fade: number;
}

export interface EditedPhoto {
  id: string;
  url: string;
  image: HTMLImageElement;
  /** 1 fills the frame */
  zoom: number;
  /** How far the photo is moved, as a share of the frame */
  panX: number;
  panY: number;
  filter: string;
  /** The sliders, -100..100 */
  light: number;
  contrast: number;
  color: number;
  texts: PhotoText[];
  sticker?: PhotoSticker;
}

export const FILTERS: { id: string; label: string; tone: Partial<Tone> }[] = [
  { id: 'none', label: 'ปกติ', tone: {} },
  { id: 'bright', label: 'สดใส', tone: { brightness: 1.04, contrast: 1.05, saturation: 1.28 } },
  { id: 'warm', label: 'อบอุ่น', tone: { warmth: 16, saturation: 1.08 } },
  { id: 'cool', label: 'เย็นสบาย', tone: { warmth: -14, brightness: 1.03 } },
  { id: 'film', label: 'ฟิล์ม', tone: { contrast: 0.9, saturation: 0.82, warmth: 10, fade: 16 } },
  { id: 'bold', label: 'คมเข้ม', tone: { contrast: 1.24, saturation: 1.06, brightness: 0.97 } },
  { id: 'mono', label: 'ขาวดำ', tone: { saturation: 0, contrast: 1.1 } },
];

export const TEXT_COLORS = ['#FFFFFF', '#0F172A', '#F43F5E', '#FACC15', '#2563EB'];
export const MAX_ZOOM = 3;
const OUTPUT_SIZE = 1440;
const INK = '#0F172A';
const ROSE = '#F43F5E';

export function newPhoto(id: string, url: string, image: HTMLImageElement): EditedPhoto {
  return { id, url, image, zoom: 1, panX: 0, panY: 0, filter: 'none', light: 0, contrast: 0, color: 0, texts: [] };
}

export function toneOf(photo: Pick<EditedPhoto, 'filter' | 'light' | 'contrast' | 'color'>): Tone {
  const base = FILTERS.find((f) => f.id === photo.filter)?.tone ?? {};
  return {
    brightness: (base.brightness ?? 1) * (1 + photo.light / 200),
    contrast: (base.contrast ?? 1) * (1 + photo.contrast / 200),
    saturation: (base.saturation ?? 1) * (1 + photo.color / 100),
    warmth: base.warmth ?? 0,
    fade: base.fade ?? 0,
  };
}

export function applyTone(data: ImageData, tone: Tone) {
  const { brightness, contrast, saturation, warmth, fade } = tone;
  if (brightness === 1 && contrast === 1 && saturation === 1 && !warmth && !fade) return;
  const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
  const curve = new Float32Array(256);
  for (let v = 0; v < 256; v++) curve[v] = fade + (((v * brightness - 127.5) * contrast + 127.5) * (255 - fade)) / 255;
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = [curve[px[i]], curve[px[i + 1]], curve[px[i + 2]]];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    px[i] = clamp(luma + (r - luma) * saturation + warmth);
    px[i + 1] = clamp(luma + (g - luma) * saturation);
    px[i + 2] = clamp(luma + (b - luma) * saturation - warmth);
  }
}

/** Where the photo lands in a frame of `size`; moving stops where an edge of the frame would show */
function placement(photo: EditedPhoto, size: number) {
  const { naturalWidth: w, naturalHeight: h } = photo.image;
  const scale = (size / Math.max(1, Math.min(w, h))) * photo.zoom;
  const [dw, dh] = [w * scale, h * scale];
  const limit = (span: number, pan: number) => {
    const room = Math.max(0, (span - size) / 2);
    return Math.max(-room, Math.min(room, pan * size));
  };
  return { dw, dh, dx: (size - dw) / 2 + limit(dw, photo.panX), dy: (size - dh) / 2 + limit(dh, photo.panY) };
}

/** The photo and its colours, without the text and sticker on top */
export function drawBase(ctx: CanvasRenderingContext2D, photo: EditedPhoto, size: number) {
  const { dx, dy, dw, dh } = placement(photo, size);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(photo.image, dx, dy, dw, dh);
  const tone = toneOf(photo);
  const data = ctx.getImageData(0, 0, size, size);
  applyTone(data, tone);
  ctx.putImageData(data, 0, 0);
}

const fontFamily = () => getComputedStyle(document.body).fontFamily;

/** The letters must have loaded before a canvas can draw them, or the first text shows in a fallback font */
export const loadEditorFont = () => document.fonts?.load(`600 40px ${fontFamily()}`, 'กA').catch(() => undefined);

/** Breaks a line that is too wide between Thai words, which have no spaces to break at */
function wrapLine(ctx: CanvasRenderingContext2D, line: string, maxWidth: number): string[] {
  if (ctx.measureText(line).width <= maxWidth) return [line];
  const words = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter('th', { granularity: 'word' }).segment(line)].map((s) => s.segment) : [...line];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current && ctx.measureText(current + word).width > maxWidth) {
      lines.push(current.trimEnd());
      current = word.trimStart();
    } else {
      current += word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function layoutText(ctx: CanvasRenderingContext2D, t: PhotoText, size: number) {
  const fontPx = t.size * size;
  ctx.font = `600 ${fontPx}px ${fontFamily()}`;
  const lines = t.text.split('\n').flatMap((line) => wrapLine(ctx, line, size * 0.86));
  const lineHeight = fontPx * 1.45;
  const width = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const pad = fontPx * 0.45;
  return { lines, lineHeight, boxW: width + pad * 2, boxH: lineHeight * lines.length + pad, pad };
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawText(ctx: CanvasRenderingContext2D, t: PhotoText, size: number) {
  const { lines, lineHeight, boxW, boxH } = layoutText(ctx, t, size);
  const [cx, cy] = [t.x * size, t.y * size];
  ctx.save();
  if (t.boxed) {
    // Dark letters on a white box, light letters on a dark one
    const light = ['#FFFFFF', '#FACC15'].includes(t.color);
    ctx.fillStyle = light ? 'rgba(15,23,42,0.78)' : 'rgba(255,255,255,0.94)';
    roundedRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, t.size * size * 0.35);
    ctx.fill();
  } else {
    ctx.shadowColor = t.color === INK ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = size * 0.02;
    ctx.shadowOffsetY = size * 0.002;
  }
  ctx.fillStyle = t.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => ctx.fillText(line, cx, cy + (i - (lines.length - 1) / 2) * lineHeight));
  ctx.restore();
}

const STICKER_FONT = 0.034;
const MAX_STICKER_CHARS = 34;

function layoutSticker(ctx: CanvasRenderingContext2D, title: string, size: number) {
  const fontPx = STICKER_FONT * size;
  ctx.font = `600 ${fontPx}px ${fontFamily()}`;
  const label = title.length > MAX_STICKER_CHARS ? `${title.slice(0, MAX_STICKER_CHARS - 1)}…` : title;
  const pad = fontPx * 0.7;
  const pin = fontPx * 1.15;
  return { label, fontPx, pad, pin, boxW: pad * 2 + pin + fontPx * 0.35 + ctx.measureText(label).width, boxH: fontPx * 2.3 };
}

function drawSticker(ctx: CanvasRenderingContext2D, sticker: PhotoSticker, size: number) {
  const { label, fontPx, pad, pin, boxW, boxH } = layoutSticker(ctx, sticker.title, size);
  const [left, top] = [sticker.x * size - boxW / 2, sticker.y * size - boxH / 2];
  ctx.save();
  ctx.shadowColor = 'rgba(15,23,42,0.28)';
  ctx.shadowBlur = size * 0.016;
  ctx.fillStyle = '#FFFFFF';
  roundedRect(ctx, left, top, boxW, boxH, boxH / 2);
  ctx.fill();
  ctx.restore();

  // The map pin from the icon set, drawn in its 24-unit box
  ctx.save();
  ctx.translate(left + pad, top + (boxH - pin) / 2);
  ctx.scale(pin / 24, pin / 24);
  ctx.strokeStyle = ROSE;
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.stroke(new Path2D('M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'));
  ctx.beginPath();
  ctx.arc(12, 10, 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = INK;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `600 ${fontPx}px ${fontFamily()}`;
  ctx.fillText(label, left + pad + pin + fontPx * 0.35, top + boxH / 2);
}

export function drawOverlays(ctx: CanvasRenderingContext2D, photo: EditedPhoto, size: number) {
  if (photo.sticker) drawSticker(ctx, photo.sticker, size);
  photo.texts.forEach((t) => drawText(ctx, t, size));
}

/** What sits under a point (0..1 of the frame): the newest text first, then the sticker */
export function hitOverlay(ctx: CanvasRenderingContext2D, photo: EditedPhoto, size: number, x: number, y: number): { type: 'text'; id: string } | { type: 'sticker' } | null {
  const inside = (cx: number, cy: number, w: number, h: number) => Math.abs(x * size - cx * size) <= w / 2 && Math.abs(y * size - cy * size) <= h / 2;
  for (const t of [...photo.texts].reverse()) {
    const { boxW, boxH } = layoutText(ctx, t, size);
    if (inside(t.x, t.y, boxW, boxH)) return { type: 'text', id: t.id };
  }
  if (photo.sticker) {
    const { boxW, boxH } = layoutSticker(ctx, photo.sticker.title, size);
    if (inside(photo.sticker.x, photo.sticker.y, boxW, boxH)) return { type: 'sticker' };
  }
  return null;
}

/** The finished square, ready to upload: WebP, or JPEG where the browser cannot write WebP (Safari) */
export async function exportPhoto(photo: EditedPhoto): Promise<Blob> {
  const size = Math.min(OUTPUT_SIZE, Math.round(Math.min(photo.image.naturalWidth, photo.image.naturalHeight) * photo.zoom));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  drawBase(ctx, photo, size);
  drawOverlays(ctx, photo, size);
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
  const webp = await encode('image/webp');
  const blob = webp?.type === 'image/webp' ? webp : await encode('image/jpeg');
  if (!blob) throw new Error('no blob');
  return blob;
}

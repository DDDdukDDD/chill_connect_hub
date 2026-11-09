/**
 * The photo editor's drawing, used for both the preview and the file that uploads, so what the member sees is what
 * gets posted. Everything is baked into the picture: posts stay plain images. Colours are worked out pixel by pixel
 * because Safari's canvas has no `filter`. A post is square (1:1) or tall (4:5, owner 2026-11-07), like Instagram;
 * every photo in one post has the same shape. Text and stickers are placed as shares of the frame's width and height,
 * and sized by its width, so the same layout works on any canvas size (the clip editor draws text with it too).
 */

import { encodeForUpload } from './compressor';

/** Width / height of a post's frame */
export type PostShape = 1 | 0.8;
/** Plain words, not ratios (owner 2026-11-07); tall comes first and is where a new post starts */
export const POST_SHAPES: { ratio: PostShape; label: string }[] = [
  { ratio: 0.8, label: 'แนวตั้ง' },
  { ratio: 1, label: 'สี่เหลี่ยม' },
];

export interface PhotoText {
  id: string;
  text: string;
  /** Centre of the text, 0..1 of the frame */
  x: number;
  y: number;
  color: string;
  /** Letter size as a share of the frame's width */
  size: number;
  /** Behind the letters: nothing (a soft shadow), the text colour solid, or the text colour see-through (owner 2026-11-09) */
  background: TextBackground;
}

export type TextBackground = 'none' | 'solid' | 'soft';
/** One button cycles through these, like Instagram's "A" */
export const TEXT_BACKGROUNDS: { id: TextBackground; label: string }[] = [
  { id: 'none', label: 'ไม่มีพื้น' },
  { id: 'solid', label: 'พื้นทึบ' },
  { id: 'soft', label: 'พื้นโปร่ง' },
];

/** The place sticker: one per photo, the place the post is about */
export interface PhotoSticker {
  title: string;
  x: number;
  y: number;
}

/** A fun sticker: a line icon on a round badge, or a short word on a pill */
export interface FunSticker {
  id: string;
  kind: 'icon' | 'word' | 'face';
  /** An ICON_STICKERS or FACE_STICKERS key, or the word itself */
  value: string;
  /** A STICKER_STYLES id */
  style: string;
  x: number;
  y: number;
  /** 1 is the normal size */
  scale: number;
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
  stickers: FunSticker[];
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

/** Seven colours (owner 2026-11-09): white, ink, rose, the brand orange, yellow, green, blue */
export const TEXT_COLORS = ['#FFFFFF', '#0F172A', '#F43F5E', '#F26430', '#FACC15', '#16A34A', '#2563EB'];
/** Colours light enough that letters on them are ink, not white */
const LIGHT_TEXT_COLORS = ['#FFFFFF', '#FACC15'];
const SOFT_ALPHA = 0.62;

function withAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
export const MAX_ZOOM = 3;
/** The upload's width; a tall post is 1.25 times as high */
const OUTPUT_WIDTH = 1440;
const INK = '#0F172A';
const ROSE = '#F43F5E';

/** Line icons from lucide (the site's icon set), drawn in their 24-unit box; each entry is one stroke */
export const ICON_STICKERS: Record<string, { label: string; paths: string[] }> = {
  heart: { label: 'หัวใจ', paths: ['M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5'] },
  star: { label: 'ดาว', paths: ['M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z'] },
  sparkles: { label: 'วิบวับ', paths: ['M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z', 'M20 2v4', 'M22 4h-4', 'M2 20a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'] },
  sun: { label: 'แดด', paths: ['M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0', 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'] },
  coffee: { label: 'กาแฟ', paths: ['M10 2v2', 'M14 2v2', 'M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1', 'M6 2v2'] },
  food: { label: 'ของกิน', paths: ['m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8', 'M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7', 'm2.1 21.8 6.4-6.3', 'm19 5-7 7'] },
  music: { label: 'เพลง', paths: ['M9 18V5l12-2v13', 'M3 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', 'M15 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'] },
  camera: { label: 'กล้อง', paths: ['M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z', 'M9 13a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'] },
  flower: { label: 'ดอกไม้', paths: ['M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1', 'M10 8a2 2 0 1 0 4 0a2 2 0 1 0 -4 0', 'M12 10v12', 'M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z', 'M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z'] },
};

/**
 * Feelings as round, cute faces (owner 2026-11-09: "emotion น่ารักๆ ที่บอกความรู้สึกได้"). Drawn in a 24-unit box on a
 * filled circle in the sticker's colour: `lines` are strokes and `dots` are filled shapes in the ink colour, `hearts`
 * and `tears` take their own colours, `blush` adds soft cheeks. One drawing serves the canvas and the picker buttons.
 */
export interface FaceSticker { label: string; lines: string[]; dots?: string[]; hearts?: string[]; tears?: string[]; blush?: boolean }
const EYES_HAPPY = ['M7.4 10.6q1.6-2.2 3.2 0', 'M13.4 10.6q1.6-2.2 3.2 0'];
const dot = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
const heart = (x: number, y: number) => `M${x} ${y + 2.3}l-2.1-2a1.3 1.3 0 0 1 2.1-1.5 1.3 1.3 0 0 1 2.1 1.5z`;
export const FACE_STICKERS: Record<string, FaceSticker> = {
  happy: { label: 'ยิ้ม', lines: [...EYES_HAPPY, 'M8.4 13.9q3.6 3.6 7.2 0'], blush: true },
  love: { label: 'หลงรัก', lines: ['M9 14.6q3 2.6 6 0'], hearts: [heart(9, 8.6), heart(15, 8.6)], blush: true },
  laugh: { label: 'ขำ', lines: ['M7.6 8.8l2.1 1.3-2.1 1.3', 'M16.4 8.8l-2.1 1.3 2.1 1.3'], dots: ['M8 13.4h8a4 4 0 0 1-8 0z'] },
  wow: { label: 'ว้าว', lines: ['M10.4 15.6a1.6 1.8 0 1 0 3.2 0a1.6 1.8 0 1 0-3.2 0'], dots: [dot(9, 10.4, 1.15), dot(15, 10.4, 1.15)] },
  shy: { label: 'เขิน', lines: ['M7.4 10.2q1.6 1.3 3.2 0', 'M13.4 10.2q1.6 1.3 3.2 0', 'M10.4 14.6q1.6 1.1 3.2 0'], blush: true },
  cool: { label: 'เท่', lines: ['M11 9.9h2', 'M10 15.6q2.6 1.3 4.6-.9'], dots: ['M5.8 9h5.2v2.1a2.3 2.3 0 0 1-2.3 2.3h-.6a2.3 2.3 0 0 1-2.3-2.3z', 'M13 9h5.2v2.1a2.3 2.3 0 0 1-2.3 2.3h-.6a2.3 2.3 0 0 1-2.3-2.3z'] },
  chill: { label: 'ชิลล์', lines: ['M7.4 10.6h3.2', 'M13.4 10.6h3.2', 'M10.2 15.2q1.8.9 3.6 0'], blush: true },
  touched: { label: 'ซึ้ง', lines: [...EYES_HAPPY, 'M9 14.4q3 2.6 6 0'], tears: ['M17.2 11.6c1 1.4 1.5 2.2 1.5 2.9a1.5 1.5 0 0 1-3 0c0-.7.5-1.5 1.5-2.9z'] },
};

/** Short words friends say about a day out */
export const WORD_STICKERS = ['ชิลล์มาก', 'ฟินสุดๆ', 'วิวปังมาก', 'อร่อยต้องซ้ำ', 'มากับแก๊ง', 'ไปอีกแน่', 'แนะนำเลย', 'วันดีๆ'];

/** Badge or pill colour, and the colour of the icon or word on it */
/** The same seven colours as text (owner 2026-11-09), in the same order */
export const STICKER_STYLES: { id: string; label: string; fill: string; ink: string }[] = [
  { id: 'white', label: 'ขาว', fill: '#FFFFFF', ink: ROSE },
  { id: 'ink', label: 'ดำ', fill: INK, ink: '#FFFFFF' },
  { id: 'rose', label: 'ชมพู', fill: ROSE, ink: '#FFFFFF' },
  { id: 'orange', label: 'ส้ม', fill: '#F26430', ink: '#FFFFFF' },
  { id: 'yellow', label: 'เหลือง', fill: '#FACC15', ink: INK },
  { id: 'green', label: 'เขียว', fill: '#16A34A', ink: '#FFFFFF' },
  { id: 'blue', label: 'น้ำเงิน', fill: '#2563EB', ink: '#FFFFFF' },
];

/** Draws a face in its 24-unit box (the caller has moved and scaled the context) */
export function drawFace(ctx: Ctx, face: FaceSticker, style: { fill: string; ink: string }) {
  const warm = style.fill === ROSE || style.fill === '#F26430';
  ctx.fillStyle = style.fill;
  ctx.fill(new Path2D(dot(12, 12, 10.5)));
  // The shadow lifts the face off the photo; the features on it stay crisp
  ctx.shadowColor = 'transparent';
  if (face.blush) {
    ctx.fillStyle = warm ? 'rgba(255,255,255,0.35)' : 'rgba(244,63,94,0.32)';
    ctx.fill(new Path2D(dot(6.6, 13.6, 1.7)));
    ctx.fill(new Path2D(dot(17.4, 13.6, 1.7)));
  }
  ctx.strokeStyle = style.ink;
  ctx.fillStyle = style.ink;
  ctx.lineWidth = 1.7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  face.lines.forEach((d) => ctx.stroke(new Path2D(d)));
  face.dots?.forEach((d) => ctx.fill(new Path2D(d)));
  ctx.fillStyle = style.fill === ROSE ? '#FFFFFF' : ROSE;
  face.hearts?.forEach((d) => ctx.fill(new Path2D(d)));
  ctx.fillStyle = '#60A5FA';
  face.tears?.forEach((d) => ctx.fill(new Path2D(d)));
}
export const STICKER_SCALES: [string, number][] = [['เล็ก', 0.75], ['กลาง', 1], ['ใหญ่', 1.4]];
export const MAX_FUN_STICKERS = 8;

export function newPhoto(id: string, url: string, image: HTMLImageElement): EditedPhoto {
  return { id, url, image, zoom: 1, panX: 0, panY: 0, filter: 'none', light: 0, contrast: 0, color: 0, texts: [], stickers: [] };
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

/** Where the photo lands in a w × h frame; moving stops where an edge of the frame would show */
function placement(photo: EditedPhoto, w: number, h: number) {
  const { naturalWidth: nw, naturalHeight: nh } = photo.image;
  const scale = Math.max(w / Math.max(1, nw), h / Math.max(1, nh)) * Math.max(photo.zoom, minZoom(photo, w / h));
  const [dw, dh] = [nw * scale, nh * scale];
  const limit = (span: number, frame: number, pan: number) => {
    const room = Math.max(0, (span - frame) / 2);
    return Math.max(-room, Math.min(room, pan * frame));
  };
  return { dw, dh, dx: (w - dw) / 2 + limit(dw, w, photo.panX), dy: (h - dh) / 2 + limit(dh, h, photo.panY) };
}

/**
 * The smallest zoom: the whole photo fits in the frame, with white bars on the sides it does not fill (1 fills the frame).
 * A photo already of the frame's shape cannot go below 1.
 */
export function minZoom(photo: EditedPhoto, ratio: number) {
  const { naturalWidth: nw, naturalHeight: nh } = photo.image;
  if (!nw || !nh) return 1;
  const fit = Math.min(ratio / nw, 1 / nh);
  const fill = Math.max(ratio / nw, 1 / nh);
  return Math.min(1, Math.round((fit / fill) * 1000) / 1000);
}

/** Pan values that stop at the photo's edge in a frame of this shape, so a long drag past it needs no undoing */
export function clampPan(photo: EditedPhoto, ratio: number, panX: number, panY: number) {
  const { naturalWidth: nw, naturalHeight: nh } = photo.image;
  const scale = Math.max(ratio / Math.max(1, nw), 1 / Math.max(1, nh)) * photo.zoom;
  const room = (span: number, frame: number) => Math.max(0, (span * scale - frame) / 2 / frame);
  const limit = (pan: number, r: number) => Math.max(-r, Math.min(r, pan));
  return { panX: limit(panX, room(nw, ratio)), panY: limit(panY, room(nh, 1)) };
}

/** The photo and its colours, without the text and stickers on top */
export function drawBase(ctx: CanvasRenderingContext2D, photo: EditedPhoto, w: number, h: number) {
  const { dx, dy, dw, dh } = placement(photo, w, h);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(photo.image, dx, dy, dw, dh);
  const data = ctx.getImageData(0, 0, w, h);
  applyTone(data, toneOf(photo));
  ctx.putImageData(data, 0, 0);
}

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const fontFamily = () => getComputedStyle(document.body).fontFamily;

/** The letters must have loaded before a canvas can draw them, or the first text shows in a fallback font */
export const loadEditorFont = () =>
  Promise.all([600, 700].map((weight) => document.fonts?.load(`${weight} 40px ${fontFamily()}`, 'กA'))).catch(() => undefined);

/** Breaks a line that is too wide between Thai words, which have no spaces to break at */
function wrapLine(ctx: Ctx, line: string, maxWidth: number): string[] {
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

function layoutText(ctx: Ctx, t: PhotoText, w: number, font = fontFamily()) {
  const fontPx = t.size * w;
  ctx.font = `600 ${fontPx}px ${font}`;
  const lines = t.text.split('\n').flatMap((line) => wrapLine(ctx, line, w * 0.86));
  const lineHeight = fontPx * 1.45;
  const width = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const pad = fontPx * 0.45;
  return { lines, lineHeight, boxW: width + pad * 2, boxH: lineHeight * lines.length + pad, pad };
}

function roundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * One text, centred on its point. `font` is passed in where `document` is not around to read it (a clip's frames are
 * drawn while it converts).
 */
export function drawText(ctx: Ctx, t: PhotoText, w: number, h: number, font = fontFamily()) {
  const { lines, lineHeight, boxW, boxH } = layoutText(ctx, t, w, font);
  const [cx, cy] = [t.x * w, t.y * h];
  ctx.save();
  let ink = t.color;
  if (t.background === 'solid' || t.background === 'soft') {
    // The box takes the chosen colour; the letters turn ink or white so they stay readable
    ctx.fillStyle = t.background === 'solid' ? t.color : withAlpha(t.color, SOFT_ALPHA);
    roundedRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, t.size * w * 0.35);
    ctx.fill();
    ink = LIGHT_TEXT_COLORS.includes(t.color) ? INK : '#FFFFFF';
  } else {
    ctx.shadowColor = t.color === INK ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = w * 0.02;
    ctx.shadowOffsetY = w * 0.002;
  }
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  // Centred on the letters as drawn, not on the font's box: a Thai font leaves room above and below for vowel and
  // tone marks, which made the words sit high in their box (owner 2026-11-09)
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, i) => {
    const m = ctx.measureText(line || ' ');
    const middle = cy + (i - (lines.length - 1) / 2) * lineHeight;
    ctx.fillText(line, cx, middle + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  });
  ctx.restore();
}

/** Where a text sits, for finding what was touched */
export function textBox(ctx: Ctx, t: PhotoText, w: number) {
  const { boxW, boxH } = layoutText(ctx, t, w);
  return { boxW, boxH };
}

const STICKER_FONT = 0.034;
const MAX_STICKER_CHARS = 34;

function layoutSticker(ctx: Ctx, title: string, w: number) {
  const fontPx = STICKER_FONT * w;
  ctx.font = `600 ${fontPx}px ${fontFamily()}`;
  const label = title.length > MAX_STICKER_CHARS ? `${title.slice(0, MAX_STICKER_CHARS - 1)}…` : title;
  const pad = fontPx * 0.7;
  const pin = fontPx * 1.15;
  return { label, fontPx, pad, pin, boxW: pad * 2 + pin + fontPx * 0.35 + ctx.measureText(label).width, boxH: fontPx * 2.3 };
}

function drawPlaceSticker(ctx: Ctx, sticker: PhotoSticker, w: number, h: number) {
  const { label, fontPx, pad, pin, boxW, boxH } = layoutSticker(ctx, sticker.title, w);
  const [left, top] = [sticker.x * w - boxW / 2, sticker.y * h - boxH / 2];
  ctx.save();
  ctx.shadowColor = 'rgba(15,23,42,0.28)';
  ctx.shadowBlur = w * 0.016;
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

const styleOf = (id: string) => STICKER_STYLES.find((s) => s.id === id) ?? STICKER_STYLES[0];

/** Size of a fun sticker: icons stand on their own (no badge behind them), words are pills */
function layoutFun(ctx: Ctx, s: FunSticker, w: number) {
  if (s.kind !== 'word') {
    const d = w * (s.kind === 'face' ? 0.14 : 0.12) * s.scale;
    return { boxW: d, boxH: d, fontPx: 0 };
  }
  const fontPx = w * 0.052 * s.scale;
  ctx.font = `700 ${fontPx}px ${fontFamily()}`;
  // Thai marks can reach past the advance width, and Safari's measure can run short: take the wider of the two, with room
  const m = ctx.measureText(s.value);
  const ink = (m.actualBoundingBoxLeft ?? 0) + (m.actualBoundingBoxRight ?? 0);
  return { boxW: Math.max(m.width, ink) * 1.06 + fontPx * 1.6, boxH: fontPx * 1.9, fontPx };
}

function drawFun(ctx: Ctx, s: FunSticker, w: number, h: number) {
  const { boxW, boxH, fontPx } = layoutFun(ctx, s, w);
  const style = styleOf(s.style);
  const [cx, cy] = [s.x * w, s.y * h];
  if (s.kind === 'word') {
    ctx.save();
    ctx.shadowColor = 'rgba(15,23,42,0.28)';
    ctx.shadowBlur = w * 0.016;
    ctx.fillStyle = style.fill;
    roundedRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, boxH / 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  if (s.kind === 'face') {
    const face = FACE_STICKERS[s.value];
    ctx.translate(cx - boxW / 2, cy - boxH / 2);
    ctx.scale(boxW / 24, boxH / 24);
    ctx.shadowColor = 'rgba(15,23,42,0.3)';
    ctx.shadowBlur = w * 0.012;
    if (face) drawFace(ctx, face, style);
  } else if (s.kind === 'icon') {
    // The icon alone, in the chosen colour; a soft shadow keeps it readable on a light or busy photo
    const icon = ICON_STICKERS[s.value];
    const side = boxW;
    ctx.translate(cx - side / 2, cy - side / 2);
    ctx.scale(side / 24, side / 24);
    ctx.shadowColor = 'rgba(15,23,42,0.4)';
    ctx.shadowBlur = w * 0.012;
    ctx.strokeStyle = style.fill;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    icon?.paths.forEach((d) => ctx.stroke(new Path2D(d)));
  } else {
    ctx.fillStyle = style.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${fontPx}px ${fontFamily()}`;
    ctx.fillText(s.value, cx, cy + fontPx * 0.04);
  }
  ctx.restore();
}

export function drawOverlays(ctx: CanvasRenderingContext2D, photo: EditedPhoto, w: number, h: number) {
  if (photo.sticker) drawPlaceSticker(ctx, photo.sticker, w, h);
  photo.stickers.forEach((s) => drawFun(ctx, s, w, h));
  photo.texts.forEach((t) => drawText(ctx, t, w, h));
}

export type OverlayHit = { type: 'text'; id: string } | { type: 'fun'; id: string } | { type: 'sticker' };

/** What sits under a point (0..1 of the frame): the newest text first, then fun stickers, then the place sticker */
export function hitOverlay(ctx: CanvasRenderingContext2D, photo: EditedPhoto, w: number, h: number, x: number, y: number): OverlayHit | null {
  const inside = (cx: number, cy: number, bw: number, bh: number) => Math.abs((x - cx) * w) <= bw / 2 && Math.abs((y - cy) * h) <= bh / 2;
  for (const t of [...photo.texts].reverse()) {
    const { boxW, boxH } = layoutText(ctx, t, w);
    if (inside(t.x, t.y, boxW, boxH)) return { type: 'text', id: t.id };
  }
  for (const s of [...photo.stickers].reverse()) {
    const { boxW, boxH } = layoutFun(ctx, s, w);
    if (inside(s.x, s.y, boxW, boxH)) return { type: 'fun', id: s.id };
  }
  if (photo.sticker) {
    const { boxW, boxH } = layoutSticker(ctx, photo.sticker.title, w);
    if (inside(photo.sticker.x, photo.sticker.y, boxW, boxH)) return { type: 'sticker' };
  }
  return null;
}

/** The finished photo in the post's shape, ready to upload, within encodeForUpload's size limit */
export async function exportPhoto(photo: EditedPhoto, ratio: number): Promise<Blob> {
  const { naturalWidth: nw, naturalHeight: nh } = photo.image;
  const w = Math.max(1, Math.min(OUTPUT_WIDTH, Math.round(Math.min(nw, nh * ratio) * Math.max(1, photo.zoom))));
  const h = Math.round(w / ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  drawBase(ctx, photo, w, h);
  drawOverlays(ctx, photo, w, h);
  const blob = await encodeForUpload(canvas);
  if (!blob) throw new Error('no blob');
  return blob;
}

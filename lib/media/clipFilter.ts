/**
 * Filters for clips (owner 2026-11-09, posting round 2): the same seven names as the photo filters, written as CSS
 * filter steps. The clip editor's preview puts them on the <video> as CSS, and posting draws every frame through the
 * canvas's own `filter`, so both show the same look. Safari's canvas has no `filter`; there the same steps are worked
 * out pixel by pixel with the matrices the CSS spec defines, so an iPhone posts the look it previewed.
 */

type Step = ['brightness' | 'contrast' | 'saturate' | 'sepia' | 'hue-rotate', number];

export const CLIP_FILTERS: { id: string; label: string; steps: Step[] }[] = [
  { id: 'none', label: 'ปกติ', steps: [] },
  { id: 'bright', label: 'สดใส', steps: [['brightness', 1.04], ['contrast', 1.05], ['saturate', 1.28]] },
  { id: 'warm', label: 'อบอุ่น', steps: [['sepia', 0.22], ['saturate', 1.2], ['brightness', 1.02]] },
  { id: 'cool', label: 'เย็นสบาย', steps: [['brightness', 1.04], ['saturate', 0.85], ['hue-rotate', 12], ['contrast', 0.96]] },
  { id: 'film', label: 'ฟิล์ม', steps: [['sepia', 0.18], ['saturate', 0.8], ['contrast', 0.86], ['brightness', 1.06]] },
  { id: 'bold', label: 'คมเข้ม', steps: [['contrast', 1.24], ['saturate', 1.06], ['brightness', 0.97]] },
  { id: 'mono', label: 'ขาวดำ', steps: [['saturate', 0], ['contrast', 1.1]] },
];

const stepsOf = (id: string) => CLIP_FILTERS.find((f) => f.id === id)?.steps ?? [];

/** The filter as CSS, for the preview and for a canvas that has `filter`; '' for none */
export function clipFilterCss(id: string): string {
  return stepsOf(id)
    .map(([name, v]) => `${name}(${name === 'hue-rotate' ? `${v}deg` : v})`)
    .join(' ');
}

/** Whether this canvas can draw through a CSS filter (not Safari) */
export function canvasHasFilter(ctx: CanvasRenderingContext2D): boolean {
  const before = ctx.filter;
  ctx.filter = 'brightness(1.01)';
  const works = ctx.filter === 'brightness(1.01)';
  ctx.filter = before ?? 'none';
  return works;
}

/** A colour step as rows of [r, g, b, offset] (offset in 0..255) */
type Matrix = number[][];

function matrixOf([name, v]: Step): Matrix {
  if (name === 'brightness') return [[v, 0, 0, 0], [0, v, 0, 0], [0, 0, v, 0]];
  if (name === 'contrast') {
    const o = (0.5 - 0.5 * v) * 255;
    return [[v, 0, 0, o], [0, v, 0, o], [0, 0, v, o]];
  }
  if (name === 'saturate')
    return [
      [0.213 + 0.787 * v, 0.715 - 0.715 * v, 0.072 - 0.072 * v, 0],
      [0.213 - 0.213 * v, 0.715 + 0.285 * v, 0.072 - 0.072 * v, 0],
      [0.213 - 0.213 * v, 0.715 - 0.715 * v, 0.072 + 0.928 * v, 0],
    ];
  if (name === 'sepia') {
    const k = 1 - v;
    return [
      [0.393 + 0.607 * k, 0.769 - 0.769 * k, 0.189 - 0.189 * k, 0],
      [0.349 - 0.349 * k, 0.686 + 0.314 * k, 0.168 - 0.168 * k, 0],
      [0.272 - 0.272 * k, 0.534 - 0.534 * k, 0.131 + 0.869 * k, 0],
    ];
  }
  const a = (v * Math.PI) / 180;
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return [
    [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928, 0],
    [0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283, 0],
    [0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072, 0],
  ];
}

/** `next` after `first`, as one step */
function then(first: Matrix, next: Matrix): Matrix {
  return next.map((row) => [0, 1, 2, 3].map((col) => row[0] * first[0][col] + row[1] * first[1][col] + row[2] * first[2][col] + (col === 3 ? row[3] : 0)));
}

/** The filter worked out on the pixels themselves, for a canvas without `filter` */
export function applyClipFilter(data: ImageData, id: string) {
  const steps = stepsOf(id);
  if (!steps.length) return;
  const m = steps.map(matrixOf).reduce(then);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
    // Uint8ClampedArray rounds and clamps on its own
    px[i] = m[0][0] * r + m[0][1] * g + m[0][2] * b + m[0][3];
    px[i + 1] = m[1][0] * r + m[1][1] * g + m[1][2] * b + m[1][3];
    px[i + 2] = m[2][0] * r + m[2][1] * g + m[2][2] * b + m[2][3];
  }
}

/** Draws a picture (a video frame or an image) onto the whole canvas through the filter */
export function drawFiltered(ctx: CanvasRenderingContext2D, draw: () => void, id: string, hasFilter: boolean) {
  const css = clipFilterCss(id);
  if (css && hasFilter) ctx.filter = css;
  draw();
  if (!css) return;
  if (hasFilter) {
    ctx.filter = 'none';
    return;
  }
  const { width, height } = ctx.canvas;
  const data = ctx.getImageData(0, 0, width, height);
  applyClipFilter(data, id);
  ctx.putImageData(data, 0, 0);
}

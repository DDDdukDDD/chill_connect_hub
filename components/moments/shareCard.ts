import type { FeedItem } from '@/lib/moments/service';

/**
 * The share card (FEED_PLAN step 3.5): a 9:16 picture of a moment for an IG Story or a LINE chat, the way Strava
 * shares a run. The photo fills the card; the place, the challenge line and the brand sit on a soft shade at the
 * bottom. Drawn in the browser, so nothing is stored. Photos go through the site's own image optimizer, so the canvas
 * stays readable (a photo from another site would lock it).
 */

const W = 1080;
const H = 1920;
const PAD = 84;

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image'));
    img.src = src;
  });
}

/** Same-origin copy of a post photo at card width */
const cardPhoto = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=85`;

/** Fills the box with the picture, cropped from the middle */
function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

/** Cuts a line to fit the width, ending with … */
function fit(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  if (ctx.measureText(text).width <= width) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > width) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
}

export async function drawShareCard(moment: FeedItem): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  // The page's own Thai font, already loaded
  const family = getComputedStyle(document.body).fontFamily || 'sans-serif';
  await document.fonts?.ready;

  const [photo, logo] = await Promise.all([moment.images[0] ? load(cardPhoto(moment.images[0])).catch(() => null) : null, load('/brand-logo.png').catch(() => null)]);

  ctx.fillStyle = '#FFF8F1';
  ctx.fillRect(0, 0, W, H);
  if (photo) cover(ctx, photo, 0, 0, W, H);

  // A shade from the middle down, so white words read on any photo
  const shade = ctx.createLinearGradient(0, H * 0.45, 0, H);
  shade.addColorStop(0, 'rgba(15,23,42,0)');
  shade.addColorStop(0.55, 'rgba(15,23,42,0.55)');
  shade.addColorStop(1, 'rgba(15,23,42,0.85)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, H * 0.45, W, H * 0.55);

  const width = W - PAD * 2;
  let y = H - 150;

  // Bottom line: the brand on the left, the site on the right
  if (logo) ctx.drawImage(logo, PAD, y - 30, 64, 64);
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.font = `700 40px ${family}`;
  ctx.fillText('Chillwaa', PAD + (logo ? 80 : 0), y + 2);
  ctx.font = `500 32px ${family}`;
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('chillwaa.com', W - PAD, y + 2);
  ctx.textAlign = 'left';
  y -= 110;

  // The challenge it counted toward, as a white pill
  if (moment.achievement) {
    const { title, current, total } = moment.achievement;
    const text = `พิชิตชาเลนจ์ ${title} · ${current >= total ? 'ครบแล้ว' : `${current}/${total}`}`;
    ctx.font = `700 38px ${family}`;
    const label = fit(ctx, text, width - 64);
    const w = ctx.measureText(label).width + 64;
    pill(ctx, PAD, y - 40, w, 80, '#FFFFFF');
    ctx.fillStyle = '#6D28D9';
    ctx.fillText(label, PAD + 32, y + 2);
    y -= 120;
  }

  // Who and when
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `500 36px ${family}`;
  const when = new Date(moment.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  ctx.fillText(fit(ctx, `${moment.userName} · ${when}`, width), PAD, y);
  y -= 96;

  // The place, big
  const place = moment.targetTitle || moment.location;
  if (place) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 72px ${family}`;
    ctx.fillText(fit(ctx, place, width), PAD, y);
  }

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('blob'))), 'image/jpeg', 0.9));
}

/**
 * Hands the card to the phone's share sheet (IG Story, LINE…) where it can take files; otherwise saves it.
 * Returns what happened, for the toast.
 */
export async function shareCard(moment: FeedItem): Promise<'shared' | 'saved' | 'cancelled'> {
  const blob = await drawShareCard(moment);
  const file = new File([blob], `chillwaa-${moment.id}.jpg`, { type: 'image/jpeg' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'saved';
}

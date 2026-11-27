'use client';

import { useState } from 'react';
import { daysBetween, thaiDateRange, tripParts, tripStops, visibleItems, type TripStop, type TripView } from '@/lib/trips/story';

/**
 * The trip as a 9:16 picture for IG Story, LINE and other apps (owner 2026-11-27): the cover, the title, the days, the
 * route and the numbers, with Chillwaa's name, so whoever sees the story knows where to look for the rest. A trip with
 * two or more cities also gets its route drawn as a thin dotted line with numbered stops (owner 2026-11-27), the same
 * arcs as the player's route frame, so the card is known as Chillwaa's at a glance.
 * Drawn in the browser, where Thai renders correctly (the server's image renderer drops stacked tone marks).
 */

const W = 1080;
const H = 1920;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Breaks text into at most `max` lines that fit `width` (Thai has no spaces, so it breaks between letters if needed) */
function lines(ctx: CanvasRenderingContext2D, text: string, width: number, max: number): string[] {
  const out: string[] = [];
  let line = '';
  const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
  const pieces = segmenter ? [...segmenter.segment(text)].map((s) => s.segment) : [...text];
  for (const piece of pieces) {
    if (ctx.measureText(line + piece).width <= width || !line) line += piece;
    else {
      out.push(line.trim());
      line = piece.trimStart();
      if (out.length === max) break;
    }
  }
  if (out.length < max && line.trim()) out.push(line.trim());
  if (out.length === max && pieces.join('').length > out.join('').length + 1) out[max - 1] = `${out[max - 1].replace(/.$/u, '')}…`;
  return out;
}

/** The player's route (TripPlayer routePath): one gentle arc per leg, inside a square box on the card */
function drawRoute(ctx: CanvasRenderingContext2D, stops: TripStop[], box: { x: number; y: number; size: number }, font: string) {
  const at = (p: TripStop) => [box.x + (p.x / 100) * box.size, box.y + (p.y / 100) * box.size] as const;
  const trace = () => {
    ctx.beginPath();
    const [x0, y0] = at(stops[0]);
    ctx.moveTo(x0, y0);
    for (let i = 0; i < stops.length - 1; i++) {
      const [ax, ay] = at(stops[i]);
      const [bx, by] = at(stops[i + 1]);
      const bend = 0.18;
      ctx.quadraticCurveTo((ax + bx) / 2 - (by - ay) * bend, (ay + by) / 2 + (bx - ax) * bend, bx, by);
    }
  };
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.setLineDash([2, 18]);
  trace();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `700 30px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  stops.forEach((p, i) => {
    const [x, y] = at(p);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0F172A';
    ctx.fillText(String(i + 1), x, y + 1);
    ctx.shadowBlur = 12;
    // The city under its dot, clear of the line, kept inside the card
    ctx.font = `700 36px ${font}`;
    ctx.fillStyle = '#fff';
    const name = p.name.slice(0, 18);
    const half = ctx.measureText(name).width / 2;
    ctx.fillText(name, Math.min(W - 60 - half, Math.max(60 + half, x)), y + 62);
    ctx.font = `700 30px ${font}`;
  });
  ctx.restore();
}

export async function drawTripCard(trip: TripView): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const font = getComputedStyle(document.body).fontFamily || 'sans-serif';
  await document.fonts?.ready;

  // The cover fills the card; without one, a warm gradient
  const [cover, logo] = await Promise.all([loadImage(`/api/trips/${trip.id}/cover`), loadImage('/brand-logo.png')]);
  if (cover) {
    const scale = Math.max(W / cover.width, H / cover.height);
    const w = cover.width * scale;
    const h = cover.height * scale;
    ctx.drawImage(cover, (W - w) / 2, (H - h) / 2, w, h);
  } else {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1E3A8A');
    bg.addColorStop(1, '#E11D48');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }
  const top = ctx.createLinearGradient(0, 0, 0, 360);
  top.addColorStop(0, 'rgba(0,0,0,0.55)');
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, 360);
  const bottom = ctx.createLinearGradient(0, H * 0.4, 0, H);
  bottom.addColorStop(0, 'rgba(0,0,0,0)');
  bottom.addColorStop(0.45, 'rgba(0,0,0,0.55)');
  bottom.addColorStop(1, 'rgba(0,0,0,0.88)');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, H * 0.4, W, H * 0.6);

  // Brand at the top
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  let x = 80;
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, 96, 84, 84, 20);
    ctx.clip();
    ctx.drawImage(logo, x, 96, 84, 84);
    ctx.restore();
    x += 108;
  }
  ctx.font = `700 52px ${font}`;
  ctx.fillText('Chillwaa', x, 140);
  ctx.font = `500 34px ${font}`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'right';
  ctx.fillText('เรื่องเล่าทริป', W - 80, 140);
  ctx.textAlign = 'left';

  // From the bottom up: link, numbers, route, dates, title
  const parts = tripParts(trip);
  const cities = [...new Set(parts.map((p) => p.city).filter(Boolean))];
  const days = daysBetween(trip.startsOn, trip.endsOn) + 1;
  const count = visibleItems(trip).length;
  ctx.textBaseline = 'alphabetic';
  let y = H - 120;
  ctx.font = `500 34px ${font}`;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('ดูเรื่องเต็มได้ที่ chillwaa.com', 80, y);

  y -= 90;
  ctx.font = `700 48px ${font}`;
  ctx.fillStyle = '#fff';
  const stats = [`${days} วัน`, ...(cities.length > 1 ? [`${cities.length} เมือง`] : []), `${count} โมเมนต์`].join('  ·  ');
  ctx.fillText(stats, 80, y);

  if (cities.length) {
    ctx.font = `500 42px ${font}`;
    const route = lines(ctx, cities.join(' → '), W - 160, 2);
    y -= 30;
    for (const line of route.reverse()) {
      y -= 58;
      ctx.fillText(line, 80, y);
    }
  }

  y -= 76;
  ctx.font = `500 40px ${font}`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(`${thaiDateRange(trip.startsOn, trip.endsOn)} · ${trip.author.name}`.slice(0, 60), 80, y);

  ctx.font = `700 96px ${font}`;
  ctx.fillStyle = '#fff';
  const title = lines(ctx, trip.title, W - 160, 3);
  y -= 40;
  for (const line of title.reverse()) {
    y -= 118;
    ctx.fillText(line, 80, y);
  }

  // The route between the brand and the title, when there is room for it
  const stops = tripStops(trip);
  const room = { top: 300, bottom: y - 150 };
  const size = Math.min(W - 160, room.bottom - room.top);
  if (stops.length >= 2 && size >= 360) drawRoute(ctx, stops, { x: (W - size) / 2, y: room.top + (room.bottom - room.top - size) / 2, size }, font);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9));
}

/**
 * The card button: draws the card, then opens the phone's share sheet (IG Story, LINE…). Safari allows sharing a file
 * only straight after a tap, and drawing takes a moment, so when it refuses the card waits and the next tap shares it.
 * Where files cannot be shared (most computers) the picture is saved instead.
 */
export function useTripCard(trip: TripView, toast: (message: string) => void) {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<File | null>(null);
  const send = async (file: File) => {
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: trip.title });
        setReady(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotAllowedError') setReady(file);
        else setReady(null);
      }
      return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setReady(null);
    toast('บันทึกรูปแล้ว ลงสตอรี่ได้เลย');
  };
  const go = async () => {
    if (ready) return send(ready);
    setBusy(true);
    const blob = await drawTripCard(trip).catch(() => null);
    setBusy(false);
    if (!blob) {
      toast('ทำรูปไม่สำเร็จ ลองอีกครั้งนะ');
      return;
    }
    await send(new File([blob], `chillwaa-trip-${trip.id.slice(0, 8)}.jpg`, { type: 'image/jpeg' }));
  };
  return { busy, ready: Boolean(ready), go };
}

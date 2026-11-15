'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { DialogShell } from '@/components/auth/DialogShell';

const MAX_ZOOM = 4;
/** The saved picture: square, enough for every place an avatar shows (the largest is the profile header) */
const OUT_SIZE = 640;

type View = { zoom: number; x: number; y: number };

/**
 * "ปรับรูปโปรไฟล์" (owner 2026-11-15): after picking a photo, place it in the circle the way Instagram and LINE do:
 * drag to move, pinch / scroll / the slider to zoom, then save the square inside the frame. Only placing the photo:
 * filters and stickers belong to posts (components/moments/PhotoEditor.tsx).
 */
export function AvatarCropDialog({ src, onCancel, onDone }: { src: string; onCancel: () => void; onDone: (file: File, preview: string) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [stage, setStage] = useState(288);
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ lastX: number; lastY: number; distance?: number } | null>(null);

  // The photo covers the frame at zoom 1 (its short side fills it)
  const baseScale = natural ? stage / Math.min(natural.w, natural.h) : 1;

  /** Keeps the frame filled: the photo's edges never come inside the circle's square */
  const clamp = useCallback(
    (v: View): View => {
      if (!natural) return v;
      const scale = baseScale * v.zoom;
      const w = natural.w * scale;
      const h = natural.h * scale;
      return { zoom: v.zoom, x: Math.min(0, Math.max(stage - w, v.x)), y: Math.min(0, Math.max(stage - h, v.y)) };
    },
    [natural, baseScale, stage]
  );

  /** Zoom keeping the point (cx, cy) of the frame where it is */
  const zoomTo = useCallback(
    (next: number, cx = stage / 2, cy = stage / 2) =>
      setView((v) => {
        const zoom = Math.min(MAX_ZOOM, Math.max(1, next));
        const ratio = zoom / v.zoom;
        return clamp({ zoom, x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio });
      }),
    [clamp, stage]
  );

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const size = stageRef.current?.getBoundingClientRect().width || 288;
      setStage(size);
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      // Centred at zoom 1
      const scale = size / Math.min(img.naturalWidth, img.naturalHeight);
      setView({ zoom: 1, x: (size - img.naturalWidth * scale) / 2, y: (size - img.naturalHeight * scale) / 2 });
    };
    img.onerror = () => setFailed(true);
    img.src = src;
  }, [src]);

  // Scroll zooms on a computer (a non-passive listener, so the page does not scroll with it)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const box = el.getBoundingClientRect();
      setView((v) => {
        const zoom = Math.min(MAX_ZOOM, Math.max(1, v.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
        const cx = e.clientX - box.left;
        const cy = e.clientY - box.top;
        const ratio = zoom / v.zoom;
        return clamp({ zoom, x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio });
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [clamp]);

  const local = (e: React.PointerEvent) => {
    const box = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };
  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
    const pts = [...pointers.current.values()];
    gesture.current = pts.length === 2 ? { lastX: (pts[0].x + pts[1].x) / 2, lastY: (pts[0].y + pts[1].y) / 2, distance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) } : { lastX: pts[0].x, lastY: pts[0].y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, local(e));
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    if (pts.length === 2 && g.distance) {
      // Pinch: zoom around the fingers' midpoint, and move with it
      const mx = (pts[0].x + pts[1].x) / 2;
      const my = (pts[0].y + pts[1].y) / 2;
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      setView((v) => {
        const zoom = Math.min(MAX_ZOOM, Math.max(1, v.zoom * (distance / g.distance!)));
        const ratio = zoom / v.zoom;
        return clamp({ zoom, x: mx - (mx - v.x) * ratio + (mx - g.lastX), y: my - (my - v.y) * ratio + (my - g.lastY) });
      });
      gesture.current = { lastX: mx, lastY: my, distance };
    } else if (pts.length === 1) {
      const dx = pts[0].x - g.lastX;
      const dy = pts[0].y - g.lastY;
      setView((v) => clamp({ ...v, x: v.x + dx, y: v.y + dy }));
      gesture.current = { lastX: pts[0].x, lastY: pts[0].y };
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    const pts = [...pointers.current.values()];
    gesture.current = pts.length === 1 ? { lastX: pts[0].x, lastY: pts[0].y } : null;
  };
  // Keyboard: arrows move, + and - zoom
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 40 : 10;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      setView((v) => clamp({ ...v, x: v.x + moves[e.key][0], y: v.y + moves[e.key][1] }));
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomTo(view.zoom + 0.2);
    } else if (e.key === '-') {
      e.preventDefault();
      zoomTo(view.zoom - 0.2);
    }
  };

  const save = () => {
    const img = imgRef.current;
    if (!img || !natural) return;
    setIsSaving(true);
    const scale = baseScale * view.zoom;
    const canvas = document.createElement('canvas');
    canvas.width = OUT_SIZE;
    canvas.height = OUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return setIsSaving(false);
    ctx.imageSmoothingQuality = 'high';
    // The frame's square, in the photo's own pixels
    ctx.drawImage(img, -view.x / scale, -view.y / scale, stage / scale, stage / scale, 0, 0, OUT_SIZE, OUT_SIZE);
    // JPEG, which every browser can write (Safari writes WebP as PNG)
    canvas.toBlob(
      (blob) => {
        setIsSaving(false);
        if (!blob) return setFailed(true);
        onDone(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }), URL.createObjectURL(blob));
      },
      'image/jpeg',
      0.9
    );
  };

  const scale = baseScale * view.zoom;
  return (
    <DialogShell onClose={onCancel} title="ปรับรูปโปรไฟล์" subtitle="ลากเพื่อเลื่อน ใช้สองนิ้วหรือแถบด้านล่างเพื่อซูม" size="sm" layer="top" focusField={false}>
      <div className="space-y-5">
        <div
          ref={stageRef}
          role="img"
          aria-label="ตัวอย่างรูปโปรไฟล์ ใช้ลูกศรเพื่อเลื่อน และปุ่ม + หรือ - เพื่อซูม"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className="relative mx-auto w-72 max-w-full aspect-square overflow-hidden rounded-2xl bg-slate-900 touch-none select-none cursor-grab active:cursor-grabbing focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          {natural && (
            // eslint-disable-next-line @next/next/no-img-element -- a local photo being placed, not a page image
            <img
              src={src}
              alt=""
              draggable={false}
              className="absolute top-0 left-0 max-w-none pointer-events-none"
              style={{ width: natural.w * scale, height: natural.h * scale, transform: `translate(${view.x}px, ${view.y}px)` }}
            />
          )}
          {/* The circle: what shows as the avatar; outside it is dimmed */}
          <span className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgb(15_23_42/0.55)] ring-2 ring-white/80" aria-hidden="true" />
          {!natural && !failed && <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-white animate-spin" aria-hidden="true" />}
          {failed && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">เปิดรูปนี้ไม่ได้ ลองเลือกรูปอื่นนะ</p>}
        </div>

        <div className="flex items-center gap-3 px-1">
          <button type="button" onClick={() => zoomTo(view.zoom - 0.25)} disabled={view.zoom <= 1} aria-label="ซูมออก" className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            <ZoomOut className="w-5 h-5" aria-hidden="true" />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={view.zoom}
            onChange={(e) => zoomTo(Number(e.target.value))}
            aria-label="ซูม"
            className="flex-1 accent-[#2563EB] cursor-pointer"
          />
          <button type="button" onClick={() => zoomTo(view.zoom + 0.25)} disabled={view.zoom >= MAX_ZOOM} aria-label="ซูมเข้า" className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            <ZoomIn className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* The safe choice on the left, the action on the right (DESIGN_SYSTEM.md, Dialogs) */}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} className="h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 cursor-pointer">
            ยกเลิก
          </button>
          <button type="button" onClick={save} disabled={!natural || isSaving} className="h-12 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-sm font-bold text-white inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            ใช้รูปนี้
          </button>
        </div>
      </div>
    </DialogShell>
  );
}

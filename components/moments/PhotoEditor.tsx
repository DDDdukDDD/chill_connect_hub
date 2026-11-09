'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Blend, Camera, Coffee, CopyCheck, Crop, Flower2, Heart, Maximize2, Minimize2, Music, Plus, Sparkles, Star, Sticker, Sun, SunMedium, Trash2, Type, UtensilsCrossed, X, ZoomIn, ZoomOut } from 'lucide-react';
import {
  FILTERS, ICON_STICKERS, MAX_FUN_STICKERS, MAX_ZOOM, POST_SHAPES, minZoom, STICKER_SCALES, STICKER_STYLES, WORD_STICKERS,
  applyTone, clampPan, drawBase, drawOverlays, hitOverlay, loadEditorFont, toneOf,
  type EditedPhoto, type FunSticker, type PhotoText, type PostShape,
} from '@/lib/media/photoEdit';
import { Segmented, TextTools, newText } from './EditorControls';

/**
 * Second step of posting photos, the way Instagram does it: the post's shape (1:1 or 4:5), crop, filter, light and
 * colour, text, and stickers (line icons, short words; the place is chosen on the next step). The frame shows exactly what will upload
 * (lib/media/photoEdit.ts). Each photo keeps its own edits; a filter or light setting can be copied to every photo.
 * The photos' order is the post's order: press and hold a thumbnail (or drag it with a mouse) to move it.
 */

type Tool = 'crop' | 'filter' | 'light' | 'text' | 'sticker';
const TOOLS: { id: Tool; label: string; Icon: typeof Crop }[] = [
  { id: 'crop', label: 'ครอป', Icon: Crop },
  { id: 'filter', label: 'ฟิลเตอร์', Icon: Blend },
  { id: 'light', label: 'แสง', Icon: SunMedium },
  { id: 'text', label: 'ข้อความ', Icon: Type },
  { id: 'sticker', label: 'สติกเกอร์', Icon: Sticker },
];
const ICON_BUTTONS: Record<string, typeof Heart> = { heart: Heart, star: Star, sparkles: Sparkles, sun: Sun, coffee: Coffee, food: UtensilsCrossed, music: Music, camera: Camera, flower: Flower2 };
const PREVIEW_WIDTH = 900;
/** Where new stickers land, in turn (shares of the frame) */
const STICKER_SPOTS: [number, number][] = [[0.3, 0.25], [0.7, 0.4], [0.3, 0.6], [0.7, 0.75], [0.5, 0.5]];
/** How long a finger rests on a thumbnail before it can be dragged; moving sooner scrolls the row instead */
const HOLD_MS = 280;

interface PhotoEditorProps {
  photos: EditedPhoto[];
  onChange: (photos: EditedPhoto[]) => void;
  onAddFiles: (files: FileList) => void;
  maxPhotos: number;
  /** The post's shape, the same for every photo */
  shape: PostShape;
  onShapeChange: (shape: PostShape) => void;
  onBack: () => void;
  onNext: () => void;
}

/** One filter's look on this photo, small */
function FilterPreview({ photo, filter }: { photo: EditedPhoto; filter: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const { naturalWidth: w, naturalHeight: h, width } = photo.image;
    if (!width) return;
    const side = Math.min(w, h);
    ctx.drawImage(photo.image, (w - side) / 2, (h - side) / 2, side, side, 0, 0, 72, 72);
    const data = ctx.getImageData(0, 0, 72, 72);
    applyTone(data, toneOf({ filter, light: 0, contrast: 0, color: 0 }));
    ctx.putImageData(data, 0, 0);
  }, [photo.image, filter]);
  return <canvas ref={canvas} width={72} height={72} className="w-14 h-14 rounded-full" aria-hidden="true" />;
}

/** A light slider: the name on the left, a small number only once it moves off zero */
function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs font-semibold text-slate-700">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} onDoubleClick={() => onChange(0)} className="flex-1 h-8 accent-[#2563EB] cursor-pointer" />
      <span className={`w-8 shrink-0 text-right text-xs tabular-nums ${value ? 'font-semibold text-slate-700' : 'text-transparent'}`}>{value > 0 ? `+${value}` : value}</span>
    </label>
  );
}

/** Copies one photo's filter or light to the others; quiet, so it never looks like the main action */
function ApplyAll({ onClick, done }: { onClick: () => void; done: boolean }) {
  return (
    <button type="button" onClick={onClick} className="h-8 px-2 rounded-full text-xs font-semibold text-[#2563EB] hover:bg-blue-50 cursor-pointer inline-flex items-center gap-1 whitespace-nowrap">
      <CopyCheck className="w-4 h-4" aria-hidden="true" />
      {done ? 'ใช้กับทุกรูปแล้ว' : 'ใช้กับทุกรูป'}
    </button>
  );
}

export function PhotoEditor({ photos, onChange, onAddFiles, maxPhotos, shape, onShapeChange, onBack, onNext }: PhotoEditorProps) {
  const [shownId, setShownId] = useState(photos[0]?.id ?? '');
  const [tool, setTool] = useState<Tool>('crop');
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedFun, setSelectedFun] = useState<string | null>(null);
  const [copied, setCopied] = useState<'filter' | 'light' | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const base = useRef<HTMLCanvasElement | null>(null);
  const baseKey = useRef('');
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ kind: 'pan' | 'text' | 'fun' | 'sticker' | 'pinch'; id?: string; lastX: number; lastY: number; distance?: number } | null>(null);
  const [fontReady, setFontReady] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const reorder = useRef<{ id: string; x: number; y: number; active: boolean; moved: boolean; scrolling?: boolean; timer?: ReturnType<typeof setTimeout> } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const shownIndex = Math.max(0, photos.findIndex((p) => p.id === shownId));
  const photo = photos[shownIndex];
  const previewHeight = Math.round(PREVIEW_WIDTH / shape);
  const update = (change: Partial<EditedPhoto>) => onChange(photos.map((p, i) => (i === shownIndex ? { ...p, ...change } : p)));
  const textOn = photo?.texts.find((t) => t.id === selectedText) ?? null;
  const funOn = photo?.stickers.find((s) => s.id === selectedFun) ?? null;
  /** Below 1 the whole photo shows, with white around it */
  const fitZoom = photo ? minZoom(photo, shape) : 1;
  const isWhole = Boolean(photo) && fitZoom < 1 && photo.zoom < 1;

  useEffect(() => {
    loadEditorFont()?.then(() => setFontReady((n) => n + 1));
  }, []);

  // The photo and colours are slow to work out and rarely change; dragging text only redraws what sits on top
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx || !photo) return;
    const key = [photo.id, shape, photo.zoom, photo.panX, photo.panY, photo.filter, photo.light, photo.contrast, photo.color].join('|');
    if (key !== baseKey.current || !base.current) {
      base.current ??= document.createElement('canvas');
      base.current.width = PREVIEW_WIDTH;
      base.current.height = previewHeight;
      const baseCtx = base.current.getContext('2d', { willReadFrequently: true });
      if (baseCtx) drawBase(baseCtx, photo, PREVIEW_WIDTH, previewHeight);
      baseKey.current = key;
    }
    ctx.drawImage(base.current, 0, 0);
    drawOverlays(ctx, photo, PREVIEW_WIDTH, previewHeight);
  }, [photo, fontReady, shape, previewHeight]);

  // Scroll on the photo zooms on a computer
  useEffect(() => {
    const el = canvas.current;
    if (!el || tool !== 'crop') return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      onChange(photos.map((p, i) => (i === shownIndex ? { ...p, zoom: Math.max(minZoom(p, shape), Math.min(MAX_ZOOM, p.zoom + (e.deltaY < 0 ? 0.08 : -0.08))) } : p)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [tool, photos, shownIndex, onChange, shape]);

  // While a thumbnail is being dragged, the finger moves it instead of scrolling the row
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const hold = (e: TouchEvent) => {
      if (reorder.current?.active) e.preventDefault();
    };
    el.addEventListener('touchmove', hold, { passive: false });
    return () => el.removeEventListener('touchmove', hold);
  }, []);

  if (!photo) return null;

  const show = (id: string) => {
    setShownId(id);
    setSelectedText(null);
    setSelectedFun(null);
    setCopied(null);
  };

  /* ---------- the photo: crop, move text and stickers ---------- */

  const positionOf = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const at = positionOf(e);
    pointers.current.set(e.pointerId, at);
    if (pointers.current.size === 2 && tool === 'crop') {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { kind: 'pinch', lastX: 0, lastY: 0, distance: Math.hypot(a.x - b.x, a.y - b.y) };
      return;
    }
    const ctx = canvas.current?.getContext('2d');
    const hit = ctx ? hitOverlay(ctx, photo, PREVIEW_WIDTH, previewHeight, at.x, at.y) : null;
    if (hit?.type === 'text') {
      setSelectedText(hit.id);
      setTool('text');
      gesture.current = { kind: 'text', id: hit.id, lastX: at.x, lastY: at.y };
    } else if (hit?.type === 'fun') {
      setSelectedFun(hit.id);
      setTool('sticker');
      gesture.current = { kind: 'fun', id: hit.id, lastX: at.x, lastY: at.y };
    } else if (hit?.type === 'sticker') {
      gesture.current = { kind: 'sticker', lastX: at.x, lastY: at.y };
    } else {
      gesture.current = tool === 'crop' ? { kind: 'pan', lastX: at.x, lastY: at.y } : null;
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    const at = positionOf(e);
    pointers.current.set(e.pointerId, at);
    const move = gesture.current;
    if (move.kind === 'pinch') {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      update({ zoom: Math.max(minZoom(photo, shape), Math.min(MAX_ZOOM, photo.zoom * (distance / (move.distance || distance)))) });
      move.distance = distance;
      return;
    }
    const [dx, dy] = [at.x - move.lastX, at.y - move.lastY];
    move.lastX = at.x;
    move.lastY = at.y;
    const keep = (v: number) => Math.max(0.03, Math.min(0.97, v));
    if (move.kind === 'pan') update(clampPan(photo, shape, photo.panX + dx, photo.panY + dy));
    if (move.kind === 'text') update({ texts: photo.texts.map((t) => (t.id === move.id ? { ...t, x: keep(t.x + dx), y: keep(t.y + dy) } : t)) });
    if (move.kind === 'fun') update({ stickers: photo.stickers.map((s) => (s.id === move.id ? { ...s, x: keep(s.x + dx), y: keep(s.y + dy) } : s)) });
    if (move.kind === 'sticker' && photo.sticker) update({ sticker: { ...photo.sticker, x: keep(photo.sticker.x + dx), y: keep(photo.sticker.y + dy) } });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2 && gesture.current?.kind === 'pinch') gesture.current = null;
    if (pointers.current.size === 0) gesture.current = null;
  };

  /* ---------- text ---------- */

  const editText = (change: Partial<PhotoText>) => update({ texts: photo.texts.map((t) => (t.id === selectedText ? { ...t, ...change } : t)) });
  const typeText = (value: string) => {
    if (textOn) return value ? editText({ text: value }) : removeText();
    if (!value) return;
    const text = newText(photo.texts, value);
    setSelectedText(text.id);
    update({ texts: [...photo.texts, text] });
  };
  const removeText = () => {
    update({ texts: photo.texts.filter((t) => t.id !== selectedText) });
    setSelectedText(null);
  };

  /* ---------- stickers ---------- */

  const addFun = (kind: FunSticker['kind'], value: string) => {
    if (photo.stickers.length >= MAX_FUN_STICKERS) return;
    const id = `s${Math.max(0, ...photo.stickers.map((s) => Number(s.id.slice(1)))) + 1}`;
    // Each new one lands on its own spot, so they do not hide each other
    const [x, y] = STICKER_SPOTS[photo.stickers.length % STICKER_SPOTS.length];
    const sticker: FunSticker = { id, kind, value, style: 'rose', x, y, scale: 1 };
    update({ stickers: [...photo.stickers, sticker] });
    setSelectedFun(id);
  };
  const editFun = (change: Partial<FunSticker>) => update({ stickers: photo.stickers.map((s) => (s.id === selectedFun ? { ...s, ...change } : s)) });
  const removeFun = () => {
    update({ stickers: photo.stickers.filter((s) => s.id !== selectedFun) });
    setSelectedFun(null);
  };

  /* ---------- the photos in this post ---------- */

  const removePhoto = (at: number) => {
    const rest = photos.filter((_, i) => i !== at);
    onChange(rest);
    show(rest[Math.max(0, at - 1)]?.id ?? '');
  };

  const copyToAll = (what: 'filter' | 'light') => {
    const pick = what === 'filter' ? { filter: photo.filter } : { light: photo.light, contrast: photo.contrast, color: photo.color };
    onChange(photos.map((p) => ({ ...p, ...pick })));
    setCopied(what);
  };

  const onThumbDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (photos.length < 2) return;
    const state: NonNullable<typeof reorder.current> = { id, x: e.clientX, y: e.clientY, active: false, moved: false };
    // A mouse drags straight away; a finger holds first, so swiping still scrolls the row
    if (e.pointerType !== 'mouse') {
      state.timer = setTimeout(() => {
        state.active = true;
        setDraggingId(id);
        navigator.vibrate?.(10);
      }, HOLD_MS);
    }
    reorder.current = state;
  };

  const onThumbMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = reorder.current;
    if (!state || state.scrolling) return;
    const far = Math.hypot(e.clientX - state.x, e.clientY - state.y) > 6;
    if (!state.active) {
      if (!far) return;
      if (e.pointerType !== 'mouse') {
        // Moved before the hold finished: this is a scroll, not a tap and not a drag
        clearTimeout(state.timer);
        state.moved = true;
        state.scrolling = true;
        return;
      }
      state.active = true;
      setDraggingId(state.id);
    }
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId);
    state.moved = true;
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-photo-id]')?.dataset.photoId;
    if (!over || over === state.id) return;
    const from = photos.findIndex((p) => p.id === state.id);
    const to = photos.findIndex((p) => p.id === over);
    if (from < 0 || to < 0) return;
    const next = [...photos];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
  };

  /** `tapped` is false when the browser took the touch over (a scroll): that never picks a photo */
  const onThumbUp = (id: string, tapped: boolean) => {
    const state = reorder.current;
    clearTimeout(state?.timer);
    reorder.current = null;
    setDraggingId(null);
    // A drag is not a tap: it leaves the photo being edited as it was
    if (tapped && !state?.moved) show(id);
  };

  /* ---------- panels ---------- */

  const panel = (
    <>
      {tool === 'crop' && (
        <div className="space-y-3">
          {/* The shape is the post's, so it reads as a choice for the whole post */}
          <Segmented label="รูปทรงโพสต์" options={POST_SHAPES.map((s) => [s.label, s.ratio] as [string, PostShape])} value={shape} onChange={onShapeChange} />
          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4 shrink-0 text-slate-500" aria-hidden="true" />
            <input
              type="range"
              aria-label="ซูม"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={Math.max(1, photo.zoom)}
              onChange={(e) => {
                const zoom = Number(e.target.value);
                update({ zoom, ...clampPan({ ...photo, zoom }, shape, photo.panX, photo.panY) });
              }}
              className="flex-1 h-8 accent-[#2563EB] cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 shrink-0 text-slate-500" aria-hidden="true" />
            {/* "See it all" is its own button, not the far end of the zoom slider (owner 2026-11-09: that read as confusing) */}
            {fitZoom < 1 && (
              <button
                type="button"
                onClick={() => {
                  const zoom = isWhole ? 1 : fitZoom;
                  update({ zoom, ...clampPan({ ...photo, zoom }, shape, 0, 0) });
                }}
                aria-pressed={isWhole}
                className={`shrink-0 h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${isWhole ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {isWhole ? <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />}
                {isWhole ? 'เต็มกรอบ' : 'ทั้งรูป'}
              </button>
            )}
          </div>
        </div>
      )}
      {tool === 'filter' && (
        <div className="space-y-1">
          {/* A row that slides on a phone; on a wide screen the side panel shows them all, four to a row */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 py-1 landscape:sm:grid landscape:sm:grid-cols-4 landscape:sm:gap-x-2 landscape:sm:gap-y-3 landscape:sm:overflow-visible landscape:sm:justify-items-center">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" onClick={() => { update({ filter: f.id }); setCopied(null); }} aria-pressed={photo.filter === f.id} className="group shrink-0 flex flex-col items-center gap-1 cursor-pointer">
                <span className={`rounded-full p-0.5 ring-2 transition-transform group-active:scale-95 ${photo.filter === f.id ? 'ring-[#2563EB]' : 'ring-transparent'}`}>
                  <FilterPreview photo={photo} filter={f.id} />
                </span>
                <span className={`text-xs ${photo.filter === f.id ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{f.label}</span>
              </button>
            ))}
          </div>
          {photos.length > 1 && <ApplyAll onClick={() => copyToAll('filter')} done={copied === 'filter'} />}
        </div>
      )}
      {tool === 'light' && (
        <div className="space-y-0.5">
          <Slider label="สว่าง" value={photo.light} min={-100} max={100} step={1} onChange={(light) => { update({ light }); setCopied(null); }} />
          {/* All three show: there are only three, so nothing hides behind a button (owner 2026-11-09) */}
          <Slider label="คอนทราสต์" value={photo.contrast} min={-100} max={100} step={1} onChange={(contrast) => { update({ contrast }); setCopied(null); }} />
          <Slider label="ความสด" value={photo.color} min={-100} max={100} step={1} onChange={(color) => { update({ color }); setCopied(null); }} />
          {photos.length > 1 && <div className="pt-1"><ApplyAll onClick={() => copyToAll('light')} done={copied === 'light'} /></div>}
        </div>
      )}
      {tool === 'text' && (
        <TextTools text={textOn} hasTexts={photo.texts.length > 0} on="รูป" onType={typeText} onEdit={editText} onRemove={removeText} onNew={() => setSelectedText(null)} />
      )}
      {tool === 'sticker' &&
        (funOn ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5" role="group" aria-label={funOn.kind === 'icon' ? 'สีไอคอน' : 'สีสติกเกอร์'}>
              {STICKER_STYLES.map((style) => (
                <button key={style.id} type="button" onClick={() => editFun({ style: style.id })} aria-label={`สี${style.label}`} aria-pressed={funOn.style === style.id} style={{ background: style.fill }} className={`w-7 h-7 rounded-full border cursor-pointer ${funOn.style === style.id ? 'ring-2 ring-offset-1 ring-[#2563EB] border-transparent' : 'border-slate-300'}`} />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented label="ขนาดสติกเกอร์" options={STICKER_SCALES} value={funOn.scale} onChange={(scale) => editFun({ scale })} />
              <button type="button" onClick={removeFun} className="h-8 px-3 rounded-full bg-slate-100 hover:bg-rose-50 text-xs font-semibold text-slate-700 hover:text-rose-600 cursor-pointer inline-flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                ลบ
              </button>
              <button type="button" onClick={() => setSelectedFun(null)} className="h-8 px-2.5 rounded-full text-xs font-bold text-[#2563EB] hover:bg-blue-50 cursor-pointer inline-flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                เพิ่มสติกเกอร์อื่น
              </button>
            </div>
            <p className="text-xs text-slate-500">ลากสติกเกอร์บนรูปไปวางตรงที่ชอบ</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="grid grid-cols-5 sm:portrait:grid-cols-9 gap-1.5" role="group" aria-label="สติกเกอร์ไอคอน">
                {Object.entries(ICON_STICKERS).map(([key, { label }]) => {
                  const Icon = ICON_BUTTONS[key];
                  return (
                    <button key={key} type="button" onClick={() => addFun('icon', key)} disabled={photo.stickers.length >= MAX_FUN_STICKERS} aria-label={`ติดสติกเกอร์${label}`} className="aspect-square rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-[#F43F5E] flex items-center justify-center cursor-pointer">
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="สติกเกอร์คำ">
                {WORD_STICKERS.map((word) => (
                  <button key={word} type="button" onClick={() => addFun('word', word)} disabled={photo.stickers.length >= MAX_FUN_STICKERS} className="h-8 px-3 rounded-full bg-[#F43F5E] hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white whitespace-nowrap cursor-pointer">
                    {word}
                  </button>
                ))}
              </div>
              {photo.stickers.length >= MAX_FUN_STICKERS && <p className="text-xs text-slate-500">ติดได้สูงสุด {MAX_FUN_STICKERS} ชิ้นต่อรูป</p>}
            </div>
          </div>
        ))}
    </>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-slate-100 shrink-0">
        <button type="button" onClick={onBack} aria-label="ย้อนกลับ" className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 id="create-moment-title" className="font-bold text-base text-slate-900">แต่งรูป</h3>
        <button type="button" onClick={onNext} className="h-10 px-5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold shadow-sm cursor-pointer">
          ถัดไป
        </button>
      </div>

      {/* The photo is the hero (owner 2026-11-09: minimal, cute, easy): the photo and its strip of thumbnails on one side,
          one tool's controls and the tool bar on the other. Upright screens stack them; wide screens put them side by side */}
      <div className="flex-1 min-h-0 flex flex-col landscape:flex-row overflow-hidden">
        <div className="shrink-0 sm:portrait:flex-1 sm:portrait:min-h-0 landscape:flex-1 landscape:min-w-0 flex flex-col bg-[#F6F7FB]">
          {/* On a phone this box leaves the tools room under it; on a bigger screen it takes the height left. The frame is the
              largest one of the post's shape that fits */}
          <div className="[container-type:size] h-[min(100vw,calc(100dvh-23rem))] sm:portrait:h-auto sm:portrait:flex-1 sm:portrait:min-h-0 landscape:flex-1 landscape:min-h-0 flex items-center justify-center sm:p-4">
            <canvas
              ref={canvas}
              width={PREVIEW_WIDTH}
              height={previewHeight}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              aria-label="รูปที่กำลังแต่ง"
              role="img"
              style={{ touchAction: 'none', aspectRatio: `${shape}`, width: `min(100cqw, ${100 * shape}cqh)` }}
              className={`block bg-white sm:rounded-2xl sm:shadow-sm ${tool === 'crop' ? 'cursor-move' : ''}`}
            />
          </div>
          {/* The photos in this post, in the post's order: tap to edit one, hold and drag to move it, × takes it out. No
              line of instructions: the first is marked ปก and the + says what it does */}
          <div ref={strip} className="shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2.5 sm:[&>*:first-child]:ml-auto sm:[&>*:last-child]:mr-auto" aria-label="รูปในโพสต์นี้ แตะค้างแล้วลากเพื่อสลับลำดับ">
                {photos.map((p, i) => (
                  <div
                    key={p.id}
                    data-photo-id={p.id}
                    onPointerDown={(e) => onThumbDown(e, p.id)}
                    onPointerMove={onThumbMove}
                    onPointerUp={() => onThumbUp(p.id, true)}
                    onPointerCancel={() => onThumbUp(p.id, false)}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`relative shrink-0 select-none [-webkit-touch-callout:none] transition-transform ${draggingId === p.id ? 'scale-110 z-10 drop-shadow-lg' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') show(p.id);
                      }}
                      aria-label={`แก้รูปที่ ${i + 1}${i === 0 ? ' (ปก)' : ''}`}
                      aria-current={i === shownIndex}
                      className={`block w-12 h-12 rounded-xl overflow-hidden border-2 cursor-pointer ${i === shownIndex ? 'border-[#2563EB]' : 'border-transparent'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                      <img src={p.url} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none" />
                    </button>
                    {i === 0 && photos.length > 1 && (
                      <span className="pointer-events-none absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-1.5 text-[10px] font-semibold leading-4 text-white">ปก</span>
                    )}
                    {i === shownIndex && !draggingId && (
                      <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => removePhoto(i)} aria-label={photos.length > 1 ? `เอารูปที่ ${i + 1} ออก` : 'เอารูปนี้ออก แล้วเลือกใหม่'} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-900 ring-2 ring-white text-white flex items-center justify-center cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {photos.length < maxPhotos && (
                  <label className="shrink-0 w-12 h-12 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] text-slate-500 flex items-center justify-center cursor-pointer transition-colors" aria-label="เพิ่มรูป">
                    <Plus className="w-5 h-5" aria-hidden="true" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files?.length) onAddFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
          </div>
        </div>

        <div className="flex-1 min-h-0 min-w-0 sm:portrait:flex-none sm:portrait:h-[15rem] landscape:flex-none landscape:w-[320px] flex flex-col landscape:border-l border-slate-100">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 landscape:order-2">{panel}</div>

          {/* Under the thumb on a phone; on a wide screen the tools head the panel, so eyes do not jump to the bottom */}
          <div className="shrink-0 grid grid-cols-5 gap-1 px-2 py-1.5 border-t landscape:border-t-0 landscape:border-b border-slate-100 pb-[max(0.375rem,env(safe-area-inset-bottom))] landscape:pb-1.5 landscape:order-1" role="group" aria-label="เครื่องมือแต่งรูป">
            {TOOLS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTool(id)}
                aria-pressed={tool === id}
                className={`flex flex-col items-center justify-center gap-0.5 h-12 rounded-2xl text-[11px] cursor-pointer transition-colors active:scale-95 ${tool === id ? 'bg-[#EFF6FF] font-bold text-[#2563EB]' : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

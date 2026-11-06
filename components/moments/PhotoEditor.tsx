'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Crop, MapPin, Plus, Sparkles, SunMedium, Trash2, Type, X } from 'lucide-react';
import { FILTERS, MAX_ZOOM, TEXT_COLORS, applyTone, drawBase, drawOverlays, hitOverlay, loadEditorFont, toneOf, type EditedPhoto, type PhotoText } from '@/lib/media/photoEdit';

/**
 * Second step of posting photos, the way Instagram does it: crop, filter, light and colour, text on the photo, and a
 * sticker of the place. The frame shows exactly what will upload (lib/media/photoEdit.ts). Each photo keeps its own edits.
 */

type Tool = 'crop' | 'filter' | 'light' | 'text' | 'place';
const TOOLS: { id: Tool; label: string; Icon: typeof Crop }[] = [
  { id: 'crop', label: 'ครอป', Icon: Crop },
  { id: 'filter', label: 'ฟิลเตอร์', Icon: Sparkles },
  { id: 'light', label: 'ปรับแสง', Icon: SunMedium },
  { id: 'text', label: 'ข้อความ', Icon: Type },
  { id: 'place', label: 'สถานที่', Icon: MapPin },
];
const PREVIEW_SIZE = 900;
const TEXT_SIZES: [string, number][] = [['เล็ก', 0.045], ['กลาง', 0.07], ['ใหญ่', 0.1]];

interface PhotoEditorProps {
  photos: EditedPhoto[];
  onChange: (photos: EditedPhoto[]) => void;
  onAddFiles: (files: FileList) => void;
  maxPhotos: number;
  /** The place chosen so far, for its sticker */
  placeTitle: string | null;
  /** The place search, shown here while no place is chosen */
  placeField: React.ReactNode;
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
  return <canvas ref={canvas} width={72} height={72} className="w-16 h-16 rounded-xl" aria-hidden="true" />;
}

function Slider({ label, value, min, max, step, onChange, shown }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; shown?: string }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs font-semibold text-slate-700">
        {label}
        <span className="tabular-nums text-slate-500">{shown ?? value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-8 accent-[#2563EB] cursor-pointer" />
    </label>
  );
}

export function PhotoEditor({ photos, onChange, onAddFiles, maxPhotos, placeTitle, placeField, onBack, onNext }: PhotoEditorProps) {
  const [index, setIndex] = useState(0);
  const [tool, setTool] = useState<Tool>('crop');
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const base = useRef<HTMLCanvasElement | null>(null);
  const baseKey = useRef('');
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ kind: 'pan' | 'text' | 'sticker' | 'pinch'; id?: string; lastX: number; lastY: number; distance?: number } | null>(null);
  const [fontReady, setFontReady] = useState(0);

  const shownIndex = Math.min(index, photos.length - 1);
  const photo = photos[shownIndex];
  const update = (change: Partial<EditedPhoto>) => onChange(photos.map((p, i) => (i === shownIndex ? { ...p, ...change } : p)));
  const textOn = photo?.texts.find((t) => t.id === selectedText) ?? null;

  useEffect(() => {
    loadEditorFont()?.then(() => setFontReady((n) => n + 1));
  }, []);

  // The photo and colours are slow to work out and rarely change; dragging text only redraws what sits on top
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx || !photo) return;
    const key = [photo.id, photo.zoom, photo.panX, photo.panY, photo.filter, photo.light, photo.contrast, photo.color].join('|');
    if (key !== baseKey.current || !base.current) {
      base.current ??= Object.assign(document.createElement('canvas'), { width: PREVIEW_SIZE, height: PREVIEW_SIZE });
      const baseCtx = base.current.getContext('2d', { willReadFrequently: true });
      if (baseCtx) drawBase(baseCtx, photo, PREVIEW_SIZE);
      baseKey.current = key;
    }
    ctx.drawImage(base.current, 0, 0);
    drawOverlays(ctx, photo, PREVIEW_SIZE);
  }, [photo, fontReady]);

  // Scroll on the photo zooms on a computer
  useEffect(() => {
    const el = canvas.current;
    if (!el || tool !== 'crop') return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      onChange(photos.map((p, i) => (i === shownIndex ? { ...p, zoom: Math.max(1, Math.min(MAX_ZOOM, p.zoom + (e.deltaY < 0 ? 0.08 : -0.08))) } : p)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [tool, photos, shownIndex, onChange]);

  if (!photo) return null;

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
    const hit = ctx ? hitOverlay(ctx, photo, PREVIEW_SIZE, at.x, at.y) : null;
    if (hit?.type === 'text') {
      setSelectedText(hit.id);
      setTool('text');
      gesture.current = { kind: 'text', id: hit.id, lastX: at.x, lastY: at.y };
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
      update({ zoom: Math.max(1, Math.min(MAX_ZOOM, photo.zoom * (distance / (move.distance || distance)))) });
      move.distance = distance;
      return;
    }
    const [dx, dy] = [at.x - move.lastX, at.y - move.lastY];
    move.lastX = at.x;
    move.lastY = at.y;
    const keep = (v: number) => Math.max(0.03, Math.min(0.97, v));
    if (move.kind === 'pan') update(clampPan(photo, photo.panX + dx, photo.panY + dy));
    if (move.kind === 'text') update({ texts: photo.texts.map((t) => (t.id === move.id ? { ...t, x: keep(t.x + dx), y: keep(t.y + dy) } : t)) });
    if (move.kind === 'sticker' && photo.sticker) update({ sticker: { ...photo.sticker, x: keep(photo.sticker.x + dx), y: keep(photo.sticker.y + dy) } });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2 && gesture.current?.kind === 'pinch') gesture.current = null;
    if (pointers.current.size === 0) gesture.current = null;
  };

  const editText = (change: Partial<PhotoText>) => update({ texts: photo.texts.map((t) => (t.id === selectedText ? { ...t, ...change } : t)) });
  const typeText = (value: string) => {
    if (textOn) return value ? editText({ text: value }) : removeText();
    if (!value) return;
    const id = `t${Math.max(0, ...photo.texts.map((t) => Number(t.id.slice(1)))) + 1}`;
    setSelectedText(id);
    update({ texts: [...photo.texts, { id, text: value, x: 0.5, y: 0.5, color: TEXT_COLORS[0], size: TEXT_SIZES[1][1], boxed: false }] });
  };
  const removeText = () => {
    update({ texts: photo.texts.filter((t) => t.id !== selectedText) });
    setSelectedText(null);
  };

  const removePhoto = (at: number) => {
    onChange(photos.filter((_, i) => i !== at));
    setSelectedText(null);
    if (at <= shownIndex && shownIndex > 0) setIndex(shownIndex - 1);
  };

  const panel = (
    <>
      {tool === 'crop' && (
        <div className="space-y-1">
          <Slider label="ซูม" value={photo.zoom} min={1} max={MAX_ZOOM} step={0.01} shown={`${photo.zoom.toFixed(1)}x`} onChange={(zoom) => update({ zoom })} />
          <p className="text-xs text-slate-500">ลากบนรูปเพื่อเลื่อน ทุกโพสต์แสดงเป็นสี่เหลี่ยมจัตุรัส</p>
        </div>
      )}
      {tool === 'filter' && (
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => update({ filter: f.id })} aria-pressed={photo.filter === f.id} className="shrink-0 flex flex-col items-center gap-1 cursor-pointer">
              <span className={`rounded-[14px] p-0.5 border-2 ${photo.filter === f.id ? 'border-[#2563EB]' : 'border-transparent'}`}>
                <FilterPreview photo={photo} filter={f.id} />
              </span>
              <span className={`text-xs ${photo.filter === f.id ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{f.label}</span>
            </button>
          ))}
        </div>
      )}
      {tool === 'light' && (
        <div className="space-y-0.5">
          <Slider label="ความสว่าง" value={photo.light} min={-100} max={100} step={1} onChange={(light) => update({ light })} />
          <Slider label="คอนทราสต์" value={photo.contrast} min={-100} max={100} step={1} onChange={(contrast) => update({ contrast })} />
          <Slider label="ความสด" value={photo.color} min={-100} max={100} step={1} onChange={(color) => update({ color })} />
        </div>
      )}
      {tool === 'text' && (
        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <textarea
              rows={2}
              maxLength={80}
              value={textOn?.text ?? ''}
              onChange={(e) => typeText(e.target.value)}
              placeholder="พิมพ์ข้อความบนรูป แล้วลากไปวางตรงที่ชอบ"
              aria-label="ข้อความบนรูป"
              className="flex-1 min-w-0 bg-white border border-slate-300 rounded-2xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] placeholder:text-slate-500"
            />
            {textOn && (
              <button type="button" onClick={removeText} aria-label="ลบข้อความนี้" className="w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center cursor-pointer shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {textOn ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex items-center gap-1.5" role="group" aria-label="สีข้อความ">
                {TEXT_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => editText({ color })} aria-label={`สี ${color}`} aria-pressed={textOn.color === color} style={{ background: color }} className={`w-7 h-7 rounded-full border cursor-pointer ${textOn.color === color ? 'ring-2 ring-offset-1 ring-[#2563EB] border-transparent' : 'border-slate-300'}`} />
                ))}
              </div>
              <div className="flex items-center gap-1" role="group" aria-label="ขนาดข้อความ">
                {TEXT_SIZES.map(([label, size]) => (
                  <button key={label} type="button" onClick={() => editText({ size })} aria-pressed={textOn.size === size} className={`h-8 px-2.5 rounded-full text-xs font-semibold cursor-pointer ${textOn.size === size ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => editText({ boxed: !textOn.boxed })} aria-pressed={textOn.boxed} className={`h-8 px-2.5 rounded-full text-xs font-semibold cursor-pointer ${textOn.boxed ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                พื้นหลัง
              </button>
              <button type="button" onClick={() => setSelectedText(null)} className="h-8 px-2.5 rounded-full text-xs font-bold text-[#2563EB] hover:bg-blue-50 cursor-pointer inline-flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                เพิ่มอีกข้อความ
              </button>
            </div>
          ) : (
            photo.texts.length > 0 && <p className="text-xs text-slate-500">แตะข้อความบนรูปเพื่อแก้ไข</p>
          )}
        </div>
      )}
      {tool === 'place' &&
        (placeTitle ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800 truncate">{placeTitle}</p>
            {photo.sticker?.title === placeTitle ? (
              <button type="button" onClick={() => update({ sticker: undefined })} className="h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 cursor-pointer">
                เอาสติกเกอร์ออก
              </button>
            ) : (
              <button type="button" onClick={() => update({ sticker: { title: placeTitle, x: 0.5, y: 0.88 } })} className="h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 cursor-pointer inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#F43F5E]" aria-hidden="true" />
                ติดสติกเกอร์สถานที่บนรูป
              </button>
            )}
            <p className="text-xs text-slate-500">ลากสติกเกอร์ไปวางตรงที่ชอบ เพื่อนๆ จะได้รู้ว่าตามไปที่ไหน</p>
          </div>
        ) : (
          placeField
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

      {/* Side by side on a short, wide screen so the photo keeps its size */}
      <div className="flex-1 min-h-0 flex flex-col [@media(max-height:560px)]:flex-row sm:flex-row overflow-hidden">
        {/* This box leaves the tools room under it on a phone; the frame is the largest square that fits inside it */}
        <div className="[container-type:size] shrink-0 h-[min(100vw,calc(100dvh-20rem))] [@media(max-height:560px)]:h-full [@media(max-height:560px)]:flex-1 [@media(max-height:560px)]:min-w-0 sm:h-auto sm:flex-1 sm:min-w-0 flex items-center justify-center bg-slate-100 sm:p-4">
          <canvas
            ref={canvas}
            width={PREVIEW_SIZE}
            height={PREVIEW_SIZE}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label="รูปที่กำลังแต่ง"
            role="img"
            style={{ touchAction: 'none' }}
            className={`block aspect-square bg-slate-200 w-[min(100cqw,100cqh)] ${tool === 'crop' ? 'cursor-move' : ''}`}
          />
        </div>

        <div className="flex-1 min-h-0 min-w-0 sm:flex-none sm:w-[320px] flex flex-col border-t sm:border-t-0 sm:border-l border-slate-100">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
            {/* The photos in this post */}
            <div className={`items-center gap-2 overflow-x-auto no-scrollbar ${tool === 'text' || tool === 'place' ? 'hidden sm:flex' : 'flex'}`} aria-label="รูปในโพสต์นี้">
              {photos.map((p, i) => (
                <div key={p.id} className="relative shrink-0">
                  <button type="button" onClick={() => { setIndex(i); setSelectedText(null); }} aria-label={`แก้รูปที่ ${i + 1}`} aria-current={i === shownIndex} className={`block w-12 h-12 rounded-xl overflow-hidden border-2 cursor-pointer ${i === shownIndex ? 'border-[#2563EB]' : 'border-transparent'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </button>
                  {photos.length > 1 && i === shownIndex && (
                    <button type="button" onClick={() => removePhoto(i)} aria-label={`เอารูปที่ ${i + 1} ออก`} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {photos.length < maxPhotos && (
                <label className="shrink-0 w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer" aria-label="เพิ่มรูป">
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
            {panel}
          </div>

          <div className="shrink-0 grid grid-cols-5 border-t border-slate-100 pb-[env(safe-area-inset-bottom)]" role="group" aria-label="เครื่องมือแต่งรูป">
            {TOOLS.map(({ id, label, Icon }) => (
              <button key={id} type="button" onClick={() => setTool(id)} aria-pressed={tool === id} className={`flex flex-col items-center justify-center gap-0.5 h-14 text-[11px] cursor-pointer ${tool === id ? 'font-bold text-[#2563EB]' : 'font-medium text-slate-600 hover:text-slate-900'}`}>
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

/** Moving stops at the photo's edge, so a long drag past it does not have to be undone before the photo moves back */
function clampPan(photo: EditedPhoto, panX: number, panY: number) {
  const { naturalWidth: w, naturalHeight: h } = photo.image;
  const short = Math.max(1, Math.min(w, h));
  const room = (span: number) => Math.max(0, ((span / short) * photo.zoom - 1) / 2);
  const limit = (pan: number, span: number) => Math.max(-room(span), Math.min(room(span), pan));
  return { panX: limit(panX, w), panY: limit(panY, h) };
}

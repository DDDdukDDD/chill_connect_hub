'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Image as ImageIcon, MapPin, RotateCw, Search, Type, X } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { MOMENT_TARGETS } from '@/components/moments/momentTargets';
import { compressImage } from '@/lib/media/compressor';
import { STORY_TEXT_COLORS, storyTextColor, type StoryTextColor } from '@/lib/storyTextColors';

/**
 * "เพิ่มสตอรี่" made like a phone story (owner 2026-10-30): the photo full screen at 9:16 as viewers will see it,
 * text written on the photo ("Aa"), an "อยู่ที่ไหน" sticker that links the ตี้, อีเวนต์ or place, and one share
 * button at the bottom. Mount it only while open so each story starts clean.
 */

export type StoryTargetDraft = { type: 'community' | 'fair' | 'spot'; id: string; title: string };
export type StoryDraft = { file: File; caption: string; captionLayout: CaptionLayout; captionColor: StoryTextColor; target: StoryTargetDraft | null };

const MAX_CAPTION = 120;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

const PHOTO_BACK = 'absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60';
const PHOTO_FRONT = 'absolute inset-0 w-full h-full object-contain';

/** The photo whole, on a blurred copy of itself so a wide photo does not float in black (viewer) */
export function StoryPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- member upload */}
      <img src={src} alt="" aria-hidden="true" className={PHOTO_BACK} />
      {/* eslint-disable-next-line @next/next/no-img-element -- member upload */}
      <img src={src} alt={alt} className={PHOTO_FRONT} />
    </>
  );
}

/**
 * The picked photo in the composer, laid out like StoryPhoto but drawn on canvases: the file never becomes an
 * address in the page (CodeQL js/xss-through-dom flagged the object URL in <img src>)
 */
function PickedPhoto({ file, alt }: { file: File; alt: string }) {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    createImageBitmap(file).then((bitmap) => {
      if (!cancelled) {
        for (const canvas of [backRef.current, frontRef.current]) {
          if (!canvas) continue;
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
        }
      }
      bitmap.close();
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [file]);
  return (
    <>
      <canvas ref={backRef} aria-hidden="true" className={PHOTO_BACK} />
      <canvas ref={frontRef} role="img" aria-label={alt} className={PHOTO_FRONT} />
    </>
  );
}

/** Where the text sits: its centre as a share of the frame's width and height, and its turn in degrees */
export type CaptionLayout = { x: number; y: number; rotate: number };
const CENTRE: CaptionLayout = { x: 0.5, y: 0.42, rotate: 0 };

const placed = ({ x, y, rotate }: CaptionLayout): React.CSSProperties => ({
  left: `${x * 100}%`,
  top: `${y * 100}%`,
  transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
});
// No box behind the text (owner 2026-10-30); its colour comes with a soft edge that keeps it readable on any photo
const CAPTION_TEXT = 'text-2xl font-bold leading-snug text-center break-words';
const captionInk = (id?: string): React.CSSProperties => {
  const { hex, shadow } = storyTextColor(id);
  return { color: hex, textShadow: `0 1px 4px ${shadow}` };
};

/** The text on the photo where and how the author left it (viewer); the composer draws it with DraggableCaption */
export function StoryCaption({ text, layout, color }: { text: string; layout?: CaptionLayout; color?: StoryTextColor }) {
  return (
    <p className={`absolute w-max max-w-[85%] pointer-events-none ${CAPTION_TEXT}`} style={{ ...placed(layout ?? CENTRE), ...captionInk(color) }}>
      {text}
    </p>
  );
}

/** The "อยู่ที่ไหน" sticker, the same in the composer and the viewer: a white pill with the pillar's icon */
export function StorySticker({ target }: { target: StoryTargetDraft }) {
  const { Icon, icon } = MOMENT_TARGETS[target.type];
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-bold text-slate-900 shadow-lg">
      <Icon className={`w-4 h-4 shrink-0 ${icon}`} aria-hidden="true" />
      <span className="truncate">{target.title}</span>
    </span>
  );
}

/** The sticker's spot, under the middle of the photo (it does not move) */
export const STICKER_SPOT = 'absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 w-max max-w-[85%]';

const angleOf = (ax: number, ay: number, bx: number, by: number) => (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;

/**
 * The text in the composer: one finger (or the mouse) drags it, two fingers turn it, the round handle turns it with
 * a mouse, and a tap without moving opens it for editing.
 */
function DraggableCaption({ text, color, layout, onChange, onEdit, frame }: {
  text: string;
  color: StoryTextColor;
  layout: CaptionLayout;
  onChange: (layout: CaptionLayout) => void;
  onEdit: () => void;
  frame: React.RefObject<HTMLDivElement | null>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(0);
  // Pointer moves come faster than renders, so the handlers read the newest layout from here
  const latest = useRef(layout);
  useEffect(() => {
    latest.current = layout;
  }, [layout]);
  const change = (next: CaptionLayout) => {
    latest.current = next;
    onChange(next);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) moved.current = 0;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const before = pointers.current.get(e.pointerId);
    const area = frame.current?.getBoundingClientRect();
    if (!before || !area) return;
    const others = [...pointers.current.entries()].filter(([id]) => id !== e.pointerId).map(([, p]) => p);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const dx = e.clientX - before.x;
    const dy = e.clientY - before.y;
    moved.current += Math.abs(dx) + Math.abs(dy);
    const now = latest.current;
    // Two fingers: the pair's turn turns the text, and half of each finger's move moves it (the midpoint)
    const share = others.length ? 0.5 : 1;
    const turn = others.length ? angleOf(others[0].x, others[0].y, e.clientX, e.clientY) - angleOf(others[0].x, others[0].y, before.x, before.y) : 0;
    const inside = (n: number) => Math.min(0.95, Math.max(0.05, n));
    change({ x: inside(now.x + (dx * share) / area.width), y: inside(now.y + (dy * share) / area.height), rotate: now.rotate + turn });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0 && moved.current < 6) onEdit();
  };

  // The handle: the angle from the text's centre to the pointer, against where the drag began
  const turnStart = useRef<{ pointer: number; rotate: number } | null>(null);
  const centre = () => {
    const r = box.current!.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const onHandleDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const c = centre();
    turnStart.current = { pointer: angleOf(c.x, c.y, e.clientX, e.clientY), rotate: latest.current.rotate };
  };
  const onHandleMove = (e: React.PointerEvent) => {
    if (!turnStart.current) return;
    e.stopPropagation();
    const c = centre();
    change({ ...latest.current, rotate: turnStart.current.rotate + angleOf(c.x, c.y, e.clientX, e.clientY) - turnStart.current.pointer });
  };

  return (
    <div
      ref={box}
      role="button"
      tabIndex={0}
      aria-label={`ข้อความบนรูป: ${text} ลากเพื่อย้าย ใช้สองนิ้วหรือปุ่มมุมเพื่อหมุน แตะเพื่อแก้`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onEdit()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`group absolute w-max max-w-[85%] px-2 py-1 rounded-lg border border-dashed border-transparent hover:border-white/70 focus-visible:border-white/70 outline-none cursor-grab active:cursor-grabbing touch-none select-none ${CAPTION_TEXT}`}
      style={{ ...placed(layout), ...captionInk(color) }}
    >
      {text}
      <span
        role="presentation"
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={(e) => { e.stopPropagation(); turnStart.current = null; }}
        title="ลากเพื่อหมุน"
        className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white text-slate-800 shadow-md flex items-center justify-center cursor-alias [text-shadow:none] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:hidden"
      >
        <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
      </span>
    </div>
  );
}

export function StoryComposer({
  onClose,
  onShare,
  onToast,
  isBusy,
}: {
  onClose: () => void;
  onShare: (draft: StoryDraft) => void;
  onToast: (message: string) => void;
  isBusy: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState<StoryTextColor>('white');
  const [layout, setLayout] = useState<CaptionLayout>(CENTRE);
  const frameRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<StoryTargetDraft | null>(null);
  const [mode, setMode] = useState<'view' | 'text' | 'sticker'>('view');

  // Opened by a tap, so the photo picker opens at once; a browser that refuses leaves the "เลือกรูป" screen
  useEffect(() => fileRef.current?.click(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isBusy) return;
      if (mode !== 'view') setMode('view');
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, isBusy, onClose]);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    try {
      const compressed = await compressImage(picked, { maxWidth: 1080, maxHeight: 1920, quality: 0.85, targetMimeType: 'image/webp' });
      setFile(compressed);
    } catch {
      onToast('ใช้รูปนี้ไม่ได้ ลองเลือกรูปอื่น (JPG, PNG หรือ WebP)');
    }
  };

  const tool = 'w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div role="dialog" aria-modal="true" aria-label="เพิ่มสตอรี่" className="fixed inset-0 z-[70] bg-black flex items-center justify-center">
      <input ref={fileRef} type="file" accept={ACCEPT} onChange={pick} className="hidden" aria-hidden="true" tabIndex={-1} />
      <div ref={frameRef} className="relative w-full h-full sm:h-[92vh] sm:max-w-md sm:rounded-3xl overflow-hidden bg-slate-950">
        {file ? (
          <PickedPhoto file={file} alt="รูปที่เลือก" />
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white cursor-pointer">
            <span className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <ImageIcon className="w-7 h-7" aria-hidden="true" />
            </span>
            <span className="text-base font-bold">เลือกรูปจากเครื่อง</span>
            <span className="text-sm text-white/60">รูปเดียว แสดง 24 ชั่วโมง แล้วหายไปเอง</span>
          </button>
        )}

        {/* What viewers will see on the photo: the sticker in its spot, the text wherever it was dragged */}
        {file && mode === 'view' && target && (
          <button type="button" onClick={() => setMode('sticker')} className={`${STICKER_SPOT} cursor-pointer`} aria-label={`สติกเกอร์ ${target.title} แตะเพื่อเปลี่ยน`}>
            <StorySticker target={target} />
          </button>
        )}
        {file && mode === 'view' && caption && (
          <DraggableCaption text={caption} color={color} layout={layout} onChange={setLayout} onEdit={() => setMode('text')} frame={frameRef} />
        )}

        <div className="absolute top-0 inset-x-0 flex items-start justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none [&>*]:pointer-events-auto">
          <button type="button" onClick={onClose} disabled={isBusy} className={tool} aria-label="ปิด">
            <X className="w-5 h-5" />
          </button>
          {file && mode === 'view' && (
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => setMode('text')} className={tool} aria-label="เขียนข้อความบนรูป" title="ข้อความ">
                <Type className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => setMode('sticker')} className={tool} aria-label="บอกว่าอยู่ที่ไหน" title="อยู่ที่ไหน">
                <MapPin className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} className={tool} aria-label="เปลี่ยนรูป" title="เปลี่ยนรูป">
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {file && mode === 'view' && (
          <div className="absolute bottom-0 inset-x-0 flex justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none [&>*]:pointer-events-auto">
            <button
              type="button"
              disabled={!file || isBusy}
              onClick={() => file && onShare({ file, caption: caption.trim(), captionLayout: layout, captionColor: color, target })}
              className="inline-flex items-center gap-1 h-12 pl-5 pr-4 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-sm font-bold shadow-lg cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              {isBusy ? 'กำลังแชร์…' : 'แชร์สตอรี่'}
              {!isBusy && <ChevronRight className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
        )}

        {mode === 'text' && <TextLayer value={caption} color={color} onDone={(text, picked) => { setCaption(text); setColor(picked); setMode('view'); }} />}
        {mode === 'sticker' && (
          <StickerSheet
            current={target}
            onPick={(picked) => { setTarget(picked); setMode('view'); }}
            onClose={() => setMode('view')}
          />
        )}
      </div>
    </div>
  );
}

/** "Aa": the photo dims and the text is typed straight onto it, as it will look */
function TextLayer({ value, color: startColor, onDone }: { value: string; color: StoryTextColor; onDone: (text: string, color: StoryTextColor) => void }) {
  const [text, setText] = useState(value);
  const [color, setColor] = useState(startColor);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="absolute inset-0 bg-black/60 flex flex-col">
      <div className="flex justify-end p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button type="button" onClick={() => onDone(text.replace(/\s+/g, ' ').trim(), color)} className="h-10 px-5 rounded-full bg-white text-slate-900 text-sm font-bold cursor-pointer">
          เสร็จ
        </button>
      </div>
      <div className="flex-1 flex items-center px-6">
        <label htmlFor="story-text" className="sr-only">ข้อความบนรูป</label>
        <textarea
          id="story-text"
          ref={ref}
          value={text}
          maxLength={MAX_CAPTION}
          rows={3}
          onChange={(e) => setText(e.target.value.replace(/\n/g, ' '))}
          placeholder="พิมพ์อะไรสักหน่อย…"
          className="w-full resize-none bg-transparent text-center text-2xl font-bold placeholder:text-white/50 focus:outline-none"
          style={captionInk(color)}
        />
      </div>
      {/* The colours, a row of dots above the keyboard; the chosen one has a ring */}
      <div role="radiogroup" aria-label="สีตัวอักษร" className="flex justify-center gap-3 px-4 pb-3">
        {STORY_TEXT_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={color === c.id}
            aria-label={`สี${c.label}`}
            onClick={() => {
              setColor(c.id);
              ref.current?.focus();
            }}
            className={`w-8 h-8 rounded-full border-2 border-white cursor-pointer transition-transform ${color === c.id ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black/60' : 'hover:scale-105'}`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
      <p className="pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-white/60 tabular-nums">{text.length}/{MAX_CAPTION}</p>
    </div>
  );
}

const TYPE_LABEL: Record<StoryTargetDraft['type'], string> = { community: 'ตี้', fair: 'อีเวนต์', spot: 'ที่เที่ยว' };
// Test-login ตี้ carry a "[ตัวอย่าง]" tag in the title (as MeetupTile); the sticker shows the plain name
const plainTitle = (title: string) => title.replace(/^\[ตัวอย่าง\]\s*/, '');

/** "อยู่ที่ไหน": search ตี้, อีเวนต์ and places (the same catalogs the moment form links to) */
function StickerSheet({ current, onPick, onClose }: { current: StoryTargetDraft | null; onPick: (target: StoryTargetDraft | null) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StoryTargetDraft[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) return;
    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const get = (url: string) => fetch(url).then((res) => res.json()).catch(() => ({}));
      const [events, spots] = await Promise.all([
        get(`/api/events?q=${encodeURIComponent(q)}&limit=5&includeEnded=true`),
        get(`/api/spots?q=${encodeURIComponent(q)}&limit=4`),
      ]);
      if (!active) return;
      setResults([
        ...((events.events ?? []) as EventItem[]).map((e) => ({ type: e.eventType === 'public_venue' ? ('fair' as const) : ('community' as const), id: e.id, title: plainTitle(e.title) })),
        ...((spots.spots ?? []) as LifestyleSpotItem[]).map((s) => ({ type: 'spot' as const, id: s.id, title: s.title })),
      ]);
      setIsSearching(false);
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q]);

  return (
    <div className="absolute inset-0 bg-black/50 flex flex-col justify-end" onClick={onClose}>
      <div className="max-h-[75%] flex flex-col rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-base font-bold text-slate-900">อยู่ที่ไหน</p>
          {current && (
            <button type="button" onClick={() => onPick(null)} className="text-sm font-medium text-rose-600 hover:underline cursor-pointer">
              เอาสติกเกอร์ออก
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 h-11 px-3.5 rounded-full bg-slate-100 focus-within:ring-2 focus-within:ring-[#2563EB]/30">
          <Search className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          <span className="sr-only">ค้นหาตี้ อีเวนต์ หรือที่เที่ยว</span>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาตี้ อีเวนต์ หรือที่เที่ยว"
            className="flex-1 min-w-0 bg-transparent text-base sm:text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
          />
        </label>
        <ul className="mt-2 overflow-y-auto">
          {q.length < 2 ? (
            <li className="py-6 text-center text-sm text-slate-500">พิมพ์ชื่อสัก 2 ตัวอักษร แล้วเลือกที่ที่ไปมา</li>
          ) : isSearching && results.length === 0 ? (
            <li className="py-6 text-center text-sm text-slate-500">กำลังหา…</li>
          ) : results.length === 0 ? (
            <li className="py-6 text-center text-sm text-slate-500">ไม่เจอ ลองคำอื่นดูนะ</li>
          ) : (
            results.map((item) => {
              const { Icon, box } = MOMENT_TARGETS[item.type];
              return (
                <li key={`${item.type}-${item.id}`}>
                  <button type="button" onClick={() => onPick(item)} className="w-full flex items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-slate-50 cursor-pointer">
                    <span className={`w-9 h-9 rounded-full ${box} flex items-center justify-center shrink-0`} aria-hidden="true">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900 truncate">{item.title}</span>
                      <span className="block text-xs text-slate-500">{TYPE_LABEL[item.type]}</span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

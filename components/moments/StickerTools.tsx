'use client';

import React, { useEffect, useRef } from 'react';
import { Camera, Coffee, Flower2, Heart, Music, Plus, Sparkles, Star, Sun, Trash2, UtensilsCrossed, ZoomIn, ZoomOut } from 'lucide-react';
import { FACE_STICKERS, ICON_STICKERS, MAX_FUN_STICKERS, STICKER_SCALE_RANGE, STICKER_STYLES, WORD_STICKERS, drawFace, type FunSticker } from '@/lib/media/photoEdit';

/** The sticker panel shared by the photo and clip editors: pick a face, icon or word, then its colour and size */

const ICON_BUTTONS: Record<string, typeof Heart> = { heart: Heart, star: Star, sparkles: Sparkles, sun: Sun, coffee: Coffee, food: UtensilsCrossed, music: Music, camera: Camera, flower: Flower2 };
/** Where new stickers land, in turn (shares of the frame) */
const STICKER_SPOTS: [number, number][] = [[0.3, 0.25], [0.7, 0.4], [0.3, 0.6], [0.7, 0.75], [0.5, 0.5]];

/** A new sticker on its own spot, so they do not hide each other; faces start yellow, icons and words rose */
export function newFunSticker(stickers: FunSticker[], kind: FunSticker['kind'], value: string): FunSticker {
  const id = `s${Math.max(0, ...stickers.map((s) => Number(s.id.slice(1)))) + 1}`;
  const [x, y] = STICKER_SPOTS[stickers.length % STICKER_SPOTS.length];
  return { id, kind, value, style: kind === 'face' ? 'yellow' : 'rose', x, y, scale: 1 };
}

/** A feeling face for the picker, drawn by the same code that puts it on the picture */
function FaceButtonArt({ value }: { value: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    const face = FACE_STICKERS[value];
    if (!ctx || !face) return;
    ctx.clearRect(0, 0, 96, 96);
    ctx.save();
    ctx.scale(4, 4);
    drawFace(ctx, face, STICKER_STYLES.find((s) => s.id === 'yellow') ?? STICKER_STYLES[0]);
    ctx.restore();
  }, [value]);
  return <canvas ref={canvas} width={96} height={96} className="w-11 h-11" aria-hidden="true" />;
}

interface StickerToolsProps {
  /** The sticker being edited, or null to show the picker */
  sticker: FunSticker | null;
  count: number;
  /** What the stickers go on, for the hints: รูป or คลิป */
  on: string;
  onAdd: (kind: FunSticker['kind'], value: string) => void;
  onEdit: (change: Partial<FunSticker>) => void;
  onRemove: () => void;
  onNew: () => void;
}

export function StickerTools({ sticker, count, on, onAdd, onEdit, onRemove, onNew }: StickerToolsProps) {
  const full = count >= MAX_FUN_STICKERS;
  if (sticker)
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5" role="group" aria-label={sticker.kind !== 'word' ? 'สีไอคอน' : 'สีสติกเกอร์'}>
          {STICKER_STYLES.map((style) => (
            <button key={style.id} type="button" onClick={() => onEdit({ style: style.id })} aria-label={`สี${style.label}`} aria-pressed={sticker.style === style.id} style={{ background: style.fill }} className={`w-7 h-7 rounded-full border cursor-pointer ${sticker.style === style.id ? 'ring-2 ring-offset-1 ring-[#2563EB] border-transparent' : 'border-slate-300'}`} />
          ))}
        </div>
        {/* Any size in between, not three steps (owner 2026-11-09) */}
        <div className="flex items-center gap-2">
          <ZoomOut className="w-4 h-4 shrink-0 text-slate-500" aria-hidden="true" />
          <input
            type="range"
            aria-label="ขนาดสติกเกอร์"
            min={STICKER_SCALE_RANGE.min}
            max={STICKER_SCALE_RANGE.max}
            step={0.05}
            value={sticker.scale}
            onChange={(e) => onEdit({ scale: Number(e.target.value) })}
            className="flex-1 min-w-0 h-8 accent-[#2563EB] cursor-pointer"
          />
          <ZoomIn className="w-4 h-4 shrink-0 text-slate-500" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onRemove} className="h-8 px-3 rounded-full bg-slate-100 hover:bg-rose-50 text-xs font-semibold text-slate-700 hover:text-rose-600 cursor-pointer inline-flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            ลบ
          </button>
          <button type="button" onClick={onNew} className="h-8 px-2.5 rounded-full text-xs font-bold text-[#2563EB] hover:bg-blue-50 cursor-pointer inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            เพิ่มสติกเกอร์อื่น
          </button>
        </div>
        <p className="text-xs text-slate-500">ลากสติกเกอร์บน{on}ไปวางตรงที่ชอบ</p>
      </div>
    );
  return (
    <div className="space-y-3">
      {/* Feelings first: they say the most about the moment */}
      <div className="grid grid-cols-4 sm:portrait:grid-cols-8 gap-1.5" role="group" aria-label="สติกเกอร์ความรู้สึก">
        {Object.entries(FACE_STICKERS).map(([key, { label }]) => (
          <button key={key} type="button" onClick={() => onAdd('face', key)} disabled={full} aria-label={`ติดหน้า${label}`} title={label} className="aspect-square rounded-2xl bg-slate-100 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition-transform active:scale-90">
            <FaceButtonArt value={key} />
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="grid grid-cols-5 sm:portrait:grid-cols-9 gap-1.5" role="group" aria-label="สติกเกอร์ไอคอน">
          {Object.entries(ICON_STICKERS).map(([key, { label }]) => {
            const Icon = ICON_BUTTONS[key];
            return (
              <button key={key} type="button" onClick={() => onAdd('icon', key)} disabled={full} aria-label={`ติดสติกเกอร์${label}`} className="aspect-square rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-[#F43F5E] flex items-center justify-center cursor-pointer">
                <Icon className="w-6 h-6" aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="สติกเกอร์คำ">
          {WORD_STICKERS.map((word) => (
            <button key={word} type="button" onClick={() => onAdd('word', word)} disabled={full} className="h-8 px-3 rounded-full bg-[#F43F5E] hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white whitespace-nowrap cursor-pointer">
              {word}
            </button>
          ))}
        </div>
        {full && <p className="text-xs text-slate-500">ติดได้สูงสุด {MAX_FUN_STICKERS} ชิ้นต่อ{on}</p>}
      </div>
    </div>
  );
}

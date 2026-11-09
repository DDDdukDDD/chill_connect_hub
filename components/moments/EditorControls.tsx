'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { TEXT_BACKGROUNDS, TEXT_COLORS, type PhotoText } from '@/lib/media/photoEdit';

/** Controls the photo editor and the clip editor share, so text works the same on both */

export const TEXT_SIZES: [string, number][] = [['เล็ก', 0.045], ['กลาง', 0.07], ['ใหญ่', 0.1]];

/** Two or three choices side by side (DESIGN_SYSTEM.md, segmented switch) */
export function Segmented<T extends string | number | boolean>({ label, options, value, onChange }: { label: string; options: [string, T][]; value: T; onChange: (value: T) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 p-0.5" role="group" aria-label={label}>
      {options.map(([text, option]) => (
        <button
          key={text}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${value === option ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/**
 * One button for what sits behind the letters, cycling none → solid → see-through, like Instagram's "A". Its little
 * "Aa" shows the current look in the chosen colour, so no slider is needed (owner 2026-11-09)
 */
function BackgroundButton({ text, onEdit }: { text: PhotoText; onEdit: (change: Partial<PhotoText>) => void }) {
  const at = Math.max(0, TEXT_BACKGROUNDS.findIndex((b) => b.id === text.background));
  const current = TEXT_BACKGROUNDS[at];
  const next = TEXT_BACKGROUNDS[(at + 1) % TEXT_BACKGROUNDS.length];
  const light = text.color === '#FFFFFF' || text.color === '#FACC15';
  const swatch =
    current.id === 'none'
      ? { color: text.color, background: 'transparent', textShadow: light ? '0 0 2px rgba(0,0,0,0.6)' : 'none' }
      : { color: light ? '#0F172A' : '#FFFFFF', background: current.id === 'solid' ? text.color : `${text.color}9E` };
  return (
    <button
      type="button"
      onClick={() => onEdit({ background: next.id })}
      aria-label={`พื้นหลังข้อความ: ${current.label} แตะเพื่อเปลี่ยนเป็น${next.label}`}
      className="h-8 pl-1 pr-3 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1.5 transition-colors active:scale-95"
    >
      <span aria-hidden="true" style={swatch} className="w-6 h-6 rounded-lg border border-slate-300/70 flex items-center justify-center text-[11px] font-bold leading-none">Aa</span>
      {current.label}
    </button>
  );
}

/** A new text in the middle of the frame */
export function newText(texts: PhotoText[], value: string): PhotoText {
  const id = `t${Math.max(0, ...texts.map((t) => Number(t.id.slice(1)))) + 1}`;
  return { id, text: value, x: 0.5, y: 0.5, color: TEXT_COLORS[0], size: TEXT_SIZES[1][1], background: 'none' };
}

interface TextToolsProps {
  /** The text being edited, or null while the next typing starts a new one */
  text: PhotoText | null;
  hasTexts: boolean;
  /** What the frame is, for the placeholder: รูป or คลิป */
  on: string;
  onType: (value: string) => void;
  onEdit: (change: Partial<PhotoText>) => void;
  onRemove: () => void;
  onNew: () => void;
}

export function TextTools({ text, hasTexts, on, onType, onEdit, onRemove, onNew }: TextToolsProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2">
        <textarea
          rows={2}
          maxLength={80}
          value={text?.text ?? ''}
          onChange={(e) => onType(e.target.value)}
          placeholder={`พิมพ์ข้อความบน${on} แล้วลากไปวางตรงที่ชอบ`}
          aria-label={`ข้อความบน${on}`}
          className="flex-1 min-w-0 bg-white border border-slate-300 rounded-2xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] placeholder:text-slate-500"
        />
        {text && (
          <button type="button" onClick={onRemove} aria-label="ลบข้อความนี้" className="w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center cursor-pointer shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {text ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-1.5" role="group" aria-label="สีข้อความ">
            {TEXT_COLORS.map((color) => (
              <button key={color} type="button" onClick={() => onEdit({ color })} aria-label={`สี ${color}`} aria-pressed={text.color === color} style={{ background: color }} className={`w-7 h-7 rounded-full border cursor-pointer ${text.color === color ? 'ring-2 ring-offset-1 ring-[#2563EB] border-transparent' : 'border-slate-300'}`} />
            ))}
          </div>
          <Segmented label="ขนาดข้อความ" options={TEXT_SIZES} value={text.size} onChange={(size) => onEdit({ size })} />
          <BackgroundButton text={text} onEdit={onEdit} />
          <button type="button" onClick={onNew} className="h-8 px-2.5 rounded-full text-xs font-bold text-[#2563EB] hover:bg-blue-50 cursor-pointer inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            เพิ่มอีกข้อความ
          </button>
        </div>
      ) : (
        hasTexts && <p className="text-xs text-slate-500">แตะข้อความบน{on}เพื่อแก้ไข</p>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { FILTER_PILL } from '@/components/discover/DiscoverHeader';

/**
 * One way to filter on the four list pages (/community, /events, /spots, /challenges; owner 2026-11-07: simple and
 * effective): a row with "ตัวกรอง" (every filter, in a sheet), the one or two filters people use most as quick chips,
 * and a chip for each filter set in the sheet, so nothing that hides results is out of sight. Categories stay the icon
 * tabs under the row.
 */

export type FilterKind = 'meetups' | 'fairs' | 'spots' | 'challenges';

/** A picked filter wears its pillar's soft tint, border and dark text (DESIGN_SYSTEM.md, filters inside a pillar page) */
const PICKED: Record<FilterKind, string> = {
  meetups: 'bg-[#FFF4EE] border-[#F26430] text-[#C2410C]',
  fairs: 'bg-[#EEF4FA] border-[#2B527A] text-[#1F3D5C]',
  spots: 'bg-[#EBF3ED] border-[#4A7C59] text-[#2D5A3C]',
  challenges: 'bg-[#F5F3FF] border-[#7C3AED] text-[#5B21B6]',
};
const BADGE: Record<FilterKind, string> = { meetups: 'bg-[#F26430]', fairs: 'bg-[#2B527A]', spots: 'bg-[#4A7C59]', challenges: 'bg-[#7C3AED]' };

export const pillClass = (kind: FilterKind, picked: boolean) =>
  `${FILTER_PILL} ${picked ? `${PICKED[kind]} font-semibold` : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'}`;

/** Opens the sheet; shows how many filters are set */
export function FilterButton({ kind, count, onClick }: { kind: FilterKind; count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-haspopup="dialog" className={pillClass(kind, count > 0)}>
      <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
      ตัวกรอง
      {count > 0 && <span className={`min-w-5 h-5 px-1 rounded-full ${BADGE[kind]} text-white text-[11px] font-bold leading-5 tabular-nums text-center`}>{count}</span>}
    </button>
  );
}

/** A quick on/off filter in the row */
export function QuickChip({ kind, on, onToggle, children }: { kind: FilterKind; on: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={on} className={pillClass(kind, on)}>
      {children}
    </button>
  );
}

/** A filter set in the sheet, shown in the row with a way to take it off */
export function ActiveChip({ kind, label, onClear }: { kind: FilterKind; label: string; onClear: () => void }) {
  return (
    <button type="button" onClick={onClear} aria-label={`เอาตัวกรอง ${label} ออก`} className={`${pillClass(kind, true)} pr-2.5`}>
      {label}
      <X className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );
}

/** One group of choices in the sheet; one is always chosen */
export function ChoiceGroup<T extends string>({ kind, title, options, value, onChange }: { kind: FilterKind; title: string; options: [string, T][]; value: T; onChange: (value: T) => void }) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="text-sm font-bold text-slate-900">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([label, option]) => (
          <button key={option} type="button" onClick={() => onChange(option)} aria-pressed={value === option} className={pillClass(kind, value === option)}>
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Every filter of the page. Choices apply at once; the footer clears them or closes with the number found */
export function FilterSheet({ onClose, onReset, canReset, resultLabel, children }: { onClose: () => void; onReset: () => void; canReset: boolean; resultLabel: string; children: React.ReactNode }) {
  return (
    <DialogShell onClose={onClose} bare size="sm" align="top" labelledBy="filter-sheet-title" showClose={false} focusField={false}>
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 shrink-0">
        <h2 id="filter-sheet-title" className="text-base font-bold text-slate-900">ตัวกรอง</h2>
        <button type="button" onClick={onClose} aria-label="ปิด" className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">{children}</div>
      <div className="shrink-0 grid grid-cols-[auto_1fr] gap-3 px-5 py-3.5 border-t border-slate-100 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={onReset} disabled={!canReset} className={`${dialogButton.quiet} disabled:opacity-50 disabled:cursor-not-allowed`}>
          ล้าง
        </button>
        <button type="button" onClick={onClose} className={dialogButton.primary}>
          {resultLabel}
        </button>
      </div>
    </DialogShell>
  );
}

/* ---------- dates (DD/MM/YYYY, as the list pages filter by) ---------- */

const dmy = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export type DatePreset = 'any' | 'today' | 'tomorrow' | 'weekend' | 'custom';

/** The start and end of each quick date choice, worked out for today */
export function datePresetRange(preset: Exclude<DatePreset, 'any' | 'custom'>, now = new Date()): [string, string] {
  if (preset === 'today') return [dmy(now), dmy(now)];
  if (preset === 'tomorrow') return [dmy(addDays(now, 1)), dmy(addDays(now, 1))];
  // This Saturday and Sunday; on a Sunday, just today
  const day = now.getDay();
  if (day === 0) return [dmy(now), dmy(now)];
  const saturday = addDays(now, 6 - day);
  return [dmy(saturday), dmy(addDays(saturday, 1))];
}

/** Which quick choice a stored range is, so the sheet and the chips can show it by name */
export function datePresetOf(start: string, end: string): DatePreset {
  if (!start) return 'any';
  for (const preset of ['today', 'tomorrow', 'weekend'] as const) {
    const [s, e] = datePresetRange(preset);
    if (s === start && e === (end || start)) return preset;
  }
  return 'custom';
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const shortDay = (value: string) => {
  const [d, m] = value.split('/').map(Number);
  return d && m ? `${d} ${THAI_MONTHS[m - 1]}` : value;
};

/** A stored range in words: วันนี้, สุดสัปดาห์นี้, or "9 พ.ย. – 15 พ.ย." */
export function dateRangeLabel(start: string, end: string): string {
  const preset = datePresetOf(start, end);
  if (preset === 'today') return 'วันนี้';
  if (preset === 'tomorrow') return 'พรุ่งนี้';
  if (preset === 'weekend') return 'สุดสัปดาห์นี้';
  return !end || end === start ? shortDay(start) : `${shortDay(start)} – ${shortDay(end)}`;
}

export const DATE_CHOICES: [string, DatePreset][] = [
  ['วันไหนก็ได้', 'any'],
  ['วันนี้', 'today'],
  ['พรุ่งนี้', 'tomorrow'],
  ['สุดสัปดาห์นี้', 'weekend'],
  ['เลือกวันเอง', 'custom'],
];

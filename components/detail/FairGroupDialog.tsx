'use client';

import React, { useId, useMemo, useState } from 'react';
import { CalendarDays, Loader2, Minus, Plus } from 'lucide-react';
import { DialogShell } from '@/components/auth/DialogShell';
import { Field, TimeInput, inputClass } from '@/components/CreateEventModal';
import { fairGroupDayLabel, fairGroupDays } from '@/lib/fairGroupDays';

export interface FairGroupInput {
  title: string;
  meetupPoint: string;
  date?: string;
  time: string;
  note: string;
  maxMembers: number;
}

const MIN_PEOPLE = 2;
const MAX_PEOPLE = 15;
/** Up to this many days show as chips; a longer run (an exhibition of weeks) is a list */
const CHIP_DAYS = 14;

/**
 * "ตั้งกลุ่มเดินงาน / ไปวิ่ง" (owner 2026-11-15): only what a group inside an อีเวนต์ keeps (lib/social/fairGroups.ts),
 * on one screen: which day (a one-day งาน takes its day), when to meet, where in the งาน, a name already filled in,
 * a line about the group, how many, and the safety promise. The old form asked for a cover, a schedule and more,
 * then threw them away.
 */
export function FairGroupDialog({
  event,
  isRun,
  onClose,
  onCreate,
}: {
  event: { title: string; date?: string; endDate?: string };
  isRun: boolean;
  onClose: () => void;
  onCreate: (input: FairGroupInput) => Promise<{ ok: boolean; message: string }>;
}) {
  const id = useId();
  const days = useMemo(() => fairGroupDays(event), [event]);
  const [date, setDate] = useState(days.length === 1 ? days[0] : '');
  const [start, setStart] = useState(isRun ? '05:00' : '13:00');
  const [end, setEnd] = useState('');
  const [meetupPoint, setMeetupPoint] = useState('');
  const [title, setTitle] = useState(isRun ? 'หาเพื่อนไปวิ่งด้วยกัน' : 'หาเพื่อนเดินงานด้วยกัน');
  const [note, setNote] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [isSafe, setIsSafe] = useState(false);
  const [error, setError] = useState<{ field: string; text: string } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fail = (field: string, text: string) => {
      setError({ field, text });
      document.getElementById(`${id}-${field}`)?.focus();
    };
    if (days.length > 1 && !date) return fail('day', 'เลือกวันที่จะไปด้วยนะ');
    if (!start) return fail('start', 'ใส่เวลาเจอกันด้วยนะ');
    if (end && end <= start) return fail('end', 'เวลาแยกย้ายต้องหลังเวลาเจอกัน');
    if (!meetupPoint.trim()) return fail('point', 'บอกจุดนัดพบในงานด้วยนะ');
    if (title.trim().length < 5) return fail('title', 'ตั้งชื่อกลุ่มอย่างน้อย 5 ตัวอักษร');
    if (!isSafe) return fail('safe', 'กดยอมรับข้อตกลงก่อนนะ');
    setError(null);
    setIsBusy(true);
    const result = await onCreate({ title: title.trim(), meetupPoint: meetupPoint.trim(), ...(date ? { date } : {}), time: `${start}${end ? ` - ${end}` : ''} น.`, note: note.trim(), maxMembers });
    setIsBusy(false);
    if (result.ok) onClose();
    else setError({ field: 'form', text: result.message });
  };
  const errorOf = (field: string) => (error?.field === field ? error.text : undefined);
  // A field's message goes as soon as the field is touched again
  const touch = (field: string) => error?.field === field && setError(null);

  return (
    <DialogShell onClose={onClose} title={isRun ? 'ตั้งกลุ่มไปวิ่งด้วยกัน' : 'ตั้งกลุ่มเดินงานด้วยกัน'} subtitle={event.title} size="sm" focusField={false}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {/* Which day: a one-day งาน says it; a few days are chips; weeks of days are a list */}
        {days.length === 1 ? (
          <p className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
            <CalendarDays className="w-4 h-4 text-slate-500" aria-hidden="true" />
            {fairGroupDayLabel(days[0])}
          </p>
        ) : days.length > 1 ? (
          <Field label="ไปวันไหน" error={errorOf('day')} htmlFor={days.length > CHIP_DAYS ? `${id}-day` : undefined}>
            {days.length > CHIP_DAYS ? (
              <select id={`${id}-day`} value={date} onChange={(e) => { setDate(e.target.value); touch('day'); }} className={inputClass(Boolean(errorOf('day')))}>
                <option value="">เลือกวัน</option>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {fairGroupDayLabel(d)}
                  </option>
                ))}
              </select>
            ) : (
              <div id={`${id}-day`} tabIndex={-1} role="radiogroup" aria-label="ไปวันไหน" className="flex flex-wrap gap-2 focus:outline-hidden">
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={date === d}
                    onClick={() => { setDate(d); touch('day'); }}
                    className={`h-10 px-3.5 rounded-full border text-sm font-semibold tabular-nums cursor-pointer transition-colors ${
                      date === d ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {fairGroupDayLabel(d)}
                  </button>
                ))}
              </div>
            )}
          </Field>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field label="เจอกันกี่โมง" error={errorOf('start')} htmlFor={`${id}-start`}>
            <TimeInput id={`${id}-start`} value={start} bad={Boolean(errorOf('start'))} onChange={(v) => { setStart(v); touch('start'); }} />
          </Field>
          <Field label="แยกย้ายราว" optional error={errorOf('end')} htmlFor={`${id}-end`}>
            <TimeInput id={`${id}-end`} value={end} bad={Boolean(errorOf('end'))} onChange={(v) => { setEnd(v); touch('end'); }} />
          </Field>
        </div>

        <Field label="จุดนัดพบในงาน" error={errorOf('point')} htmlFor={`${id}-point`}>
          <input
            id={`${id}-point`}
            value={meetupPoint}
            maxLength={120}
            onChange={(e) => { setMeetupPoint(e.target.value); touch('point'); }}
            placeholder={isRun ? 'เช่น หน้าเต็นท์รับเสื้อ ก่อนปล่อยตัว 30 นาที' : 'เช่น หน้าประตูทางเข้า ฮอลล์ 5'}
            className={inputClass(Boolean(errorOf('point')))}
          />
        </Field>

        <Field label="ชื่อกลุ่ม" error={errorOf('title')} htmlFor={`${id}-title`}>
          <input id={`${id}-title`} value={title} maxLength={80} onChange={(e) => { setTitle(e.target.value); touch('title'); }} className={inputClass(Boolean(errorOf('title')))} />
        </Field>

        <Field label="เล่าสั้นๆ" optional htmlFor={`${id}-note`}>
          <textarea
            id={`${id}-note`}
            value={note}
            maxLength={300}
            rows={2}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isRun ? 'เช่น วิ่งเพซสบายๆ ราว 7 นาที/กม. จบแล้วไปหาอะไรกินกัน' : 'เช่น อยากเดินโซนหนังสือแปล แล้วแวะนั่งกาแฟกัน'}
            className={`${inputClass()} resize-none`}
          />
        </Field>

        <div className="flex items-center justify-between gap-3">
          <span id={`${id}-size`} className="text-sm font-bold text-slate-900">
            รับกี่คน <span className="text-xs font-medium text-slate-500">(รวมคุณ)</span>
          </span>
          <div role="group" aria-labelledby={`${id}-size`} className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
            <button type="button" onClick={() => setMaxMembers((n) => Math.max(MIN_PEOPLE, n - 1))} disabled={maxMembers <= MIN_PEOPLE} aria-label="ลดจำนวนคน" className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              <Minus className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="w-10 text-center text-base font-bold text-slate-900 tabular-nums" aria-live="polite">{maxMembers}</span>
            <button type="button" onClick={() => setMaxMembers((n) => Math.min(MAX_PEOPLE, n + 1))} disabled={maxMembers >= MAX_PEOPLE} aria-label="เพิ่มจำนวนคน" className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <label className={`flex items-start gap-2.5 rounded-2xl px-3.5 py-3 cursor-pointer ${errorOf('safe') ? 'bg-rose-50' : 'bg-slate-50'}`}>
          <input id={`${id}-safe`} type="checkbox" checked={isSafe} onChange={(e) => { setIsSafe(e.target.checked); touch('safe'); }} className="mt-0.5 w-4 h-4 shrink-0 accent-[#2563EB]" />
          <span className="text-[13px] text-slate-700 leading-relaxed">นัดเจอกันในงานที่มีคนอยู่รอบๆ ไม่ขอเงินหรือข้อมูลส่วนตัวกัน และทำตามแนวทางคอมมูนิตี้</span>
        </label>

        {/* Field errors show under their field; these two have no field line of their own */}
        {error && (error.field === 'form' || error.field === 'safe') && (
          <p role="alert" className="text-sm font-medium text-rose-600">
            {error.text}
          </p>
        )}
        <button type="submit" disabled={isBusy} className="w-full h-12 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
          {isBusy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          เปิดกลุ่ม
        </button>
      </form>
    </DialogShell>
  );
}

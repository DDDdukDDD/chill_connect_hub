'use client';

import React, { useId, useState } from 'react';
import type { EventItem } from '@/data/mockData';
import { MASTER_77_PROVINCES } from '@/data/masterHub';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { DateInput, Field, PlaceSuggest, TimeInput, inputClass } from '@/components/CreateEventModal';
import { useMasterData } from '@/lib/useMasterData';
import { formatThaiDateBE, isValidTimeRange } from '@/lib/dateUtils';
import { placeName } from '@/lib/placeName';
import { parseThaiDateRange } from '@/lib/scrapers/dates';

const pad = (n: number) => String(n).padStart(2, '0');

/** "29 ต.ค. 2569" → "2026-10-29", what the date box holds */
function isoOf(thaiDate: string | undefined): string {
  const start = thaiDate ? parseThaiDateRange(thaiDate)?.start : null;
  return start ? `${start.year}-${pad(start.month + 1)}-${pad(start.day)}` : '';
}

/** Today on the viewer's clock, the earliest day the calendar offers; the server decides against the Bangkok clock */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface EditTeeDialogProps {
  event: EventItem;
  onClose: () => void;
  onSaved: (result: { event: EventItem; changed: boolean; notified: number }) => void;
}

/** The host moves the date, time or place of their own ตี้; the people in it are told (lib/social/editTee.ts) */
export function EditTeeDialog({ event, onClose, onSaved }: EditTeeDialogProps) {
  const uid = useId();
  const { venues } = useMasterData();
  const online = event.locationType === 'online' || event.province === 'ออนไลน์';
  const clocks = [...(event.time ?? '').matchAll(/(\d{1,2})[:.](\d{2})/g)].map((m) => `${pad(Number(m[1]))}:${m[2]}`);

  const [date, setDate] = useState(() => isoOf(event.date));
  const [startTime, setStartTime] = useState(clocks[0] ?? '');
  const [endTime, setEndTime] = useState(clocks[1] ?? '');
  const [province, setProvince] = useState(event.province ?? '');
  const [district, setDistrict] = useState(event.zone ?? '');
  const [locationName, setLocationName] = useState(() => placeName(event.location));
  const [meetingPoint, setMeetingPoint] = useState(event.meetingPoint ?? '');
  const [placeId, setPlaceId] = useState(event.placeId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const others = Math.max(0, (event.participantsCount ?? 1) - 1);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const problem = !date
      ? 'เลือกวันให้ครบก่อนนะ'
      : !startTime || !endTime
        ? 'ใส่เวลาเริ่มและเวลาเลิกให้ครบก่อนนะ'
        : !isValidTimeRange(startTime, endTime)
          ? 'เวลาเลิกต้องไม่ตรงกับเวลาเริ่ม'
          : !online && (district.trim().length < 2 || locationName.trim().length < 2 || meetingPoint.trim().length < 2)
            ? 'บอกย่าน สถานที่ และจุดนัดพบให้ครบก่อนนะ'
            : null;
    setError(problem);
    if (problem) return;
    setSaving(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit_tee', eventId: event.id, edit: { date, startTime, endTime, province, district, locationName, meetingPoint, placeId } }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.message || 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
        return;
      }
      onSaved({ event: data.event, changed: data.changed, notified: data.notified });
    } catch {
      setError('เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell onClose={onClose} title="แก้วัน เวลา หรือสถานที่" subtitle={others > 0 ? `เราจะแจ้งเพื่อนๆ ${others} คนในตี้ให้ทันทีที่บันทึก` : undefined} align="top" focusField={false}>
      <form onSubmit={save} className="space-y-4 min-w-0">
        <Field label="วัน" htmlFor={`${uid}-date`} hint={date ? formatThaiDateBE(date) : undefined}>
          <DateInput id={`${uid}-date`} min={todayIso()} value={date} onChange={setDate} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="เวลาเริ่ม" htmlFor={`${uid}-start`}>
            <TimeInput id={`${uid}-start`} value={startTime} onChange={setStartTime} />
          </Field>
          <Field label="เวลาเลิก" htmlFor={`${uid}-end`}>
            <TimeInput id={`${uid}-end`} value={endTime} onChange={setEndTime} />
          </Field>
        </div>
        {!online && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="จังหวัด" htmlFor={`${uid}-province`}>
                <select id={`${uid}-province`} value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass()}>
                  {MASTER_77_PROVINCES.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </Field>
              <Field label="ย่านหรือเขต" htmlFor={`${uid}-district`}>
                <input id={`${uid}-district`} value={district} maxLength={40} onChange={(e) => setDistrict(e.target.value)} className={inputClass()} />
              </Field>
            </div>
            <Field label="สถานที่" htmlFor={`${uid}-place`} hint="นัดในที่สาธารณะที่มีคนอื่นอยู่ด้วยเสมอ">
              <PlaceSuggest
                id={`${uid}-place`}
                value={locationName}
                linked={Boolean(placeId)}
                venues={venues}
                province={province}
                onType={(text) => {
                  setLocationName(text);
                  setPlaceId('');
                }}
                onPick={(pick) => {
                  setLocationName(pick.name);
                  setPlaceId(pick.placeId ?? '');
                  if (pick.province && MASTER_77_PROVINCES.includes(pick.province)) setProvince(pick.province);
                  if (pick.district) setDistrict(pick.district);
                }}
              />
            </Field>
            <Field label="จุดนัดพบ" htmlFor={`${uid}-meet`}>
              <input id={`${uid}-meet`} value={meetingPoint} maxLength={100} onChange={(e) => setMeetingPoint(e.target.value)} className={inputClass()} />
            </Field>
          </>
        )}
        {error && <p role="alert" className="text-sm font-semibold text-rose-700">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={`${dialogButton.quiet} flex-1`}>ยกเลิก</button>
          <button type="submit" disabled={saving} className={`${dialogButton.primary} flex-1`}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
        </div>
      </form>
    </DialogShell>
  );
}

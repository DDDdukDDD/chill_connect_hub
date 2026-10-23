'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Participant {
  userId: string;
  userName: string;
  userAvatar: string;
  checkedInAt?: string;
  isHost: boolean;
  attendance?: { attended: number; total: number };
}

/**
 * The host's check-in on the day (the "ระหว่าง" phase, host side): type a ticket code or confirm each person they see.
 * This confirmation is the proof that someone went: it counts toward challenges, opens reviews and "อยากเจออีก",
 * and builds everyone's "มาตามนัด" record. People not confirmed after the ตี้ count as not having come.
 */
export function HostCheckIn({ eventId }: { eventId: string }) {
  const [people, setPeople] = useState<Participant[] | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    fetch(`/api/events/${encodeURIComponent(eventId)}/participants`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => Array.isArray(json?.participants) && setPeople(json.participants.filter((p: Participant) => !p.isHost)))
      .catch(() => setPeople([]));
  }, [eventId]);

  useEffect(load, [load]);

  const send = async (body: Record<string, string>, key: string) => {
    setBusy(key);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/participants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => null);
      if (!res.ok) setMessage(json?.message || 'ทำรายการไม่สำเร็จ');
      else if (body.code) {
        setMessage(`ยืนยัน ${json?.participant?.userName ?? ''} แล้ว`);
        setCode('');
      }
      load();
    } finally {
      setBusy('');
    }
  };

  if (people === null) return null;
  const done = people.filter((p) => p.checkedInAt).length;

  return (
    <section className="rounded-3xl border border-slate-200 p-5 sm:p-6" aria-label="เช็กชื่อ">
      <h2 className="text-lg font-bold text-slate-900">เช็กชื่อ · ยืนยันแล้ว {done} จาก {people.length} คน</h2>
      <p className="mt-0.5 text-sm text-slate-500">ใส่รหัสบนบัตร หรือกดยืนยันเมื่อเห็นตัวจริง การยืนยันนี้คือหลักฐานว่าไปจริง ใช้นับชาเลนจ์และเปิดให้รีวิว</p>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) void send({ action: 'check_in', code: code.trim().toUpperCase() }, 'code');
        }}
      >
        <label htmlFor="checkin-code" className="sr-only">รหัสบัตร 6 ตัว</label>
        <input
          id="checkin-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          placeholder="รหัสบัตร เช่น 74HQ3F"
          className="flex-1 h-11 px-4 border border-slate-300 rounded-full text-sm font-semibold tracking-widest uppercase focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
        />
        <button type="submit" disabled={busy === 'code' || !code.trim()} className="h-11 px-5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white text-sm font-semibold cursor-pointer">
          ยืนยัน
        </button>
      </form>
      {message && <p className="mt-2 text-sm font-semibold text-slate-700" role="status">{message}</p>}

      <ul className="mt-3 divide-y divide-slate-100">
        {people.map((p) => (
          <li key={p.userId} className="flex items-center gap-3 py-2.5">
            {p.userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- member photos
              <img src={p.userAvatar} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100" />
            ) : (
              <span className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold" aria-hidden="true">{p.userName.slice(0, 1)}</span>
            )}
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-slate-900 truncate">{p.userName}</span>
              <span className={`block text-xs ${p.checkedInAt ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                {p.checkedInAt ? `ยืนยันแล้ว ${new Date(p.checkedInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}` : 'ยังไม่ได้ยืนยัน'}
                {p.attendance ? ` · ${p.attendance.total ? `มาตามนัด ${p.attendance.attended}/${p.attendance.total}` : 'ตี้แรก'}` : ''}
              </span>
            </span>
            <button
              type="button"
              disabled={busy === p.userId}
              onClick={() => void send({ action: p.checkedInAt ? 'undo' : 'check_in', userId: p.userId }, p.userId)}
              className={`h-9 px-4 rounded-full text-sm font-semibold cursor-pointer inline-flex items-center gap-1.5 ${p.checkedInAt ? 'border border-slate-200 text-slate-600 bg-white' : 'border-[1.5px] border-[#2563EB] text-[#1D4ED8] bg-white'}`}
            >
              {p.checkedInAt ? 'ยกเลิก' : <><CheckCircle2 className="w-4 h-4" aria-hidden="true" />ยืนยันว่ามา</>}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-500">คนที่ไม่ได้ยืนยันและไม่ได้ยกเลิกก่อน จะถูกบันทึกว่าไม่มาตามนัด</p>
    </section>
  );
}

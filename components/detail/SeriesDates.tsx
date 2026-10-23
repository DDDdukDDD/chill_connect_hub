'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarCheck } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import { activityActions, useMyActivity } from '@/lib/useMyActivity';
import { useMemberSession } from '@/lib/useMemberSession';
import { joinBlocker, JoinReadinessNotice } from '@/components/JoinReadinessNotice';

interface SeriesDate {
  date: string;
  label: string;
  eventId: string | null;
  taken: number;
  max: number;
  full: boolean;
}

/**
 * "เลือกวันที่จะไป" on a recurring ตี้ (owner 2026-10-23): each date has its own seats, and members join one date at a
 * time. Joining opens that date's own page, where the ticket, chat and check-in live (lib/social/recurring.ts).
 */
export function SeriesDates({ series, onRequireLogin }: { series: EventItem; onRequireLogin: (returnTo: string) => void }) {
  const router = useRouter();
  const { member } = useMemberSession();
  const activity = useMyActivity();
  const [dates, setDates] = useState<SeriesDate[] | null>(null);
  const [picked, setPicked] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`/api/events/${encodeURIComponent(series.id)}/dates`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!active || !Array.isArray(json?.dates)) return;
        setDates(json.dates);
        // Back from sign-up with ?date=: that date stays picked
        const wanted = new URLSearchParams(window.location.search).get('date');
        const list = json.dates as SeriesDate[];
        const first = list.find((d) => d.date === wanted && !d.full) ?? list.find((d) => !d.full);
        if (first) setPicked(first.date);
      })
      .catch(() => setDates([]));
    return () => {
      active = false;
    };
  }, [series.id]);

  const mine = activity.joined.filter((e) => (e as EventItem).seriesId === series.id);
  const choice = dates?.find((d) => d.date === picked);
  const returnTo = `/community/${encodeURIComponent(series.id)}?date=${picked}`;

  const join = async () => {
    if (!choice || busy) return;
    if (!member) return onRequireLogin(returnTo);
    setBusy(true);
    setError('');
    const result = await activityActions.join(series.id, choice.date);
    setBusy(false);
    if (!result.ok) return setError(result.message);
    if (result.event) router.push(`/community/${encodeURIComponent(result.event.id)}`);
  };

  return (
    <section id="dates" className="scroll-mt-24 rounded-3xl border border-slate-200 p-5 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900">เลือกวันที่จะไป</h2>
      <p className="mt-0.5 text-sm text-slate-500">แต่ละวันมีที่นั่งของตัวเอง ลงทะเบียนทีละวัน</p>

      {mine.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {mine.map((e) => (
            <Link key={e.id} href={`/community/${encodeURIComponent(e.id)}`} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border-[1.5px] border-[#2563EB] text-[#1D4ED8] text-sm font-semibold">
              <CalendarCheck className="w-4 h-4" aria-hidden="true" />
              คุณลงทะเบียน {e.date}
            </Link>
          ))}
        </div>
      )}

      {dates === null ? (
        <p className="mt-3 text-sm text-slate-500" role="status">กำลังโหลดวัน…</p>
      ) : dates.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">ตอนนี้ยังไม่มีรอบที่เปิด</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="วันที่จะไป">
          {dates.map((d) => {
            const on = d.date === picked;
            const left = Math.max(d.max - d.taken, 0);
            return (
              <button
                key={d.date}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={d.full}
                onClick={() => setPicked(d.date)}
                className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'border-2 border-[#2563EB] bg-blue-50/40' : 'border border-slate-200 hover:border-slate-300'}`}
              >
                <span>
                  <span className="block font-semibold text-slate-900">{d.label}</span>
                  <span className={`block text-xs font-semibold ${d.full ? 'text-slate-500' : 'text-emerald-700'}`}>{d.full ? 'เต็มแล้ว' : `เหลือ ${left} ที่${d.taken ? ` · ${d.taken} คนไป` : ''}`}</span>
                </span>
                {on && <span className="text-xs font-semibold text-[#1D4ED8]">เลือกแล้ว</span>}
              </button>
            );
          })}
        </div>
      )}

      {member && joinBlocker(member) && <div className="mt-3"><JoinReadinessNotice member={member} returnTo={returnTo} /></div>}
      {error && <p className="mt-2 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
      {choice && (
        <button
          type="button"
          onClick={join}
          disabled={busy || Boolean(member && joinBlocker(member))}
          className="mt-4 h-12 px-7 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-semibold cursor-pointer disabled:cursor-not-allowed"
        >
          {busy ? 'กำลังลงทะเบียน…' : `ลงทะเบียน ${choice.label}`}
        </button>
      )}
    </section>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { EventItem } from '@/data/mockData';
import { areaLabel } from '@/components/MeetupTile';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';

const DAY = 24 * 60 * 60 * 1000;
const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80';
const PAGE = 40;

type Kind = 'meetups' | 'fairs';

/** The pillar's dark color for the when-line (DESIGN_SYSTEM.md, pillar colors on cards) */
const WHEN_COLOR: Record<Kind, string> = { meetups: 'text-[#D04A1B]', fairs: 'text-[#2B527A]' };

const startOf = (e: EventItem) => parseEventDateToTimestamp(e.date);
const endOf = (e: EventItem) => parseEventEndDateToTimestamp(e.endDate || e.date) + DAY - 1;
const shortDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]}`;
};
const hasValue = (text: string | undefined) => Boolean(text && !/ไม่ระบุ/.test(text));

/** The time ("06:30 - 07:30 น."); a fair over several days leads with its range ("23 ต.ค. – 1 พ.ย."). The day itself is on the leaf. */
function whenLine(kind: Kind, e: EventItem) {
  // "16:00 - 16:00" (no end time given) reads as one time
  const time = hasValue(e.time) ? e.time!.replace(/^(\d{1,2}[:.]\d{2})\s*-\s*\1\b/, '$1') : '';
  if (kind === 'fairs' && e.endDate && e.endDate !== e.date) {
    const range = `${shortDate(startOf(e))} – ${shortDate(parseEventEndDateToTimestamp(e.endDate))}`;
    return time ? `${range} · ${time}` : range;
  }
  return time || shortDate(startOf(e));
}

/** A ticket price as one short fact: "เริ่ม ฿1,500" when the organizer lists several tiers */
function priceOf(price: string) {
  if (!price.includes('/')) return price;
  const amounts = (price.match(/\d[\d,]*/g) || []).map((n) => parseInt(n.replace(/,/g, ''), 10)).filter((n) => n >= 50);
  return amounts.length ? `เริ่ม ฿${Math.min(...amounts).toLocaleString()}` : price.split('/')[0].trim();
}

/** Seats for a meetup, entry for a fair: the one fact that decides a click */
function statusOf(kind: Kind, e: EventItem): { text: string; tone: string } | null {
  const free = /ฟรี/.test(e.price || '');
  if (kind === 'fairs')
    return free ? { text: 'เข้าฟรี', tone: 'text-emerald-700' } : hasValue(e.price) ? { text: priceOf(e.price!), tone: 'text-slate-600' } : null;
  const left = (e.maxParticipants || 0) - (e.participantsCount || 0);
  if (left <= 0) return { text: 'เต็มแล้ว', tone: 'text-slate-500' };
  return { text: `${free ? 'ฟรี · ' : ''}เหลือ ${left} ที่`, tone: left <= 2 ? 'text-[#D04A1B]' : 'text-emerald-700' };
}

// A ตี้ names its short area ("สุขุมวิท"), as its tile does; an อีเวนต์ its province and venue
const placeOf = (kind: Kind, e: EventItem) => (kind === 'meetups' ? areaLabel(e) : [e.province, e.location].filter(Boolean).join(' · '));
const hrefOf = (kind: Kind, e: EventItem) => `/${kind === 'meetups' ? 'community' : 'events'}/${encodeURIComponent(e.id)}`;

function Row({ kind, event }: { kind: Kind; event: EventItem }) {
  const status = statusOf(kind, event);
  return (
    <li className="min-w-0">
      <Link href={hrefOf(kind, event)} className="group flex items-center gap-3 sm:gap-4 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.image || FALLBACK_IMAGE}
          onError={(ev) => {
            if (ev.currentTarget.src !== FALLBACK_IMAGE) ev.currentTarget.src = FALLBACK_IMAGE;
          }}
          alt=""
          loading="lazy"
          className="w-16 h-16 sm:w-28 sm:h-[72px] shrink-0 rounded-xl object-cover bg-slate-100"
        />
        <span className="flex-1 min-w-0">
          <span className={`block text-xs font-semibold tabular-nums truncate ${WHEN_COLOR[kind]}`}>{whenLine(kind, event)}</span>
          <span className="mt-0.5 block text-sm sm:text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{event.title}</span>
          <span className="mt-0.5 block text-xs text-slate-500 truncate">
            {placeOf(kind, event)}
            {status && <span className={`font-semibold ${status.tone}`}> · {status.text}</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** One calendar leaf (weekday over the day) per day, that day's events beside it: two columns on wide screens */
function DayGroups({ kind, events }: { kind: Kind; events: EventItem[] }) {
  const days: { key: string; start: Date; items: EventItem[] }[] = [];
  for (const e of events) {
    const start = new Date(startOf(e));
    const key = start.toDateString();
    const last = days[days.length - 1];
    if (last?.key === key) last.items.push(e);
    else days.push({ key, start, items: [e] });
  }
  return (
    <ul className="divide-y divide-slate-100">
      {days.map((d) => (
        <li key={d.key} className="flex gap-3 sm:gap-4 py-2">
          <span className="w-11 shrink-0 pt-3 text-center">
            <span className="block text-[11px] font-medium text-slate-500">{THAI_WEEKDAYS[d.start.getDay()]}</span>
            <span className="block text-xl font-bold text-slate-900 tabular-nums leading-tight">{d.start.getDate()}</span>
          </span>
          <ul className="flex-1 min-w-0 grid lg:grid-cols-2 gap-x-8">
            {d.items.map((e) => (
              <Row key={e.id} kind={kind} event={e} />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function StripCard({ kind, event }: { kind: Kind; event: EventItem }) {
  const status = statusOf(kind, event);
  const start = new Date(startOf(event));
  return (
    <Link href={hrefOf(kind, event)} className="group snap-start shrink-0 w-56 sm:w-64">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={event.image || FALLBACK_IMAGE}
        onError={(ev) => {
          if (ev.currentTarget.src !== FALLBACK_IMAGE) ev.currentTarget.src = FALLBACK_IMAGE;
        }}
        alt=""
        loading="lazy"
        className="w-full aspect-video rounded-xl object-cover bg-slate-100"
      />
      <span className={`mt-2 block text-xs font-semibold tabular-nums truncate ${WHEN_COLOR[kind]}`}>
        {kind === 'meetups' ? `${THAI_WEEKDAYS[start.getDay()]} ${shortDate(start.getTime())} · ${whenLine(kind, event)}` : whenLine(kind, event)}
      </span>
      <span className="mt-0.5 block text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{event.title}</span>
      <span className="mt-0.5 block text-xs text-slate-500 truncate">
        {event.province || event.location}
        {status && <span className={`font-semibold ${status.tone}`}> · {status.text}</span>}
      </span>
    </Link>
  );
}

const heading = (title: string, count: number) => (
  <h2 className="text-base sm:text-lg font-bold text-slate-900">
    {title} <span className="ml-1 text-sm font-medium text-slate-400 tabular-nums">{count}</span>
  </h2>
);

/**
 * The list view of /community and /events, like the /challenges list: what is soon on top as a strip of small cards
 * ("สัปดาห์นี้" for meetups, "กำลังจัดอยู่ตอนนี้" for fairs), then the rest by date under month headings, then
 * the ended ones (latest first) when the filter shows them. Open layout: headings and rows, no boxes.
 * `renderTile` draws the strip with the page's own tile (/community: the ตี้ tile of the card view, owner 2026-10-27).
 */
export function EventDateList({ kind, events, renderTile }: { kind: Kind; events: EventItem[]; renderTile?: (event: EventItem) => React.ReactNode }) {
  const [shown, setShown] = useState(PAGE);
  // The clock is read once when the list opens; what counts as "this week" does not shift while scrolling
  const [now] = useState(() => Date.now());

  const { strip, months, ended } = useMemo(() => {
    const isOver = (e: EventItem) => isEventEnded(e) || endOf(e) < now;
    const live = events.filter((e) => !isOver(e)).sort((a, b) => startOf(a) - startOf(b));
    const isSoon = kind === 'meetups' ? (e: EventItem) => startOf(e) < now + 7 * DAY : (e: EventItem) => startOf(e) <= now;
    let strip = live.filter(isSoon);
    let rest = live.filter((e) => !isSoon(e));
    // A strip with nothing under it is just the list
    if (rest.length === 0) {
      rest = strip;
      strip = [];
    }
    const months: { key: string; label: string; items: EventItem[] }[] = [];
    for (const e of rest) {
      const d = new Date(startOf(e));
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (months[months.length - 1]?.key !== key) months.push({ key, label: `${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`, items: [] });
      months[months.length - 1].items.push(e);
    }
    const ended = events.filter(isOver).sort((a, b) => startOf(b) - startOf(a));
    return { strip, months, ended };
  }, [events, kind, now]);

  // Rows past the first pages wait behind "ดูเพิ่ม"; the strip always shows. Each group shows what is left of the budget.
  const before = months.map((_, i) => months.slice(0, i).reduce((n, m) => n + m.items.length, 0));
  const visibleMonths = months.map((m, i) => ({ ...m, visible: m.items.slice(0, Math.max(0, shown - before[i])) })).filter((m) => m.visible.length > 0);
  const monthRows = months.reduce((n, m) => n + m.items.length, 0);
  const visibleEnded = ended.slice(0, Math.max(0, shown - monthRows));
  const total = monthRows + ended.length;

  return (
    <div className="space-y-8 sm:space-y-10">
      {strip.length > 0 && (
        <section aria-label={kind === 'meetups' ? 'สัปดาห์นี้' : 'กำลังจัดอยู่ตอนนี้'}>
          {heading(kind === 'meetups' ? 'สัปดาห์นี้' : 'กำลังจัดอยู่ตอนนี้', strip.length)}
          <div className="mt-3 flex gap-4 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            {strip.map((e) =>
              renderTile ? (
                <div key={e.id} className="snap-start shrink-0 w-44 sm:w-52">
                  {renderTile(e)}
                </div>
              ) : (
                <StripCard key={e.id} kind={kind} event={e} />
              )
            )}
          </div>
        </section>
      )}

      {visibleMonths.map((m) => (
        <section key={m.key} aria-label={m.label}>
          <div className="pb-2 border-b border-slate-200">{heading(m.label, m.items.length)}</div>
          <DayGroups kind={kind} events={m.visible} />
        </section>
      ))}

      {visibleEnded.length > 0 && (
        <section aria-label="ที่ผ่านมาแล้ว">
          <div className="pb-2 border-b border-slate-200">{heading('ที่ผ่านมาแล้ว', ended.length)}</div>
          <div className="opacity-80">
            <DayGroups kind={kind} events={visibleEnded} />
          </div>
        </section>
      )}

      {shown < total && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="h-10 px-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold cursor-pointer transition-colors"
          >
            ดูเพิ่ม ({(total - shown).toLocaleString()})
          </button>
        </div>
      )}
    </div>
  );
}

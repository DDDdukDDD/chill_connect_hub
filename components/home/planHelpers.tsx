'use client';

import React, { useEffect, useState } from 'react';
import type { EventItem } from '@/data/mockData';
import { nearDayLabel, parseEventDateToTimestamp } from '@/lib/dateUtils';
import { nameInitial } from '@/lib/displayName';

/** Times, faces and links shared by the member home (MemberLiveHome) and its journey band (JourneyBand) */

export const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const WEEKDAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80';
const FACE_COLORS = ['bg-amber-500', 'bg-pink-500', 'bg-sky-500'];

const startTime = (event: EventItem) => (event.time ?? '').split('-')[0].trim().replace(/\s*น\.$/, '');

/** When the event starts, from its date and the first time in "06:30 - 08:00" */
export function startsAt(event: EventItem) {
  const day = parseEventDateToTimestamp(event.date);
  const match = startTime(event).match(/^(\d{1,2})[:.](\d{2})/);
  return match ? day + (Number(match[1]) * 60 + Number(match[2])) * 60_000 : day;
}

/** When the event is over: the second time in "06:30 - 08:00", else three hours after it starts */
export function endsAt(event: EventItem) {
  const end = ((event.time ?? '').split('-')[1] ?? '').trim().match(/^(\d{1,2})[:.](\d{2})/);
  if (!end) return startsAt(event) + 3 * 3_600_000;
  const at = parseEventDateToTimestamp(event.date) + (Number(end[1]) * 60 + Number(end[2])) * 60_000;
  // An end time earlier than the start (a night that runs past midnight) is on the next day
  return at < startsAt(event) ? at + DAY_MS : at;
}

// "ส. 17 ต.ค. · 06:30", or "วันนี้ · 06:30" / "พรุ่งนี้ · 06:30" when it is that close
export const dayLine = (event: EventItem) =>
  `${nearDayLabel(event.date) ?? `${WEEKDAYS[new Date(parseEventDateToTimestamp(event.date)).getDay()]} ${event.date.replace(/\s*\d{4}$/, '')}`} · ${startTime(event)}`;

/** "อีก 15 ชม. 42 นาที" inside a day, then "อีก 2 วัน 6 ชม." */
export function awayLabel(event: EventItem, now: number) {
  const left = startsAt(event) - now;
  if (left <= 0) return 'เริ่มแล้ว';
  if (left < DAY_MS) {
    const hours = Math.floor(left / 3_600_000);
    const minutes = Math.floor((left % 3_600_000) / 60_000);
    return hours > 0 ? `อีก ${hours} ชม. ${minutes} นาที` : `อีก ${minutes} นาที`;
  }
  const days = Math.floor(left / DAY_MS);
  const hours = Math.floor((left % DAY_MS) / 3_600_000);
  // Hours matter only in the last few days: "อีก 40 วัน 14 ชม." reads like a timer, not a plan
  if (days >= 3) return `อีก ${days} วัน`;
  return hours > 0 ? `อีก ${days} วัน ${hours} ชม.` : `อีก ${days} วัน`;
}

/** "บ่ายวันอาทิตย์": the greeting carries the time of day instead of a coloured theme */
export function dayPart(now: number) {
  const date = new Date(now);
  const hour = date.getHours();
  const part = hour >= 5 && hour < 11 ? 'เช้า' : hour >= 11 && hour < 16 ? 'บ่าย' : hour >= 16 && hour < 19 ? 'เย็น' : 'ค่ำ';
  return `${part}วัน${WEEKDAY_NAMES[date.getDay()]}`;
}

/** A clock that ticks once a minute, for the countdown */
export function useMinuteClock(start: number) {
  const [now, setNow] = useState(start);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** Who else is going to a meetup (the list is open to everyone), for the faces on a row */
export function useGoingWith(eventId: string, enabled: boolean) {
  const [people, setPeople] = useState<{ name: string; avatar: string }[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetch(`/api/events/${encodeURIComponent(eventId)}/attendees`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (alive && json?.success) setPeople((json.attendees as { name: string; avatar: string; isMe?: boolean }[]).filter((p) => !p.isMe));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [eventId, enabled]);
  return people;
}

export const eventHref = (event: EventItem) => `/${event.eventType === 'public_venue' ? 'events' : 'community'}/${encodeURIComponent(event.id)}`;

export function Faces({ people, ring = 'ring-white', size = 'w-5 h-5' }: { people: { name: string; avatar?: string }[]; ring?: string; size?: string }) {
  return (
    <span className="flex -space-x-1.5 shrink-0" aria-hidden="true">
      {people.map((p, i) =>
        p.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={p.avatar} alt="" className={`${size} rounded-full ring-2 ${ring} object-cover bg-slate-100`} />
        ) : (
          <span key={i} className={`${size} rounded-full ring-2 ${ring} ${FACE_COLORS[i % FACE_COLORS.length]} text-white text-[9px] font-bold flex items-center justify-center`}>
            {nameInitial(p.name)}
          </span>
        )
      )}
    </span>
  );
}

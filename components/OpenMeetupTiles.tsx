'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, MapPin } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import { parseEventDateToTimestamp } from '@/lib/dateUtils';

type Face = { id: string; name: string; avatar: string };

const FACES_SHOWN = 3;
const FACE_COLORS = ['bg-violet-500', 'bg-cyan-600', 'bg-pink-500', 'bg-orange-500', 'bg-emerald-600', 'bg-blue-600'];
const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const DAY_MS = 24 * 60 * 60 * 1000;
const TILE = 'w-[68%] shrink-0 snap-start sm:w-auto';

// "วันนี้", "เสาร์นี้" for the coming days, then the short day itself
function dayLabel(event: EventItem, now: Date) {
  const ts = parseEventDateToTimestamp(event.date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.round((ts - today) / DAY_MS);
  const weekday = new Date(ts).getDay();
  if (days <= 0) return 'วันนี้';
  if (days === 1) return 'พรุ่งนี้';
  // Weeks start on Monday, so Saturday and Sunday close the week
  if (days <= (7 - now.getDay()) % 7 && (weekday === 6 || weekday === 0)) return weekday === 6 ? 'เสาร์นี้' : 'อาทิตย์นี้';
  return `${WEEKDAYS[weekday]} ${event.date.replace(/\s*\d{4}$/, '')}`;
}

function seatsLine(event: EventItem) {
  const joined = event.participantsCount;
  const left = event.maxParticipants - joined;
  if (event.minParticipants && joined < event.minParticipants) return `ขาดอีก ${event.minParticipants - joined} คน`;
  if (left === 1) return 'ที่สุดท้าย!';
  if (left <= 2) return `เหลือ ${left} ที่`;
  return `ว่าง ${left} ที่`;
}

function FaceStack({ event }: { event: EventItem }) {
  const [faces, setFaces] = useState<Face[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/events/${encodeURIComponent(event.id)}/attendees`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => { if (alive) setFaces(json?.success ? json.attendees : []); })
      .catch(() => { if (alive) setFaces([]); });
    return () => { alive = false; };
  }, [event.id]);

  const listed: Face[] = faces ?? [];
  // Sample events count more people than they list; the host stands in for them
  const people = listed.length === 0 && event.hostName ? [{ id: 'host', name: event.hostName, avatar: event.hostAvatar ?? '' }] : listed;
  const shown = people.slice(0, FACES_SHOWN);
  const more = Math.max(event.participantsCount, people.length) - shown.length;
  const box = 'w-7 h-7 rounded-full border-2 border-white';

  return (
    <span className="flex -space-x-2 shrink-0" aria-hidden="true">
      {shown.map((p) =>
        p.avatar ? (
          <img key={p.id} src={p.avatar} alt="" className={`${box} object-cover bg-slate-100`} />
        ) : (
          <span
            key={p.id}
            className={`${box} ${FACE_COLORS[[...p.name].reduce((n, c) => n + c.charCodeAt(0), 0) % FACE_COLORS.length]} text-white text-[11px] font-bold flex items-center justify-center`}
          >
            {[...p.name][0] ?? '?'}
          </span>
        )
      )}
      {more > 0 && (
        <span className={`${box} bg-white text-slate-800 text-[10px] font-extrabold flex items-center justify-center`}>+{more}</span>
      )}
    </span>
  );
}

/**
 * "ตี้ที่เปิดรับอยู่" on /journey: tall photo tiles with the day, who is going and the seats left.
 * The last tile invites the member to start their own.
 */
export function OpenMeetupTiles({ events, isLoaded, onCreate }: { events: EventItem[]; isLoaded: boolean; onCreate: () => void }) {
  const row = 'flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-3 sm:grid sm:overflow-visible sm:grid-cols-3 lg:grid-cols-6 sm:gap-4';

  if (!isLoaded) {
    return (
      <div className={row}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${TILE} aspect-[3/4] rounded-3xl bg-slate-100`} />
        ))}
      </div>
    );
  }

  const now = new Date();

  return (
    <div className={row}>
      {events.map((event, i) => {
        const startTime = event.time.split('-')[0].trim().replace(/\s*น\.$/, '');
        return (
          <Link
            key={event.id}
            href={`/community/${encodeURIComponent(event.id)}`}
            className={`${TILE} group relative aspect-[3/4] overflow-hidden rounded-3xl bg-slate-200 ${i % 2 ? 'sm:mt-5' : ''}`}
          >
            <img src={event.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" aria-hidden="true" />
            <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-slate-900 shadow-sm">
              {dayLabel(event, now)} · {startTime}
            </span>
            <span className="absolute inset-x-0 bottom-0 p-3.5 text-white">
              <span className="block text-base font-black leading-snug line-clamp-2">{event.title}</span>
              <span className="mt-1 flex items-center gap-1 text-xs font-medium text-white/85 min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{event.location}</span>
              </span>
              <span className="mt-2.5 flex items-center justify-between gap-2">
                <FaceStack event={event} />
                <span className="rounded-full bg-[#F26430] px-2.5 py-1 text-[11px] font-extrabold whitespace-nowrap">{seatsLine(event)}</span>
              </span>
            </span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onCreate}
        className={`${TILE} ${events.length % 2 ? 'sm:mt-5' : ''} group aspect-[3/4] rounded-3xl border-2 border-dashed border-slate-300 hover:border-[#F26430] hover:bg-orange-50/60 flex flex-col items-center justify-center gap-3 p-4 text-center cursor-pointer transition-colors`}
      >
        <span className="w-12 h-12 rounded-full bg-[#F26430] text-white flex items-center justify-center -rotate-6 group-hover:rotate-0 transition-transform">
          <Plus className="w-6 h-6" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-base font-black text-slate-900">ไม่เจอที่ใช่?</span>
          <span className="block mt-0.5 text-sm font-bold text-slate-600">ตั้งตี้เองเลย แล้วรอเพื่อนๆ มาร่วม</span>
        </span>
      </button>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, MapPin, Heart } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import { parseEventDateToTimestamp } from '@/lib/dateUtils';

type Face = { id: string; name: string; avatar: string };

const FACES_SHOWN = 3;
const FACE_COLORS = ['bg-violet-500', 'bg-cyan-600', 'bg-pink-500', 'bg-orange-500', 'bg-emerald-600', 'bg-blue-600'];
const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const DAY_MS = 24 * 60 * 60 * 1000;
// Same widths as ChallengePicks, so the homepage photo rows line up
const TILE = 'w-[44%] sm:w-[30%] md:w-[23%] lg:w-[calc((100%-5*24px)/6)] shrink-0 snap-start';

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

// Test-login meetups carry a "[ตัวอย่าง]" tag in the title; the tile shows the title alone
const cleanTitle = (title: string) => title.replace(/^\[ตัวอย่าง\]\s*/, '');

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
  const box = 'w-6 h-6 rounded-full border-2 border-white';

  return (
    <span className="flex -space-x-2 shrink-0" aria-hidden="true">
      {shown.map((p) =>
        p.avatar ? (
          <img key={p.id} src={p.avatar} alt="" className={`${box} object-cover bg-slate-100`} />
        ) : (
          <span
            key={p.id}
            className={`${box} ${FACE_COLORS[[...p.name].reduce((n, c) => n + c.charCodeAt(0), 0) % FACE_COLORS.length]} text-white text-[10px] font-bold flex items-center justify-center`}
          >
            {[...p.name][0] ?? '?'}
          </span>
        )
      )}
      {more > 0 && (
        <span className={`${box} bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center`}>+{more}</span>
      )}
    </span>
  );
}

/**
 * "ตี้แนะนำ เปิดรับอยู่" on the homepage: square photos the size of the challenge picks, with the day and
 * the seats left on the photo, and the title, place and who is going below it.
 * The last tile invites the member to start their own. `reasons` (signed-in home) puts why a meetup is
 * suggested, such as "เพราะคุณชอบสายคาเฟ่", in place of the place.
 * `onToggleSave` adds a heart on each photo (`savedIds` are the saved meetups).
 */
export function OpenMeetupTiles({
  events,
  isLoaded,
  onCreate,
  reasons,
  savedIds,
  onToggleSave,
}: {
  events: EventItem[];
  isLoaded: boolean;
  onCreate: () => void;
  reasons?: Record<string, string>;
  savedIds?: string[];
  onToggleSave?: (eventId: string) => void;
}) {
  const row = 'flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-1 sm:scroll-px-1 pt-1 pb-2';

  if (!isLoaded) {
    return (
      <div className={row}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${TILE} aspect-square rounded-3xl bg-slate-100`} />
        ))}
      </div>
    );
  }

  const now = new Date();

  return (
    <div className={row}>
      {events.map((event) => {
        const startTime = event.time.split('-')[0].trim().replace(/\s*น\.$/, '');
        const reason = reasons?.[event.id];
        const isSaved = savedIds?.includes(event.id) ?? false;
        return (
          <Link key={event.id} href={`/community/${encodeURIComponent(event.id)}`} className={`${TILE} group block`}>
            <span className="relative block aspect-square overflow-hidden rounded-3xl bg-slate-200 shadow-md">
              <img src={event.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-900 shadow-sm">
                {dayLabel(event, now)} · {startTime}
              </span>
              <span className="absolute right-2.5 bottom-2.5 rounded-full bg-[#F26430] px-2.5 py-1 text-[11px] font-bold text-white whitespace-nowrap shadow-sm">
                {seatsLine(event)}
              </span>
              {onToggleSave && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onToggleSave(event.id);
                  }}
                  aria-label={isSaved ? 'เลิกบันทึกตี้นี้' : 'บันทึกตี้นี้'}
                  aria-pressed={isSaved}
                  className="absolute right-2.5 top-2.5 w-8 h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#F26430] text-[#F26430]' : 'text-slate-900'}`} aria-hidden="true" />
                </button>
              )}
            </span>
            <span className="mt-3 text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{cleanTitle(event.title)}</span>
            {reason ? (
              <span className="mt-1 flex items-center gap-1 text-xs font-bold text-orange-700 min-w-0">
                <Heart className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{reason}</span>
              </span>
            ) : (
              <span className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-500 min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
            <span className="mt-2 block">
              <FaceStack event={event} />
            </span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onCreate}
        className={`${TILE} group self-start aspect-square rounded-3xl border-2 border-dashed border-slate-300 hover:border-[#F26430] hover:bg-orange-50/60 flex flex-col items-center justify-center gap-2.5 p-3 text-center cursor-pointer transition-colors`}
      >
        <span className="w-11 h-11 rounded-full bg-[#F26430] text-white flex items-center justify-center -rotate-6 group-hover:rotate-0 transition-transform">
          <Plus className="w-5 h-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-bold text-slate-900">ไม่เจอที่ใช่?</span>
          <span className="block mt-0.5 text-xs font-bold text-slate-600">ตั้งตี้เองเลย แล้วรอเพื่อนๆ มาร่วม</span>
        </span>
      </button>
    </div>
  );
}

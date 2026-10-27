'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Heart, Star, Globe } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import { isEventEnded, parseEventDateToTimestamp } from '@/lib/dateUtils';
import { formatEventBadgePrice, hasKnownPrice, isPriceFree } from '@/lib/priceUtils';
import { placeName } from '@/lib/placeName';
import { optimizedImage } from '@/lib/optimizedImage';

type Face = { id: string; name: string; avatar: string };

const FACES_SHOWN = 3;
const FACE_COLORS = ['bg-violet-500', 'bg-cyan-600', 'bg-pink-500', 'bg-orange-500', 'bg-emerald-600', 'bg-blue-600'];
const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const DAY_MS = 24 * 60 * 60 * 1000;

// "วันนี้", "เสาร์นี้" for the coming days, then the short day itself
function dayLabel(event: EventItem, now?: Date | null) {
  const ts = parseEventDateToTimestamp(event.date);
  const weekday = new Date(ts).getDay();
  const short = `${WEEKDAYS[weekday]} ${event.date.replace(/\s*\d{4}$/, '')}`;
  // Without the browser's clock (server HTML) the plain day, so both render the same
  if (!now) return short;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.round((ts - today) / DAY_MS);
  if (days < 0) return short;
  if (days === 0) return 'วันนี้';
  if (days === 1) return 'พรุ่งนี้';
  // Weeks start on Monday, so Saturday and Sunday close the week
  if (days <= (7 - now.getDay()) % 7 && (weekday === 6 || weekday === 0)) return weekday === 6 ? 'เสาร์นี้' : 'อาทิตย์นี้';
  return short;
}

// Test-login meetups carry a "[ตัวอย่าง]" tag in the title; the tile shows the title alone
const cleanTitle = (title: string) => title.replace(/^\[ตัวอย่าง\]\s*/, '');

function seatsLine(event: EventItem) {
  const joined = event.participantsCount;
  const left = event.maxParticipants - joined;
  if (event.status === 'full' || left <= 0) return 'เต็มแล้ว';
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
 * A ตี้ as the landing shows it ("ตี้แนะนำ เปิดรับอยู่") and /community lists it, so both pages feel the same:
 * a square photo with the day and the seats left on it, then the title, the place and who is going. No frame;
 * the whole tile is one link. `reason` (signed-in home) puts why it is suggested in place of the place.
 * `showHost` adds one quiet line for host, rating and price (/community: trust and cost decide whether to join).
 */
export function MeetupTile({
  event,
  now,
  reason,
  isSaved = false,
  onToggleSave,
  isJoined = false,
  showHost = false,
  className = '',
}: {
  event: EventItem;
  /** The browser's clock, for "วันนี้" / "เสาร์นี้"; leave it out in server HTML */
  now?: Date | null;
  reason?: string;
  isSaved?: boolean;
  onToggleSave?: (eventId: string) => void;
  /** Rings the photo and says "ร่วมแล้ว" in place of the seats */
  isJoined?: boolean;
  showHost?: boolean;
  className?: string;
}) {
  const isEnded = isEventEnded(event);
  const startTime = (event.time ?? '').split('-')[0].trim().replace(/\s*น\.$/, '');
  const rating = event.hostRating || event.rating;
  const isOnline = event.province === 'ออนไลน์' || event.locationType === 'online';
  const showSave = onToggleSave && !isEnded;

  return (
    <Link href={`/community/${encodeURIComponent(event.id)}`} className={`group block ${className}`}>
      <span
        data-row-photo
        className={`relative block aspect-square overflow-hidden rounded-3xl bg-slate-200 shadow-md ${isJoined && !isEnded ? 'ring-2 ring-[#F26430] ring-offset-2' : ''}`}
      >
        <img
          src={optimizedImage(event.image, 384)}
          alt=""
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isEnded ? 'grayscale opacity-80' : ''}`}
        />
        {/* On a phone tile the day and time stack, so the chip stays clear of the heart */}
        <span className={`absolute left-2.5 top-2.5 flex flex-col sm:flex-row sm:gap-1 rounded-xl sm:rounded-full bg-white px-2.5 py-1 text-xs leading-snug font-bold text-slate-900 shadow-sm ${showSave ? 'max-sm:max-w-[calc(100%-3.75rem)]' : ''}`}>
          <span className="max-sm:truncate whitespace-nowrap">{dayLabel(event, now)}</span>
          <span className="whitespace-nowrap">
            <span className="hidden sm:inline">· </span>
            {startTime}
          </span>
        </span>
        {isEnded ? (
          <span className="absolute right-2.5 bottom-2.5 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 whitespace-nowrap shadow-sm">จบแล้ว</span>
        ) : isJoined ? (
          <span className="absolute right-2.5 bottom-2.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#C2410C] whitespace-nowrap shadow-sm">ร่วมแล้ว</span>
        ) : (
          <span className={`absolute right-2.5 bottom-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shadow-sm ${seatsLine(event) === 'เต็มแล้ว' ? 'bg-slate-700 text-white' : 'bg-[#F26430] text-white'}`}>
            {seatsLine(event)}
          </span>
        )}
        {showSave && (
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
      <span className={`mt-3 text-sm font-bold leading-snug line-clamp-2 group-hover:underline ${isEnded ? 'text-slate-700' : 'text-slate-900'}`} title={cleanTitle(event.title)}>
        {cleanTitle(event.title)}
      </span>
      {showHost && event.hostName && (
        <span className="mt-1 flex items-center gap-1 text-xs text-slate-500 min-w-0">
          {event.hostAvatar && <img src={event.hostAvatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0 bg-slate-100" />}
          <span className="truncate">{event.hostName}</span>
          {Boolean(rating) && (
            <span className="inline-flex items-center gap-0.5 shrink-0 tabular-nums" title={`คะแนนโฮสต์ ${(rating ?? 0).toFixed(1)} / 5`}>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
              {(rating ?? 0).toFixed(1)}
            </span>
          )}
          {hasKnownPrice(event.price) && (
            <span className={`shrink-0 ${isPriceFree(event.price) ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-700'}`}>
              · {formatEventBadgePrice(event.price, 'ฟรี')}
            </span>
          )}
        </span>
      )}
      {reason ? (
        <span className="mt-1 flex items-center gap-1 text-xs font-bold text-orange-700 min-w-0">
          <Heart className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{reason}</span>
        </span>
      ) : (
        <span className={`mt-1 flex items-center gap-1 text-xs min-w-0 ${showHost ? 'text-slate-500' : 'font-bold text-slate-500'}`}>
          {isOnline ? <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> : <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
          <span className="truncate">{isOnline ? (event.location.includes('ออนไลน์') ? event.location : `ออนไลน์ · ${event.location}`) :showHost ? placeName(event.location) : event.location}</span>
        </span>
      )}
      <span className="mt-2 block">
        <FaceStack event={event} />
      </span>
    </Link>
  );
}

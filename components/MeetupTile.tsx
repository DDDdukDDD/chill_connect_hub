'use client';

import React, { useEffect, useState } from 'react';
import { SponsoredBadge } from './SponsoredBadge';
import Link from 'next/link';
import { MapPin, Heart, Star, Globe } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import { BANGKOK_ZONES } from '@/data/zones';
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

// The area a tile names next to the day: "สุขุมวิท" from the zone, else the province, "ออนไลน์" for online ตี้.
// Short on purpose so the line never cuts; the full place and meeting point are on the detail page (owner 2026-10-27).
export function areaLabel(event: EventItem, isOnline = event.province === 'ออนไลน์' || event.locationType === 'online') {
  if (isOnline) return 'ออนไลน์';
  const zone = (event.zone ?? '').toLowerCase();
  const known = BANGKOK_ZONES.find((z) => zone === z.id || zone.startsWith(`${z.id}_`));
  if (known) return known.label.split(' / ')[0];
  // Hosts type the area themselves ("คลองเตย"); only sample ids like "chiangmai_city" fall back to the province
  if (event.zone?.trim() && !/^[a-z0-9_]+$/.test(zone)) return event.zone.trim();
  if (event.province) return event.province === 'กรุงเทพมหานคร' ? 'กรุงเทพฯ' : event.province;
  return placeName(event.location).split(/,\s*/)[0];
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

// Tiles on screen ask together: one request for a whole page of tiles (GET /api/events/faces), kept for the visit
type Stack = { faces: Face[]; listed: number };
const NO_STACK: Stack = { faces: [], listed: 0 };
const BATCH_MAX = 60;
const stackCache = new Map<string, Promise<Stack>>();
let waiting: { id: string; resolve: (stack: Stack) => void }[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushStacks() {
  const batch = waiting;
  waiting = [];
  flushTimer = null;
  for (let i = 0; i < batch.length; i += BATCH_MAX) {
    const chunk = batch.slice(i, i + BATCH_MAX);
    fetch(`/api/events/faces?ids=${chunk.map((w) => encodeURIComponent(w.id)).join(',')}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => chunk.forEach((w) => w.resolve(json?.stacks?.[w.id] ?? NO_STACK)))
      .catch(() =>
        chunk.forEach((w) => {
          stackCache.delete(w.id);
          w.resolve(NO_STACK);
        })
      );
  }
}

function loadStack(id: string): Promise<Stack> {
  const known = stackCache.get(id);
  if (known) return known;
  const promise = new Promise<Stack>((resolve) => {
    waiting.push({ id, resolve });
    flushTimer ??= setTimeout(flushStacks, 30);
  });
  stackCache.set(id, promise);
  return promise;
}

function FaceStack({ event }: { event: EventItem }) {
  const [stack, setStack] = useState<Stack | null>(null);

  useEffect(() => {
    let alive = true;
    loadStack(event.id).then((loaded) => alive && setStack(loaded));
    return () => { alive = false; };
  }, [event.id]);

  const listed = stack ?? NO_STACK;
  // Sample events count more people than they list; the host stands in for them
  const people = listed.listed === 0 && event.hostName ? [{ id: 'host', name: event.hostName, avatar: event.hostAvatar ?? '' }] : listed.faces;
  const shown = people.slice(0, FACES_SHOWN);
  const more = Math.max(event.participantsCount, listed.listed, people.length) - shown.length;
  const box = 'w-6 h-6 rounded-full border-2 border-white';

  return (
    <span className="flex -space-x-2 shrink-0" aria-hidden="true">
      {shown.map((p) =>
        p.avatar ? (
          <img key={p.id} src={optimizedImage(p.avatar, 96)} alt="" loading="lazy" className={`${box} object-cover bg-slate-100`} />
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
 * a square photo with the seats left on it, then the title, the day and area in one line, and who is going. No frame;
 * the whole tile is one link. `reason` (signed-in home) adds a line saying why it is suggested.
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
  badge,
  href,
  sponsored = false,
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
  /** Replaces the seats on the photo (a host's own ตี้ on their profile: "รอทีมงานตรวจ") */
  badge?: string;
  /** Where the tile goes; null when there is no page yet (a ตี้ waiting for review). Defaults to the ตี้ page. */
  href?: string | null;
  /** A paid-for place in a list (lib/sponsored): "สนับสนุน" on the photo */
  sponsored?: boolean;
  className?: string;
}) {
  const isEnded = isEventEnded(event);
  const startTime = (event.time ?? '').split('-')[0].trim().replace(/\s*น\.$/, '');
  const rating = event.hostRating || event.rating;
  const isOnline = event.province === 'ออนไลน์' || event.locationType === 'online';
  const showSave = onToggleSave && !isEnded;

  const target = href === undefined ? `/community/${encodeURIComponent(event.id)}` : href;
  const body = (
    <>
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
        {badge ? (
          <span className="absolute right-2.5 bottom-2.5 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 whitespace-nowrap shadow-sm">{badge}</span>
        ) : isEnded ? (
          <span className="absolute right-2.5 bottom-2.5 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 whitespace-nowrap shadow-sm">จบแล้ว</span>
        ) : isJoined ? (
          <span className="absolute right-2.5 bottom-2.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#C2410C] whitespace-nowrap shadow-sm">ร่วมแล้ว</span>
        ) : (
          <span className={`absolute right-2.5 bottom-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shadow-sm ${seatsLine(event) === 'เต็มแล้ว' ? 'bg-slate-700 text-white' : 'bg-[#F26430] text-white'}`}>
            {seatsLine(event)}
          </span>
        )}
        {sponsored && <SponsoredBadge />}
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
          {event.hostAvatar && <img src={optimizedImage(event.hostAvatar, 96)} alt="" loading="lazy" className="w-4 h-4 rounded-full object-cover shrink-0 bg-slate-100" />}
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
      {/* When and where in one line: the day leads in orange, the area after it (the photo keeps only the heart and the seats) */}
      <span className="mt-1 flex items-center gap-1 text-xs text-slate-500 min-w-0">
        {isOnline ? <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> : <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
        <span className={`shrink-0 whitespace-nowrap font-semibold ${isEnded ? 'text-slate-500' : 'text-[#C2410C]'}`}>
          {dayLabel(event, now)}
          {startTime && ` ${startTime}`}
        </span>
        <span className="truncate">· {areaLabel(event, isOnline)}</span>
      </span>
      {reason && (
        <span className="mt-1 flex items-center gap-1 text-xs font-bold text-orange-700 min-w-0">
          <Heart className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{reason}</span>
        </span>
      )}
      <span className="mt-2 block">
        <FaceStack event={event} />
      </span>
    </>
  );
  return target ? (
    <Link href={target} className={`group block ${className}`}>
      {body}
    </Link>
  ) : (
    <div className={`group block ${className}`}>{body}</div>
  );
}

'use client';

import React from 'react';
import { SponsoredBadge } from './SponsoredBadge';
import Link from 'next/link';
import { MapPin, Heart } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { formatEventBadgePrice, hasKnownPrice, isPriceFree } from '@/lib/priceUtils';
import { fairPlace } from '@/lib/placeName';
import { optimizedImage } from '@/lib/optimizedImage';
import { PosterPhoto } from '@/components/PosterPhoto';

const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

const shortDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]}`;
};

// "ส. 1 พ.ย." for a one-day อีเวนต์, "23 ต.ค. – 1 พ.ย." for one over several days; no year, the tile is short.
// Imported events may hold the range in `date` itself ("24 ต.ค. - 28 ต.ค. 2569"), so the end comes from either.
function whenLine(event: EventItem) {
  const start = parseEventDateToTimestamp(event.date);
  const end = parseEventEndDateToTimestamp(event.endDate || event.date);
  if (new Date(end).toDateString() !== new Date(start).toDateString()) return `${shortDate(start)} – ${shortDate(end)}`;
  return `${WEEKDAYS[new Date(start).getDay()]} ${shortDate(start)}`;
}

// The big halls by the names people use, so "date · venue" fits one line like a ตี้'s "day · area"
const KNOWN_VENUES: [RegExp, string][] = [
  [/สิริกิติ์|QSNCC/i, 'ศูนย์ฯ สิริกิติ์'],
  [/อิมแพ็ค|IMPACT/i, 'อิมแพ็ค'],
  [/ไบเทค|BITEC/i, 'ไบเทค'],
  [/พารากอน|Paragon/i, 'พารากอน'],
  [/ไอคอนสยาม|ICONSIAM/i, 'ไอคอนสยาม'],
];

// Else the venue alone: "รอยัล พารากอน ฮอลล์ (Royal Paragon Hall ชั้น 5 …)" → "รอยัล พารากอน ฮอลล์"
function venueOf(event: EventItem) {
  const known = KNOWN_VENUES.find(([pattern]) => pattern.test(event.location || ''));
  if (known) return known[1];
  const place = (fairPlace(event.location).split(' · ')[0] || event.province || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  return place === 'กรุงเทพมหานคร' ? 'กรุงเทพฯ' : place;
}

// While it runs: "กำลังจัด · ถึง 28 ต.ค.", or "วันนี้" for a one-day อีเวนต์
function onNowLine(event: EventItem) {
  const end = parseEventEndDateToTimestamp(event.endDate || event.date);
  return new Date(end).toDateString() === new Date().toDateString() ? 'วันนี้' : `กำลังจัด · ถึง ${shortDate(end)}`;
}

// The badge price, short: "เข้าชมฟรี", "฿800", "เริ่ม ฿1,200" when the organizer lists tiers; null when not given,
// so the tile shows no badge rather than a guess (owner 2026-10-28: never "free" unless the source says so)
function entryPrice(price: string | undefined): string | null {
  if (isPriceFree(price)) return 'เข้าชมฟรี';
  if (!hasKnownPrice(price) || /ไม่ระบุ/.test(price!)) return null;
  const amounts = (formatEventBadgePrice(price).match(/\d[\d,]*/g) || []).map((n) => parseInt(n.replace(/,/g, ''), 10)).filter((n) => n >= 20);
  if (amounts.length === 0) return null;
  const min = Math.min(...amounts);
  return `${amounts.length > 1 ? 'เริ่ม ' : ''}฿${min.toLocaleString()}`;
}

/** On now: started and not over. Needs the browser's clock, so the server HTML never says it. */
function isOnNow(event: EventItem, now: Date | null | undefined) {
  if (!now) return false;
  const end = parseEventEndDateToTimestamp(event.endDate || event.date);
  return parseEventDateToTimestamp(event.date) <= now.getTime() && now.getTime() <= end;
}

// Test-login events carry a "[ตัวอย่าง]" tag in the title; the tile shows the title alone
const cleanTitle = (title: string) => title.replace(/^\[ตัวอย่าง\]\s*/, '');

/**
 * An อีเวนต์ as /events lists it, built like the ตี้ tile so both tabs feel the same: a square photo with one badge,
 * the title, a quiet line for the price, then "date · venue" with the pin. No frame; the whole tile is one link.
 */
export function FairTile({
  event,
  now,
  isSaved = false,
  onToggleSave,
  sponsored = false,
}: {
  event: EventItem;
  /** The browser's clock, for "กำลังจัดอยู่"; leave it out in server HTML */
  now?: Date | null;
  isSaved?: boolean;
  onToggleSave?: (eventId: string) => void;
  /** A paid-for place in a list (lib/sponsored): "สนับสนุน" on the photo */
  sponsored?: boolean;
}) {
  const isEnded = isEventEnded(event);
  const onNow = !isEnded && isOnNow(event, now);
  // One badge: what it costs to get in (the fact that decides a click), "จบแล้ว" once over, none when the price is unknown
  const price = entryPrice(event.price);
  const badge = isEnded ? { text: 'จบแล้ว', tone: 'bg-slate-200 text-slate-700' } : price ? { text: price, tone: 'bg-[#2B527A] text-white' } : null;

  return (
    <Link href={`/events/${encodeURIComponent(event.id)}`} className="group block">
      <span className="relative block aspect-square overflow-hidden rounded-3xl bg-slate-200 shadow-md">
        {/* A tall poster shows whole over a blurred copy of itself; a plain photo fills the square as on a ตี้ tile */}
        <PosterPhoto src={optimizedImage(event.image, 384)} dim={isEnded} zoom />
        {badge && <span className={`absolute right-2.5 bottom-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shadow-sm ${badge.tone}`}>{badge.text}</span>}
        {sponsored && <SponsoredBadge />}
        {onToggleSave && !isEnded && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleSave(event.id);
            }}
            aria-label={isSaved ? 'เลิกบันทึกอีเวนต์นี้' : 'บันทึกอีเวนต์นี้'}
            aria-pressed={isSaved}
            className="absolute right-2.5 top-2.5 w-8 h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#2B527A] text-[#2B527A]' : 'text-slate-900'}`} aria-hidden="true" />
          </button>
        )}
      </span>
      <span className={`mt-3 text-sm font-bold leading-snug line-clamp-2 group-hover:underline ${isEnded ? 'text-slate-700' : 'text-slate-900'}`} title={cleanTitle(event.title)}>
        {cleanTitle(event.title)}
      </span>
      {/* When and where in one line, as on a ตี้: the dates lead in the pillar's blue ("กำลังจัด · ถึง 28 ต.ค." while on), the venue after them */}
      <span className="mt-1 flex items-center gap-1 text-xs text-slate-500 min-w-0">
        <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className={`shrink-0 whitespace-nowrap font-semibold tabular-nums ${isEnded ? 'text-slate-500' : 'text-[#2B527A]'}`}>{onNow ? onNowLine(event) : whenLine(event)}</span>
        <span className="truncate">· {venueOf(event)}</span>
      </span>
    </Link>
  );
}

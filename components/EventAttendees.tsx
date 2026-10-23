'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';

type Attendee = { id: string; name: string; avatar: string; verified: boolean; isHost: boolean; isMe: boolean; attendance?: { attended: number; total: number } };

/** "มาตามนัด 9/10" from host check-ins on ended ตี้ (lib/social/attendance.ts); a first-timer has none yet */
const attendanceLabel = (a: Attendee) => (a.attendance ? (a.attendance.total > 0 ? `มาตามนัด ${a.attendance.attended}/${a.attendance.total}` : 'ตี้แรก') : null);

type Tile =
  | { kind: 'person'; key: string; name: string; avatar: string; href: string; label: string; tone: 'host' | 'me' | 'plain'; verified: boolean }
  | { kind: 'unknown'; key: string };

const MOBILE_SHOWN = 3;
const DESKTOP_SHOWN = 5;
const FACE_COLORS = ['bg-violet-500', 'bg-cyan-600', 'bg-pink-500', 'bg-orange-500', 'bg-emerald-600', 'bg-blue-600', 'bg-fuchsia-600', 'bg-slate-600'];

function Face({ name, avatar, verified, size = 'lg' }: { name: string; avatar: string; verified?: boolean; size?: 'lg' | 'sm' }) {
  const box = size === 'lg' ? 'w-12 h-12 text-base' : 'w-5 h-5 text-[9px]';
  const color = FACE_COLORS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % FACE_COLORS.length];
  return (
    <span className="relative inline-block shrink-0">
      {avatar ? (
        <img src={avatar} alt="" className={`${box} rounded-full object-cover bg-slate-100`} />
      ) : (
        <span className={`${box} ${color} rounded-full text-white font-bold flex items-center justify-center`}>{[...name][0] ?? '?'}</span>
      )}
      {verified && size === 'lg' && (
        <BadgeCheck className="absolute -right-1 -bottom-1 w-5 h-5 text-white fill-emerald-600" aria-label="ยืนยันตัวตนแล้ว" />
      )}
    </span>
  );
}

/**
 * "ใครจะไปบ้าง" on a meetup page (and "ใครทำอยู่บ้าง" on a challenge): one row of people with a "อีก N คน" tile, open to everyone.
 * Sample events have a count but few join records; the host from the event and gray faces fill the gap.
 */
export function EventAttendees({ src, title = 'ใครจะไปบ้าง', total, hostName, hostAvatar, hostHref = '', refreshKey }: {
  /** The API that lists the people: /api/events/{id}/attendees or /api/quests/{id}/members */
  src: string;
  title?: string;
  total: number;
  hostName?: string;
  hostAvatar?: string;
  hostHref?: string;
  /** Changes when the member joins or leaves, so the list reloads */
  refreshKey?: unknown;
}) {
  const [attendees, setAttendees] = useState<Attendee[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(src, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => { if (alive && json?.success) setAttendees(json.attendees); })
      .catch(() => { if (alive) setAttendees([]); });
    return () => { alive = false; };
  }, [src, refreshKey]);

  if (!attendees || total <= 0) return null;

  const tiles: Tile[] = [];
  if (!attendees.some((a) => a.isHost) && hostName) {
    tiles.push({ kind: 'person', key: 'host', name: hostName, avatar: hostAvatar ?? '', href: hostHref, label: 'ผู้จัด', tone: 'host', verified: true });
  }
  for (const a of attendees) {
    tiles.push({
      kind: 'person',
      key: a.id,
      name: a.isMe ? 'คุณ' : a.name,
      avatar: a.avatar,
      href: `/profile?id=${encodeURIComponent(a.id)}`,
      label: a.isHost ? 'ผู้จัด' : a.isMe ? 'คุณเอง' : attendanceLabel(a) ?? (a.verified ? 'ยืนยันแล้ว' : 'สมาชิก'),
      tone: a.isHost ? 'host' : a.isMe ? 'me' : 'plain',
      verified: a.verified,
    });
  }
  // People counted on the event but not listed (sample events)
  for (let i = tiles.length; i < total; i++) tiles.push({ kind: 'unknown', key: `unknown-${i}` });

  const moreTile = (rest: Tile[], className: string) => rest.length > 0 && (
    <button
      type="button"
      onClick={() => setShowAll(true)}
      className={`${className} flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-1 py-3 hover:bg-slate-50 transition-colors cursor-pointer`}
    >
      <span className="grid grid-cols-2 gap-0.5 w-12 h-12 place-items-center">
        {rest.slice(0, 3).map((t) => t.kind === 'person'
          ? <span key={t.key} className="blur-[0.5px]"><Face name={t.name} avatar={t.avatar} size="sm" /></span>
          : <span key={t.key} className="w-5 h-5 rounded-full bg-slate-200" />)}
        {rest.length > 3 && (
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">+{rest.length - 3}</span>
        )}
      </span>
      <span className="text-xs font-bold text-slate-800">อีก {rest.length} คน</span>
    </button>
  );

  const tileView = (t: Tile, className = 'flex') => t.kind === 'person' ? (
    <Link
      key={t.key}
      href={t.href}
      className={`${className} flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white px-1 py-3 text-center min-w-0 hover:bg-slate-50 transition-colors`}
    >
      <Face name={t.name} avatar={t.avatar} verified={t.verified} />
      <span className="mt-0.5 w-full truncate text-xs font-bold text-slate-900">{t.name}</span>
      <span className={`text-[11px] font-bold ${t.tone === 'host' ? 'text-indigo-700' : t.tone === 'me' ? 'text-emerald-700' : 'text-slate-500'}`}>{t.label}</span>
    </Link>
  ) : (
    <div key={t.key} className={`${className} flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white px-1 py-3 text-center`}>
      <span className="w-12 h-12 rounded-full bg-slate-200" />
      <span className="mt-0.5 text-xs font-bold text-slate-500">สมาชิก</span>
    </div>
  );

  return (
    <section className="space-y-3" aria-labelledby="attendees-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="attendees-title" className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <span>{title}</span>
          <span className="text-[11px] sm:text-xs font-bold text-slate-700 border border-slate-200 rounded-full px-2.5 py-0.5">{total} คน</span>
        </h2>
        {tiles.length > MOBILE_SHOWN + 1 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-xs sm:text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
          >
            {showAll ? 'ย่อ' : 'ดูทั้งหมด'}
          </button>
        )}
      </div>

      {showAll ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">{tiles.map((t) => tileView(t))}</div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {tiles.slice(0, MOBILE_SHOWN).map((t) => tileView(t))}
          {tiles.slice(MOBILE_SHOWN, DESKTOP_SHOWN).map((t, i) =>
            // On phones the 4th place goes to "อีก N คน" unless this person is the last one
            tileView(t, tiles.length === MOBILE_SHOWN + 1 && i === 0 ? 'flex' : 'hidden sm:flex'))}
          {tiles.length > MOBILE_SHOWN + 1 && moreTile(tiles.slice(MOBILE_SHOWN), 'flex sm:hidden')}
          {moreTile(tiles.slice(DESKTOP_SHOWN), 'hidden sm:flex')}
        </div>
      )}
    </section>
  );
}

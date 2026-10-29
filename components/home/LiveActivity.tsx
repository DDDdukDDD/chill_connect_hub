'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, ChevronDown, Flag, MapPin, Tent, Trophy, Users } from 'lucide-react';
import type { LiveCounts, LiveItem, LiveKind } from '@/lib/social/liveActivity';
import { nameInitial } from '@/lib/displayName';
import { recall, remember } from '@/lib/clientMemory';

const POLL_MS = 30_000;
const TICK_MS = 4_500;

type LiveState = { items: LiveItem[]; counts: LiveCounts | null; isLoaded: boolean; freshIds: Set<string> };

// One fetch and one poll for every line on the page: the landing mounts two (phone and wide) and the member home
// a third, and each used to fetch and poll on its own (2026-10-29)
const listeners = new Set<(state: LiveState) => void>();
let shared: LiveState | null = null;
let seen: Set<string> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function publish(state: LiveState) {
  shared = state;
  listeners.forEach((listener) => listener(state));
}

function load() {
  fetch('/api/activity', { cache: 'no-store' })
    .then((response) => response.json())
    .then((result) => {
      if (!result?.success) return;
      const items: LiveItem[] = Array.isArray(result.items) ? result.items : [];
      // Lines that arrived since the last poll slide in; the first load shows everything at rest
      const freshIds = seen ? new Set(items.filter((i) => !seen!.has(i.id)).map((i) => i.id)) : new Set<string>();
      seen = new Set(items.map((i) => i.id));
      publish({ items, counts: result.counts ?? null, isLoaded: true, freshIds });
      remember('live-activity', { items, counts: result.counts ?? null, isLoaded: true, freshIds: new Set<string>() });
    })
    .catch((error) => {
      console.warn('Live activity:', error);
      publish({ ...(shared ?? { items: [], counts: null, freshIds: new Set<string>() }), isLoaded: true });
    });
}

/** "ตอนนี้ในชิลล์": named lines for members, last week's counts for visitors (the server decides which) */
export function useLiveActivity(): LiveState {
  const [state, setState] = useState<LiveState>(() => shared ?? recall<LiveState>('live-activity') ?? { items: [], counts: null, isLoaded: false, freshIds: new Set() });

  useEffect(() => {
    if (!shared) {
      shared = state;
      if (state.isLoaded) seen = new Set(state.items.map((i) => i.id));
    }
    listeners.add(setState);
    if (listeners.size === 1) {
      load();
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') load();
      }, POLL_MS);
    }
    return () => {
      listeners.delete(setState);
      if (listeners.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- joins the shared poll once; its state arrives through setState
  }, []);

  return state;
}

const VERB: Record<LiveKind, string> = {
  meetup_join: 'เข้าร่วมตี้',
  meetup_host: 'เปิดตี้ใหม่',
  quest_join: 'เริ่มชาเลนจ์',
  quest_finish: 'ทำชาเลนจ์สำเร็จ',
  moment: 'แชร์โมเมนต์ที่',
};

// Pillar colors (DESIGN_SYSTEM.md): meetups amber, challenges violet, places green, fairs slate blue, moments rose
const TARGET_STYLE = {
  community: { text: 'text-[#D04A1B]', chip: 'bg-[#FFF4EE] text-[#F26430]', Icon: Users },
  challenge: { text: 'text-[#6D28D9]', chip: 'bg-[#F5F3FF] text-[#7C3AED]', Icon: Flag },
  spot: { text: 'text-[#2D5A3C]', chip: 'bg-[#EBF3ED] text-[#4A7C59]', Icon: MapPin },
  fair: { text: 'text-[#1F3D5C]', chip: 'bg-[#EEF4FA] text-[#2B527A]', Icon: Tent },
  general: { text: 'text-[#E11D48]', chip: 'bg-[#FFF1F2] text-[#F43F5E]', Icon: Camera },
} as const;

export function liveHref(target: LiveItem['target']): string {
  if (!target.id) return '/moments';
  const id = encodeURIComponent(target.id);
  switch (target.type) {
    case 'community':
      return `/community/${id}`;
    case 'challenge':
      return `/challenges/${id}`;
    case 'spot':
      return `/spots/${id}`;
    case 'fair':
      return `/events/${id}`;
    default:
      return `/moments/${encodeURIComponent(id)}`;
  }
}

function Avatar({ name, src, className }: { name: string; src?: string; className: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`${className} rounded-full object-cover bg-slate-100 shrink-0`} />
  ) : (
    <span className={`${className} rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center shrink-0`} aria-hidden="true">
      {nameInitial(name)}
    </span>
  );
}

export function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-red-500">
      <span className="relative flex w-2 h-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 motion-safe:animate-ping" />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500" />
      </span>
      สด
    </span>
  );
}

/** Wide screens: a list in the right column */
export function LiveActivityList({ live }: { live: LiveState }) {
  if (!live.isLoaded) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }
  if (live.items.length === 0) return <p className="text-sm font-medium text-slate-500">ยังเงียบอยู่ ลองเป็นคนแรกที่ชวนเพื่อนออกไปกัน</p>;
  return (
    <ul className="divide-y divide-dashed divide-slate-200" aria-live="polite">
      {live.items.slice(0, 6).map((item) => {
        const style = TARGET_STYLE[item.target.type];
        return (
          <li key={item.id} className={live.freshIds.has(item.id) ? 'motion-safe:animate-slide-in' : undefined}>
            <Link href={liveHref(item.target)} className="group flex items-start gap-2.5 py-2.5">
              <Avatar name={item.person.name} src={item.person.avatar} className="w-8 h-8 text-xs" />
              <span className="min-w-0 flex-1 text-[13px] leading-snug text-slate-700">
                <strong className="font-semibold text-slate-900">{item.person.name}</strong> {VERB[item.kind]}{' '}
                <span className={`font-semibold ${style.text} group-hover:underline`}>{item.target.title}</span>
                <span className="block mt-0.5 text-[11px] font-medium text-slate-400">{item.timeAgo}</span>
              </span>
              <span className={`mt-1 w-6 h-6 rounded-full ${style.chip} flex items-center justify-center shrink-0`} aria-hidden="true">
                {item.kind === 'quest_finish' ? <Trophy className="w-3.5 h-3.5" /> : <style.Icon className="w-3.5 h-3.5" />}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * One line above the post box: the newest lines take turns every few seconds, and a tap opens the list.
 * Small on purpose, so the feed stays the main thing on the page.
 */
export function LiveTicker({ live }: { live: LiveState }) {
  const [turn, setTurn] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const count = Math.min(live.items.length, 6);
  useEffect(() => {
    if (count < 2 || isOpen) return;
    const timer = setInterval(() => setTurn((t) => t + 1), TICK_MS);
    return () => clearInterval(timer);
  }, [count, isOpen]);
  if (!live.isLoaded || count === 0) return null;
  const item = live.items[turn % count];
  const style = TARGET_STYLE[item.target.type];

  return (
    <section aria-label="ตอนนี้ในชิลล์" className="rounded-2xl bg-slate-50">
      <div className="flex items-center gap-2.5 h-11 pl-3 pr-1.5 min-w-0">
        <LiveDot />
        <Link key={item.id} href={liveHref(item.target)} className="min-w-0 flex-1 flex items-center gap-2 text-[13px] text-slate-700 motion-safe:animate-slide-in">
          <Avatar name={item.person.name} src={item.person.avatar} className="w-6 h-6 text-[10px]" />
          <span className="min-w-0 truncate">
            <strong className="font-semibold text-slate-900">{item.person.name}</strong> {VERB[item.kind]} <span className={`font-semibold ${style.text}`}>{item.target.title}</span>
            <span className="text-slate-400"> · {item.timeAgo}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="shrink-0 h-8 px-2.5 rounded-full text-xs font-medium text-slate-600 hover:bg-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
        >
          {isOpen ? 'ย่อ' : `ดูทั้งหมด ${count}`}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>
      {isOpen && (
        <div className="px-3 pb-1">
          <LiveActivityList live={live} />
        </div>
      )}
    </section>
  );
}

/** Visitors: one short line of last week's numbers, no names. Hidden while there is nothing to count. */
// Sample base added to the real counts so the landing page does not look empty during the prototype.
// Remove before launch (docs/LAUNCH_CHECKLIST.md).
const SAMPLE_COUNTS = { meetupJoins: 1147, questJoins: 343, moments: 525 };

function withSampleCounts<T extends typeof SAMPLE_COUNTS>(counts: T): T {
  return {
    ...counts,
    meetupJoins: counts.meetupJoins + SAMPLE_COUNTS.meetupJoins,
    questJoins: counts.questJoins + SAMPLE_COUNTS.questJoins,
    moments: counts.moments + SAMPLE_COUNTS.moments,
  };
}

/** Below this many real joins a week the hero shows a warm line instead of a number (owner 2026-10-26: no padded numbers) */
const HERO_JOINS_MIN = 1000;

/**
 * Visitor hero: one line, how many times people joined a meetup last week, from real joins only (no sample padding).
 * Under HERO_JOINS_MIN it says "เพื่อนๆ กำลังรอคุณอยู่". `faces` sits before the words; `short` is the sticker on phones.
 */
export function LiveJoinsLine({ faces, short = false }: { faces?: React.ReactNode; short?: boolean }) {
  const live = useLiveActivity();
  if (!live.counts) return null;
  const joins = live.counts.meetupJoins;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex w-2 h-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 motion-safe:animate-ping" />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500" />
      </span>
      {faces}
      {joins < HERO_JOINS_MIN ? (
        short ? 'เพื่อนๆ รอคุณอยู่' : 'เพื่อนๆ กำลังรอคุณอยู่'
      ) : (
        <>
          {short ? 'ไปตี้กันแล้ว' : 'สัปดาห์นี้ไปตี้กันแล้ว'} <strong className="font-semibold text-slate-900">{joins.toLocaleString()} ครั้ง</strong>
        </>
      )}
    </span>
  );
}

export function LiveCountsRow({ className = '' }: { className?: string }) {
  const live = useLiveActivity();
  if (!live.counts) return null;
  const counts = withSampleCounts(live.counts);
  const parts = [
    counts.meetupJoins > 0 && { Icon: Users, fg: 'text-[#F26430]', text: `เข้าร่วมตี้ ${counts.meetupJoins.toLocaleString()} ครั้ง` },
    counts.questJoins > 0 && { Icon: Flag, fg: 'text-[#7C3AED]', text: `เริ่มชาเลนจ์ ${counts.questJoins.toLocaleString()} คน` },
    counts.moments > 0 && { Icon: Camera, fg: 'text-[#F43F5E]', text: `แชร์โมเมนต์ ${counts.moments.toLocaleString()} ครั้ง` },
  ].filter((p): p is { Icon: typeof Users; fg: string; text: string } => Boolean(p));
  if (parts.length === 0) return null;

  return (
    <section aria-label="ตอนนี้ในชิลล์" className={`flex flex-wrap items-center justify-center ${className} gap-x-5 gap-y-2 text-[13px] sm:text-sm font-semibold text-slate-700`}>
      <span className="inline-flex items-center gap-2">
        <LiveDot />
        <span className="font-bold text-slate-900">สัปดาห์นี้ในชิลล์</span>
      </span>
      {parts.map(({ Icon, fg, text }) => (
        <span key={text} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Icon className={`w-4 h-4 ${fg}`} aria-hidden="true" />
          {text}
        </span>
      ))}
    </section>
  );
}

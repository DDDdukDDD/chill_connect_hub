'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import type { AchievementItem } from '@/lib/social/achievementsRow';
import { nameInitial } from '@/lib/displayName';
import { avatarImage } from '@/lib/optimizedImage';
import { recall, remember } from '@/lib/clientMemory';

const MEMORY_KEY = 'achievements-row';

/**
 * "เพื่อนๆ กำลังออกไปใช้ชีวิต" above the feed, in the place other apps give stories (owner 2026-11-10: no stories; show who
 * achieved what). A gold ring and a trophy for a finished challenge, a violet ring and "2/3" for a step on the way.
 * A blue ring and "ทำอยู่" for the reader's own challenge they took on but have not posted for yet.
 * A tap opens the post or the challenge. Nothing shows until someone has achieved something.
 */
export function AchievementsRow({ initial, onOpenMoment, lead }: { initial?: AchievementItem[]; /** Circles before the achievements: the reader's next plan (MemberLiveHome UpNextCircle) */ lead?: React.ReactNode; /** A circle that opens a post: the feed keeps its place, so that post's back link returns here */ onOpenMoment?: (momentId: string) => void }) {
  // From the server with the page (app/page.tsx), so the row never pops in above posts already on screen
  const [items, setItems] = useState<AchievementItem[]>(() => initial ?? recall<AchievementItem[]>(MEMORY_KEY) ?? []);
  useEffect(() => {
    if (initial) {
      remember(MEMORY_KEY, initial);
      return;
    }
    let active = true;
    fetch('/api/achievements', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!active || !Array.isArray(json?.items)) return;
        remember(MEMORY_KEY, json.items);
        setItems(json.items);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [initial]);
  // Computers have no swipe: ‹ › appear on the side that has more circles (owner 2026-11-13)
  const listRef = useRef<HTMLUListElement>(null);
  const [more, setMore] = useState({ left: false, right: false });
  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setMore({ left: list.scrollLeft > 4, right: list.scrollLeft + list.clientWidth < list.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, items.length, lead]);
  const page = (direction: 1 | -1) => listRef.current?.scrollBy({ left: direction * listRef.current.clientWidth * 0.8, behavior: 'smooth' });
  const arrow = 'hidden sm:flex absolute top-[30px] z-10 w-9 h-9 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-700 hover:bg-slate-50 cursor-pointer';

  if (items.length === 0 && !lead) return null;
  // At the very top of home (owner 2026-11-13): the circles speak for themselves, so the label is for screen readers only
  return (
    <section aria-labelledby="achievements-heading" className="relative mb-3">
      <h3 id="achievements-heading" className="sr-only">เพื่อนๆ กำลังออกไปใช้ชีวิต</h3>
      {more.left && (
        <button type="button" onClick={() => page(-1)} aria-label="เลื่อนดูก่อนหน้า" className={`${arrow} -left-3`}>
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
      {more.right && (
        <button type="button" onClick={() => page(1)} aria-label="เลื่อนดูต่อ" className={`${arrow} -right-3`}>
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
      {/* The row fades out at the side that has more (2026-11-14): a circle cut in half at the feed edge looked like a mistake */}
      <ul ref={listRef} onScroll={measure} style={fadeMask(more)} className="sm:[mask-image:var(--row-fade)] flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {lead}
        {items.map((item) => {
          const done = item.kind === 'finish';
          const doing = item.kind === 'doing';
          const name = item.isMe ? (doing ? item.quest.title : 'คุณ') : item.person.name;
          // My challenges show their own picture, so three of them read as three things to do, not my face three times
          const picture = doing ? item.quest.image || item.person.avatar : item.person.avatar;
          // The badge in words: "2/3" alone says nothing to someone new (owner 2026-11-13)
          const meaning = doing
            ? `คุณรับชาเลนจ์ ${item.quest.title} ไว้ ยังไม่ได้โพสต์`
            : done
              ? `${name} พิชิตชาเลนจ์ ${item.quest.title} ครบแล้ว · ${item.timeAgo}`
              : `${name} ทำชาเลนจ์ ${item.quest.title} ไปแล้ว ${item.current} จาก ${item.total} ขั้น · ${item.timeAgo}`;
          return (
            <li key={item.id} className="shrink-0 w-[80px]">
              <Link
                href={item.href}
                onClick={() => item.momentId && onOpenMoment?.(item.momentId)}
                aria-label={meaning}
                title={meaning}
                className="group flex flex-col items-center gap-1.5 rounded-2xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <span className={`relative rounded-full p-[3px] ${done ? 'bg-linear-to-tr from-[#F59E0B] via-[#FBBF24] to-[#FDE68A]' : doing ? 'bg-linear-to-tr from-[#2563EB] to-[#93C5FD]' : 'bg-linear-to-tr from-[#7C3AED] to-[#C4B5FD]'}`}>
                  <span className="block rounded-full bg-white p-[2px]">
                    {picture ? (
                      // eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers
                      <img src={avatarImage(picture)} alt="" className="w-16 h-16 rounded-full object-cover bg-slate-100 group-hover:brightness-95 transition-[filter]" />
                    ) : (
                      <span className="w-16 h-16 rounded-full bg-slate-200 text-lg font-bold text-slate-700 flex items-center justify-center">{nameInitial(item.person.name)}</span>
                    )}
                  </span>
                  <span
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full border-2 border-white text-[11px] font-bold tabular-nums whitespace-nowrap ${done ? 'bg-[#F59E0B] text-white' : doing ? 'bg-[#2563EB] text-white' : 'bg-[#7C3AED] text-white'}`}
                    aria-hidden="true"
                  >
                    {done ? <Trophy className="w-3 h-3" /> : doing ? 'ทำอยู่' : `${item.current}/${item.total}`}
                  </span>
                </span>
                <span className="w-full truncate text-center text-xs font-medium text-slate-700" aria-hidden="true">
                  {/* Under an 80px slot only the name before a bracket fits ("คุณปอนด์ (Pond)" → "คุณปอนด์"); the link's label keeps it whole */}
                  {name.replace(/\s*\(.*$/, '') || name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** One circle in the row's look, for what is not an achievement: the next plan, a ตี้ that asks for its moment */
export function RowCircle({ href, onClick, label, image, ring, badge, badgeClass, name, className = '' }: {
  href?: string;
  onClick?: () => void;
  label: string;
  image: string;
  /** Tailwind gradient classes for the ring */
  ring: string;
  badge: React.ReactNode;
  badgeClass: string;
  name: string;
  className?: string;
}) {
  const body = (
    <>
      <span className={`relative rounded-full p-[3px] bg-linear-to-tr ${ring}`}>
        <span className="block rounded-full bg-white p-[2px]">
          {/* eslint-disable-next-line @next/next/no-img-element -- event covers come from many hosts */}
          <img src={image} alt="" className="w-16 h-16 rounded-full object-cover bg-slate-100 group-hover:brightness-95 transition-[filter]" />
        </span>
        <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full border-2 border-white text-[11px] font-bold tabular-nums whitespace-nowrap ${badgeClass}`} aria-hidden="true">
          {badge}
        </span>
      </span>
      <span className="w-full truncate text-center text-xs font-medium text-slate-700" aria-hidden="true">{name}</span>
    </>
  );
  const look = 'group w-full flex flex-col items-center gap-1.5 rounded-2xl cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]';
  return (
    <li className={`shrink-0 w-[80px] ${className}`}>
      {href ? <Link href={href} aria-label={label} title={label} className={look}>{body}</Link> : <button type="button" onClick={onClick} aria-label={label} title={label} className={look}>{body}</button>}
    </li>
  );
}

/** Fades the row's edge on the side with more circles (computers); none when everything fits */
function fadeMask(more: { left: boolean; right: boolean }): React.CSSProperties | undefined {
  if (!more.left && !more.right) return undefined;
  const mask = `linear-gradient(to right, ${more.left ? 'transparent 0, #000 56px' : '#000 0'}, ${more.right ? '#000 calc(100% - 56px), transparent 100%' : '#000 100%'})`;
  // Only from sm (set in the class): phones run the row to the screen edge, where a half circle is the usual hint to swipe
  return { ["--row-fade" as string]: mask } as React.CSSProperties;
}

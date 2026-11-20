'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, LayoutGrid, Trophy, UserPlus } from 'lucide-react';
import { DialogShell } from '@/components/auth/DialogShell';
import { FollowRow } from '@/components/home/onboardingFirstStep';
import type { AchievementCircle, CircleItem } from '@/lib/social/circles';
import { nameInitial } from '@/lib/displayName';
import { avatarImage, safeImageSrc } from '@/lib/optimizedImage';
import ImgOr from '@/components/ImgOr';
import { recall, remember } from '@/lib/clientMemory';
import { CircleViewer } from '@/components/home/CircleViewer';
import { GroupRowCircle } from '@/components/home/GroupCircleView';
import { ChallengeRowCircle } from '@/components/home/ChallengeCircleView';
import { AllCirclesSheet } from '@/components/home/AllCirclesSheet';
import { ACHIEVEMENTS_ROW_MAX } from '@/lib/social/socialRules';
import { BADGE_MINE, NAME_MINE, RING_FRIENDS, RING_MINE } from '@/components/home/circleLook';

/** The reader's own Circle: first, never greyed (a type check only; lib/social/circles.ts is server code) */
export const isOwnCircle = (item: CircleItem): boolean => (item.kind === 'finish' || item.kind === 'step' || item.kind === 'doing') && item.isMe;

const MEMORY_KEY = 'circles';
const FIND_PEOPLE_KEY = 'circles-find-people';


/**
 * Circles (one is a Circle; owner 2026-11-16) above the feed, in the place other apps give stories (owner 2026-11-10: no stories; show who
 * achieved what). Rings: orange for mine, blue for friends (RING_MINE / RING_FRIENDS); the badge says a finish (gold
 * trophy), a step ("2/3") or my own challenge taken on but not posted for yet ("ทำอยู่").
 * A tap opens the Circle (CircleViewer, round A 2026-11-16): who did what, who else is doing it, and one button to do it
 * too. Nothing shows until someone has achieved something.
 */
export function Circles({ initial, initialFindPeople, onOpenMoment, onPost, lead, refreshKey = 0 }: {
  initial?: CircleItem[];
  /** The row ends with "หาเพื่อน" (the reader follows few people; GET /api/circles `findPeople`) */
  initialFindPeople?: boolean;
  /** Circles before the achievements: the reader's next plan (MemberLiveHome UpNextCircle) */
  lead?: React.ReactNode;
  /** A circle that opens a post: the feed keeps its place, so that post's back link returns here */
  onOpenMoment?: (momentId: string) => void;
  /** "โพสต์โมเมนต์" on my own Circle: the feed opens its posting form tied to that challenge */
  onPost?: (quest: { id: string; title: string; withPlace?: boolean }) => void;
  /** Goes up after the member posted: the row is asked again, so a new step shows */
  refreshKey?: number;
}) {
  // From the server with the page (app/page.tsx), so the row never pops in above posts already on screen
  const [items, setItems] = useState<CircleItem[]>(() => initial ?? recall<CircleItem[]>(MEMORY_KEY) ?? []);
  const [findPeople, setFindPeople] = useState<boolean>(() => initialFindPeople ?? recall<boolean>(FIND_PEOPLE_KEY) ?? false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const followedHere = useRef(false);
  const [openAt, setOpenAt] = useState<number | null>(null);
  // Circles opened on this device get a grey ring and move behind the new ones (owner 2026-11-18: no way to tell what
  // was new). The order is set when the row loads, never while the member taps through it. The member home is drawn in
  // the browser only (MemberLiveHome), so the device's memory can be read at once
  const [seen, setSeen] = useState<string[]>(readSeen);
  const [seenAtLoad, setSeenAtLoad] = useState<string[]>(readSeen);
  const ordered = useMemo(() => {
    const mine = items.filter(isOwnCircle);
    const others = items.filter((item) => !isOwnCircle(item));
    return [...mine, ...others.filter((item) => !seenAtLoad.includes(item.id)), ...others.filter((item) => seenAtLoad.includes(item.id))];
  }, [items, seenAtLoad]);
  const markSeen = useCallback((id: string) => setSeen((now) => (now.includes(id) ? now : rememberSeen(id))), []);
  // Asked again after something changed it: a join or a cheer in the viewer, or a post
  const [stale, setStale] = useState(0);
  const load = useCallback(() => {
    let active = true;
    fetch('/api/circles', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!active || !Array.isArray(json?.items)) return;
        remember(MEMORY_KEY, json.items);
        remember(FIND_PEOPLE_KEY, Boolean(json.findPeople));
        setItems(json.items);
        setFindPeople(Boolean(json.findPeople));
        setSeenAtLoad(readSeen());
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (initial && refreshKey === 0 && stale === 0) {
      remember(MEMORY_KEY, initial);
      remember(FIND_PEOPLE_KEY, Boolean(initialFindPeople));
      return;
    }
    return load();
  }, [initial, initialFindPeople, refreshKey, stale, load]);
  const open = (index: number) => setOpenAt(index);
  // Past ACHIEVEMENTS_ROW_MAX the row ends with "ดูทั้งหมด" (Circles at scale, owner 2026-11-18): a list of every Circle
  const [allOpen, setAllOpen] = useState(false);
  const shown = ordered.length > ACHIEVEMENTS_ROW_MAX ? ordered.slice(0, ACHIEVEMENTS_ROW_MAX) : ordered;
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

  if (items.length === 0 && !lead && !findPeople) return null;
  // At the very top of home (owner 2026-11-13): the circles speak for themselves, so the label is for screen readers only
  return (
    <section aria-labelledby="circles-heading" className="relative mb-3">
      <h3 id="circles-heading" className="sr-only">เพื่อนๆ กำลังออกไปใช้ชีวิต</h3>
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
        {shown.map((item, index) => {
          // A friend's Circle already opened on this device gets a grey ring; my own are things to do and never fade
          const faded = !isOwnCircle(item) && seen.includes(item.id);
          // A thin line between my own Circles and friends' (option A). The lead Circles (next plan, campaigns) are mine
          // too (TR-023), but `lead` may draw nothing: then this line is the list's first item and `first:hidden` drops it.
          // The lead Circles are phone-only (laptops show them beside the feed, MemberLiveHome), so the line after them is too
          const afterLead = index === 0 && Boolean(lead);
          const afterMine = index > 0 ? isOwnCircle(shown[index - 1]) : afterLead;
          const divider = afterMine && !isOwnCircle(item) ? (
            <li key={`divider-${item.id}`} aria-hidden="true" className={`shrink-0 self-start mt-[14px] w-px h-11 bg-slate-200 first:hidden ${afterLead ? 'lg:hidden' : ''}`} />
          ) : null;
          if (divider) return [divider, rowCircle(item, faded, () => open(index))];
          return rowCircle(item, faded, () => open(index));
        })}
        {shown.length < ordered.length && (
          <Circle
            onClick={() => setAllOpen(true)}
            label={`ดู Circles ทั้งหมด ${ordered.length} อัน`}
            ring="from-slate-300 to-slate-200"
            fallback={<LayoutGrid className="w-7 h-7 text-slate-600" aria-hidden="true" />}
            badge={`+${ordered.length - shown.length}`}
            badgeClass="bg-slate-700 text-white"
            name="ดูทั้งหมด"
          />
        )}
        {/* A reader following few people (owner 2026-11-18): people worth following, so the row fills with real friends */}
        {findPeople && (
          <Circle
            onClick={() => setPeopleOpen(true)}
            label="หาคนน่าติดตาม"
            ring="from-[#2563EB] to-[#93C5FD]"
            fallback={<UserPlus className="w-7 h-7 text-[#2563EB]" aria-hidden="true" />}
            badge={<UserPlus className="w-3 h-3" />}
            badgeClass="bg-[#2563EB] text-white"
            name="หาเพื่อน"
          />
        )}
      </ul>
      {peopleOpen && (
        <DialogShell
          onClose={() => {
            setPeopleOpen(false);
            // Someone followed: the row is asked again, so their Circles show
            if (followedHere.current) {
              followedHere.current = false;
              setStale((n) => n + 1);
            }
          }}
          title="เพื่อนๆ ที่น่าติดตาม"
          size="sm"
        >
          <p className="mb-4 text-sm text-slate-600">ติดตามแล้ว ชาเลนจ์และโมเมนต์ของเขาจะขึ้นใน Circles ของคุณ</p>
          <FollowRow layout="list" onFollowed={() => (followedHere.current = true)} emptyText="ยังไม่มีคนแนะนำตอนนี้ ลองดูโมเมนต์ในฟีดแล้วกดติดตามคนที่ชอบได้เลย" />
        </DialogShell>
      )}
      {allOpen && (
        <AllCirclesSheet
          items={ordered}
          render={(item, index) => {
            const faded = !isOwnCircle(item) && seen.includes(item.id);
            const pick = () => {
              setAllOpen(false);
              open(index);
            };
            if (item.kind === 'group') return <GroupRowCircle key={item.id} item={item} seen={faded} onOpen={pick} />;
            if (item.kind === 'challenge') return <ChallengeRowCircle key={item.id} item={item} seen={faded} onOpen={pick} />;
            return <AchievementRowCircle key={item.id} item={item} seen={faded} onOpen={pick} />;
          }}
          onClose={() => setAllOpen(false)}
        />
      )}
      {openAt !== null && ordered[openAt] && (
        <CircleViewer
          items={ordered}
          start={openAt}
          onSeen={markSeen}
          onClose={(changed) => {
            setOpenAt(null);
            if (changed) setStale((n) => n + 1);
          }}
          onOpenMoment={onOpenMoment}
          onPost={
            onPost &&
            ((quest) => {
              setOpenAt(null);
              onPost(quest);
            })
          }
        />
      )}
    </section>
  );
}

function rowCircle(item: CircleItem, faded: boolean, onOpen: () => void) {
  if (item.kind === 'group') return <GroupRowCircle key={item.id} item={item} seen={faded} onOpen={onOpen} />;
  if (item.kind === 'challenge') return <ChallengeRowCircle key={item.id} item={item} seen={faded} onOpen={onOpen} />;
  return <AchievementRowCircle key={item.id} item={item} seen={faded} onOpen={onOpen} />;
}

/** A person's Circle in the row: orange when it is mine, blue for a friend; the badge says finished (trophy), "2/3" or "ทำอยู่" */
function AchievementRowCircle({ item, seen: faded, onOpen }: { item: AchievementCircle; seen: boolean; onOpen: () => void }) {
    const done = item.kind === 'finish';
    const doing = item.kind === 'doing';
    // My own Circles show the challenge (picture and title) in every state, so "Road to ATM…" stays itself after its
    // first step instead of turning into "คุณ" (2026-11-18 walk); friends' Circles show the friend
    const name = item.isMe ? item.quest.title : item.person.name;
    const picture = item.isMe ? item.quest.image || item.person.avatar : item.person.avatar;
    // The badge in words: "2/3" alone says nothing to someone new (owner 2026-11-13)
    const meaning = doing
      ? `ชาเลนจ์ที่คุณทำอยู่: ${item.quest.title}`
      : done
        ? `${item.isMe ? 'คุณ' : name} พิชิตชาเลนจ์ ${item.quest.title} ครบแล้ว · ${item.timeAgo}`
        : `${item.isMe ? 'คุณ' : name} ทำชาเลนจ์ ${item.quest.title} ไปแล้ว ${item.current} จาก ${item.total} ขั้น · ${item.timeAgo}`;
    const ring = faded ? 'bg-slate-200' : `bg-linear-to-tr ${item.isMe ? RING_MINE : RING_FRIENDS}`;
    const badge = item.isMe ? BADGE_MINE : done ? 'bg-[#F59E0B] text-white' : 'bg-[#1D4ED8] text-white';
    // No picture, or a bad link: a trophy for my own challenge, the friend's initial otherwise
    const fallback = item.isMe ? (
      <span className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
        <Trophy className="w-7 h-7 text-[#C2410C]" aria-hidden="true" />
      </span>
    ) : (
      <span className="w-16 h-16 rounded-full bg-slate-200 text-lg font-bold text-slate-700 flex items-center justify-center">{nameInitial(item.person.name)}</span>
    );
    return (
      <li className="shrink-0 w-[80px]">
        <button
          type="button"
          onClick={onOpen}
          aria-label={meaning}
          title={meaning}
          className="group w-full flex flex-col items-center gap-1.5 rounded-2xl cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          <span className={`relative rounded-full p-[3px] ${ring}`}>
            <span className="block rounded-full bg-white p-[2px]">
              {/* A failed resized link tries the original file once (iPad after an Apple sign-up, 2026-11-18), then the fallback */}
              {picture ? <ImgOr key={picture} src={avatarImage(picture)} fallback={<ImgOr src={safeImageSrc(picture)} fallback={fallback} className="w-16 h-16 rounded-full object-cover bg-slate-100 group-hover:brightness-95 transition-[filter]" />} className="w-16 h-16 rounded-full object-cover bg-slate-100 group-hover:brightness-95 transition-[filter]" /> : fallback}
            </span>
            <span
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full border-2 border-white text-[11px] font-bold tabular-nums whitespace-nowrap ${badge}`}
              aria-hidden="true"
            >
              {done ? <Trophy className="w-3 h-3" /> : doing ? 'ทำอยู่' : `${item.current}/${item.total}`}
            </span>
          </span>
          {/* My own show the challenge's name on up to two lines (option A: "ป้ายยาที่โปรด…" was cut off); friends show the name */}
          <span className={`w-full text-center text-xs ${item.isMe ? `line-clamp-2 leading-tight ${NAME_MINE}` : `truncate font-medium ${faded ? 'text-slate-500' : 'text-slate-700'}`}`} aria-hidden="true">
            {/* Under an 80px slot only the name before a bracket fits ("คุณปอนด์ (Pond)" → "คุณปอนด์"); the link's label keeps it whole */}
            {name.replace(/\s*\(.*$/, '') || name}
          </span>
        </button>
      </li>
    );
}

// Circles opened on this device (ids), newest last; a per-device convenience, so a cleared browser just shows them fresh again
const SEEN_KEY = 'circles-seen';
function readSeen(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}
function rememberSeen(id: string): string[] {
  const ids = [...readSeen().filter((other) => other !== id), id].slice(-200);
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    // Private mode: the ring just stays coloured
  }
  return ids;
}

/** One circle in the row's look, for what is not an achievement: the next plan, a ตี้ that asks for its moment, a campaign */
export function Circle({ href, onClick, label, image, fallback, fit = 'cover', ring, badge, badgeClass, name, mine = false, className = '' }: {
  href?: string;
  onClick?: () => void;
  label: string;
  /** Empty: `fallback` is drawn instead */
  image?: string;
  fallback?: React.ReactNode;
  /** 'contain': the whole picture on a tinted circle (a prize photo), not cropped like a cover */
  fit?: 'cover' | 'contain';
  /** Tailwind gradient classes for the ring */
  ring: string;
  badge: React.ReactNode;
  badgeClass: string;
  name: string;
  /** One of mine (option A): the name in the orange of my own Circles */
  mine?: boolean;
  className?: string;
}) {
  const empty = <span className="w-16 h-16 rounded-full bg-[#FFF8DB] flex items-center justify-center group-hover:brightness-95 transition-[filter]">{fallback}</span>;
  const body = (
    <>
      <span className={`relative rounded-full p-[3px] bg-linear-to-tr ${ring}`}>
        <span className="block rounded-full bg-white p-[2px]">
          {image ? (
            <ImgOr src={image} fallback={empty} className={`w-16 h-16 rounded-full group-hover:brightness-95 transition-[filter] ${fit === 'contain' ? 'object-contain bg-[#FFF8DB] p-2' : 'object-cover bg-slate-100'}`} />
          ) : (
            empty
          )}
        </span>
        <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full border-2 border-white text-[11px] font-bold tabular-nums whitespace-nowrap ${badgeClass}`} aria-hidden="true">
          {badge}
        </span>
      </span>
      <span className={`w-full truncate text-center text-xs ${mine ? NAME_MINE : 'font-medium text-slate-700'}`} aria-hidden="true">{name}</span>
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

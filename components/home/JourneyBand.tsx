'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Heart, Plus, Zap } from 'lucide-react';
import type { ChallengeQuest, EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { formatEventDateRange, isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import type { QuestProgress } from '@/lib/useMyRewards';
import { activityActions } from '@/lib/useMyActivity';
import type { MarkedVisit } from '@/lib/social/visits';
import { EVIDENCE_HINTS, type QuestDetail } from '@/lib/questDisplay';
import { MOMENT_REACTED_EVENT, type ShareRequest } from '@/components/home/HomeMomentFeed';
import { nameInitial } from '@/lib/displayName';
import { DAY_MS, FALLBACK_IMAGE, Faces, awayLabel, dayLine, dayPart, endsAt, eventHref, startsAt, useGoingWith, useMinuteClock } from '@/components/home/planHelpers';

/**
 * The member journey on home: ① เลือกกิจกรรมที่ใช่ ② ออกไปใช้ชีวิต ③ แชร์โมเมนต์, the same three steps as the
 * landing hero and the end of onboarding. A cream band above the feed; it stays on home for good as the call to
 * go out (owner 2026-10-23: no ข้าม, it folds to one line instead).
 * The three steps are tabs (owner 2026-10-23): the band opens on the one that needs the member, and they can switch.
 * - ① picks across the four ways out (ตี้, ชาเลนจ์, ที่เที่ยว, งานแฟร์), three at a time, with "สุ่มใหม่".
 *   Places and fairs are planned here with "อยากไป" (saved); ตี้ and challenges are joined on their own page.
 * - ② the member's plans of every kind, soonest first, one at a time with ‹ ›; places and fairs are marked
 *   "ไปมาแล้ว" right here (POST /api/visits).
 * - ③ a moment for where they just went (a ตี้ that ended, a place or fair marked), else any moment.
 * A separate path for members who came for moments only (owner 2026-10-23): ① ติดตามเพื่อน ② กดใจ คอมเมนต์
 * ③ แชร์โมเมนต์แรก, in rose. It gives way to the tabs once they share a moment or plan something.
 */

export const JOURNEY_STEPS = ['เลือกกิจกรรมที่ใช่', 'ออกไปใช้ชีวิต', 'แชร์โมเมนต์'] as const;
export const MOMENT_STEPS = ['ติดตามเพื่อน', 'กดใจ คอมเมนต์', 'แชร์โมเมนต์แรก'] as const;

type Kind = 'meetup' | 'challenge' | 'place' | 'fair';
type Flavour = Kind | 'moments';
type Tab = 0 | 1 | 2;

export type Plan =
  | { kind: 'meetup'; key: string; at: number; event: EventItem; hosting: boolean }
  | { kind: 'challenge'; key: string; at: number; quest: ChallengeQuest; progress: QuestProgress }
  | { kind: 'fair'; key: string; at: number; event: EventItem }
  | { kind: 'place'; key: string; at: number; spot: LifestyleSpotItem };

/** Somewhere the member just went and has not shared yet */
export type ShareTarget =
  | { kind: 'meetup' | 'fair'; key: string; at: number; event: EventItem }
  | { kind: 'place'; key: string; at: number; spot: LifestyleSpotItem }
  | { kind: 'challenge'; key: string; at: number; quest: ChallengeQuest };

export type Journey =
  | { mode: 'loop'; plans: Plan[]; share: ShareTarget | null; open: Tab; soon: boolean }
  | { mode: 'moments'; step: 'follow'; following: number }
  | { mode: 'moments'; step: 'react' }
  | { mode: 'moments'; step: 'post' };

// Onboarding goals (app/onboarding/OnboardingFlow.tsx): "ทำชาเลนจ์สนุกๆ" asks for a challenge first; the meetup goals for a ตี้
const CHALLENGE_GOALS = ['earn_xp'];
const MEETUP_GOALS = ['find_friends', 'join_community'];
const SOCIAL_GOALS = ['share_moments', 'browse_moments'];
/** Only moment goals picked: the moments path on home and moments first on the onboarding summary */
export const isSocialOnly = (goals: string[]) => goals.length > 0 && goals.every((g) => SOCIAL_GOALS.includes(g));
/** People to follow before step ① counts as done (the member may move on after the first one) */
const FOLLOW_TARGET = 3;
/** Somewhere the member went this long ago still asks for its moment */
const SHARE_WINDOW_MS = 14 * DAY_MS;
/** Plans without a date (a challenge under way, a saved place) come after the dated ones, challenges first */
const UNDATED_CHALLENGE = Number.MAX_SAFE_INTEGER - 1;
const UNDATED_PLACE = Number.MAX_SAFE_INTEGER;

/** The first step the onboarding summary offered (app/onboarding/OnboardingFlow.tsx): step ① shows it first */
export interface FirstStep {
  pillar: 'community' | 'challenges';
  id: string;
  reason?: string;
  /** The ตี้ itself, in case it is not among the band's own picks */
  event?: EventItem;
}
export const FIRST_STEP_KEY = (memberId: string) => `cch_first_step_${memberId}`;

function readFirstStep(memberId: string | null): FirstStep | null {
  if (!memberId || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FIRST_STEP_KEY(memberId));
    return raw ? (JSON.parse(raw) as FirstStep) : null;
  } catch {
    return null;
  }
}
const followDoneKey = (memberId: string) => `cch_journey_follow_done_${memberId}`;
/** Folded to one line; holds what the band showed then, so something new opens it again */
const foldKey = (memberId: string) => `cch_journey_folded_${memberId}`;

/** A fair is over after its last day */
const fairOver = (event: EventItem, now: number) =>
  event.status === 'ended' || parseEventEndDateToTimestamp(event.endDate || event.date) + DAY_MS <= now;

interface JourneyInput {
  memberId: string | null;
  /** The member picked only moment goals in onboarding */
  socialOnly: boolean;
  now: number;
  /** Meetups and fairs the member joined or hosts, ended ones included */
  mine: EventItem[];
  hostedIds: string[];
  questProgress: QuestProgress[];
  allQuests: ChallengeQuest[];
  /** Saved places and events ("อยากไป"), looked up in every place and event */
  savedSpotIds: string[];
  savedEventIds: string[];
  allSpots: LifestyleSpotItem[];
  allEvents: EventItem[];
  isLoaded: boolean;
}

/** The member's plans and what to share; `journey` is null only until the member's data has loaded */
export function useJourney({ memberId, socialOnly, now, mine, hostedIds, questProgress, allQuests, savedSpotIds, savedEventIds, allSpots, allEvents, isLoaded }: JourneyInput) {
  const [momentCount, setMomentCount] = useState<number | null>(null);
  // When the newest moment was posted: somewhere visited before it no longer asks for one
  const [lastMomentAt, setLastMomentAt] = useState(0);
  // Places and fairs marked "ไปมาแล้ว"; null until loaded
  const [marks, setMarks] = useState<MarkedVisit[] | null>(null);
  // Moments path only: people followed and a first like or comment; null until loaded
  const [social, setSocial] = useState<{ following: number; reacted: boolean; followDone: boolean } | null>(null);

  useEffect(() => {
    if (!memberId) return;
    let alive = true;
    fetch('/api/moments?tab=mine&limit=1', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!alive) return;
        setMomentCount(Number(json?.pagination?.totalCount ?? 0));
        setLastMomentAt(Date.parse(json?.moments?.[0]?.createdAt ?? '') || 0);
      })
      .catch(() => alive && setMomentCount(0));
    fetch('/api/visits?mine=1', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => alive && setMarks(Array.isArray(json?.marks) ? json.marks : []))
      .catch(() => alive && setMarks([]));
    return () => {
      alive = false;
    };
  }, [memberId]);

  useEffect(() => {
    if (!memberId || !socialOnly) return;
    let alive = true;
    let followDone = false;
    try {
      followDone = localStorage.getItem(followDoneKey(memberId)) === '1';
    } catch {}
    fetch('/api/moments/journey', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => alive && setSocial({ following: Number(json?.following ?? 0), reacted: Boolean(json?.reacted), followDone }))
      .catch(() => alive && setSocial({ following: 0, reacted: false, followDone }));
    // A like or comment in the feed below moves step ② on without a reload
    const onReacted = () => setSocial((s) => (s ? { ...s, reacted: true } : s));
    window.addEventListener(MOMENT_REACTED_EVENT, onReacted);
    return () => {
      alive = false;
      window.removeEventListener(MOMENT_REACTED_EVENT, onReacted);
    };
  }, [memberId, socialOnly]);

  const followed = useCallback(() => setSocial((s) => (s ? { ...s, following: s.following + 1 } : s)), []);
  const finishFollow = useCallback(() => {
    setSocial((s) => (s ? { ...s, followDone: true } : s));
    try {
      if (memberId) localStorage.setItem(followDoneKey(memberId), '1');
    } catch {}
  }, [memberId]);
  const markPosted = useCallback(() => {
    setMomentCount((count) => (count ?? 0) + 1);
    setLastMomentAt(Date.now());
  }, []);

  /** "ไปมาแล้ว" for a place or a fair; returns the reason when it fails */
  const markVisited = useCallback(async (targetType: 'spot' | 'fair', targetId: string): Promise<string | null> => {
    const res = await fetch('/api/visits', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark', targetType, targetId }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (!res?.ok) return json?.message || 'บันทึกไม่สำเร็จ ลองอีกครั้งนะ';
    setMarks((list) => [...(list ?? []), { id: `local-${targetId}`, memberId: memberId ?? '', targetType, targetId, createdAt: new Date().toISOString() }]);
    return null;
  }, [memberId]);

  const journey = useMemo<Journey | null>(() => {
    if (marks === null) return null;
    const hasPosted = (momentCount ?? 0) > 0;
    const meetups = mine.filter((e) => (e.eventType || 'community') === 'community');
    // Over once its end time has passed ("06:30 - 08:00"), not only at the end of the day
    const isOver = (e: EventItem) => isEventEnded(e) || endsAt(e) <= now;
    const marked = new Set(marks.map((m) => `${m.targetType}:${m.targetId}`));
    const questOf = (id: string) => allQuests.find((q) => q.id === id);
    const running = questProgress.filter((q) => q.joined && !q.completed && questOf(q.questId));

    const plans: Plan[] = [
      ...meetups.filter((e) => !isOver(e)).map((event): Plan => ({ kind: 'meetup', key: `meetup:${event.id}`, at: startsAt(event), event, hosting: hostedIds.includes(event.id) })),
      ...allEvents
        .filter((e) => e.eventType === 'public_venue' && savedEventIds.includes(e.id) && !fairOver(e, now) && !marked.has(`fair:${e.id}`))
        .map((event): Plan => ({ kind: 'fair', key: `fair:${event.id}`, at: startsAt(event), event })),
      ...running.map((progress): Plan => ({ kind: 'challenge', key: `challenge:${progress.questId}`, at: UNDATED_CHALLENGE, quest: questOf(progress.questId)!, progress })),
      ...allSpots
        .filter((s) => savedSpotIds.includes(s.id) && !marked.has(`spot:${s.id}`))
        .map((spot): Plan => ({ kind: 'place', key: `place:${spot.id}`, at: UNDATED_PLACE, spot })),
    ].sort((a, b) => a.at - b.at);

    const fresh = (at: number) => now - at < SHARE_WINDOW_MS && at > lastMomentAt;
    const shares: ShareTarget[] = [
      ...meetups.filter((e) => isOver(e) && fresh(endsAt(e))).map((event): ShareTarget => ({ kind: 'meetup', key: `meetup:${event.id}`, at: endsAt(event), event })),
      ...marks.flatMap((m): ShareTarget[] => {
        const at = Date.parse(m.createdAt);
        if (!fresh(at)) return [];
        if (m.targetType === 'spot') {
          const spot = allSpots.find((s) => s.id === m.targetId);
          return spot ? [{ kind: 'place', key: `place:${spot.id}`, at, spot }] : [];
        }
        const event = allEvents.find((e) => e.id === m.targetId);
        return event ? [{ kind: 'fair', key: `fair:${event.id}`, at, event }] : [];
      }),
    ].sort((a, b) => b.at - a.at);
    // A challenge visit asks for a moment only until the first one is shared
    const visited = hasPosted ? undefined : running.find((q) => q.current > 0);
    const share = shares[0] ?? (visited ? { kind: 'challenge' as const, key: `challenge:${visited.questId}`, at: 0, quest: questOf(visited.questId)! } : null);

    // Moments path, until the member shares a first moment or plans something
    if (socialOnly && social && !hasPosted && plans.length === 0 && !share) {
      if (social.following < FOLLOW_TARGET && !social.followDone) return { mode: 'moments', step: 'follow', following: social.following };
      return social.reacted ? { mode: 'moments', step: 'post' } : { mode: 'moments', step: 'react' };
    }

    // Something within a day comes first; then a moment for where they went; then what is coming up; else pick
    const soon = Boolean(plans[0] && (plans[0].kind === 'meetup' || plans[0].kind === 'fair') && plans[0].at - now < DAY_MS);
    const open: Tab = soon ? 1 : share ? 2 : plans.length > 0 ? 1 : 0;
    return { mode: 'loop', plans, share, open, soon };
  }, [marks, momentCount, lastMomentAt, mine, hostedIds, questProgress, allQuests, savedSpotIds, savedEventIds, allSpots, allEvents, now, socialOnly, social]);

  const isReady = isLoaded && momentCount !== null && marks !== null && (!socialOnly || social !== null);
  // Been out before (joined something, marked a place or fair, or shared a moment): step ① stops saying "แรก"
  const returning = (momentCount ?? 0) > 0 || mine.length > 0 || (marks?.length ?? 0) > 0 || questProgress.some((q) => q.joined);
  return { journey: isReady ? journey : null, isReady, returning, markPosted, markVisited, followed, finishFollow };
}

/** The tab shown first at step ①: a challenge when the member chose challenges and no meetup goal, else a ตี้ */
export function flavourFromGoals(goals: string[]): 'meetup' | 'challenge' {
  const challenge = goals.some((g) => CHALLENGE_GOALS.includes(g));
  const meetup = goals.some((g) => MEETUP_GOALS.includes(g));
  return challenge && !meetup ? 'challenge' : 'meetup';
}

const KIND_LABEL: Record<Kind, string> = { meetup: 'ตี้', challenge: 'ชาเลนจ์', place: 'ที่เที่ยว', fair: 'งานแฟร์' };
const KINDS: Kind[] = ['meetup', 'challenge', 'place', 'fair'];
const ACCENT: Record<Flavour, { bar: string; text: string }> = {
  meetup: { bar: 'bg-[#F26430]', text: 'text-[#D04A1B]' },
  challenge: { bar: 'bg-[#7C3AED]', text: 'text-[#6D28D9]' },
  place: { bar: 'bg-[#2D5A3C]', text: 'text-[#2D5A3C]' },
  fair: { bar: 'bg-[#2B527A]', text: 'text-[#2B527A]' },
  moments: { bar: 'bg-[#F43F5E]', text: 'text-[#E11D48]' },
};
const RING: Record<Flavour, string> = {
  meetup: 'ring-[#F26430] text-[#D04A1B]',
  challenge: 'ring-[#7C3AED] text-[#6D28D9]',
  place: 'ring-[#2D5A3C] text-[#2D5A3C]',
  fair: 'ring-[#2B527A] text-[#2B527A]',
  moments: 'ring-[#F43F5E] text-[#E11D48]',
};
const TILTS = ['-rotate-2', 'rotate-[1.5deg]', '-rotate-1'];
const PRINT = 'block w-full object-cover rounded-2xl border-[3px] border-white bg-slate-100 shadow-[0_6px_14px_rgba(15,23,42,0.14)]';
const STICKER = 'absolute whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-900 shadow-[0_3px_10px_rgba(15,23,42,0.14)]';
const DARK_BUTTON = 'inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold whitespace-nowrap cursor-pointer disabled:opacity-60';
const LIGHT_BUTTON = 'inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold whitespace-nowrap cursor-pointer';
// Test-login meetups carry a "[ตัวอย่าง]" tag in the title; the band shows the title alone (as MeetupTile does)
const cleanTitle = (title: string) => title.replace(/^\[ตัวอย่าง\]\s*/, '');

const ROSE_BUTTON = 'inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#F43F5E] hover:bg-[#E11D48] text-white text-sm font-semibold shadow-[0_6px_16px_rgba(244,63,94,0.25)] whitespace-nowrap cursor-pointer';
/** The one headline of a step: the ตี้, the place, or the ask */
const HEADLINE = 'block text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2';
/** The photo beside a step's words */
const PHOTO_BOX = 'relative w-[104px] sm:w-[128px] shrink-0 -rotate-3';
const shortDate = (text: string) => text.replace(/\s*\d{4}$/, '');
/** "เปิด 08:00-17:00", without doubling a "เปิดทุกวัน …" that already says it */
const openLine = (hours: string) => (/^\s*เปิด/.test(hours) ? hours.trim() : `เปิด ${hours}`);

/** The steps; on the loop they are tabs. `marks` puts a tick or a dot on a step that has something waiting */
function Tracker({ at, flavour, vertical = false, onSelect, marks }: {
  at: number; flavour: Flavour; vertical?: boolean; onSelect?: (tab: Tab) => void; marks?: ('done' | 'dot' | null)[];
}) {
  // The step names follow the path: the loop has tabs (onSelect), the moments-only path does not
  const steps = !onSelect && flavour === 'moments' ? MOMENT_STEPS : JOURNEY_STEPS;
  const item = (label: string, i: number, body: React.ReactNode, className: string) =>
    onSelect ? (
      <button type="button" onClick={() => onSelect(i as Tab)} aria-pressed={i === at} className={`${className} text-left cursor-pointer hover:text-slate-900`}>{body}</button>
    ) : (
      <span className={className}>{body}</span>
    );
  // The narrow left column (wide screens) lists the steps down, like a short checklist
  if (vertical) {
    return (
      <ol className="flex flex-col gap-0.5" aria-label="เส้นทางของคุณ">
        {steps.map((label, i) => {
          const here = i === at;
          const mark = marks?.[i] ?? (onSelect ? null : i < at ? 'done' : null);
          const ring = here && i === 2 ? RING.moments : RING[flavour];
          return (
            <li key={label} aria-current={here ? 'step' : undefined}>
              {item(label, i, (
                <>
                  <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold ${
                    here ? `bg-white ring-2 ${ring}` : mark === 'done' ? `${ACCENT[flavour].bar} text-white` : 'bg-[#F1E4D6] text-slate-500'
                  }`}>
                    {mark === 'done' && !here ? <Check className="w-3 h-3" strokeWidth={3} aria-label="เสร็จแล้ว" /> : i + 1}
                  </span>
                  {label}
                  {mark === 'dot' && !here && <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]" aria-label="มีเรื่องรออยู่" />}
                </>
              ), `flex items-center gap-2.5 py-0.5 text-[13px] ${here ? 'font-semibold text-slate-900' : 'text-slate-600'}`)}
            </li>
          );
        })}
      </ol>
    );
  }
  return (
    <ol className="grid grid-cols-3 gap-1.5 sm:gap-2" aria-label="เส้นทางของคุณ">
      {steps.map((label, i) => {
        const here = i === at;
        const mark = marks?.[i] ?? (onSelect ? null : i < at ? 'done' : null);
        const bar = here ? (i === 2 ? 'bg-[#F43F5E]' : ACCENT[flavour].bar) : mark === 'done' ? `${ACCENT[flavour].bar} opacity-40` : 'bg-[#F1E4D6]';
        return (
          <li key={label} className="min-w-0" aria-current={here ? 'step' : undefined}>
            {item(label, i, (
              <>
                <span className={`block h-[5px] rounded-full ${bar}`} aria-hidden="true" />
                <span className={`mt-1.5 flex items-start gap-1 text-xs leading-snug ${here ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                  {mark === 'done' && !here ? <Check className={`w-3 h-3 mt-0.5 shrink-0 ${ACCENT[flavour].text}`} strokeWidth={3} aria-label="เสร็จแล้ว" /> : <span aria-hidden="true">{i + 1}</span>}
                  <span className="min-w-0">{label}</span>
                  {mark === 'dot' && !here && <span className="mt-1 w-1.5 h-1.5 shrink-0 rounded-full bg-[#F43F5E]" aria-label="มีเรื่องรออยู่" />}
                </span>
              </>
            ), 'block w-full')}
          </li>
        );
      })}
    </ol>
  );
}

/** Picks shown at once: three on phones and iPads, five from laptops up, where the band is wider (the rest hide by CSS) */
const PICK_COUNT = 5;
const PICK_SHOWN = ['', '', '', 'hidden lg:block', 'hidden lg:block'];

/** A tilted photo card for the picks: a sideways row on phones, three to five across from iPad up. `action` sits under it. */
function Print({ href, image, alt, index, sticker, when, whenClass, title, meta, action }: {
  href: string; image: string; alt: string; index: number; sticker?: string; when: string; whenClass: string; title: string; meta?: string; action?: React.ReactNode;
}) {
  return (
    <div className={`w-[140px] sm:w-auto shrink-0 ${PICK_SHOWN[index] ?? 'hidden'} ${TILTS[index % TILTS.length]} hover:rotate-0 transition-transform`}>
      <Link href={href} className="group block">
        <span className="relative block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={alt} loading="lazy" className={`${PRINT} aspect-[16/9] lg:aspect-[2/1] xl:aspect-[16/9]`} />
          {sticker && <span className="absolute -top-2 -right-1.5 rotate-6 rounded-full bg-[#7C3AED] px-2 py-0.5 text-[11px] font-semibold text-white">{sticker}</span>}
        </span>
        <span className={`block mt-1.5 text-[11px] font-semibold truncate ${whenClass}`}>{when}</span>
        <span className="block mt-0.5 text-[13px] font-semibold text-slate-900 leading-snug truncate group-hover:underline">{title}</span>
        {meta && <span className="block mt-0.5 text-xs text-slate-500 truncate">{meta}</span>}
      </Link>
      {action}
    </div>
  );
}

/** A few of a list, and a fresh few on "สุ่มใหม่" that the member has not seen yet (round again once all are seen) */
function useShuffled<T extends { id: string }>(pool: T[]) {
  const [shown, setShown] = useState<string[] | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const current = useMemo(() => {
    const byId = new Map(pool.map((x) => [x.id, x]));
    const list = (shown ?? []).map((id) => byId.get(id)).filter((x): x is T => Boolean(x));
    return list.length > 0 ? list : pool.slice(0, PICK_COUNT);
  }, [pool, shown]);
  const shuffle = () => {
    const now = current.map((x) => x.id);
    const seenNow = [...new Set([...seen, ...now])];
    let fresh = pool.filter((x) => !seenNow.includes(x.id));
    let nextSeen = seenNow;
    if (fresh.length < 3) {
      fresh = pool.filter((x) => !now.includes(x.id));
      nextSeen = [];
    }
    const picked = [...fresh].sort(() => Math.random() - 0.5).slice(0, PICK_COUNT);
    setSeen(nextSeen);
    setShown(picked.map((x) => x.id));
  };
  return { current, shuffle, canShuffle: pool.length > 3 };
}

/** Pips on a 3×3 grid (0 top left … 8 bottom right) for each face */
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
/** Where each face sits on the cube, and the turn [x, y] that brings it to the front */
const FACES: { face: number; place: string; show: [number, number] }[] = [
  { face: 1, place: 'rotateY(0deg)', show: [0, 0] },
  { face: 2, place: 'rotateY(90deg)', show: [0, -90] },
  { face: 3, place: 'rotateX(90deg)', show: [-90, 0] },
  { face: 4, place: 'rotateX(-90deg)', show: [90, 0] },
  { face: 5, place: 'rotateY(-90deg)', show: [0, 90] },
  { face: 6, place: 'rotateY(180deg)', show: [0, 180] },
];
const DIE = 26;
const CONFETTI = ['#F26430', '#7C3AED', '#2D5A3C', '#F43F5E', '#2563EB', '#F59E0B'];

/**
 * "สุ่มเลย!" as a tilted yellow sticker with a 3D die sitting on its edge (owner 2026-10-24: fun and creative).
 * A roll makes the die hop and tumble onto a new face, its shadow shrinking under it, and throws a pinch of confetti.
 */
function DiceButton({ onRoll, tone }: { onRoll: () => void; tone: string }) {
  const [roll, setRoll] = useState({ count: 0, at: 4 });
  const hop = useRef<HTMLSpanElement>(null);
  const shadow = useRef<HTMLSpanElement>(null);
  const burst = useRef<HTMLSpanElement>(null);
  const [x, y] = FACES[roll.at].show;
  const spin = roll.count * 360;

  const throwDie = () => {
    setRoll((r) => ({ count: r.count + 1, at: (r.at + 1 + Math.floor(Math.random() * 5)) % 6 }));
    onRoll();
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timing = { duration: 650, easing: 'cubic-bezier(.3,.7,.4,1)' };
    hop.current?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-16px)', offset: 0.4 }, { transform: 'translateY(0)', offset: 0.75 }, { transform: 'translateY(-3px)', offset: 0.88 }, { transform: 'translateY(0)' }], timing);
    shadow.current?.animate([{ transform: 'scale(1)', opacity: 0.35 }, { transform: 'scale(0.45)', opacity: 0.12, offset: 0.4 }, { transform: 'scale(1)', opacity: 0.35, offset: 0.75 }, { transform: 'scale(1)', opacity: 0.35 }], timing);
    Array.from(burst.current?.children ?? []).forEach((dot, i) => {
      const angle = (-150 + i * 24 + Math.random() * 14) * (Math.PI / 180);
      const far = 18 + Math.random() * 12;
      (dot as HTMLElement).animate(
        [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(angle) * far}px,${Math.sin(angle) * far}px) scale(0.4)`, opacity: 0 }],
        { duration: 600, delay: 120, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' }
      );
    });
  };

  return (
    <button type="button" onClick={throwDie} aria-label="สุ่มกิจกรรมใหม่"
      className="group relative shrink-0 inline-flex items-center h-8 pl-7 pr-3.5 -rotate-3 hover:rotate-2 rounded-full bg-[#FDE047] border-2 border-slate-900 shadow-[2px_3px_0_#0F172A] active:translate-x-[2px] active:translate-y-[3px] active:shadow-none text-[13px] font-bold text-slate-900 cursor-pointer transition-transform">
      {/* The die sits on the sticker's left edge, half off it */}
      <span className="absolute -left-3 top-1/2 -translate-y-1/2" aria-hidden="true" style={{ width: DIE, height: DIE }}>
        <span ref={shadow} className="absolute left-1/2 -bottom-1.5 -ml-2.5 w-5 h-1.5 rounded-full bg-slate-900 opacity-35" />
        <span ref={burst} className="absolute left-1/2 top-1/2">
          {CONFETTI.map((color) => <span key={color} className="absolute -ml-[3px] -mt-[3px] w-1.5 h-1.5 rounded-[2px] opacity-0" style={{ background: color }} />)}
        </span>
        <span ref={hop} className="block [perspective:220px]">
          {/* Tilted so three faces show; leans further on hover */}
          <span className="block [transform-style:preserve-3d] [transform:rotateX(-22deg)_rotateY(-30deg)] group-hover:[transform:rotateX(-30deg)_rotateY(-48deg)] transition-transform duration-300" style={{ width: DIE, height: DIE }}>
            <span className="relative block [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(.2,.9,.25,1.15)]"
              style={{ width: DIE, height: DIE, transform: `rotateX(${x + spin}deg) rotateY(${y + spin}deg)` }}>
              {FACES.map(({ face, place }) => (
                <span key={face} className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-[4px] rounded-[7px] bg-white border-2 border-slate-900 [backface-visibility:hidden]"
                  style={{ transform: `${place} translateZ(${DIE / 2}px)` }}>
                  {Array.from({ length: 9 }, (_, i) => (
                    <span key={i} className="flex items-center justify-center">
                      {PIPS[face].includes(i) && <span className={`rounded-full ${face === 1 ? 'w-2 h-2 bg-[#E11D48]' : `w-[5px] h-[5px] ${tone}`}`} />}
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </span>
        </span>
      </span>
      สุ่มเลย!
    </button>
  );
}

const ALL_HREF: Record<Kind, string> = { meetup: '/community?seats=open', challenge: '/challenges', place: '/spots', fair: '/events' };

function Picks({ kind, setKind, meetups, reasons, quests, spots, fairs, returning, onWant }: {
  kind: Kind; setKind: (k: Kind) => void; meetups: EventItem[]; reasons: Record<string, string>; quests: ChallengeQuest[];
  spots: LifestyleSpotItem[]; fairs: EventItem[]; returning: boolean; onWant: (kind: 'place' | 'fair', id: string) => Promise<void>;
}) {
  const meetupPicks = useShuffled(meetups);
  const questPicks = useShuffled(quests);
  const spotPicks = useShuffled(spots);
  const fairPicks = useShuffled(fairs);
  const picks = { meetup: meetupPicks, challenge: questPicks, place: spotPicks, fair: fairPicks }[kind];
  const [busy, setBusy] = useState<string | null>(null);
  const want = (k: 'place' | 'fair', id: string, title: string) => (
    <button type="button" disabled={busy === id} onClick={async () => { setBusy(id); await onWant(k, id); setBusy(null); }}
      aria-label={`อยากไป ${title}`}
      className="mt-1.5 inline-flex items-center gap-1 h-7 px-3 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-900 cursor-pointer disabled:opacity-60">
      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
      อยากไป
    </button>
  );
  const empty = { meetup: 'ตอนนี้ยังไม่มีตี้ที่เปิดรับ ลองดูทั้งหมด หรือเปิดตี้เองเลย', challenge: 'ตอนนี้ยังไม่มีชาเลนจ์ที่เปิดอยู่', place: 'ยังไม่มีที่เที่ยวให้แนะนำตอนนี้', fair: 'ช่วงนี้ยังไม่มีงานที่กำลังจะมา' }[kind];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 flex items-center gap-5">
          <h2 className="min-w-0 text-base sm:text-lg font-bold text-slate-900 truncate">{returning ? 'อยากไปไหนต่อดี?' : 'เลือกกิจกรรมแรกของคุณ'}</h2>
          {picks.canShuffle && <DiceButton onRoll={picks.shuffle} tone={ACCENT[kind].bar} />}
        </span>
        <Link href={ALL_HREF[kind]} className={`shrink-0 text-[13px] font-semibold hover:underline whitespace-nowrap ${ACCENT[kind].text}`}>ดูทั้งหมด →</Link>
      </div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="เลือกแบบไหน">
        {KINDS.map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}
            className={`h-8 px-3.5 shrink-0 rounded-full text-[13px] cursor-pointer transition-colors ${kind === k ? 'bg-slate-900 text-white font-semibold' : 'bg-white text-slate-600 font-medium hover:text-slate-900'}`}>
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 items-start gap-4 overflow-x-auto sm:overflow-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pt-1 pb-1">
        {kind === 'meetup' && meetupPicks.current.map((event, i) => (
          <Print key={event.id} href={eventHref(event)} image={event.image || FALLBACK_IMAGE} alt={cleanTitle(event.title)} index={i}
            when={dayLine(event)} whenClass={ACCENT.meetup.text} title={cleanTitle(event.title)}
            meta={reasons[event.id] ?? `เหลือ ${Math.max(0, event.maxParticipants - event.participantsCount)} ที่`} />
        ))}
        {kind === 'challenge' && questPicks.current.map((quest, i) => (
          <Print key={quest.id} href={`/challenges/${encodeURIComponent(quest.id)}`} image={quest.image || quest.badgeCoverImg || FALLBACK_IMAGE} alt={quest.title} index={i}
            sticker={quest.rewardPoints ? `+${quest.rewardPoints} XP` : undefined}
            when={quest.startsInDays && quest.startsInDays > 0 ? `เริ่มอีก ${quest.startsInDays} วัน` : quest.daysRemaining !== undefined ? `เหลือ ${quest.daysRemaining} วัน` : 'เปิดอยู่'}
            whenClass={ACCENT.challenge.text} title={quest.title}
            meta={quest.participantsCount ? `กำลังทำ ${quest.participantsCount.toLocaleString()} คน` : undefined} />
        ))}
        {kind === 'place' && spotPicks.current.map((spot, i) => (
          <Print key={spot.id} href={`/spots/${encodeURIComponent(spot.id)}`} image={spot.image || FALLBACK_IMAGE} alt={spot.title} index={i}
            when={spot.province} whenClass={ACCENT.place.text} title={spot.title} meta={spot.openHours ? openLine(spot.openHours) : undefined}
            action={want('place', spot.id, spot.title)} />
        ))}
        {kind === 'fair' && fairPicks.current.map((event, i) => (
          <Print key={event.id} href={eventHref(event)} image={event.image || FALLBACK_IMAGE} alt={cleanTitle(event.title)} index={i}
            when={shortDate(formatEventDateRange(event))} whenClass={ACCENT.fair.text} title={cleanTitle(event.title)} meta={event.location}
            action={want('fair', event.id, event.title)} />
        ))}
        {picks.current.length === 0 && <p className="col-span-full text-sm text-slate-600">{empty}</p>}
      </div>
    </div>
  );
}

/** ‹ 1/3 › under a plan, when there is more than one */
function Pager({ index, count, onMove }: { index: number; count: number; onMove: (index: number) => void }) {
  if (count < 2) return null;
  const arrow = 'w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:bg-white cursor-pointer disabled:opacity-30 disabled:cursor-default';
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-600 tabular-nums">
      <button type="button" className={arrow} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="แผนก่อนหน้า"><ChevronLeft className="w-4 h-4" /></button>
      {index + 1}/{count}
      <button type="button" className={arrow} disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="แผนถัดไป"><ChevronRight className="w-4 h-4" /></button>
    </span>
  );
}

/** The photo, the words and the buttons of one plan or ask; every step uses it, so the band keeps one shape */
function Step({ photo, photoHref, sticker, kicker, kickerClass, title, titleHref, sub, children }: {
  photo: React.ReactNode | string; photoHref?: string; sticker?: string; kicker: React.ReactNode; kickerClass: string;
  title: string; titleHref?: string; sub?: React.ReactNode; children: React.ReactNode;
}) {
  const picture = (
    <>
      {typeof photo === 'string' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className={`${PRINT} aspect-square`} />
      ) : photo}
      {sticker && <span className={`${STICKER} left-1/2 -bottom-2.5 -translate-x-1/2 rotate-2`}>{sticker}</span>}
    </>
  );
  return (
    <div className="flex items-center gap-5 sm:gap-6">
      {photoHref ? (
        <Link href={photoHref} className={`${PHOTO_BOX} hover:rotate-0 transition-transform`}>{picture}</Link>
      ) : (
        <div className={PHOTO_BOX} aria-hidden="true">{picture}</div>
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] font-semibold tabular-nums truncate ${kickerClass}`}>{kicker}</p>
        {titleHref ? <Link href={titleHref} className={`${HEADLINE} mt-0.5 hover:underline`}>{title}</Link> : <p className={`${HEADLINE} mt-0.5`}>{title}</p>}
        {sub && <div className="mt-1 flex items-center gap-2 min-w-0 text-xs text-slate-600">{sub}</div>}
        <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

function MoreButton({ onMore }: { onMore: () => void }) {
  return (
    <button type="button" onClick={onMore} className={LIGHT_BUTTON}>
      <Plus className="w-4 h-4" aria-hidden="true" />
      หาอีกอย่าง
    </button>
  );
}

function GoMeetup({ event, hosting, now: start, children }: { event: EventItem; hosting: boolean; now: number; children: React.ReactNode }) {
  const now = useMinuteClock(start);
  const people = useGoingWith(event.id, true);
  const others = Math.max(0, event.participantsCount - 1);
  const isOn = startsAt(event) <= now;
  const when = isOn ? 'กำลังจัดอยู่ตอนนี้' : hosting ? `ตี้ที่คุณเปิด · ${awayLabel(event, now)}` : `${awayLabel(event, now)} เจอกันนะ`;
  return (
    <Step photo={event.image || FALLBACK_IMAGE} photoHref={eventHref(event)} sticker={dayLine(event)} kicker={when} kickerClass={ACCENT.meetup.text} title={cleanTitle(event.title)} titleHref={eventHref(event)}
      sub={<>
        {people && people.length > 0 && <Faces people={people.slice(0, 3)} ring="ring-[#FFF8F1]" />}
        <span className="truncate">{hosting ? (others > 0 ? `ลงชื่อแล้ว ${others} คน` : 'ยังไม่มีคนลงชื่อ') : others > 0 ? `ไปด้วยกัน ${others} คน` : 'คุณเป็นคนแรกที่ไป'} · {event.location}</span>
      </>}>
      <Link href={eventHref(event)} className={DARK_BUTTON}>{hosting ? 'ดูคนที่ลงชื่อ' : 'ดูตี้นี้'}</Link>
      {children}
    </Step>
  );
}

function GoChallenge({ quest, progress, children }: { quest: ChallengeQuest; progress: QuestProgress; children: React.ReactNode }) {
  const [detail, setDetail] = useState<QuestDetail | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/quests/${encodeURIComponent(quest.id)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => alive && json?.targets && setDetail(json as QuestDetail))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [quest.id]);
  const target = detail?.targets.find((t) => !t.visited);
  const stamps = Math.min(progress.total, 6);
  const hint = detail?.minEvidence ? EVIDENCE_HINTS[detail.minEvidence] : null;
  const questHref = `/challenges/${encodeURIComponent(quest.id)}`;
  return (
    <Step photo={target?.image || quest.image || FALLBACK_IMAGE} photoHref={target?.href ?? questHref} sticker={target ? 'ที่ถัดไป' : 'ชาเลนจ์ของคุณ'}
      kicker={<span className="flex items-center gap-2 min-w-0">
        <span className="flex gap-1 shrink-0" aria-hidden="true">
          {Array.from({ length: stamps }, (_, i) => (
            <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < progress.current ? 'bg-[#7C3AED]' : 'border-[1.5px] border-[#7C3AED]/50'}`} />
          ))}
        </span>
        <span className="truncate">ไปแล้ว {progress.current}/{progress.total} · {quest.title}</span>
      </span>}
      kickerClass={ACCENT.challenge.text} title={target?.title ?? 'เลือกที่แรกจากหน้าชาเลนจ์'} titleHref={target?.href ?? questHref}
      sub={hint ? <span className="line-clamp-1">{hint}</span> : undefined}>
      <Link href={target?.href ?? questHref} className={DARK_BUTTON}>{target ? 'ไปที่นี่' : 'ดูชาเลนจ์'}</Link>
      {children}
    </Step>
  );
}

/** A saved fair or place: "ไปมาแล้ว" right here once it can count (a fair from its first day) */
function GoPlace({ plan, now, onMark, children }: {
  plan: Extract<Plan, { kind: 'fair' | 'place' }>; now: number; onMark: (targetType: 'spot' | 'fair', id: string) => Promise<string | null>; children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mark = async (targetType: 'spot' | 'fair', id: string) => {
    setBusy(true);
    setError(await onMark(targetType, id));
    setBusy(false);
  };
  const markButton = (targetType: 'spot' | 'fair', id: string) => (
    <button type="button" disabled={busy} onClick={() => mark(targetType, id)} className={DARK_BUTTON}>
      <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
      ไปมาแล้ว
    </button>
  );
  if (plan.kind === 'fair') {
    const { event } = plan;
    const started = parseEventDateToTimestamp(event.date) <= now;
    const last = shortDate(event.endDate || event.date);
    return (
      <Step photo={event.image || FALLBACK_IMAGE} photoHref={eventHref(event)} sticker="งานที่อยากไป"
        kicker={started ? `กำลังจัดอยู่ · ถึง ${last}` : `${shortDate(formatEventDateRange(event))} · ${awayLabel(event, now)}`} kickerClass={ACCENT.fair.text}
        title={cleanTitle(event.title)} titleHref={eventHref(event)} sub={<span className="truncate">{error ?? event.location}</span>}>
        {started ? markButton('fair', event.id) : <Link href={eventHref(event)} className={DARK_BUTTON}>ดูงานนี้</Link>}
        {children}
      </Step>
    );
  }
  const { spot } = plan;
  const href = `/spots/${encodeURIComponent(spot.id)}`;
  return (
    <Step photo={spot.image || FALLBACK_IMAGE} photoHref={href} sticker="ที่ที่อยากไป"
      kicker={`ที่เที่ยว · ${spot.province}`} kickerClass={ACCENT.place.text}
      title={spot.title} titleHref={href} sub={<span className="truncate">{error ?? (spot.openHours ? openLine(spot.openHours) :'ไปถึงแล้วกด "ไปมาแล้ว" รับ XP')}</span>}>
      {markButton('spot', spot.id)}
      {children}
    </Step>
  );
}

function shareRequestOf(target: ShareTarget): Omit<ShareRequest, 'key'> {
  if (target.kind === 'meetup') return { type: 'community', id: target.event.id, title: target.event.title, location: target.event.location };
  if (target.kind === 'fair') return { type: 'fair', id: target.event.id, title: target.event.title, location: target.event.location };
  if (target.kind === 'place') return { type: 'spot', id: target.spot.id, title: target.spot.title, location: target.spot.title };
  return {};
}

function Share({ target, onShare }: { target: ShareTarget | null; onShare: (request: Omit<ShareRequest, 'key'>) => void }) {
  const camera = (
    <span className="absolute -right-3 -top-3 w-10 h-10 rounded-full bg-[#F43F5E] text-white rotate-6 flex items-center justify-center shadow-md">
      <Camera className="w-5 h-5" />
    </span>
  );
  const button = (request: Omit<ShareRequest, 'key'>) => (
    <button type="button" onClick={() => onShare(request)} className={ROSE_BUTTON}>
      <Camera className="w-4 h-4" aria-hidden="true" />
      แชร์โมเมนต์
    </button>
  );
  // Nowhere waiting: any moment from today
  if (!target) {
    return (
      <Step photo={<span className="flex aspect-square w-full items-center justify-center rounded-2xl border-[3px] border-white bg-[#FFE4E8] shadow-[0_6px_14px_rgba(15,23,42,0.14)]"><Camera className="w-12 h-12 text-[#F43F5E]" /></span>}
        kicker="วันนี้ไปไหนมา?" kickerClass={ACCENT.moments.text} title="แชร์ให้เพื่อนๆ ดูหน่อย"
        sub={<span className="line-clamp-1">คาเฟ่ที่ชอบ วิวที่เพิ่งไป หรือมื้ออร่อยวันนี้</span>}>
        {button({})}
      </Step>
    );
  }
  const image = target.kind === 'place' ? target.spot.image : target.kind === 'challenge' ? target.quest.image : target.event.image;
  const title = cleanTitle(target.kind === 'place' ? target.spot.title : target.kind === 'challenge' ? target.quest.title : target.event.title);
  return (
    <Step photo={<>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image || FALLBACK_IMAGE} alt="" className={`${PRINT} aspect-square`} />
        {camera}
      </>}
      sticker="ไปมาแล้ว!" kicker="สนุกไหม?" kickerClass={ACCENT.moments.text} title="แชร์โมเมนต์จากวันนั้น"
      sub={<span className="line-clamp-1">รูปจาก {title} {target.kind === 'meetup' ? 'ให้เพื่อนในตี้เห็น' : 'ให้เพื่อนๆ เห็น'}</span>}>
      {button(shareRequestOf(target))}
    </Step>
  );
}

interface Suggested {
  id: string;
  displayName: string;
  avatarUrl?: string;
  momentCount: number;
}

/**
 * People worth following (verified members who post, GET /api/members/suggested), each with a follow button.
 * Used by the moments path on home and the onboarding summary. `onLoaded` tells how many came back.
 */
export function FollowRow({ onFollowed, onLoaded, emptyText }: { onFollowed?: () => void; onLoaded?: (count: number) => void; emptyText: string }) {
  const [people, setPeople] = useState<Suggested[] | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/members/suggested', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => json?.members ?? [])
      .catch(() => [])
      .then((list: Suggested[]) => {
        if (!alive) return;
        setPeople(list);
        onLoaded?.(list.length);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
  }, []);
  const follow = async (id: string) => {
    setBusy(id);
    const res = await fetch(`/api/members/${encodeURIComponent(id)}/actions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'follow' }),
    }).catch(() => null);
    setBusy(null);
    if (res?.ok) {
      setDone((d) => [...d, id]);
      onFollowed?.();
    }
  };
  if (people === null) return <div className="h-[92px]" aria-hidden="true" />;
  if (people.length === 0) return <p className="text-sm text-slate-600">{emptyText}</p>;
  return (
    <ul className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
      {people.slice(0, 5).map((p) => {
        const isDone = done.includes(p.id);
        return (
          <li key={p.id} className="w-[84px] shrink-0 flex flex-col items-center text-center">
            <Link href={`/profile?id=${encodeURIComponent(p.id)}`} className="group flex flex-col items-center min-w-0 w-full">
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover bg-slate-100 border-2 border-white shadow-sm" />
              ) : (
                <span className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center border-2 border-white shadow-sm" aria-hidden="true">{nameInitial(p.displayName)}</span>
              )}
              <span className="mt-1 w-full text-xs font-semibold text-slate-900 truncate group-hover:underline">{p.displayName}</span>
              <span className="text-[11px] text-slate-500">{p.momentCount} โมเมนต์</span>
            </Link>
            <button type="button" disabled={isDone || busy === p.id} onClick={() => follow(p.id)} aria-label={isDone ? `ติดตาม ${p.displayName} แล้ว` : `ติดตาม ${p.displayName}`}
              className={`mt-1.5 h-7 px-3 rounded-full text-xs font-semibold whitespace-nowrap ${isDone ? 'bg-white border border-slate-200 text-slate-600' : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'}`}>
              {isDone ? 'ติดตามแล้ว' : 'ติดตาม'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Moments path ①: people who post, followed right here */
function FollowPeople({ following, onFollowed, onNext }: { following: number; onFollowed: () => void; onNext: () => void }) {
  const [count, setCount] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="flex items-baseline justify-between gap-3 text-[13px] font-semibold text-[#E11D48] tabular-nums">
          ติดตามแล้ว {Math.min(following, FOLLOW_TARGET)}/{FOLLOW_TARGET}
          {/* Three is the aim, but one is enough to move on */}
          {(following > 0 || count === 0) && (
            <button type="button" onClick={onNext} className="shrink-0 font-semibold text-slate-900 hover:underline cursor-pointer">ไปขั้นต่อไป →</button>
          )}
        </p>
        <h2 className={`${HEADLINE} mt-0.5`}>ติดตามเพื่อนสายเดียวกัน</h2>
        <p className="mt-0.5 text-[13px] text-slate-600">โมเมนต์ของเขาจะขึ้นในแท็บติดตาม ไม่พลาดที่เที่ยวใหม่ๆ</p>
      </div>
      <FollowRow onFollowed={onFollowed} onLoaded={setCount} emptyText="ตอนนี้ยังไม่มีคนให้แนะนำ ลองส่องโมเมนต์ในฟีดด้านล่างก่อนนะ" />
    </div>
  );
}

/** Moments path ②: a first like or comment in the feed below */
function ReactFirst({ name }: { name: string }) {
  return (
    <Step photo={<span className="flex aspect-square w-full items-center justify-center rounded-2xl border-[3px] border-white bg-[#FFE4E8] shadow-[0_6px_14px_rgba(15,23,42,0.14)]"><Heart className="w-12 h-12 text-[#F43F5E] fill-current" /></span>}
      kicker="เพื่อนๆ แชร์อะไรกันอยู่" kickerClass={ACCENT.moments.text} title="ส่งใจให้โมเมนต์ที่ชอบ"
      sub={<span className="line-clamp-2">กดใจหรือคอมเมนต์สักโพสต์ในฟีดด้านล่าง ให้เขารู้ว่าคุณ{name ? ` ${name}` : ''} แวะมาเจอ</span>}>
      <a href="#home-feed" className={DARK_BUTTON}>ไปที่ฟีด</a>
    </Step>
  );
}

/** Moments path ③: the member's own first moment */
function PostFirst({ onShare }: { onShare: (request: Omit<ShareRequest, 'key'>) => void }) {
  return (
    <Step photo={<span className="flex aspect-square w-full items-center justify-center rounded-2xl border-[3px] border-white bg-[#FFE4E8] shadow-[0_6px_14px_rgba(15,23,42,0.14)]"><Camera className="w-12 h-12 text-[#F43F5E]" /></span>}
      kicker="ถึงตาคุณแล้ว" kickerClass={ACCENT.moments.text} title="แชร์โมเมนต์แรกของคุณ"
      sub={<span className="line-clamp-2">คาเฟ่ที่ชอบ วิวที่เพิ่งไป หรือมื้ออร่อยวันนี้ ส่งต่อให้เพื่อนๆ เห็น</span>}>
      <button type="button" onClick={() => onShare({})} className={ROSE_BUTTON}>
        <Camera className="w-4 h-4" aria-hidden="true" />
        แชร์โมเมนต์
      </button>
    </Step>
  );
}

interface JourneyBandProps {
  name: string;
  /** Reads the first step the onboarding summary offered, so step ① opens on it */
  memberId: string | null;
  now: number;
  journey: Journey;
  firstFlavour: 'meetup' | 'challenge';
  /** Step ① picks for each way out */
  meetups: EventItem[];
  reasons: Record<string, string>;
  quests: ChallengeQuest[];
  spots: LifestyleSpotItem[];
  fairs: EventItem[];
  /** Been out before: step ① stops saying "แรก" */
  returning: boolean;
  /** This month's Chill (places) and Connect (meetups), shown on the right on laptops; null until it loads */
  month: { chill: number; connect: number } | null;
  xp: number;
  onShare: (request: Omit<ShareRequest, 'key'>) => void;
  onMark: (targetType: 'spot' | 'fair', id: string) => Promise<string | null>;
  /** Moments path ①: a person was followed, or the member moves on */
  onFollowed: () => void;
  onFollowDone: () => void;
}

/** What the band shows by itself; when it changes, a folded band opens again */
const signatureOf = (journey: Journey) =>
  journey.mode === 'moments' ? `m:${journey.step}` : `${journey.open}:${journey.soon ? journey.plans[0]?.key : ''}:${journey.share?.key ?? ''}`;

const planTitle = (plan: Plan) => (plan.kind === 'challenge' ? plan.quest.title : plan.kind === 'place' ? plan.spot.title : plan.event.title);

/**
 * Laid on the member home's own three columns (MemberLiveHome) so it lines up with the page below:
 * greeting and steps over "ของฉัน", the step over the feed (same width), the month over the right column.
 */
export function JourneyBand({ name, memberId, now, journey, firstFlavour, meetups, reasons, quests, spots, fairs, returning, month, xp, onShare, onMark, onFollowed, onFollowDone }: JourneyBandProps) {
  // The band only mounts in the browser (after the member's data loads), so storage can be read on first render
  const [firstStep] = useState(() => readFirstStep(memberId));
  const [kind, setKind] = useState<Kind>(firstStep ? (firstStep.pillar === 'challenges' ? 'challenge' : 'meetup') : firstFlavour);
  const loop = journey.mode === 'loop' ? journey : null;
  const [tab, setTab] = useState<Tab>(loop?.open ?? 0);
  const [planIndex, setPlanIndex] = useState(0);
  // The plan to show at ② once it arrives (a place or fair just saved)
  const [focus, setFocus] = useState<string | null>(null);
  const signature = signatureOf(journey);
  const [folded, setFolded] = useState(() => {
    try {
      return Boolean(memberId) && localStorage.getItem(foldKey(memberId!)) === signature;
    } catch {
      return false;
    }
  });
  // Something new (a plan within a day, somewhere to share) opens the band and its step
  const [seenSignature, setSeenSignature] = useState(signature);
  if (seenSignature !== signature) {
    setSeenSignature(signature);
    setFolded(false);
    if (loop) setTab(loop.open);
  }
  const fold = (next: boolean) => {
    setFolded(next);
    try {
      if (!memberId) return;
      if (next) localStorage.setItem(foldKey(memberId), signature);
      else localStorage.removeItem(foldKey(memberId));
    } catch {}
  };

  // Step ①: the onboarding summary's first step leads, with the reason it gave there; nothing already planned
  const planned = useMemo(() => new Set(loop?.plans.map((p) => p.key) ?? []), [loop]);
  const pickMeetups = useMemo(() => {
    const open = meetups.filter((e) => !planned.has(`meetup:${e.id}`));
    if (firstStep?.pillar !== 'community') return open;
    const event = open.find((e) => e.id === firstStep.id) ?? firstStep.event;
    return event ? [event, ...open.filter((e) => e.id !== firstStep.id)] : open;
  }, [firstStep, meetups, planned]);
  const pickReasons = useMemo(
    () => (firstStep?.pillar === 'community' && firstStep.reason ? { ...reasons, [firstStep.id]: firstStep.reason } : reasons),
    [firstStep, reasons]
  );
  const pickQuests = useMemo(() => {
    const open = quests.filter((q) => !planned.has(`challenge:${q.id}`));
    const quest = firstStep?.pillar === 'challenges' ? open.find((q) => q.id === firstStep.id) : undefined;
    return quest ? [quest, ...open.filter((q) => q.id !== quest.id)] : open;
  }, [firstStep, quests, planned]);
  const pickSpots = useMemo(() => spots.filter((s) => !planned.has(`place:${s.id}`)), [spots, planned]);
  const pickFairs = useMemo(() => fairs.filter((e) => !planned.has(`fair:${e.id}`)), [fairs, planned]);

  const plans = loop?.plans ?? [];
  const focusIndex = focus ? plans.findIndex((p) => p.key === focus) : -1;
  const shownIndex = focusIndex >= 0 ? focusIndex : Math.min(planIndex, Math.max(0, plans.length - 1));
  const plan = plans[shownIndex];

  const want = async (k: 'place' | 'fair', id: string) => {
    const ok = await activityActions.setSaved(k === 'place' ? 'spot' : 'event', id, true);
    if (ok === false) return;
    setFocus(`${k}:${id}`);
    setTab(1);
  };
  const mark = async (targetType: 'spot' | 'fair', id: string) => {
    const error = await onMark(targetType, id);
    if (!error) {
      setFocus(null);
      setTab(2);
    }
    return error;
  };
  const toPick = () => setTab(0);
  const movePlan = (index: number) => {
    setFocus(null);
    setPlanIndex(index);
  };

  const isMoments = journey.mode === 'moments';
  const flavour: Flavour = isMoments ? 'moments' : tab === 1 && plan ? plan.kind : kind;
  const at = isMoments ? (journey.step === 'follow' ? 0 : journey.step === 'react' ? 1 : 2) : tab;
  const marks: ('done' | 'dot' | null)[] | undefined = loop ? [plans.length > 0 ? 'done' : null, loop.soon ? 'dot' : null, loop.share ? 'dot' : null] : undefined;
  const select = loop ? (next: Tab) => setTab(next) : undefined;

  if (folded) {
    const summary = isMoments
      ? `${at + 1} ${MOMENT_STEPS[at]}`
      : loop!.open === 2 && loop!.share
        ? `③ แชร์โมเมนต์จากวันนั้น`
        : plans[0]
          ? `② ${KIND_LABEL[plans[0].kind]} · ${plans[0].kind === 'meetup' || plans[0].kind === 'fair' ? `${dayLine(plans[0].event)} · ` : ''}${planTitle(plans[0])}`
          : '① เลือกกิจกรรมต่อไป';
    return <FoldedBand name={name} summary={summary} onOpen={() => fold(false)} />;
  }

  return (
    <BandFrame name={name} now={now} month={month} xp={xp} handle={<Handle folded={false} onClick={() => fold(true)} />} hint={Boolean(loop)}
      tracker={(vertical) => <Tracker at={at} flavour={flavour} vertical={vertical} onSelect={select} marks={marks} />}>
      <div className={`flex flex-col justify-center ${loop ? 'sm:min-h-[236px]' : ''}`}>
        {loop && tab === 0 && (
          <Picks kind={kind} setKind={setKind} meetups={pickMeetups} reasons={pickReasons} quests={pickQuests} spots={pickSpots} fairs={pickFairs} returning={returning} onWant={want} />
        )}
        {/* One plan or ask at a time keeps about the feed's width; only the picks spread wider */}
        <div className="max-w-[640px]">
          {loop && tab === 1 && !plan && (
            <Step photo={<span className="flex aspect-square w-full items-center justify-center rounded-2xl border-[3px] border-white bg-white shadow-[0_6px_14px_rgba(15,23,42,0.14)]"><Zap className="w-12 h-12 text-[#F26430]" /></span>}
              kicker="ยังไม่มีแผน" kickerClass={ACCENT.meetup.text} title="เลือกสักอย่าง แล้วออกไปกัน"
              sub={<span className="line-clamp-1">ตี้ ชาเลนจ์ ที่เที่ยว หรืองานแฟร์ เลือกได้หมด</span>}>
              <button type="button" onClick={toPick} className={DARK_BUTTON}>เลือกกิจกรรม</button>
            </Step>
          )}
          {loop && tab === 1 && plan && (() => {
            const extra = (
              <>
                <MoreButton onMore={toPick} />
                <Pager index={shownIndex} count={plans.length} onMove={movePlan} />
              </>
            );
            if (plan.kind === 'meetup') return <GoMeetup key={plan.key} event={plan.event} hosting={plan.hosting} now={now}>{extra}</GoMeetup>;
            if (plan.kind === 'challenge') return <GoChallenge key={plan.key} quest={plan.quest} progress={plan.progress}>{extra}</GoChallenge>;
            return <GoPlace key={plan.key} plan={plan} now={now} onMark={mark}>{extra}</GoPlace>;
          })()}
          {loop && tab === 2 && <Share target={loop.share} onShare={onShare} />}
          {journey.mode === 'moments' && journey.step === 'react' && <ReactFirst name={name} />}
          {journey.mode === 'moments' && journey.step === 'post' && <PostFirst onShare={onShare} />}
        </div>
        {journey.mode === 'moments' && journey.step === 'follow' && <FollowPeople following={journey.following} onFollowed={onFollowed} onNext={onFollowDone} />}
      </div>
    </BandFrame>
  );
}

/** The band's call to go out, in place of a plain hello (owner 2026-10-24) */
const CALLOUT = 'เลือกกิจกรรมและออกไปใช้ชีวิตกัน';

/** พับ / เปิด as a tab hanging off the band's bottom edge, like a drawer handle (owner 2026-10-24); it adds no height */
function Handle({ folded, onClick }: { folded: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} aria-expanded={!folded} aria-label={folded ? 'เปิดแถบเส้นทางของคุณ' : 'พับแถบนี้ให้เหลือบรรทัดเดียว'}
      className="absolute left-1/2 top-full z-10 -mt-px -translate-x-1/2 inline-flex items-center gap-1 h-6 pl-3.5 pr-3 rounded-b-xl bg-[#FFF8F1] border border-t-0 border-[#F3E6D8] text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer disabled:invisible">
      {folded ? 'เปิดดู' : 'พับเก็บ'}
      {folded ? <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />}
    </button>
  );
}

/** The band folded to one line */
function FoldedBand({ name, summary, onOpen }: { name: string; summary: React.ReactNode; onOpen?: () => void }) {
  return (
    <section aria-label="เส้นทางของคุณ" className="relative bg-[#FFF8F1] border-b border-[#F3E6D8]">
      <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
        <h1 className="shrink-0 text-sm font-bold text-slate-900">สวัสดี {name}</h1>
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left text-[13px] text-slate-700 hover:text-slate-900 truncate cursor-pointer">{summary}</button>
      </div>
      <Handle folded onClick={onOpen} />
    </section>
  );
}

/** This month's Chill (places) and Connect (meetups) with the member's XP, on one line; opens the month in My Hub */
function MonthStats({ month, xp, size }: { month: { chill: number; connect: number } | null; xp: number; size: 'sm' | 'lg' }) {
  // Holds its place until the month loads, so nothing moves
  if (!month) return <span className={`block rounded-md bg-[#F1E4D6]/70 ${size === 'lg' ? 'h-7 w-52' : 'h-4 w-40'}`} aria-hidden="true" />;
  return (
    <Link href="/myhub#my-month" className="group flex items-baseline gap-2 whitespace-nowrap" aria-label={`เดือนนี้ ไปที่เที่ยว ${month.chill} แห่ง ไปตี้ ${month.connect} ครั้ง มี ${xp} XP ดูในมายฮับ`}>
      <span className={`font-bold text-slate-900 group-hover:opacity-80 ${size === 'lg' ? 'text-lg' : 'text-[13px]'}`}>
        <span className="font-extrabold text-[#2D5A3C]">Chill</span> <span className="tabular-nums">{month.chill}</span>
        <span className={`${size === 'lg' ? 'mx-1.5' : 'mx-1'} font-normal text-slate-300`} aria-hidden="true">·</span>
        <span className="font-extrabold text-[#D04A1B]">Connect</span> <span className="tabular-nums">{month.connect}</span>
      </span>
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#7C3AED] tabular-nums group-hover:underline">
        <Zap className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
        {xp.toLocaleString()} XP
      </span>
    </Link>
  );
}

/**
 * The band's frame, shared with its placeholder so the page never jumps when the band arrives. It keeps the band's
 * old height (owner 2026-10-24): hello and the month share one line, and พับ hangs below the band.
 * Wide screens: the call to go out, the month and the steps sit over "ของฉัน"; the step fills the rest (the picks
 * spread across the feed and the right column). Smaller screens: one column.
 */
function BandFrame({ name, now, month, xp, handle, hint, tracker, children }: {
  name: string; now: number; month: { chill: number; connect: number } | null; xp: number; handle: React.ReactNode;
  /** The steps are tabs: say they can be switched */
  hint: boolean;
  tracker: (vertical: boolean) => React.ReactNode;
  children: React.ReactNode;
}) {
  const hello = <p className="min-w-0 truncate text-xs text-slate-500">สวัสดี {name}<span className="hidden sm:inline"> · {dayPart(now)}</span></p>;
  const hintLine = hint && <p className="text-xs text-slate-500 whitespace-nowrap">กดที่ 1 2 3 สลับดูแต่ละขั้นได้เลย</p>;
  return (
    <section aria-label="เส้นทางของคุณ" className="relative bg-[#FFF8F1] border-b border-[#F3E6D8]">
      <div className="relative max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)] lg:gap-10 items-center">
          {/* Wide screens: the call-out on one line, then this month and the steps */}
          <div className="hidden xl:flex flex-col gap-2.5 min-w-0">
            {hello}
            {/* One <h1> per page: the narrow-screen copy below is the h1; this one is a heading only to screen readers that see it */}
            <p role="heading" aria-level={1} className="-mt-1 text-xl font-bold text-slate-900 tracking-tight leading-snug">{CALLOUT}</p>
            <MonthStats month={month} xp={xp} size="lg" />
            <div className="flex flex-col gap-1">
              {tracker(true)}
              {hintLine}
            </div>
          </div>

          <div className="min-w-0 w-full flex flex-col gap-3 sm:gap-4">
            <div className="xl:hidden flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                {hello}
                <span className="shrink-0">
                  <MonthStats month={month} xp={xp} size="sm" />
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <h1 className="min-w-0 text-[17px] sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">{CALLOUT}</h1>
                <span className="hidden sm:block">{hintLine}</span>
              </div>
              <div className="flex flex-col gap-1">
                {tracker(false)}
                <span className="sm:hidden">{hintLine}</span>
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
      {handle}
    </section>
  );
}

/** Folded last time (kept per member): the placeholder takes the one-line shape */
const wasFolded = (memberId: string | null) => {
  try {
    return Boolean(memberId) && localStorage.getItem(foldKey(memberId!)) !== null;
  } catch {
    return false;
  }
};

/** Holds the band's place while the member's plans load, in the same frame, so the feed below does not jump */
export function JourneyBandPlaceholder({ name, memberId, now, month, xp }: { name: string; memberId: string | null; now: number; month: { chill: number; connect: number } | null; xp: number }) {
  const folded = wasFolded(memberId);
  const bone = 'rounded-lg bg-[#F1E4D6]/70';
  if (folded) return <FoldedBand name={name} summary={<span className={`block h-3 w-48 ${bone}`} />} />;
  return (
    <BandFrame name={name} now={now} month={month} xp={xp} hint handle={<Handle folded={false} />}
      tracker={(vertical) => (
        <span className={vertical ? 'flex flex-col gap-1' : 'grid grid-cols-3 gap-2'} aria-hidden="true">
          {JOURNEY_STEPS.map((label) => <span key={label} className={`block ${vertical ? 'h-6 w-40' : 'h-[26px]'} ${bone}`} />)}
        </span>
      )}>
      <div className="sm:min-h-[236px] flex flex-col justify-center gap-3" aria-busy="true" aria-label="กำลังโหลด">
        <span className={`block h-7 w-56 ${bone}`} />
        <span className={`block h-8 w-72 ${bone}`} />
        <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-4 overflow-hidden">
          {Array.from({ length: PICK_COUNT }, (_, i) => (
            <span key={i} className={`w-[140px] sm:w-auto shrink-0 ${PICK_SHOWN[i]}`}>
              <span className={`block aspect-[16/9] lg:aspect-[2/1] xl:aspect-[16/9] rounded-2xl ${bone}`} />
              <span className={`mt-2 block h-3 w-3/4 ${bone}`} />
              <span className={`mt-1.5 block h-3 w-1/2 ${bone}`} />
            </span>
          ))}
        </div>
      </div>
    </BandFrame>
  );
}

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Camera, Check, Heart, Zap } from 'lucide-react';
import type { ChallengeQuest, EventItem } from '@/data/mockData';
import { isEventEnded } from '@/lib/dateUtils';
import type { QuestProgress } from '@/lib/useMyRewards';
import { EVIDENCE_HINTS, type QuestDetail } from '@/lib/questDisplay';
import { MOMENT_REACTED_EVENT, type ShareRequest } from '@/components/home/HomeMomentFeed';
import { nameInitial } from '@/lib/displayName';
import { DAY_MS, FALLBACK_IMAGE, Faces, awayLabel, dayLine, dayPart, endsAt, eventHref, startsAt, useGoingWith, useMinuteClock } from '@/components/home/planHelpers';

/**
 * The member journey on home: ① เลือกกิจกรรมที่ใช่ ② ออกไปใช้ชีวิต ③ แชร์โมเมนต์, the same three steps as the
 * landing hero and the end of onboarding. A cream band above the feed says which step the member is on and
 * gives the one next thing to do. It stays on home for good (owner 2026-10-23: the call to go out, no ข้าม);
 * after a moment is shared it keeps running the loop: pick something, go, share it.
 * Two flavours: a ตี้ (orange, Connect) or a challenge (violet, Chill); the member switches only at step ①.
 * A third path for members who came for moments only (owner 2026-10-23): ① ติดตามเพื่อน ② กดใจ คอมเมนต์
 * ③ แชร์โมเมนต์แรก, in rose. It gives way to the usual steps once they join a ตี้ or a challenge.
 */

export const JOURNEY_STEPS = ['เลือกกิจกรรมที่ใช่', 'ออกไปใช้ชีวิต', 'แชร์โมเมนต์'] as const;
export const MOMENT_STEPS = ['ติดตามเพื่อน', 'กดใจ คอมเมนต์', 'แชร์โมเมนต์แรก'] as const;

type Flavour = 'meetup' | 'challenge' | 'moments';

export type Journey =
  | { step: 'pick' }
  | { step: 'go-meetup'; event: EventItem }
  | { step: 'go-challenge'; quest: ChallengeQuest; progress: QuestProgress }
  | { step: 'share'; event?: EventItem; quest?: ChallengeQuest }
  | { step: 'follow'; following: number }
  | { step: 'react' }
  | { step: 'post' };

// Onboarding goals (app/onboarding/OnboardingFlow.tsx): "ทำชาเลนจ์สนุกๆ" asks for a challenge first; the meetup goals for a ตี้
const CHALLENGE_GOALS = ['earn_xp'];
const MEETUP_GOALS = ['find_friends', 'join_community'];
const SOCIAL_GOALS = ['share_moments', 'browse_moments'];
/** Only moment goals picked: the moments path on home and moments first on the onboarding summary */
export const isSocialOnly = (goals: string[]) => goals.length > 0 && goals.every((g) => SOCIAL_GOALS.includes(g));
/** People to follow before step ① counts as done (the member may move on after the first one) */
const FOLLOW_TARGET = 3;
/** A ตี้ that ended this long ago still asks for its moment */
const SHARE_WINDOW_MS = 14 * DAY_MS;


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

interface JourneyInput {
  memberId: string | null;
  /** The member picked only moment goals in onboarding */
  socialOnly: boolean;
  now: number;
  /** Meetups and fairs the member joined or hosts, ended ones included */
  mine: EventItem[];
  questProgress: QuestProgress[];
  allQuests: ChallengeQuest[];
  isLoaded: boolean;
}

/** Which step the member is on; `journey` is null only until the member's data has loaded */
export function useJourney({ memberId, socialOnly, now, mine, questProgress, allQuests, isLoaded }: JourneyInput) {
  const [momentCount, setMomentCount] = useState<number | null>(null);
  // When the newest moment was posted: a ตี้ that ended before it no longer asks for one
  const [lastMomentAt, setLastMomentAt] = useState(0);
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

  const journey = useMemo<Journey | null>(() => {
    const hasPosted = (momentCount ?? 0) > 0;
    const meetups = mine.filter((e) => (e.eventType || 'community') === 'community');
    // Over once its end time has passed ("06:30 - 08:00"), not only at the end of the day
    const isOver = (e: EventItem) => isEventEnded(e) || endsAt(e) <= now;
    const upcoming = meetups.filter((e) => !isOver(e)).sort((a, b) => startsAt(a) - startsAt(b));
    const ended = meetups
      .filter((e) => isOver(e) && now - endsAt(e) < SHARE_WINDOW_MS && endsAt(e) > lastMomentAt)
      .sort((a, b) => endsAt(b) - endsAt(a));
    const running = questProgress.filter((q) => q.joined && !q.completed);
    const questOf = (id: string) => allQuests.find((q) => q.id === id);
    // A challenge visit asks for a moment only until the first one is shared
    const visited = hasPosted ? undefined : running.find((q) => q.current > 0 && questOf(q.questId));
    const next = upcoming[0];
    const doing = running.find((q) => questOf(q.questId));

    // Moments path, until the member shares a first moment or signs up for something to go out to
    if (socialOnly && social && !hasPosted && !next && !ended[0] && !doing) {
      if (social.following < FOLLOW_TARGET && !social.followDone) return { step: 'follow', following: social.following };
      return social.reacted ? { step: 'post' } : { step: 'react' };
    }

    // A ตี้ within a day comes first; then a moment for somewhere they went; then what is coming up
    if (next && startsAt(next) - now < DAY_MS) return { step: 'go-meetup', event: next };
    if (ended[0]) return { step: 'share', event: ended[0] };
    if (visited) return { step: 'share', quest: questOf(visited.questId) };
    if (next) return { step: 'go-meetup', event: next };
    if (doing) return { step: 'go-challenge', quest: questOf(doing.questId)!, progress: doing };
    return { step: 'pick' };
  }, [momentCount, lastMomentAt, mine, questProgress, allQuests, now, socialOnly, social]);

  const isReady = isLoaded && momentCount !== null && (!socialOnly || social !== null);
  // Been out before (joined something or shared a moment): the steps stop saying "แรก"
  const returning = (momentCount ?? 0) > 0 || mine.length > 0 || questProgress.some((q) => q.joined);
  return { journey: isReady ? journey : null, isReady, returning, markPosted, followed, finishFollow };
}

/** The tab shown first at step ①: a challenge when the member chose challenges and no meetup goal, else a ตี้ */
export function flavourFromGoals(goals: string[]): Flavour {
  const challenge = goals.some((g) => CHALLENGE_GOALS.includes(g));
  const meetup = goals.some((g) => MEETUP_GOALS.includes(g));
  return challenge && !meetup ? 'challenge' : 'meetup';
}

const ACCENT: Record<Flavour, { bar: string; text: string }> = {
  meetup: { bar: 'bg-[#F26430]', text: 'text-[#D04A1B]' },
  challenge: { bar: 'bg-[#7C3AED]', text: 'text-[#6D28D9]' },
  moments: { bar: 'bg-[#F43F5E]', text: 'text-[#E11D48]' },
};
const RING: Record<Flavour, string> = { meetup: 'ring-[#F26430] text-[#D04A1B]', challenge: 'ring-[#7C3AED] text-[#6D28D9]', moments: 'ring-[#F43F5E] text-[#E11D48]' };
const TILTS = ['-rotate-2', 'rotate-[1.5deg]', '-rotate-1'];
const PRINT = 'block w-full object-cover rounded-2xl border-[3px] border-white bg-slate-100 shadow-[0_6px_14px_rgba(15,23,42,0.14)]';
const STICKER = 'absolute whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-900 shadow-[0_3px_10px_rgba(15,23,42,0.14)]';
const DARK_BUTTON = 'inline-flex items-center justify-center h-10 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold whitespace-nowrap';
const LIGHT_BUTTON = 'inline-flex items-center justify-center h-10 px-5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold whitespace-nowrap';
/** The one headline of a step: the ตี้, the place, or the ask */
const HEADLINE = 'block text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2';
/** The photo beside a step's words */
const PHOTO_BOX = 'relative w-[104px] sm:w-[128px] shrink-0 -rotate-3';

function Tracker({ at, flavour, vertical = false }: { at: number; flavour: Flavour; vertical?: boolean }) {
  const steps = flavour === 'moments' ? MOMENT_STEPS : JOURNEY_STEPS;
  // The narrow left column (wide screens) lists the steps down, like a short checklist
  if (vertical) {
    return (
      <ol className="flex flex-col gap-2" aria-label="เส้นทางของคุณ">
        {steps.map((label, i) => {
          const done = i < at;
          const here = i === at;
          const ring = here && i === 2 ? RING.moments : RING[flavour];
          return (
            <li key={label} className={`flex items-center gap-2.5 text-[13px] ${here ? 'font-semibold text-slate-900' : done ? 'text-slate-600' : 'text-slate-500'}`} aria-current={here ? 'step' : undefined}>
              <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold ${
                done ? `${ACCENT[flavour].bar} text-white` : here ? `bg-white ring-2 ${ring}` : 'bg-[#F1E4D6] text-slate-500'
              }`}>
                {done ? <Check className="w-3 h-3" strokeWidth={3} aria-label="เสร็จแล้ว" /> : i + 1}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    );
  }
  return (
    <ol className="grid grid-cols-3 gap-1.5 sm:gap-2" aria-label="เส้นทางของคุณ">
      {steps.map((label, i) => {
        const done = i < at;
        const here = i === at;
        const bar = done || here ? (here && i === 2 ? 'bg-[#F43F5E]' : ACCENT[flavour].bar) : 'bg-[#F1E4D6]';
        return (
          <li key={label} className="min-w-0 flex flex-col gap-1.5" aria-current={here ? 'step' : undefined}>
            <span className={`h-[5px] rounded-full ${bar}`} aria-hidden="true" />
            <span className={`flex items-start gap-1 text-xs leading-snug ${here ? 'font-semibold text-slate-900' : done ? 'text-slate-600' : 'text-slate-500'}`}>
              {done ? <Check className={`w-3 h-3 mt-0.5 shrink-0 ${ACCENT[flavour].text}`} strokeWidth={3} aria-label="เสร็จแล้ว" /> : <span aria-hidden="true">{i + 1}</span>}
              <span className="min-w-0">{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** A tilted photo card for the picks: a sideways row on phones, three across from iPad up */
function Print({ href, image, alt, index, sticker, when, whenClass, title, meta }: {
  href: string; image: string; alt: string; index: number; sticker?: string; when: string; whenClass: string; title: string; meta?: string;
}) {
  return (
    <Link href={href} className={`group w-[140px] sm:w-auto shrink-0 ${TILTS[index % TILTS.length]} hover:rotate-0 transition-transform`}>
      <span className="relative block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={alt} loading="lazy" className={`${PRINT} aspect-[16/9]`} />
        {sticker && <span className="absolute -top-2 -right-1.5 rotate-6 rounded-full bg-[#7C3AED] px-2 py-0.5 text-[11px] font-semibold text-white">{sticker}</span>}
      </span>
      <span className={`block mt-1.5 text-[11px] font-semibold ${whenClass}`}>{when}</span>
      <span className="block mt-0.5 text-[13px] font-semibold text-slate-900 leading-snug truncate group-hover:underline">{title}</span>
      {meta && <span className="block mt-0.5 text-xs text-slate-500 truncate">{meta}</span>}
    </Link>
  );
}

function Picks({ flavour, setFlavour, meetups, reasons, quests, returning }: {
  flavour: Flavour; setFlavour: (f: Flavour) => void; meetups: EventItem[]; reasons: Record<string, string>; quests: ChallengeQuest[]; returning: boolean;
}) {
  const isMeetup = flavour === 'meetup';
  const allHref = isMeetup ? '/community?seats=open' : '/challenges';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">{returning ? (isMeetup ? 'หาตี้ต่อไปของคุณ' : 'เลือกชาเลนจ์ต่อไป') : isMeetup ? 'เลือกตี้แรกของคุณ' : 'เลือกชาเลนจ์แรกของคุณ'}</h2>
        <div className="flex gap-0.5 p-0.5 rounded-full bg-white shrink-0 shadow-[0_2px_8px_rgba(15,23,42,0.06)]" role="group" aria-label="เลือกแบบไหนก่อน">
          {(['meetup', 'challenge'] as const).map((f) => (
            <button key={f} type="button" aria-pressed={flavour === f} onClick={() => setFlavour(f)}
              className={`h-8 px-3.5 rounded-full text-[13px] cursor-pointer transition-colors ${flavour === f ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 font-medium hover:text-slate-900'}`}>
              {f === 'meetup' ? 'ตี้' : 'ชาเลนจ์'}
            </button>
          ))}
        </div>
      </div>
      <p className="-mt-1.5 flex items-baseline justify-between gap-3 text-[13px] text-slate-600">
        <span className="min-w-0">{isMeetup ? 'ตี้ที่เข้ากับสิ่งที่คุณชอบ เปิดรับอยู่ตอนนี้' : 'ไปคนเดียวก็ได้ ตามจังหวะตัวเอง ได้ XP ทุกที่ที่ไป'}</span>
        <Link href={allHref} className={`shrink-0 font-semibold hover:underline whitespace-nowrap ${ACCENT[flavour].text}`}>ดูทั้งหมด →</Link>
      </p>
      <div className="flex sm:grid sm:grid-cols-3 items-start gap-4 overflow-x-auto sm:overflow-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pt-2 pb-1">
        {isMeetup
          ? meetups.slice(0, 3).map((event, i) => (
              <Print key={event.id} href={eventHref(event)} image={event.image || FALLBACK_IMAGE} alt={event.title} index={i}
                when={dayLine(event)} whenClass="text-[#D04A1B]" title={event.title}
                meta={reasons[event.id] ?? `เหลือ ${Math.max(0, event.maxParticipants - event.participantsCount)} ที่`} />
            ))
          : quests.slice(0, 3).map((quest, i) => (
              <Print key={quest.id} href={`/challenges/${encodeURIComponent(quest.id)}`} image={quest.image || quest.badgeCoverImg || FALLBACK_IMAGE} alt={quest.title} index={i}
                sticker={quest.rewardPoints ? `+${quest.rewardPoints} XP` : undefined}
                when={quest.startsInDays && quest.startsInDays > 0 ? `เริ่มอีก ${quest.startsInDays} วัน` : quest.daysRemaining !== undefined ? `เหลือ ${quest.daysRemaining} วัน` : 'เปิดอยู่'}
                whenClass="text-[#6D28D9]" title={quest.title}
                meta={quest.participantsCount ? `กำลังทำ ${quest.participantsCount.toLocaleString()} คน` : undefined} />
            ))}
        {(isMeetup ? meetups : quests).length === 0 && (
          <p className="col-span-3 text-sm text-slate-600">{isMeetup ? 'ตอนนี้ยังไม่มีตี้ที่เปิดรับ ลองดูทั้งหมด หรือเปิดตี้แรกเองเลย' : 'ตอนนี้ยังไม่มีชาเลนจ์ที่เปิดอยู่'}</p>
        )}
      </div>
    </div>
  );
}

function GoMeetup({ event, now: start }: { event: EventItem; now: number }) {
  const now = useMinuteClock(start);
  const people = useGoingWith(event.id, true);
  const others = Math.max(0, event.participantsCount - 1);
  const isOn = startsAt(event) <= now;
  return (
    <div className="flex items-center gap-5 sm:gap-6">
      <Link href={eventHref(event)} className={`${PHOTO_BOX} hover:rotate-0 transition-transform`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.image || FALLBACK_IMAGE} alt="" className={`${PRINT} aspect-square`} />
        <span className={`${STICKER} left-1/2 -bottom-2.5 -translate-x-1/2 rotate-2`}>{dayLine(event)}</span>
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#D04A1B] tabular-nums">{isOn ? 'กำลังจัดอยู่ตอนนี้' : `${awayLabel(event, now)} เจอกันนะ`}</p>
        <Link href={eventHref(event)} className={`${HEADLINE} mt-0.5 hover:underline`}>{event.title}</Link>
        <p className="mt-1 flex items-center gap-2 min-w-0 text-xs text-slate-600">
          {people && people.length > 0 && <Faces people={people.slice(0, 3)} ring="ring-[#FFF8F1]" />}
          <span className="truncate">{others > 0 ? `ไปด้วยกัน ${others} คน` : 'คุณเป็นคนแรกที่ไป'} · {event.location}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={eventHref(event)} className={DARK_BUTTON}>ดูตี้นี้</Link>
          <Link href="/myhub" className={LIGHT_BUTTON}>ตารางของฉัน</Link>
        </div>
      </div>
    </div>
  );
}

function GoChallenge({ quest, progress }: { quest: ChallengeQuest; progress: QuestProgress }) {
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
    <div className="flex items-center gap-5 sm:gap-6">
      <Link href={target?.href ?? questHref} className={`${PHOTO_BOX} hover:rotate-0 transition-transform`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={target?.image || quest.image || FALLBACK_IMAGE} alt="" className={`${PRINT} aspect-square`} />
        <span className={`${STICKER} left-1/2 -bottom-2.5 -translate-x-1/2 rotate-2`}>{target ? 'ที่ถัดไป' : 'ชาเลนจ์ของคุณ'}</span>
      </Link>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 min-w-0">
          <span className="flex gap-1 shrink-0" aria-hidden="true">
            {Array.from({ length: stamps }, (_, i) => (
              <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < progress.current ? 'bg-[#7C3AED]' : 'border-[1.5px] border-[#7C3AED]/50'}`} />
            ))}
          </span>
          <span className="text-[13px] font-semibold text-[#6D28D9] truncate">ไปแล้ว {progress.current}/{progress.total} · {quest.title}</span>
        </p>
        <Link href={target?.href ?? questHref} className={`${HEADLINE} mt-0.5 hover:underline`}>{target?.title ?? 'เลือกที่แรกจากหน้าชาเลนจ์'}</Link>
        {hint && <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">{hint}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {target && <Link href={target.href} className={DARK_BUTTON}>ไปที่นี่</Link>}
          <Link href={questHref} className={target ? LIGHT_BUTTON : DARK_BUTTON}>ดูชาเลนจ์</Link>
        </div>
      </div>
    </div>
  );
}

function Share({ event, quest, onShare }: { event?: EventItem; quest?: ChallengeQuest; onShare: (request: Omit<ShareRequest, 'key'>) => void }) {
  const title = event?.title ?? quest?.title ?? '';
  return (
    <div className="flex items-center gap-5 sm:gap-6">
      <div className={PHOTO_BOX} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event?.image || quest?.image || FALLBACK_IMAGE} alt="" className={`${PRINT} aspect-square`} />
        <span className="absolute -right-3 -top-3 w-10 h-10 rounded-full bg-[#F43F5E] text-white rotate-6 flex items-center justify-center shadow-md">
          <Camera className="w-5 h-5" />
        </span>
        <span className={`${STICKER} left-1/2 -bottom-2.5 -translate-x-1/2 rotate-2`}>ไปมาแล้ว!</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#E11D48]">สนุกไหม?</p>
        <p className={`${HEADLINE} mt-0.5`}>แชร์โมเมนต์จากวันนั้น</p>
        <p className="mt-1 text-xs text-slate-600 line-clamp-2">
          รูปจาก {title} {event ? 'ให้เพื่อนในตี้เห็น' : 'ให้เพื่อนๆ เห็น'}
        </p>
        <button
          type="button"
          onClick={() => onShare(event ? { type: 'community', id: event.id, title: event.title, location: event.location } : {})}
          className="mt-3 inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#F43F5E] hover:bg-[#E11D48] text-white text-sm font-semibold shadow-[0_6px_16px_rgba(244,63,94,0.25)] whitespace-nowrap cursor-pointer"
        >
          <Camera className="w-4 h-4" aria-hidden="true" />
          แชร์โมเมนต์
        </button>
      </div>
    </div>
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
    <div className="flex items-center gap-5 sm:gap-6">
      <div className={PHOTO_BOX} aria-hidden="true">
        <span className="flex aspect-square w-full items-center justify-center rounded-2xl border-[3px] border-white bg-[#FFE4E8] shadow-[0_6px_14px_rgba(15,23,42,0.14)]">
          <Heart className="w-12 h-12 text-[#F43F5E] fill-current" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#E11D48]">เพื่อนๆ แชร์อะไรกันอยู่</p>
        <p className={`${HEADLINE} mt-0.5`}>ส่งใจให้โมเมนต์ที่ชอบ</p>
        <p className="mt-1 text-xs text-slate-600 line-clamp-2">กดใจหรือคอมเมนต์สักโพสต์ในฟีดด้านล่าง ให้เขารู้ว่าคุณ{name ? ` ${name}` : ''} แวะมาเจอ</p>
        <a href="#home-feed" className={`mt-3 ${DARK_BUTTON}`}>ไปที่ฟีด</a>
      </div>
    </div>
  );
}

/** Moments path ③: the member's own first moment */
function PostFirst({ onShare }: { onShare: (request: Omit<ShareRequest, 'key'>) => void }) {
  return (
    <div className="flex items-center gap-5 sm:gap-6">
      <div className={PHOTO_BOX} aria-hidden="true">
        <span className="flex aspect-square w-full items-center justify-center rounded-2xl border-[3px] border-white bg-[#FFE4E8] shadow-[0_6px_14px_rgba(15,23,42,0.14)]">
          <Camera className="w-12 h-12 text-[#F43F5E]" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#E11D48]">ถึงตาคุณแล้ว</p>
        <p className={`${HEADLINE} mt-0.5`}>แชร์โมเมนต์แรกของคุณ</p>
        <p className="mt-1 text-xs text-slate-600 line-clamp-2">คาเฟ่ที่ชอบ วิวที่เพิ่งไป หรือมื้ออร่อยวันนี้ ส่งต่อให้เพื่อนๆ เห็น</p>
        <button
          type="button"
          onClick={() => onShare({})}
          className="mt-3 inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#F43F5E] hover:bg-[#E11D48] text-white text-sm font-semibold shadow-[0_6px_16px_rgba(244,63,94,0.25)] whitespace-nowrap cursor-pointer"
        >
          <Camera className="w-4 h-4" aria-hidden="true" />
          แชร์โมเมนต์
        </button>
      </div>
    </div>
  );
}

interface JourneyBandProps {
  name: string;
  /** Reads the first step the onboarding summary offered, so step ① opens on it */
  memberId: string | null;
  now: number;
  journey: Journey;
  firstFlavour: Flavour;
  meetups: EventItem[];
  reasons: Record<string, string>;
  quests: ChallengeQuest[];
  /** Been out before: step ① stops saying "แรก" */
  returning: boolean;
  /** This month's Chill (places) and Connect (meetups), shown on the right on laptops; null until it loads */
  month: { chill: number; connect: number } | null;
  xp: number;
  onShare: (request: Omit<ShareRequest, 'key'>) => void;
  /** Moments path ①: a person was followed, or the member moves on */
  onFollowed: () => void;
  onFollowDone: () => void;
}

/**
 * Laid on the member home's own three columns (MemberLiveHome) so it lines up with the page below:
 * greeting and progress over "ของฉัน", the step over the feed (same width), the month over the right column.
 */
export function JourneyBand({ name, memberId, now, journey, firstFlavour, meetups, reasons, quests, month, xp, onShare, onFollowed, returning, onFollowDone }: JourneyBandProps) {
  // The band only mounts in the browser (after the member's data loads), so storage can be read on first render
  const [firstStep] = useState(() => readFirstStep(memberId));
  const [picked, setPicked] = useState<Flavour | null>(firstStep ? (firstStep.pillar === 'challenges' ? 'challenge' : 'meetup') : null);
  // Step ①: the summary's first step leads, with the reason it gave there
  const pickMeetups = useMemo(() => {
    if (firstStep?.pillar !== 'community') return meetups;
    const event = meetups.find((e) => e.id === firstStep.id) ?? firstStep.event;
    return event ? [event, ...meetups.filter((e) => e.id !== firstStep.id)] : meetups;
  }, [firstStep, meetups]);
  const pickReasons = useMemo(
    () => (firstStep?.pillar === 'community' && firstStep.reason ? { ...reasons, [firstStep.id]: firstStep.reason } : reasons),
    [firstStep, reasons]
  );
  const pickQuests = useMemo(() => {
    const quest = firstStep?.pillar === 'challenges' ? quests.find((q) => q.id === firstStep.id) : undefined;
    return quest ? [quest, ...quests.filter((q) => q.id !== quest.id)] : quests;
  }, [firstStep, quests]);
  const isMoments = journey.step === 'follow' || journey.step === 'react' || journey.step === 'post';
  const flavour: Flavour = isMoments
    ? 'moments'
    : journey.step === 'pick' ? picked ?? firstFlavour : journey.step === 'go-challenge' || (journey.step === 'share' && journey.quest) ? 'challenge' : 'meetup';
  const at = journey.step === 'pick' || journey.step === 'follow' ? 0 : journey.step === 'share' || journey.step === 'post' ? 2 : 1;

  const greeting = (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{dayPart(now)}</p>
      <h1 className="text-[22px] sm:text-2xl font-bold text-slate-900 tracking-tight truncate">สวัสดี {name}</h1>
    </div>
  );

  return (
    <section aria-label="เส้นทางของคุณ" className="relative overflow-hidden bg-[#FFF8F1] border-b border-[#F3E6D8]">
      <span className="pointer-events-none absolute -bottom-24 -left-20 w-56 h-56 rounded-full bg-[#E3EDFF]/70" aria-hidden="true" />
      <div className="relative max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[260px_minmax(0,1fr)_320px] 2xl:grid-cols-[300px_minmax(0,1fr)_360px] lg:gap-10 items-center">
          {/* Over "ของฉัน" (wide screens) */}
          <div className="hidden xl:flex flex-col gap-3.5 min-w-0">
            {greeting}
            <Tracker at={at} flavour={flavour} vertical />
          </div>

          {/* Over the feed, the same width */}
          <div className="min-w-0 w-full max-w-[560px] 2xl:max-w-[600px] mx-auto flex flex-col gap-4">
            <div className="xl:hidden flex flex-col gap-3">
              {greeting}
              <Tracker at={at} flavour={flavour} />
            </div>
            {journey.step === 'pick' && <Picks flavour={flavour} setFlavour={setPicked} meetups={pickMeetups} reasons={pickReasons} quests={pickQuests} returning={returning} />}
            {journey.step === 'go-meetup' && <GoMeetup event={journey.event} now={now} />}
            {journey.step === 'go-challenge' && <GoChallenge quest={journey.quest} progress={journey.progress} />}
            {journey.step === 'share' && <Share event={journey.event} quest={journey.quest} onShare={onShare} />}
            {journey.step === 'follow' && <FollowPeople following={journey.following} onFollowed={onFollowed} onNext={onFollowDone} />}
            {journey.step === 'react' && <ReactFirst name={name} />}
            {journey.step === 'post' && <PostFirst onShare={onShare} />}
          </div>

          {/* Over the right column (laptops up): this month */}
          <div className="hidden lg:flex flex-col gap-2 self-stretch">
            {month && (
              <Link href="/myhub#my-month" className="group my-auto block" aria-label={`เดือนนี้ ไปที่เที่ยว ${month.chill} แห่ง ไปตี้ ${month.connect} ครั้ง ดูในมายฮับ`}>
                <span className="block text-xs text-slate-500">เดือนนี้ของคุณ</span>
                <span className="mt-0.5 block text-xl font-bold text-slate-900 group-hover:opacity-80">
                  <span className="font-extrabold text-[#2D5A3C]">Chill</span> <span className="tabular-nums">{month.chill}</span>
                  <span className="mx-2 font-normal text-slate-300" aria-hidden="true">·</span>
                  <span className="font-extrabold text-[#D04A1B]">Connect</span> <span className="tabular-nums">{month.connect}</span>
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Zap className="w-3.5 h-3.5 text-[#7C3AED] fill-current" aria-hidden="true" />
                  <span className="font-semibold text-[#7C3AED] tabular-nums">{xp.toLocaleString()} XP</span>
                  <span aria-hidden="true">·</span>
                  <span className="group-hover:underline">ดูเดือนนี้ในมายฮับ</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

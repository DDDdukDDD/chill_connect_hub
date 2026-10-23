'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Camera, Check, Zap } from 'lucide-react';
import type { ChallengeQuest, EventItem } from '@/data/mockData';
import { isEventEnded } from '@/lib/dateUtils';
import type { QuestProgress } from '@/lib/useMyRewards';
import { EVIDENCE_HINTS, type QuestDetail } from '@/lib/questDisplay';
import type { ShareRequest } from '@/components/home/HomeMomentFeed';
import { DAY_MS, FALLBACK_IMAGE, Faces, awayLabel, dayLine, dayPart, endsAt, eventHref, startsAt, useGoingWith, useMinuteClock } from '@/components/home/planHelpers';

/**
 * The member journey on home: ① เลือกกิจกรรมที่ใช่ ② ออกไปใช้ชีวิต ③ แชร์โมเมนต์, the same three steps as the
 * landing hero and the end of onboarding. A cream band above the feed says which step the member is on and
 * gives the one next thing to do. It goes away for good once the member has shared a moment, or taps ข้าม.
 * Two flavours: a ตี้ (orange, Connect) or a challenge (violet, Chill); the member switches only at step ①.
 */

export const JOURNEY_STEPS = ['เลือกกิจกรรมที่ใช่', 'ออกไปใช้ชีวิต', 'แชร์โมเมนต์'] as const;

type Flavour = 'meetup' | 'challenge';

export type Journey =
  | { step: 'pick' }
  | { step: 'go-meetup'; event: EventItem }
  | { step: 'go-challenge'; quest: ChallengeQuest; progress: QuestProgress }
  | { step: 'share'; event?: EventItem; quest?: ChallengeQuest };

// Onboarding goals (app/onboarding/OnboardingFlow.tsx): "ทำชาเลนจ์สนุกๆ" asks for a challenge first; the meetup goals for a ตี้
const CHALLENGE_GOALS = ['earn_xp'];
const MEETUP_GOALS = ['find_friends', 'join_community'];
/** A ตี้ that ended this long ago still asks for its moment */
const SHARE_WINDOW_MS = 14 * DAY_MS;

const skipKey = (memberId: string) => `cch_journey_skipped_${memberId}`;

interface JourneyInput {
  memberId: string | null;
  now: number;
  /** Meetups and fairs the member joined or hosts, ended ones included */
  mine: EventItem[];
  questProgress: QuestProgress[];
  allQuests: ChallengeQuest[];
  isLoaded: boolean;
}

/** Which step the member is on; `journey` is null when the band is off (a moment shared, or skipped) */
export function useJourney({ memberId, now, mine, questProgress, allQuests, isLoaded }: JourneyInput) {
  const [momentCount, setMomentCount] = useState<number | null>(null);
  const [skipped, setSkipped] = useState<boolean | null>(null);

  useEffect(() => {
    if (!memberId) return;
    let alive = true;
    try {
      setSkipped(localStorage.getItem(skipKey(memberId)) === '1');
    } catch {
      setSkipped(false);
    }
    fetch('/api/moments?tab=mine&limit=1', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => alive && setMomentCount(Number(json?.pagination?.totalCount ?? 0)))
      .catch(() => alive && setMomentCount(0));
    return () => {
      alive = false;
    };
  }, [memberId]);

  const skip = useCallback(() => {
    setSkipped(true);
    try {
      if (memberId) localStorage.setItem(skipKey(memberId), '1');
    } catch {}
  }, [memberId]);
  const markPosted = useCallback(() => setMomentCount((count) => (count ?? 0) + 1), []);

  const journey = useMemo<Journey | null>(() => {
    if (skipped || (momentCount ?? 0) > 0) return null;
    const meetups = mine.filter((e) => (e.eventType || 'community') === 'community');
    // Over once its end time has passed ("06:30 - 08:00"), not only at the end of the day
    const isOver = (e: EventItem) => isEventEnded(e) || endsAt(e) <= now;
    const upcoming = meetups.filter((e) => !isOver(e)).sort((a, b) => startsAt(a) - startsAt(b));
    const ended = meetups
      .filter((e) => isOver(e) && now - endsAt(e) < SHARE_WINDOW_MS)
      .sort((a, b) => endsAt(b) - endsAt(a));
    const running = questProgress.filter((q) => q.joined && !q.completed);
    const questOf = (id: string) => allQuests.find((q) => q.id === id);
    const visited = running.find((q) => q.current > 0 && questOf(q.questId));
    const next = upcoming[0];

    // A ตี้ within a day comes first; then a moment for somewhere they went; then what is coming up
    if (next && startsAt(next) - now < DAY_MS) return { step: 'go-meetup', event: next };
    if (ended[0]) return { step: 'share', event: ended[0] };
    if (visited) return { step: 'share', quest: questOf(visited.questId) };
    if (next) return { step: 'go-meetup', event: next };
    const doing = running.find((q) => questOf(q.questId));
    if (doing) return { step: 'go-challenge', quest: questOf(doing.questId)!, progress: doing };
    return { step: 'pick' };
  }, [skipped, momentCount, mine, questProgress, allQuests, now]);

  const isReady = isLoaded && momentCount !== null && skipped !== null;
  return { journey: isReady ? journey : null, isReady, skip, markPosted };
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
};
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
  // The narrow left column (wide screens) lists the steps down, like a short checklist
  if (vertical) {
    return (
      <ol className="flex flex-col gap-2" aria-label="เส้นทางของคุณ">
        {JOURNEY_STEPS.map((label, i) => {
          const done = i < at;
          const here = i === at;
          const ring = here && i === 2 ? 'ring-[#F43F5E] text-[#E11D48]' : flavour === 'meetup' ? 'ring-[#F26430] text-[#D04A1B]' : 'ring-[#7C3AED] text-[#6D28D9]';
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
      {JOURNEY_STEPS.map((label, i) => {
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
        <img src={image} alt={alt} loading="lazy" className={`${PRINT} aspect-[4/3]`} />
        {sticker && <span className="absolute -top-2 -right-1.5 rotate-6 rounded-full bg-[#7C3AED] px-2 py-0.5 text-[11px] font-semibold text-white">{sticker}</span>}
      </span>
      <span className={`block mt-2 text-[11px] font-semibold ${whenClass}`}>{when}</span>
      <span className="block mt-0.5 text-[13px] font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{title}</span>
      {meta && <span className="block mt-0.5 text-xs text-slate-500 truncate">{meta}</span>}
    </Link>
  );
}

function Picks({ flavour, setFlavour, meetups, reasons, quests }: {
  flavour: Flavour; setFlavour: (f: Flavour) => void; meetups: EventItem[]; reasons: Record<string, string>; quests: ChallengeQuest[];
}) {
  const isMeetup = flavour === 'meetup';
  const allHref = isMeetup ? '/community?seats=open' : '/challenges';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">{isMeetup ? 'เลือกตี้แรกของคุณ' : 'เลือกชาเลนจ์แรกของคุณ'}</h2>
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
        <p className={`${HEADLINE} mt-0.5`}>แชร์โมเมนต์แรกของคุณ</p>
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

interface JourneyBandProps {
  name: string;
  now: number;
  journey: Journey;
  firstFlavour: Flavour;
  meetups: EventItem[];
  reasons: Record<string, string>;
  quests: ChallengeQuest[];
  /** This month's Chill (places) and Connect (meetups), shown on the right on laptops; null until it loads */
  month: { chill: number; connect: number } | null;
  xp: number;
  onShare: (request: Omit<ShareRequest, 'key'>) => void;
  onSkip: () => void;
}

/**
 * Laid on the member home's own three columns (MemberLiveHome) so it lines up with the page below:
 * greeting and progress over "ของฉัน", the step over the feed (same width), the month and ข้าม over the right column.
 */
export function JourneyBand({ name, now, journey, firstFlavour, meetups, reasons, quests, month, xp, onShare, onSkip }: JourneyBandProps) {
  const [picked, setPicked] = useState<Flavour | null>(null);
  const flavour: Flavour =
    journey.step === 'pick' ? picked ?? firstFlavour : journey.step === 'go-challenge' || (journey.step === 'share' && journey.quest) ? 'challenge' : 'meetup';
  const at = journey.step === 'pick' ? 0 : journey.step === 'share' ? 2 : 1;

  const skip = (
    <button type="button" onClick={onSkip} className="shrink-0 -mr-2 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-white/70 cursor-pointer" aria-label="ข้ามเส้นทางนี้ แล้วใช้หน้าแรกแบบปกติ">
      ข้าม
    </button>
  );
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
              <div className="flex items-start justify-between gap-3">
                {greeting}
                <span className="lg:hidden">{skip}</span>
              </div>
              <Tracker at={at} flavour={flavour} />
            </div>
            {journey.step === 'pick' && <Picks flavour={flavour} setFlavour={setPicked} meetups={meetups} reasons={reasons} quests={quests} />}
            {journey.step === 'go-meetup' && <GoMeetup event={journey.event} now={now} />}
            {journey.step === 'go-challenge' && <GoChallenge quest={journey.quest} progress={journey.progress} />}
            {journey.step === 'share' && <Share event={journey.event} quest={journey.quest} onShare={onShare} />}
          </div>

          {/* Over the right column (laptops up): this month, and ข้าม */}
          <div className="hidden lg:flex flex-col gap-2 self-stretch">
            <div className="flex justify-end">{skip}</div>
            {month && (
              <Link href="/myhub#my-month" className="group mt-auto mb-auto block" aria-label={`เดือนนี้ ไปที่เที่ยว ${month.chill} แห่ง ไปตี้ ${month.connect} ครั้ง ดูในมายฮับ`}>
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

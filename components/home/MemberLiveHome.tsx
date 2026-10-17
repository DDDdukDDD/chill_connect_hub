'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, CalendarDays, Camera, Flag, Gift, Zap } from 'lucide-react';
import type { ChallengeQuest, EventItem } from '@/data/mockData';
import type { QuestProgress } from '@/lib/useMyRewards';
import { parseEventDateToTimestamp } from '@/lib/dateUtils';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { HomeMomentFeed, type FeedView } from '@/components/home/HomeMomentFeed';
import { LiveTicker, useLiveActivity } from '@/components/home/LiveActivity';
import type { LifestyleSpotItem } from '@/data/spotsData';

const DAY_MS = 24 * 60 * 60 * 1000;
const COUNTDOWN_WITHIN_MS = 2 * DAY_MS;
const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80';

const startTime = (event: EventItem) => event.time.split('-')[0].trim().replace(/\s*น\.$/, '');

/** When the event starts, from its date and the first time in "06:30 - 08:00" */
function startsAt(event: EventItem) {
  const day = parseEventDateToTimestamp(event.date);
  const match = startTime(event).match(/^(\d{1,2})[:.](\d{2})/);
  return match ? day + (Number(match[1]) * 60 + Number(match[2])) * 60_000 : day;
}

// "ส. 17 ต.ค. · 06:30"
const dayLine = (event: EventItem) => `${WEEKDAYS[new Date(parseEventDateToTimestamp(event.date)).getDay()]} ${event.date.replace(/\s*\d{4}$/, '')} · ${startTime(event)}`;

/** "อีก 15 ชม. 42 นาที" inside two days, then "พรุ่งนี้" / "อีก 9 วัน" */
function awayLabel(event: EventItem, now: number) {
  const left = startsAt(event) - now;
  if (left <= 0) return 'เริ่มแล้ว';
  if (left < COUNTDOWN_WITHIN_MS) {
    const hours = Math.floor(left / 3_600_000);
    const minutes = Math.floor((left % 3_600_000) / 60_000);
    return hours > 0 ? `อีก ${hours} ชม. ${minutes} นาที` : `อีก ${minutes} นาที`;
  }
  return `อีก ${Math.ceil(left / DAY_MS)} วัน`;
}

/** A clock that ticks once a minute, for the countdown */
function useMinuteClock(start: number) {
  const [now, setNow] = useState(start);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

const eventHref = (event: EventItem) => `/${event.eventType === 'public_venue' ? 'fairs' : 'community'}/${encodeURIComponent(event.id)}`;

export interface MemberLiveHomeProps {
  name: string;
  avatar?: string;
  now: number;
  xp: number;
  badges: number;
  redeemable: number;
  nextEvent: EventItem | null;
  challenge: { quest: ChallengeQuest; progress: QuestProgress } | null;
  /** Challenges the member has joined and not finished */
  challengesDoing: number;
  savedCount: number;
  likedCategories: string[];
  isLoaded: boolean;
  /** Open meetups for this member, with "เพราะคุณชอบ…" reasons */
  meetups: EventItem[];
  reasons: Record<string, string>;
  isEventsLoaded: boolean;
  /** Running challenges the member has not joined, most people first */
  quests: ChallengeQuest[];
  /** Fairs, runs and concerts coming up (no attendee counts, AGENTS.md) and how to say their dates */
  fairs: EventItem[];
  fairWhen: (event: EventItem) => string;
  /** Places worth a visit, one per vibe in turn */
  spots: LifestyleSpotItem[];
  isSpotsLoaded: boolean;
}

/**
 * The home page for a signed-in member: a live social place.
 * Wide screens: ถัดไปของคุณ | moments from friends | what is happening now, meetups and challenges.
 * Laptops drop the left column (ถัดไปของคุณ moves above the feed); phones keep one column with the
 * live strip on top and meetups and challenges between the posts.
 */
export function MemberLiveHome(props: MemberLiveHomeProps) {
  const { name, avatar, xp, badges, redeemable } = props;
  const live = useLiveActivity();
  const [feedView, setFeedView] = useState<FeedView>('all');
  // A shortcut on the left switches the feed and brings it into view
  const showFeed = (view: FeedView) => {
    setFeedView(view);
    document.getElementById('home-feed')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
      {/* Greeting and points. On wide screens they move into the left column, so the feed starts at the top. */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-8 xl:hidden`}>
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-[28px] font-bold text-slate-900 tracking-tight truncate">สวัสดี {name}</h1>
          {/* Points as plain text, the rewards link on its own: one line each, nothing underlined */}
          <p className="mt-1 flex items-center gap-2 text-[13px] text-slate-600 whitespace-nowrap">
            <span className="inline-flex items-center gap-1 font-semibold text-[#7C3AED] tabular-nums">
              <Zap className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              {xp.toLocaleString()} XP
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span>{badges > 0 ? `${badges} เหรียญ` : 'ยังไม่มีเหรียญ'}</span>
          </p>
          <Link href="/rewards" className="mt-0.5 inline-block text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
            {redeemable > 0 ? `แลกของรางวัลได้ ${redeemable} อย่าง` : 'ดูของรางวัล'} →
          </Link>
        </div>
      </div>

      <div className="pt-6 sm:pt-8 xl:pt-0 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[260px_minmax(0,1fr)_320px] lg:gap-10">
        {/* Left (wide screens): what the member is doing */}
        {/* Scrolls on its own when taller than the screen, like the right column */}
        <aside className="hidden xl:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar space-y-8 pb-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight truncate">สวัสดี {name}</h1>
            {/* Points as plain text, the rewards link on its own: one line each, nothing underlined */}
            <p className="mt-1 flex items-center gap-2 text-[13px] text-slate-600 whitespace-nowrap">
              <span className="inline-flex items-center gap-1 font-semibold text-[#7C3AED] tabular-nums">
                <Zap className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                {xp.toLocaleString()} XP
              </span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span>{badges > 0 ? `${badges} เหรียญ` : 'ยังไม่มีเหรียญ'}</span>
            </p>
            <Link href="/rewards" className="mt-0.5 inline-block text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
              {redeemable > 0 ? `แลกของรางวัลได้ ${redeemable} อย่าง` : 'ดูของรางวัล'} →
            </Link>
          </div>
          <NextUp {...props} layout="column" />
          <Shortcuts {...props} feedView={feedView} onShowFeed={showFeed} />
        </aside>

        <main id="home-feed" className="min-w-0 w-full max-w-[560px] mx-auto scroll-mt-24">
          <div className="xl:hidden mb-8">
            <NextUp {...props} layout="row" />
          </div>
          <HomeMomentFeed
            view={feedView}
            onViewChange={setFeedView}
            name={name}
            avatar={avatar}
            top={<LiveTicker live={live} />}
            inserts={{
              1: (
                <section className="lg:hidden py-5 border-b border-slate-200">
                  <MeetupsBlock {...props} layout="tiles" />
                </section>
              ),
              3: (
                <section className="lg:hidden py-5 border-b border-slate-200">
                  <QuestsBlock {...props} />
                </section>
              ),
              5: (
                <section className="lg:hidden py-5 border-b border-slate-200">
                  <FairsBlock {...props} layout="tiles" />
                </section>
              ),
              7: (
                <section className="lg:hidden py-5 border-b border-slate-200">
                  <SpotsBlock {...props} layout="tiles" />
                </section>
              ),
            }}
          />
        </main>

        {/* Right (laptops and up): where to go next, one short list per kind */}
        <aside className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar space-y-8 pb-4">
          <MeetupsBlock {...props} layout="rows" />
          <QuestsBlock {...props} />
          <FairsBlock {...props} layout="rows" />
          <SpotsBlock {...props} layout="rows" />
        </aside>
      </div>
    </div>
  );
}

function NextUp({ now: start, nextEvent, challenge, likedCategories, isLoaded, layout }: MemberLiveHomeProps & { layout: 'column' | 'row' }) {
  const now = useMinuteClock(start);
  const liked = COMMUNITY_LIFESTYLE_CATEGORIES.filter((cat) => likedCategories.includes(cat.id));
  const isEmpty = isLoaded && !nextEvent && !challenge;
  const grid = layout === 'column' ? 'grid gap-3' : 'flex sm:grid sm:grid-cols-2 gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0';
  const card = layout === 'row' ? 'w-[280px] shrink-0 sm:w-auto' : '';

  return (
    <section aria-label="ถัดไปของคุณ">
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-slate-900">ถัดไปของคุณ</h2>
        <Link href="/myhub" className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">ดูตารางทั้งหมด</Link>
      </div>
      {!isLoaded ? (
        <div className={grid} aria-hidden="true">
          <div className={`h-[88px] rounded-2xl bg-slate-100 ${card}`} />
          <div className={`h-[88px] rounded-2xl bg-slate-100 ${card}`} />
        </div>
      ) : isEmpty ? (
        <div className="rounded-2xl bg-slate-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-900">ยังว่างอยู่เลย ลองหาตี้แรกกัน</p>
          {liked.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {liked.map((cat) => (
                <Link key={cat.id} href={`/community?category=${cat.id}`} className={`h-7 px-2.5 inline-flex items-center rounded-full text-xs font-bold ${cat.colorScheme.iconBg} ${cat.colorScheme.iconColor} hover:opacity-80`}>
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
          <Link href="/community" className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold whitespace-nowrap transition-colors">
            หาตี้แรกของคุณ
          </Link>
        </div>
      ) : (
        <div className={grid}>
          {nextEvent && (
            <Link href={eventHref(nextEvent)} className={`group flex items-center gap-3 rounded-2xl bg-[#FFF4EE] p-3 min-w-0 ${card}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={nextEvent.image || FALLBACK_IMAGE} alt="" className="w-16 h-16 shrink-0 rounded-xl object-cover bg-slate-100" />
              <span className="min-w-0 flex-1 space-y-0.5">
                <span className="inline-block rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#D04A1B] tabular-nums whitespace-nowrap">{awayLabel(nextEvent, now)}</span>
                <span className="block text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{nextEvent.title}</span>
                <span className="block text-xs text-slate-500 truncate">
                  {dayLine(nextEvent)}
                  {/* Fairs never show an attendee count (AGENTS.md) */}
                  {nextEvent.eventType === 'community' && ` · ไปด้วยกัน ${nextEvent.participantsCount} คน`}
                </span>
              </span>
            </Link>
          )}
          {challenge && (
            <Link href={`/challenges/${encodeURIComponent(challenge.quest.id)}`} className={`group flex items-center gap-3 rounded-2xl bg-[#F5F3FF] p-3 min-w-0 ${card}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={challenge.quest.image || challenge.quest.badgeCoverImg || FALLBACK_IMAGE} alt="" className="w-16 h-16 shrink-0 rounded-xl object-cover bg-slate-100" />
              <span className="min-w-0 flex-1 space-y-0.5">
                <span className="inline-block rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#6D28D9] whitespace-nowrap">
                  {challenge.quest.daysRemaining !== undefined && challenge.quest.daysRemaining > 0 ? `เหลือ ${challenge.quest.daysRemaining} วัน` : 'ชาเลนจ์ที่ทำอยู่'} · +{challenge.progress.rewardPoints.toLocaleString()} XP
                </span>
                <span className="block text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{challenge.quest.title}</span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 flex-1 rounded-full bg-white overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={challenge.progress.total} aria-valuenow={challenge.progress.current}>
                    <span className="block h-full bg-[#7C3AED]" style={{ width: `${Math.min(100, (challenge.progress.current / Math.max(1, challenge.progress.total)) * 100)}%` }} />
                  </span>
                  <span className="text-xs font-medium text-slate-500 tabular-nums">{challenge.progress.current}/{challenge.progress.total}</span>
                </span>
              </span>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function Shortcuts({ challengesDoing, savedCount, redeemable, feedView, onShowFeed }: MemberLiveHomeProps & { feedView: FeedView; onShowFeed: (view: FeedView) => void }) {
  // Pages elsewhere, and two views of the feed in the middle
  const items: { label: string; Icon: typeof Flag; box: string; count?: number; href?: string; view?: FeedView }[] = [
    { href: '/myhub', label: 'ตารางของฉัน', Icon: CalendarDays, box: 'bg-slate-100 text-slate-700' },
    { href: '/myhub', label: 'ชาเลนจ์ที่ทำอยู่', Icon: Flag, box: 'bg-[#F5F3FF] text-[#7C3AED]', count: challengesDoing },
    { href: '/myhub', label: 'ตี้และที่เที่ยวที่บันทึก', Icon: Bookmark, box: 'bg-slate-100 text-slate-700', count: savedCount },
    { view: 'mine', label: 'โมเมนต์ของฉัน', Icon: Camera, box: 'bg-[#FFF1F2] text-[#F43F5E]' },
    { view: 'saved', label: 'โมเมนต์ที่บันทึก', Icon: Bookmark, box: 'bg-[#FFF1F2] text-[#F43F5E]' },
    { href: '/rewards', label: 'ของรางวัล', Icon: Gift, box: 'bg-amber-50 text-amber-600', count: redeemable || undefined },
  ];
  const row = 'w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer';
  return (
    <nav aria-label="ทางลัด">
      <ul className="space-y-0.5">
        {items.map(({ href, view, label, Icon, box, count }) => {
          const inner = (
            <>
              <span className={`w-8 h-8 rounded-lg ${box} flex items-center justify-center shrink-0`} aria-hidden="true">
                <Icon className="w-4 h-4" />
              </span>
              <span className="flex-1 min-w-0 truncate">{label}</span>
              {count !== undefined && count > 0 && <span className="text-xs font-medium text-slate-400 tabular-nums">{count}</span>}
            </>
          );
          return (
            <li key={label}>
              {view ? (
                <button type="button" onClick={() => onShowFeed(feedView === view ? 'all' : view)} aria-pressed={feedView === view} className={`${row} ${feedView === view ? 'bg-[#FFF1F2]' : ''}`}>
                  {inner}
                </button>
              ) : (
                <Link href={href!} className={row}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const seatsLeft = (event: EventItem) => Math.max(0, event.maxParticipants - event.participantsCount);

function MeetupsBlock({ meetups, reasons, isEventsLoaded, layout }: MemberLiveHomeProps & { layout: 'rows' | 'tiles' }) {
  const shown = meetups.slice(0, layout === 'rows' ? 3 : 6);
  return (
    <section aria-label="ตี้แนะนำสำหรับคุณ">
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-slate-900">ตี้แนะนำสำหรับคุณ</h2>
        <Link href="/community" className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">ดูทั้งหมด</Link>
      </div>
      {!isEventsLoaded ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="text-sm font-medium text-slate-500">ตอนนี้ยังไม่มีตี้เปิดรับ ลองตั้งตี้เองดูไหม</p>
      ) : layout === 'rows' ? (
        <ul className="space-y-3.5">
          {shown.map((event) => (
            <li key={event.id}>
              <Link href={eventHref(event)} className="group flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.image || FALLBACK_IMAGE} alt="" className="w-14 h-14 shrink-0 rounded-xl object-cover bg-slate-100" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-[#D04A1B]">{dayLine(event)}</span>
                  <span className="block text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{event.title}</span>
                  <span className="block text-xs text-slate-500 truncate">
                    {reasons[event.id] ? `${reasons[event.id]} · ` : ''}เหลือ {seatsLeft(event)} ที่
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6">
          {shown.map((event) => (
            <Link key={event.id} href={eventHref(event)} className="group w-[200px] shrink-0 space-y-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.image || FALLBACK_IMAGE} alt="" className="w-full aspect-[4/3] rounded-2xl object-cover bg-slate-100" />
              <span className="block text-xs font-semibold text-[#D04A1B]">{dayLine(event)}</span>
              <span className="block text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{event.title}</span>
              <span className="block text-xs text-slate-500">เหลือ {seatsLeft(event)} ที่</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function QuestsBlock({ quests }: MemberLiveHomeProps) {
  if (quests.length === 0) return null;
  return (
    <section aria-label="ชาเลนจ์ที่เพื่อนๆ กำลังทำ">
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-slate-900">ชาเลนจ์ที่เพื่อนๆ กำลังทำ</h2>
        <Link href="/challenges" className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">ดูทั้งหมด</Link>
      </div>
      <ul className="space-y-3.5">
        {quests.slice(0, 3).map((quest) => (
          <li key={quest.id}>
            <Link href={`/challenges/${encodeURIComponent(quest.id)}`} className="group flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={quest.image || quest.badgeCoverImg || FALLBACK_IMAGE} alt="" className="w-14 h-14 shrink-0 rounded-xl object-cover bg-slate-100" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{quest.title}</span>
                <span className="block text-xs text-slate-500">
                  {(quest.participantsCount ?? 0) > 0 ? `กำลังทำ ${(quest.participantsCount ?? 0).toLocaleString()} คน` : 'ยังไม่มีใครเริ่ม เป็นคนแรกเลย'}
                  {quest.daysRemaining !== undefined && quest.daysRemaining > 0 && ` · เหลือ ${quest.daysRemaining} วัน`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface ListItem {
  key: string;
  href: string;
  image: string;
  kicker?: string;
  title: string;
  sub: string;
}

/** A short titled list: rows in the right column, a sideways row of photos between posts on phones */
function ItemsBlock({ title, href, items, kickerClass, layout }: { title: string; href: string; items: ListItem[]; kickerClass: string; layout: 'rows' | 'tiles' }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title}>
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <Link href={href} className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">ดูทั้งหมด</Link>
      </div>
      {layout === 'rows' ? (
        <ul className="space-y-3.5">
          {items.slice(0, 3).map((item) => (
            <li key={item.key}>
              <Link href={item.href} className="group flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image || FALLBACK_IMAGE} alt="" className="w-14 h-14 shrink-0 rounded-xl object-cover bg-slate-100" />
                <span className="min-w-0 flex-1">
                  {item.kicker && <span className={`block text-xs font-semibold ${kickerClass}`}>{item.kicker}</span>}
                  <span className="block text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{item.title}</span>
                  <span className="block text-xs text-slate-500 truncate">{item.sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6">
          {items.slice(0, 6).map((item) => (
            <Link key={item.key} href={item.href} className="group w-[200px] shrink-0 space-y-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image || FALLBACK_IMAGE} alt="" className="w-full aspect-[4/3] rounded-2xl object-cover bg-slate-100" />
              {item.kicker && <span className={`block text-xs font-semibold ${kickerClass}`}>{item.kicker}</span>}
              <span className="block text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{item.title}</span>
              <span className="block text-xs text-slate-500 truncate">{item.sub}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function FairsBlock({ fairs, fairWhen, layout }: MemberLiveHomeProps & { layout: 'rows' | 'tiles' }) {
  const items = fairs.map((fair) => ({ key: fair.id, href: eventHref(fair), image: fair.image, kicker: fairWhen(fair), title: fair.title, sub: fair.location }));
  return <ItemsBlock title="งานแฟร์ งานวิ่ง งานคอน ช่วงนี้" href="/fairs" items={items} kickerClass="text-[#2B527A]" layout={layout} />;
}

function SpotsBlock({ spots, layout }: MemberLiveHomeProps & { layout: 'rows' | 'tiles' }) {
  const items = spots.map((spot) => ({ key: spot.id, href: `/spots/${encodeURIComponent(spot.id)}`, image: spot.image, title: spot.title, sub: [spot.district, spot.province].filter(Boolean).join(', ') }));
  return <ItemsBlock title="ที่เที่ยวน่าไป" href="/spots" items={items} kickerClass="text-[#4A7C59]" layout={layout} />;
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, CalendarDays, Gift, Stamp, Zap } from 'lucide-react';
import type { ChallengeQuest, EventItem } from '@/data/mockData';
import { nearDayLabel, parseEventDateToTimestamp } from '@/lib/dateUtils';
import { nameInitial } from '@/lib/displayName';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { HomeMomentFeed, type FeedView } from '@/components/home/HomeMomentFeed';
import { LiveTicker, useLiveActivity } from '@/components/home/LiveActivity';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { PASSPORT_HREF } from '@/components/home/StampPassport';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const WEEKDAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80';
const FACE_COLORS = ['bg-amber-500', 'bg-pink-500', 'bg-sky-500'];
const MY_MONTH_HREF = '/myhub#my-month';

const startTime = (event: EventItem) => event.time.split('-')[0].trim().replace(/\s*น\.$/, '');

/** When the event starts, from its date and the first time in "06:30 - 08:00" */
function startsAt(event: EventItem) {
  const day = parseEventDateToTimestamp(event.date);
  const match = startTime(event).match(/^(\d{1,2})[:.](\d{2})/);
  return match ? day + (Number(match[1]) * 60 + Number(match[2])) * 60_000 : day;
}

// "ส. 17 ต.ค. · 06:30", or "วันนี้ · 06:30" / "พรุ่งนี้ · 06:30" when it is that close
const dayLine = (event: EventItem) =>
  `${nearDayLabel(event.date) ?? `${WEEKDAYS[new Date(parseEventDateToTimestamp(event.date)).getDay()]} ${event.date.replace(/\s*\d{4}$/, '')}`} · ${startTime(event)}`;

/** "อีก 15 ชม. 42 นาที" inside a day, then "อีก 2 วัน 6 ชม." */
function awayLabel(event: EventItem, now: number) {
  const left = startsAt(event) - now;
  if (left <= 0) return 'เริ่มแล้ว';
  if (left < DAY_MS) {
    const hours = Math.floor(left / 3_600_000);
    const minutes = Math.floor((left % 3_600_000) / 60_000);
    return hours > 0 ? `อีก ${hours} ชม. ${minutes} นาที` : `อีก ${minutes} นาที`;
  }
  const days = Math.floor(left / DAY_MS);
  const hours = Math.floor((left % DAY_MS) / 3_600_000);
  return hours > 0 ? `อีก ${days} วัน ${hours} ชม.` : `อีก ${days} วัน`;
}

/** "บ่ายวันอาทิตย์": the greeting carries the time of day instead of a coloured theme */
function dayPart(now: number) {
  const date = new Date(now);
  const hour = date.getHours();
  const part = hour >= 5 && hour < 11 ? 'เช้า' : hour >= 11 && hour < 16 ? 'บ่าย' : hour >= 16 && hour < 19 ? 'เย็น' : 'ค่ำ';
  return `${part}วัน${WEEKDAY_NAMES[date.getDay()]}`;
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

/** Who else is going to a meetup (the list is open to everyone), for the faces on a row */
function useGoingWith(eventId: string, enabled: boolean) {
  const [people, setPeople] = useState<{ name: string; avatar: string }[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetch(`/api/events/${encodeURIComponent(eventId)}/attendees`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (alive && json?.success) setPeople((json.attendees as { name: string; avatar: string; isMe?: boolean }[]).filter((p) => !p.isMe));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [eventId, enabled]);
  return people;
}

const eventHref = (event: EventItem) => `/${event.eventType === 'public_venue' ? 'fairs' : 'community'}/${encodeURIComponent(event.id)}`;

export interface MemberLiveHomeProps {
  name: string;
  avatar?: string;
  now: number;
  xp: number;
  badges: number;
  redeemable: number;
  /** What the member goes to next (joined, hosted, saved fairs), soonest first, at most three */
  plans: EventItem[];
  /** Ids among the plans the member hosts, and fairs they only saved */
  hostedIds: string[];
  savedIds: string[];
  /** This month's count behind "Chill · Connect"; null until it loads */
  month: { chill: number; connect: number } | null;
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
  /** Finished challenges: the stamps in the passport, which lives in My Hub */
  stampCount: number;
}

/**
 * The home page for a signed-in member: a live social place about friends and what is happening.
 * What the member manages themselves (the schedule, challenges under way, the month) lives in My Hub; home shows
 * a short summary that leads there.
 * Wide screens: me | moments from friends | where to go next. Laptops drop the left column (greeting and
 * ถัดไปของคุณ move above the feed, in the feed's column); phones keep one column with picks between the posts.
 * Without plans the feed still comes first: the first-meetup picks sit after the first post, never in front of it.
 */
export function MemberLiveHome(props: MemberLiveHomeProps) {
  const { name, plans, isLoaded } = props;
  const live = useLiveActivity();
  const [feedView, setFeedView] = useState<FeedView>('all');
  const hasPlans = plans.length > 0;
  const showPicks = isLoaded && !hasPlans;

  return (
    <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[260px_minmax(0,1fr)_320px] lg:gap-10">
        {/* Left (wide screens): me, my next plans, shortcuts (the stamp passport opens in My Hub) */}
        {/* Scrolls on its own when taller than the screen, like the right column */}
        <aside className="hidden xl:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar space-y-8 pb-4">
          <Greeting {...props} layout="column" />
          <NextUp {...props} />
          <Shortcuts {...props} />
        </aside>

        <main id="home-feed" className="min-w-0 w-full max-w-[560px] mx-auto scroll-mt-24">
          {/* Below wide screens the greeting and plans sit in the feed's own column, on its left edge */}
          <div className="xl:hidden mb-7 space-y-6">
            <Greeting {...props} layout="row" />
            <NextUp {...props} />
          </div>
          <HomeMomentFeed
            view={feedView}
            onViewChange={setFeedView}
            name={name}
            avatar={props.avatar}
            top={<LiveTicker live={live} />}
            inserts={{
              // Without plans, picks for a first meetup come right after the first post, on every screen size
              0: showPicks ? (
                <section className="py-5 border-y border-slate-100 my-2">
                  <FirstPicks {...props} />
                </section>
              ) : undefined,
              1: !showPicks && props.meetups[0] ? (
                <section className="lg:hidden py-5 border-b border-slate-200">
                  <InvitePost event={props.meetups[0]} reason={props.reasons[props.meetups[0].id]} />
                </section>
              ) : undefined,
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
              6: !showPicks && props.meetups[1] ? (
                <section className="lg:hidden py-5 border-b border-slate-200">
                  <InvitePost event={props.meetups[1]} reason={props.reasons[props.meetups[1].id]} />
                </section>
              ) : undefined,
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
          <MeetupsBlock {...props} />
          <QuestsBlock {...props} />
          <FairsBlock {...props} layout="rows" />
          <SpotsBlock {...props} layout="rows" />
        </aside>
      </div>
    </div>
  );
}

/**
 * "สวัสดี Duke" with this month's Chill (places) and Connect (meetups), which open the month in My Hub.
 * The words keep their brand colours even at 0; before anything counts, one line says how the first one comes.
 */
function Greeting({ name, now, xp, redeemable, month, plans, layout }: MemberLiveHomeProps & { layout: 'row' | 'column' }) {
  const isNew = month !== null && month.chill + month.connect === 0;
  const counter = month && (
    <Link href={MY_MONTH_HREF} className={`font-bold whitespace-nowrap text-slate-900 hover:opacity-80 ${layout === 'row' ? 'text-sm' : 'text-xl'}`} aria-label={`เดือนนี้ ไปที่เที่ยว ${month.chill} แห่ง ไปตี้ ${month.connect} ครั้ง ดูในมายฮับ`}>
      {/* The two words are the brand's: Latin, heavier than the Thai around them */}
      <span className="font-extrabold text-[#2D5A3C]">Chill</span> <span className="tabular-nums">{month.chill}</span>
      <span className="mx-1.5 font-normal text-slate-300" aria-hidden="true">·</span>
      <span className="font-extrabold text-[#D04A1B]">Connect</span> <span className="tabular-nums">{month.connect}</span>
      {layout === 'row' && <span className="ml-1 font-normal text-slate-400" aria-hidden="true">›</span>}
    </Link>
  );
  const nudge = isNew && plans.length === 0 && (
    <p className="mt-1 text-[13px] text-slate-600">
      ไปตี้แรก = <span className="font-extrabold text-[#D04A1B]">Connect</span> แรกของคุณ รับ <span className="font-semibold text-[#7C3AED]">+50 XP</span>
    </p>
  );

  if (layout === 'row') {
    return (
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{dayPart(now)}</p>
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-[22px] sm:text-2xl font-bold text-slate-900 tracking-tight truncate">สวัสดี {name}</h1>
          {counter}
        </div>
        {nudge}
      </div>
    );
  }
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{dayPart(now)}</p>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight truncate">สวัสดี {name}</h1>
      <div className="mt-2">{counter}</div>
      {nudge || (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
          <Zap className="w-3.5 h-3.5 text-[#7C3AED] fill-current" aria-hidden="true" />
          <span className="font-semibold text-[#7C3AED] tabular-nums">{xp.toLocaleString()} XP</span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <Link href="/rewards" className="font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
            {redeemable > 0 ? `แลกของรางวัลได้ ${redeemable} อย่าง` : 'ดูของรางวัล'}
          </Link>
        </p>
      )}
    </div>
  );
}

/** Up to three next plans as quiet rows, like the lists in the right column. Only the soonest has a countdown. */
function NextUp(props: MemberLiveHomeProps) {
  const { plans, isLoaded } = props;
  const now = useMinuteClock(props.now);
  if (!isLoaded) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }
  if (plans.length === 0) return null;
  return (
    <section aria-label="ถัดไปของคุณ">
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-slate-900">ถัดไปของคุณ</h2>
        <Link href="/myhub" className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">ดูตารางทั้งหมด</Link>
      </div>
      <ul className="space-y-3.5">
        {plans.map((event, i) => (
          <PlanRow key={event.id} event={event} countdown={i === 0 ? awayLabel(event, now) : null} {...props} />
        ))}
      </ul>
    </section>
  );
}

function PlanRow({ event, countdown, hostedIds, savedIds, fairWhen }: MemberLiveHomeProps & { event: EventItem; countdown: string | null }) {
  const isFair = event.eventType === 'public_venue';
  const isHost = hostedIds.includes(event.id);
  // Fairs never show who is going (AGENTS.md); meetups show a few faces
  const people = useGoingWith(event.id, !isFair);
  const when = isFair ? fairWhen(event) : dayLine(event);
  const others = Math.max(0, event.participantsCount - 1);

  return (
    <li>
      <Link href={eventHref(event)} className="group flex items-center gap-3 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.image || FALLBACK_IMAGE} alt="" className="w-14 h-14 shrink-0 rounded-xl object-cover bg-slate-100" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 min-w-0">
            {countdown && <span className="shrink-0 rounded-full bg-[#FFF4EE] px-2 py-0.5 text-[11px] font-semibold text-[#D04A1B] tabular-nums whitespace-nowrap">{countdown}</span>}
            <span className={`text-xs truncate ${countdown ? 'text-slate-500' : isFair ? 'font-semibold text-[#2B527A]' : 'font-semibold text-[#D04A1B]'}`}>{when}</span>
          </span>
          <span className="block mt-0.5 text-sm font-semibold text-slate-900 leading-snug truncate group-hover:underline">{event.title}</span>
          {isFair ? (
            <span className="block text-xs text-slate-500 truncate">
              {event.location}
              {savedIds.includes(event.id) && ' · งานที่บันทึกไว้'}
            </span>
          ) : (
            <span className="mt-0.5 flex items-center gap-1.5 min-w-0">
              {people && people.length > 0 && <Faces people={people.slice(0, 3)} />}
              <span className="text-xs text-slate-500 truncate">{isHost ? `คุณเป็นเจ้าภาพ · มา ${event.participantsCount} คน` : others > 0 ? `ไปด้วยกัน ${others} คน` : 'คุณเป็นคนแรกที่ไป'}</span>
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

function Faces({ people }: { people: { name: string; avatar?: string }[] }) {
  return (
    <span className="flex -space-x-1.5 shrink-0" aria-hidden="true">
      {people.map((p, i) =>
        p.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={p.avatar} alt="" className="w-5 h-5 rounded-full ring-2 ring-white object-cover bg-slate-100" />
        ) : (
          <span key={i} className={`w-5 h-5 rounded-full ring-2 ring-white ${FACE_COLORS[i % FACE_COLORS.length]} text-white text-[9px] font-bold flex items-center justify-center`}>
            {nameInitial(p.name)}
          </span>
        )
      )}
    </span>
  );
}

/** Seats as dots: filled for taken, open rings for free (meetups hold 2 to 15) */
function SeatDots({ event }: { event: EventItem }) {
  const total = Math.min(15, Math.max(event.maxParticipants, event.participantsCount));
  const taken = Math.min(total, event.participantsCount);
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`w-2 h-2 rounded-full ${i < taken ? 'bg-[#F26430]' : 'border-[1.5px] border-[#F26430]/40'}`} />
      ))}
    </span>
  );
}

const seatsLeft = (event: EventItem) => Math.max(0, event.maxParticipants - event.participantsCount);

/** A meetup between the posts, told as an invite from its host: their face, the seats, one way in */
function InvitePost({ event, reason }: { event: EventItem; reason?: string }) {
  const left = seatsLeft(event);
  return (
    <article aria-label={`${event.hostName} ชวนไป ${event.title}`}>
      <div className="flex items-center gap-3">
        {event.hostAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.hostAvatar} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100 shrink-0" />
        ) : (
          <span className="w-10 h-10 rounded-full bg-[#FFF4EE] text-[#D04A1B] text-sm font-bold flex items-center justify-center shrink-0" aria-hidden="true">{nameInitial(event.hostName)}</span>
        )}
        <div className="min-w-0">
          <p className="text-sm text-slate-900 truncate">
            <span className="font-semibold">{event.hostName}</span> ชวนไปด้วยกัน
          </p>
          {reason && <p className="text-xs text-slate-500 truncate">{reason}</p>}
        </div>
      </div>
      <div className="mt-3 rounded-3xl overflow-hidden border border-slate-200">
        <Link href={eventHref(event)} className="block relative aspect-[4/3] bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.image || FALLBACK_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-white/95 backdrop-blur h-7 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F26430]" aria-hidden="true" />
            ตี้
          </span>
        </Link>
        <div className="p-4">
          <p className="text-xs font-semibold text-[#D04A1B]">{dayLine(event)}</p>
          <Link href={eventHref(event)} className="mt-0.5 block text-base font-bold text-slate-900 leading-snug hover:underline">{event.title}</Link>
          <div className="mt-3 flex items-center gap-2">
            <SeatDots event={event} />
            <span className="text-xs text-slate-600 tabular-nums">{left > 0 ? `เหลือ ${left} ที่` : 'เต็มแล้ว'}</span>
          </div>
          {/* Joining asks for the safety checks on the meetup page, so the button opens it */}
          <Link href={eventHref(event)} className="mt-4 flex items-center justify-center h-10 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors">
            ขอไปด้วย
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Without plans: three open meetups from the สาย the member liked, as a sideways row inside the feed */
function FirstPicks({ meetups, likedCategories, xp }: MemberLiveHomeProps) {
  const liked = COMMUNITY_LIFESTYLE_CATEGORIES.filter((cat) => likedCategories.includes(cat.id));
  const picks = meetups.slice(0, 3);
  if (picks.length === 0) return null;
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">{xp === 0 ? 'ตี้แรกของคุณ เลือกเลย' : 'ตี้ต่อไปของคุณ เลือกเลย'}</h2>
        <Link href="/community" className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">ดูทั้งหมด</Link>
      </div>
      {liked.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          เพราะคุณชอบ
          {liked.map((cat) => (
            <Link key={cat.id} href={`/community?category=${cat.id}`} className="h-6 px-2 inline-flex items-center rounded-full bg-[#FFF4EE] text-[#D04A1B] font-semibold hover:opacity-80">
              {cat.name}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {picks.map((event) => (
          <Link key={event.id} href={eventHref(event)} className="group relative w-[150px] sm:w-auto sm:flex-1 shrink-0 aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.image || FALLBACK_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" aria-hidden="true" />
            <span className="absolute left-3 right-3 bottom-3 text-white">
              <span className="block text-[11px] text-white/80">{dayLine(event)}</span>
              <span className="block text-[13px] font-bold leading-snug line-clamp-2">{event.title}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * "ของฉัน": the four places a member goes back to, all outside this page. Own and saved moments are not here;
 * they are views of the feed, in its ··· menu.
 */
function Shortcuts({ savedCount, redeemable, stampCount }: MemberLiveHomeProps) {
  const items: { href: string; label: string; Icon: typeof Gift; box: string; count?: number }[] = [
    { href: '/myhub', label: 'ตารางของฉัน', Icon: CalendarDays, box: 'bg-slate-100 text-slate-700' },
    { href: PASSPORT_HREF, label: 'พาสปอร์ตของฉัน', Icon: Stamp, box: 'bg-[#F5F3FF] text-[#7C3AED]', count: stampCount },
    { href: '/myhub', label: 'ตี้และที่เที่ยวที่บันทึก', Icon: Bookmark, box: 'bg-slate-100 text-slate-700', count: savedCount },
    { href: '/rewards', label: 'ของรางวัล', Icon: Gift, box: 'bg-amber-50 text-amber-600', count: redeemable },
  ];
  return (
    <nav aria-labelledby="home-shortcuts-title">
      <h2 id="home-shortcuts-title" className="text-base font-bold text-slate-900 mb-2">ของฉัน</h2>
      <ul>
        {items.map(({ href, label, Icon, box, count }) => (
          <li key={label}>
            <Link href={href} className="-mx-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
              <span className={`w-7 h-7 rounded-lg ${box} flex items-center justify-center shrink-0`} aria-hidden="true">
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="flex-1 min-w-0 truncate">{label}</span>
              {count !== undefined && count > 0 && <span className="text-xs font-medium text-slate-400 tabular-nums">{count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Right column: open meetups told as invites, the host's face on the photo and the seats as dots */
function MeetupsBlock({ meetups, isEventsLoaded }: MemberLiveHomeProps) {
  const shown = meetups.slice(0, 3);
  return (
    <section aria-label="ชวนไปด้วยกัน">
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-slate-900">ชวนไปด้วยกัน</h2>
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
      ) : (
        <ul className="space-y-4">
          {shown.map((event) => (
            <li key={event.id}>
              <Link href={eventHref(event)} className="group flex items-center gap-3 min-w-0">
                <span className="relative w-14 h-14 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.image || FALLBACK_IMAGE} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100" />
                  {event.hostAvatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.hostAvatar} alt="" className="absolute -right-1.5 -bottom-1.5 w-6 h-6 rounded-full ring-2 ring-white object-cover bg-slate-100" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-slate-500 truncate">
                    <span className="font-semibold text-slate-700">{event.hostName}</span> ชวนไป · <span className="text-[#D04A1B] font-semibold">{dayLine(event)}</span>
                  </span>
                  <span className="block text-sm font-semibold text-slate-900 leading-snug truncate group-hover:underline">{event.title}</span>
                  <span className="mt-1 flex items-center gap-1.5">
                    <SeatDots event={event} />
                    <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">เหลือ {seatsLeft(event)} ที่</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The running challenges most people are doing (the list comes sorted by participants) */
function QuestsBlock({ quests }: MemberLiveHomeProps) {
  if (quests.length === 0) return null;
  return (
    <section aria-label="ชาเลนจ์ยอดฮิตตอนนี้">
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-slate-900">ชาเลนจ์ยอดฮิตตอนนี้</h2>
        <Link href="/challenges" className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">ดูทั้งหมด</Link>
      </div>
      <ul className="space-y-4">
        {quests.slice(0, 3).map((quest) => (
          <li key={quest.id}>
            <Link href={`/challenges/${encodeURIComponent(quest.id)}`} className="group flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={quest.image || quest.badgeCoverImg || FALLBACK_IMAGE} alt="" className="w-14 h-14 shrink-0 rounded-xl object-cover bg-slate-100" />
              <span className="min-w-0 flex-1">
                {/* Same three lines as every row in this column: when, what, who */}
                {quest.daysRemaining !== undefined && quest.daysRemaining > 0 && (
                  <span className="block text-xs font-semibold text-[#7C3AED] tabular-nums">เหลือ {quest.daysRemaining} วัน</span>
                )}
                <span className="block text-sm font-semibold text-slate-900 leading-snug truncate group-hover:underline">{quest.title}</span>
                <span className="block text-xs text-slate-500 truncate">
                  {(quest.participantsCount ?? 0) > 0 ? `กำลังทำ ${(quest.participantsCount ?? 0).toLocaleString()} คน` : 'ยังไม่มีใครเริ่ม เป็นคนแรกเลย'}
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
        <ul className="space-y-4">
          {items.slice(0, 3).map((item) => (
            <li key={item.key}>
              <Link href={item.href} className="group flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image || FALLBACK_IMAGE} alt="" className="w-14 h-14 shrink-0 rounded-xl object-cover bg-slate-100" />
                {/* One title line, like the meetup rows above, so every row in the column has the same height */}
                <span className="min-w-0 flex-1">
                  {item.kicker && <span className={`block text-xs font-semibold ${kickerClass}`}>{item.kicker}</span>}
                  <span className="block text-sm font-semibold text-slate-900 leading-snug truncate group-hover:underline">{item.title}</span>
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

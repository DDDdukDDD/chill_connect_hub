'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, CalendarDays, Gift, Stamp, Zap } from 'lucide-react';
import type { ChallengeQuest, EventItem } from '@/data/mockData';
import { nameInitial } from '@/lib/displayName';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { HomeMomentFeed, type FeedView, type ShareRequest } from '@/components/home/HomeMomentFeed';
import { JourneyBand, flavourFromGoals, isSocialOnly, useJourney } from '@/components/home/JourneyBand';
import type { QuestProgress } from '@/lib/useMyRewards';
import { LiveTicker, useLiveActivity } from '@/components/home/LiveActivity';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { PASSPORT_HREF } from '@/components/home/StampPassport';
import { FALLBACK_IMAGE, Faces, awayLabel, dayLine, dayPart, eventHref, useGoingWith, useMinuteClock } from '@/components/home/planHelpers';

const MY_MONTH_HREF = '/myhub#my-month';

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
  /** For the journey band: who is signed in, their onboarding goals, every meetup they joined or host (ended ones too),
      their challenge progress and every challenge */
  memberId: string | null;
  goals: string[];
  mine: EventItem[];
  questProgress: QuestProgress[];
  allQuests: ChallengeQuest[];
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
  // A new member gets the journey band (① เลือก ② ไป ③ แชร์) in place of the greeting and plans, until their first moment
  const { journey, skip, markPosted, followed, finishFollow } = useJourney({
    memberId: props.memberId,
    socialOnly: isSocialOnly(props.goals),
    now: props.now,
    mine: props.mine,
    questProgress: props.questProgress,
    allQuests: props.allQuests,
    isLoaded,
  });
  const [shareRequest, setShareRequest] = useState<ShareRequest | null>(null);
  // The band already offers first picks, so the picks between posts wait until it is gone
  const showPicks = isLoaded && !hasPlans && !journey;

  return (
    <>
    {journey && (
      <JourneyBand
        name={name}
        memberId={props.memberId}
        now={props.now}
        journey={journey}
        firstFlavour={flavourFromGoals(props.goals)}
        meetups={props.meetups}
        reasons={props.reasons}
        quests={props.quests}
        month={props.month}
        xp={props.xp}
        onShare={(request) => setShareRequest({ ...request, key: Date.now() })}
        onSkip={skip}
        onFollowed={followed}
        onFollowDone={finishFollow}
      />
    )}
    <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[260px_minmax(0,1fr)_320px] 2xl:grid-cols-[300px_minmax(0,1fr)_360px] lg:gap-10">
        {/* Left (wide screens): me, my next plans, shortcuts (the stamp passport opens in My Hub) */}
        {/* Scrolls on its own when taller than the screen, like the right column */}
        <aside className="hidden xl:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar space-y-8 pb-4">
          {!journey && (
            <>
              <Greeting {...props} layout="column" />
              <NextUp {...props} />
            </>
          )}
          <Shortcuts {...props} />
        </aside>

        <main id="home-feed" className="min-w-0 w-full max-w-[560px] 2xl:max-w-[600px] mx-auto scroll-mt-24">
          {/* Below wide screens the greeting and plans sit in the feed's own column, on its left edge */}
          {!journey && (
            <div className="xl:hidden mb-7 space-y-6">
              <Greeting {...props} layout="row" />
              <NextUp {...props} />
            </div>
          )}
          <HomeMomentFeed
            view={feedView}
            onViewChange={setFeedView}
            shareRequest={shareRequest}
            onPosted={markPosted}
            name={name}
            avatar={props.avatar}
            inserts={{
              // After the first post: the live line ("สด"), so the feed opens on a post rather than a stack of controls;
              // then, without plans, picks for a first meetup, on every screen size
              0: (
                <>
                  <div className="py-3">
                    <LiveTicker live={live} />
                  </div>
                  {showPicks && (
                    <section className="py-5 border-y border-slate-100 my-2">
                      <FirstPicks {...props} />
                    </section>
                  )}
                </>
              ),
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
        <aside className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar space-y-11 pb-4">
          <MeetupsBlock {...props} skip={journey?.step === 'pick' ? 3 : 0} />
          <QuestsBlock {...props} />
          <FairsBlock {...props} layout="rows" />
          <SpotsBlock {...props} layout="rows" />
        </aside>
      </div>
    </div>
    </>
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

// Right column rows, kept calm (owner 2026-10-20): only the section headings are bold; a row is a quiet grey line with a
// small dot in its pillar colour, a regular-weight title that may take two lines, and one grey detail line
const VIEW_ALL = 'text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:underline whitespace-nowrap';
const ROW_TITLE = 'block mt-0.5 text-sm font-medium text-slate-800 leading-snug line-clamp-2 group-hover:underline';

function Kicker({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 tabular-nums min-w-0">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Right column: open meetups told as invites, the host's face on the photo. `skip` leaves out the ones the journey band shows. */
function MeetupsBlock({ meetups, isEventsLoaded, skip = 0 }: MemberLiveHomeProps & { skip?: number }) {
  const shown = meetups.slice(skip, skip + 3);
  return (
    <section aria-label="ชวนไปด้วยกัน">
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-slate-900">ชวนไปด้วยกัน</h2>
        <Link href="/community" className={VIEW_ALL}>ดูทั้งหมด</Link>
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
        <ul className="space-y-5">
          {shown.map((event) => (
            <li key={event.id}>
              <Link href={eventHref(event)} className="group flex items-start gap-3 min-w-0">
                <span className="relative w-14 h-14 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.image || FALLBACK_IMAGE} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100" />
                  {event.hostAvatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.hostAvatar} alt="" className="absolute -right-1.5 -bottom-1.5 w-6 h-6 rounded-full ring-2 ring-white object-cover bg-slate-100" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <Kicker dot="bg-[#F26430]">{dayLine(event)}</Kicker>
                  <span className={ROW_TITLE}>{event.title}</span>
                  <span className="block mt-0.5 text-xs text-slate-500 truncate">
                    {event.hostName} ชวนไป · เหลือ {seatsLeft(event)} ที่
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
        <Link href="/challenges" className={VIEW_ALL}>ดูทั้งหมด</Link>
      </div>
      <ul className="space-y-5">
        {quests.slice(0, 3).map((quest) => (
          <li key={quest.id}>
            <Link href={`/challenges/${encodeURIComponent(quest.id)}`} className="group flex items-start gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={quest.image || quest.badgeCoverImg || FALLBACK_IMAGE} alt="" className="w-14 h-14 shrink-0 rounded-xl object-cover bg-slate-100" />
              <span className="min-w-0 flex-1">
                {/* Same three lines as every row in this column: when, what, who */}
                {quest.daysRemaining !== undefined && quest.daysRemaining > 0 && <Kicker dot="bg-[#7C3AED]">เหลือ {quest.daysRemaining} วัน</Kicker>}
                <span className={ROW_TITLE}>{quest.title}</span>
                <span className="block mt-0.5 text-xs text-slate-500 truncate">
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
function ItemsBlock({ title, href, items, dot, layout }: { title: string; href: string; items: ListItem[]; dot: string; layout: 'rows' | 'tiles' }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title}>
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <Link href={href} className={VIEW_ALL}>ดูทั้งหมด</Link>
      </div>
      {layout === 'rows' ? (
        <ul className="space-y-5">
          {items.slice(0, 3).map((item) => (
            <li key={item.key}>
              <Link href={item.href} className="group flex items-start gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image || FALLBACK_IMAGE} alt="" className="w-14 h-14 shrink-0 rounded-xl object-cover bg-slate-100" />
                <span className="min-w-0 flex-1">
                  {item.kicker && <Kicker dot={dot}>{item.kicker}</Kicker>}
                  <span className={ROW_TITLE}>{item.title}</span>
                  <span className="block mt-0.5 text-xs text-slate-500 truncate">{item.sub}</span>
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
              {item.kicker && <Kicker dot={dot}>{item.kicker}</Kicker>}
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
  return <ItemsBlock title="งานแฟร์ งานวิ่ง งานคอน ช่วงนี้" href="/fairs" items={items} dot="bg-[#2B527A]" layout={layout} />;
}

function SpotsBlock({ spots, layout }: MemberLiveHomeProps & { layout: 'rows' | 'tiles' }) {
  const items = spots.map((spot) => ({ key: spot.id, href: `/spots/${encodeURIComponent(spot.id)}`, image: spot.image, title: spot.title, sub: [spot.district, spot.province].filter(Boolean).join(', ') }));
  return <ItemsBlock title="ที่เที่ยวน่าไป" href="/spots" items={items} dot="bg-[#4A7C59]" layout={layout} />;
}

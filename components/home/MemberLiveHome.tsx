'use client';

import { SHARE_ASK_DAYS } from '@/lib/social/socialRules';
import { HOME_MODE_KEY } from '@/lib/homeAgain';
import React, { useEffect, useState } from 'react';
import { CampaignShelf, type CampaignMemberState } from '@/components/CampaignStrip';
import type { Campaign } from '@/lib/campaigns/types';
import Link from 'next/link';
import { Bookmark, CalendarDays, Camera, Gift, Zap } from 'lucide-react';
import { avatarImage, optimizedImage } from '@/lib/optimizedImage';
import { useHomeExitNote } from '@/lib/backFromHome';
import { meetupTimes, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import type { ChallengeQuest, EventItem } from '@/data/mockData';
import { nameInitial } from '@/lib/displayName';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { Circle } from '@/components/home/Circles';
import { BADGE_MINE, RING_MINE } from '@/components/home/circleLook';
import { FollowRow } from '@/components/home/onboardingFirstStep';
import { FOOTER_LINKS } from '@/components/SiteFooter';
import { HomeMomentFeed, type FeedView, type ShareRequest } from '@/components/home/HomeMomentFeed';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { ChallengeTile, assignReasons } from '@/components/ChallengeTile';
import type { FeedCardKind } from '@/lib/homeInterests';
import { FALLBACK_IMAGE, Faces, awayLabel, dayLine, dayPart, eventHref, shortAwayLabel, useGoingWith, useMinuteClock } from '@/components/home/planHelpers';
import type { HomeFeedStart } from '@/lib/homeData';


export interface MemberLiveHomeProps {
  /** The feed's first page and Circles from the server (app/page.tsx) */
  feedStart?: HomeFeedStart;
  /** ตี้ the member already posted a moment from (server): the "ไปมาแล้ว?" circle does not ask for them on any device */
  postedTeeIds?: string[];
  name: string;
  /** The running campaigns (server, homeCampaigns()); shown again with the member's own progress */
  campaigns?: Campaign[];
  /** Where the member stands in one; undefined until their rewards and joined campaigns load */
  campaignMemberOf?: (campaign: Campaign) => CampaignMemberState;
  onOpenCampaign?: (id: string) => void;
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
  /** Which kind of card comes first between the posts, from what the member picked and does (lib/homeInterests.ts) */
  cardKinds: FeedCardKind[];
  isSpotsLoaded: boolean;
  /** Finished challenges: the stamps in the passport, which lives in My Hub */
  /** Every meetup they joined or host, ended ones too: the slim line asks for a moment from one that just ended */
  mine: EventItem[];
}

/**
 * The home page for a signed-in member: a live social place about friends and what is happening.
 * What the member manages themselves (the schedule, challenges under way, the month) lives in My Hub; home shows
 * a short summary that leads there.
 * Wide screens: me | moments from friends | where to go next. Laptops drop the left column (greeting and
 * ถัดไปของคุณ move above the feed, in the feed's column); phones keep one column with picks between the posts.
 * Without plans the feed still comes first: the first-meetup picks sit after the first post, never in front of it.
 */
const FEED_MODE_KEY = HOME_MODE_KEY;

export function MemberLiveHome(props: MemberLiveHomeProps) {
  const { name, plans, isLoaded } = props;
  // A page opened from here says "กลับหน้าหลัก" and comes back here (owner 2026-11-16)
  useHomeExitNote();
  // The mode picked last time comes back on this device (owner 2026-11-26): someone who browses ค้นพบ is not sent to
  // สำหรับคุณ every visit. Read after the first paint, since the server's first page is สำหรับคุณ
  const [feedView, setFeedViewState] = useState<FeedView>('foryou');
  const setFeedView = (view: FeedView) => {
    setFeedViewState(view);
    try {
      localStorage.setItem(FEED_MODE_KEY, view);
    } catch {
      // private window or blocked storage: the mode is simply not remembered
    }
  };
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FEED_MODE_KEY);
      if (saved === 'discover' || saved === 'following') setFeedViewState(saved);
    } catch {
      // as above
    }
  }, []);
  const hasPlans = plans.length > 0;
  const [shareRequest, setShareRequest] = useState<ShareRequest | null>(null);
  const showPicks = isLoaded && !hasPlans;
  // Posting from the "แชร์โมเมนต์" line hides it (remembered on this device)
  const [sharedIds, setSharedIds] = useState<string[]>([]);
  const markPosted = () => {
    if (!shareRequest?.id) return;
    rememberShared(shareRequest.id);
    setSharedIds((ids) => [...ids, shareRequest.id!]);
  };

  return (
    <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
      {/* Two columns on laptops (owner 2026-10-29): "ของฉัน" pinned on the left under the logo as in My Hub (owner 2026-10-31), the feed centred in the rest. Where to go next (ตี้,
          ชาเลนจ์, อีเวนต์, ที่เที่ยว) comes as cards between the posts on every screen, as on phones, instead of a third column */}
      {/* No right column (owner 2026-11-14): it only showed on wide screens, and the feed's cards and the circles above it
          already suggest what to do next on every screen. From xl a third track as wide as the left keeps the feed in the
          middle; it holds people to follow (PeopleRail) */}
      {/* Phones: one track that can shrink to the screen (minmax 0), so a wide row in the feed never widens the page */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_280px] 2xl:grid-cols-[300px_minmax(0,1fr)_300px] lg:gap-14 xl:gap-10 2xl:gap-14">
        <main id="home-feed" className="min-w-0 w-full max-w-[600px] mx-auto scroll-mt-24">
          {/* The top of home (owner 2026-10-30): no band, only what nothing else on the page says. Phones: hello, then
              one slim line when there is something to do next. Laptops have both beside the feed */}
          <div className="lg:hidden">
            <Greeting {...props} layout="row" />
          </div>
          <HomeMomentFeed
            view={feedView}
            onViewChange={setFeedView}
            shareRequest={shareRequest}
            onPosted={markPosted}
            name={name}
            avatar={props.avatar}
            inserts={feedCards(props, showPicks)}
            tailUpTo={FIRST_SLOTS[FIRST_SLOTS.length - 1]}
            start={props.feedStart}
            rowLead={
              <>
                <UpNextCircle {...props} sharedIds={sharedIds} onShare={(request) => setShareRequest({ ...request, key: Date.now() })} />
                <CampaignCircles {...props} />
              </>
            }
          />
        </main>

        {/* Laptops: me, my next plans, shortcuts and the campaign, pinned beside the feed. With three plans and the
            campaign it is taller than a 768-900px screen, so it scrolls on its own instead of hiding its bottom */}
        <aside className="hidden lg:block lg:order-first sticky top-24 self-start max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain no-scrollbar space-y-8 pb-4">
          <Greeting {...props} layout="column" />
          {/* ของฉัน before the plans (owner 2026-10-31): the shortcuts keep one place however many plans there are */}
          <Shortcuts {...props} />
          <NextUp {...props} />
          {/* Campaigns sit beside the feed, not above it (owner 2026-10-30): you and your plans come first */}
          {props.campaigns && props.campaignMemberOf && props.onOpenCampaign && (
            <div className="empty:hidden">
              <CampaignShelf campaigns={props.campaigns} memberOf={props.campaignMemberOf} onOpen={props.onOpenCampaign} layout="side" />
            </div>
          )}
        </aside>

        {/* Wide screens: people to follow and the site links in the third track (owner 2026-11-14) */}
        <aside className="hidden xl:block sticky top-24 self-start max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain no-scrollbar pb-4">
          <PeopleRail />
        </aside>
      </div>
    </div>
  );
}

/**
 * "สวัสดี Duke" and the XP. This month's counts left for My Hub (owner 2026-11-04: "ของฉัน" already leads there);
 * before anything counts, one line says how the first one comes.
 */
function Greeting({ name, now, xp, layout }: MemberLiveHomeProps & { layout: 'row' | 'column' }) {
  if (layout === 'row') {
    return (
      <div className="min-w-0">
        {/* Phones and upright iPads start with the feed (owner 2026-11-05); the heading stays for screen readers */}
        <h1 className="sr-only">สวัสดี {name}</h1>
      </div>
    );
  }
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{dayPart(now)}</p>
      {/* One <h1> per page: the phone copy is the h1 */}
      <p role="heading" aria-level={1} className="text-2xl font-bold text-slate-900 tracking-tight truncate">สวัสดี {name}</p>
      {/* No "ไปตี้แรก… +50 XP" nudge (owner 2026-11-14): it pulled a new member away from the first-step challenges the circles show */}
      {/* XP only: the way to the rewards is "ของรางวัล" in ของฉัน below */}
      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
        <Zap className="w-3.5 h-3.5 text-[#7C3AED] fill-current" aria-hidden="true" />
        <span className="font-semibold text-[#7C3AED] tabular-nums">{xp.toLocaleString()} XP</span>
      </p>
    </div>
  );
}

// The "ไปมาแล้ว?" circle hides for a ตี้ once a moment was posted from it: the server says so on every device
// (postedTeeIds); this device remembers it at once, until the next page load brings the server's list
const SHARED_KEY = 'home-shared-moments';
function readShared(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(SHARED_KEY) || '[]');
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}
function rememberShared(id: string) {
  try {
    localStorage.setItem(SHARED_KEY, JSON.stringify([...new Set([...readShared(), id])].slice(-50)));
  } catch {
    // Private mode: the line just comes back next visit
  }
}

// A ตี้ that ended this long ago or less still asks for its moment
const SHARE_WINDOW_MS = SHARE_ASK_DAYS * 24 * 60 * 60 * 1000;
// Test-login ตี้ carry a "[ตัวอย่าง]" tag in the title (as MeetupTile)
const plainTitle = (title: string) => title.replace(/^\[ตัวอย่าง\]\s*/, '');

/**
 * The first circle of the row at the top of home (owner 2026-11-13, was a slim line above the feed): a ตี้ they just went
 * to asks for its moment (every screen); otherwise, on phones, the next plan with its countdown (laptops list the plans
 * beside the feed). Nothing to do, no circle: the row starts with friends.
 */
function UpNextCircle(props: MemberLiveHomeProps & { sharedIds: string[]; onShare: (request: Omit<ShareRequest, 'key'>) => void }) {
  const now = useMinuteClock(props.now);
  // The home is drawn in the browser only (no server render), so the device's memory can be read at once
  const [storedShared] = useState(readShared);
  // The server knows every ตี้ already posted from (any device, any way of posting); this device's memory covers the
  // moments between a post and the next page load
  const posted = props.postedTeeIds ?? [];
  const justBack = props.mine
    .filter((event) => event.eventType !== 'public_venue' && !posted.includes(event.id) && !storedShared.includes(event.id) && !props.sharedIds.includes(event.id))
    .map((event) => ({ event, end: meetupTimes(event)?.end ?? parseEventEndDateToTimestamp(event.date) }))
    .filter(({ end }) => end <= now && now - end <= SHARE_WINDOW_MS)
    .sort((a, b) => b.end - a.end)[0]?.event;

  if (justBack) {
    return (
      <Circle
        onClick={() => props.onShare({ type: 'community', id: justBack.id, title: justBack.title, location: justBack.location })}
        label={`ไปมาแล้ว? แชร์โมเมนต์จาก ${plainTitle(justBack.title)}`}
        image={justBack.image || FALLBACK_IMAGE}
        ring={RING_MINE}
        badge={<><Camera className="w-3 h-3" />แชร์</>}
        badgeClass={BADGE_MINE}
        name="ไปมาแล้ว?"
        mine
      />
    );
  }
  const next = props.plans[0];
  if (!next) return null;
  return (
    <Circle
      href={eventHref(next)}
      label={`นัดถัดไป ${awayLabel(next, now) ?? dayLine(next)} ${plainTitle(next.title)}`}
      image={next.image || FALLBACK_IMAGE}
      ring={RING_MINE}
      badge={shortAwayLabel(next, now) ?? dayLine(next)}
      badgeClass={BADGE_MINE}
      name="นัดถัดไป"
      mine
      className="lg:hidden"
    />
  );
}

/** At most this many campaign circles, so challenges and friends stay in view; ready-to-redeem ones come first */
const MAX_CAMPAIGN_CIRCLES = 2;

/** Joined campaigns this member is in, as circles in the row (owner 2026-11-16): something they are doing, like a
 * challenge under way. Ones they have not joined stay in the shelf between the posts. Phones only: laptops have the
 * campaign line beside the feed, like the next plan. */
function joinedCampaigns(campaigns: Campaign[], memberOf: (campaign: Campaign) => CampaignMemberState) {
  const rank = (member: CampaignMemberState) => (member.ready && !member.entered ? 0 : member.entered ? 2 : 1);
  return campaigns
    .map((campaign) => ({ campaign, member: memberOf(campaign) }))
    .filter(({ member }) => member?.enrolled)
    .sort((a, b) => rank(a.member) - rank(b.member));
}

function CampaignCircles({ campaigns, campaignMemberOf, onOpenCampaign }: MemberLiveHomeProps) {
  if (!campaigns || !campaignMemberOf || !onOpenCampaign) return null;
  const joined = joinedCampaigns(campaigns, campaignMemberOf).slice(0, MAX_CAMPAIGN_CIRCLES);
  return (
    <>
      {joined.map(({ campaign, member }) => {
        const badge = member.entered ? 'แลกแล้ว' : member.ready ? 'แลกได้' : `${member.done}/${member.total}`;
        const state = member.entered ? 'แลกรางวัลแล้ว' : member.ready ? 'ครบแล้ว แลกรางวัลได้' : `ทำแล้ว ${member.done} จาก ${member.total} ขั้น`;
        return (
          <Circle
            key={campaign.id}
            onClick={() => onOpenCampaign(campaign.id)}
            label={`แคมเปญ ${campaign.headline}: ${state}`}
            image={campaign.prizeImage ? optimizedImage(campaign.prizeImage, 128) : undefined}
            fallback={<Gift className="w-7 h-7 text-[#D97706]" aria-hidden="true" />}
            fit="contain"
            ring={RING_MINE}
            badge={badge}
            badgeClass={BADGE_MINE}
            // One campaign: just "แคมเปญ" (option A: longer words were cut off); two: the headline tells them apart
            name={joined.length > 1 ? campaign.headline : 'แคมเปญ'}
            mine
            className="lg:hidden"
          />
        );
      })}
    </>
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
        {/* The whole schedule is "ตารางของฉัน" in ของฉัน below, so no second link here */}
        <h2 className="text-base font-bold text-slate-900">ถัดไปของคุณ</h2>
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
            {countdown && <span className="shrink-0 rounded-full bg-[#FFF4EE] px-2 py-0.5 text-[11px] font-semibold text-[#C2410C] tabular-nums whitespace-nowrap">{countdown}</span>}
            <span className={`text-xs truncate ${countdown ? 'text-slate-500' : isFair ? 'font-semibold text-[#2B527A]' : 'font-semibold text-[#C2410C]'}`}>{when}</span>
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
// Cards between the posts (owner 2026-10-29): after posts 2, 5, 8 and 11, one of each kind in the member's order,
// then one every six posts, the kinds in turn. Nothing shows twice; a kind that has run out is skipped. Fewer, spaced
// cards keep the feed about friends. On a short feed the first four go at its end (HomeMomentFeed `tailUpTo`)
const FIRST_SLOTS = [1, 4, 7, 10];
const LATER_EVERY = 6;
const LATER_UNTIL = 70;
const PHONE_CAMPAIGN_SLOT = FIRST_SLOTS[1];
const PEOPLE_SLOT = 2;
// How many items one card shows, and the fewest worth a card
const TAKE: Record<FeedCardKind, number> = { meetup: 1, challenge: 3, fair: 4, spot: 5 };
const FEWEST: Record<FeedCardKind, number> = { meetup: 1, challenge: 2, fair: 2, spot: 2 };

function feedCards(props: MemberLiveHomeProps, showPicks: boolean): Record<number, React.ReactNode> {
  const cards: Record<number, React.ReactNode> = {};
  // Without plans the first post is followed by three ตี้ picks, so the invites start after them
  // Only when there is a ตี้ to pick: with none open, FirstPicks draws nothing and its frame left an empty band with two lines (owner 2026-11-26, seen live)
  if (showPicks && props.meetups.length > 0) {
    cards[0] = (
      <section className="py-5 border-y border-slate-100 my-2">
        <FirstPicks {...props} />
      </section>
    );
  }
  // Different pictures first: two challenges with the same photo side by side look fake (as the ตี้ picks, tester 2026-11-09)
  const quests = [...props.quests.filter((q, i) => !q.image || props.quests.findIndex((o) => o.image === q.image) === i), ...props.quests].filter((q, i, all) => all.indexOf(q) === i);
  const lists: Record<FeedCardKind, number> = { meetup: props.meetups.length, challenge: props.quests.length, fair: props.fairs.length, spot: props.spots.length };
  const used: Record<FeedCardKind, number> = { meetup: showPicks ? 3 : 0, challenge: 0, fair: 0, spot: 0 };
  const slots = [...FIRST_SLOTS];
  for (let at = FIRST_SLOTS[FIRST_SLOTS.length - 1] + LATER_EVERY; at <= LATER_UNTIL; at += LATER_EVERY) slots.push(at);
  const kinds = props.cardKinds;
  let turn = 0;
  for (const at of slots) {
    // This slot's kind, or the next one in the member's order that still has something new
    let kind: FeedCardKind | undefined;
    for (let tries = 0; tries < kinds.length && !kind; tries++) {
      const candidate = kinds[(turn + tries) % kinds.length];
      if (lists[candidate] - used[candidate] >= FEWEST[candidate]) kind = candidate;
    }
    if (!kind) break;
    turn = (kinds.indexOf(kind) + 1) % kinds.length;
    const from = used[kind];
    used[kind] += TAKE[kind];
    // A second row of the same kind gets its own heading
    const again = from >= TAKE[kind];
    cards[at] = (
      <section className="py-5 border-b border-slate-200">
        {kind === 'meetup' ? (
          <InvitePost event={props.meetups[from]} reason={props.reasons[props.meetups[from].id]} />
        ) : kind === 'challenge' ? (
          <QuestsBlock {...props} quests={quests.slice(from, from + TAKE.challenge)} heading={again ? 'ชาเลนจ์อื่นที่น่าลอง' : undefined} />
        ) : kind === 'fair' ? (
          <FairsBlock {...props} fairs={props.fairs.slice(from, from + TAKE.fair)} layout="tiles" heading={again ? 'อีเวนต์อื่นที่น่าไป' : undefined} />
        ) : (
          <SpotsBlock {...props} spots={props.spots.slice(from, from + TAKE.spot)} layout="tiles" heading={again ? 'ที่เที่ยวอื่นน่าไป' : undefined} />
        )}
      </section>
    );
  }
  // People to follow (owner 2026-11-14: the feed suggests friends too), after the second card's post; it hides itself when nobody is left
  cards[PEOPLE_SLOT] = (
    <>
      {cards[PEOPLE_SLOT]}
      <PeopleToFollow />
    </>
  );
  // Phones have no side column: the campaign comes between the posts, after the first cards, never on top. Joined
  // ones are circles at the top (CampaignCircles), so the shelf offers only the rest and goes once all are joined
  if (props.campaigns && props.campaignMemberOf && props.onOpenCampaign) {
    const memberOf = props.campaignMemberOf;
    const notJoined = props.campaigns.filter((campaign) => !memberOf(campaign)?.enrolled);
    cards[PHONE_CAMPAIGN_SLOT] = (
      <>
        {cards[PHONE_CAMPAIGN_SLOT]}
        <section className="lg:hidden py-5 border-b border-slate-200 empty:hidden">
          <CampaignShelf campaigns={notJoined} memberOf={memberOf} onOpen={props.onOpenCampaign} />
        </section>
      </>
    );
  }
  return cards;
}

/** "เพื่อนๆ ที่น่าติดตาม": verified members who post, people who like the same สาย first (GET /api/members/suggested) */
function PeopleToFollow() {
  // Wide screens list these in the right rail instead, so only one list loads and nothing shows twice
  const wide = useWideScreen();
  const [count, setCount] = useState<number | null>(null);
  if (count === 0 || wide) return null;
  return (
    <section className="py-5 border-b border-slate-200" aria-labelledby="home-people-title">
      <h2 id="home-people-title" className="text-base font-bold text-slate-900 mb-3">เพื่อนๆ ที่น่าติดตาม</h2>
      <FollowRow onLoaded={setCount} emptyText="" />
    </section>
  );
}

/**
 * The right rail on wide screens (owner 2026-11-14, as "Suggested for you" on Instagram): people to follow as quiet lines
 * and the small site links. No tinted boxes: the four pastel folds that stood here left on the same day.
 */
function PeopleRail() {
  const wide = useWideScreen();
  const [count, setCount] = useState<number | null>(null);
  if (!wide) return null;
  return (
    <div className="space-y-6">
      {count !== 0 && (
        <section aria-labelledby="home-rail-people-title">
          <h2 id="home-rail-people-title" className="text-sm font-semibold text-slate-500 mb-3.5">เพื่อนๆ ที่น่าติดตาม</h2>
          <FollowRow layout="list" onLoaded={setCount} emptyText="" />
        </section>
      )}
      <nav aria-label="เกี่ยวกับ Chillwaa" className="text-xs text-slate-400 leading-relaxed">
        {FOOTER_LINKS.map((link, i) => (
          <React.Fragment key={link.href}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            <Link href={link.href} className="hover:text-slate-600 hover:underline">{link.label}</Link>
          </React.Fragment>
        ))}
        <p className="mt-2">© 2026 Chillwaa</p>
      </nav>
    </div>
  );
}

/** xl and up (1280px), where the rail has room; read at once, since home is drawn in the browser only */
function useWideScreen() {
  const query = '(min-width: 1280px)';
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setWide(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return wide;
}

function InvitePost({ event, reason }: { event: EventItem; reason?: string }) {
  const left = seatsLeft(event);
  return (
    <article aria-label={`${event.hostName} ชวนไป ${event.title}`}>
      <div className="flex items-center gap-3">
        {event.hostAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarImage(event.hostAvatar)} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100 shrink-0" />
        ) : (
          <span className="w-10 h-10 rounded-full bg-[#FFF4EE] text-[#C2410C] text-sm font-bold flex items-center justify-center shrink-0" aria-hidden="true">{nameInitial(event.hostName)}</span>
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
          <p className="text-xs font-semibold text-[#C2410C]">{dayLine(event)}</p>
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

const LIKED_CHIPS = 3;

/** Without plans: three open meetups from the สาย the member liked, as a sideways row inside the feed */
function FirstPicks({ meetups, likedCategories, xp }: MemberLiveHomeProps) {
  const liked = COMMUNITY_LIFESTYLE_CATEGORIES.filter((cat) => likedCategories.includes(cat.id));
  // Three ตี้ with three different photos: two with the same picture side by side look fake (tester 2026-11-09)
  const picks = [...meetups.filter((m, i) => !m.image || meetups.findIndex((o) => o.image === m.image) === i), ...meetups].filter((m, i, all) => all.indexOf(m) === i).slice(0, 3);
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
          {/* Three at most: a member who liked every สาย got a wall of 20 chips above the picks */}
          {liked.slice(0, LIKED_CHIPS).map((cat) => (
            <Link key={cat.id} href={`/community?category=${cat.id}`} className="h-6 px-2 inline-flex items-center rounded-full bg-[#FFF4EE] text-[#C2410C] font-semibold hover:opacity-80">
              {cat.name}
            </Link>
          ))}
          {liked.length > LIKED_CHIPS && <span>และอีก {liked.length - LIKED_CHIPS} สาย</span>}
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
 * "ของฉัน": the three places a member goes back to, all outside this page. Own and saved moments are not here;
 * they are views of the feed, in its ··· menu.
 */
function Shortcuts({ savedCount, redeemable }: MemberLiveHomeProps) {
  const items: { href: string; label: string; Icon: typeof Gift; box: string; count?: number }[] = [
    // Each lands on its own section of My Hub, which scrolls there once the section has loaded
    { href: '/myhub#my-schedule', label: 'ตารางของฉัน', Icon: CalendarDays, box: 'bg-slate-100 text-slate-700' },
    { href: '/myhub#my-saved', label: 'กิจกรรมที่บันทึก', Icon: Bookmark, box: 'bg-slate-100 text-slate-700', count: savedCount },
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
              {count !== undefined && count > 0 && <span className="text-xs font-medium text-slate-500 tabular-nums">{count}</span>}
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

/**
 * The running challenges most people are doing (the list comes sorted by participants), as the same tiles as
 * /challenges (owner 2026-10-29): three across the feed on wider screens, a row to swipe on phones
 */
function QuestsBlock({ quests, heading = 'ชาเลนจ์ยอดฮิตตอนนี้' }: MemberLiveHomeProps & { heading?: string }) {
  const shown = quests.slice(0, 3);
  const reasons = assignReasons(shown);
  if (shown.length === 0) return null;
  return (
    <section aria-label={heading}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">{heading}</h2>
        <Link href="/challenges" className={VIEW_ALL}>ดูทั้งหมด</Link>
      </div>
      {/* Top padding gives the XP stickers room; the phone row clips at its edges */}
      <ul className="flex gap-4 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 scroll-px-4 pt-4 pb-1 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible">
        {shown.map((quest, i) => (
          <li key={quest.id} className="w-[44%] shrink-0 snap-start sm:w-auto">
            <ChallengeTile quest={quest} index={i} reason={reasons.get(quest.id)} />
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

function FairsBlock({ fairs, fairWhen, layout, heading = 'เอ็กซ์โป งานวิ่ง คอนเสิร์ต ช่วงนี้' }: MemberLiveHomeProps & { layout: 'rows' | 'tiles'; heading?: string }) {
  const items = fairs.map((fair) => ({ key: fair.id, href: eventHref(fair), image: fair.image, kicker: fairWhen(fair), title: fair.title, sub: fair.location }));
  return <ItemsBlock title={heading} href="/events" items={items} dot="bg-[#2B527A]" layout={layout} />;
}

function SpotsBlock({ spots, layout, heading = 'ที่เที่ยวน่าไป' }: MemberLiveHomeProps & { layout: 'rows' | 'tiles'; heading?: string }) {
  const items = spots.map((spot) => ({ key: spot.id, href: `/spots/${encodeURIComponent(spot.id)}`, image: spot.image, title: spot.title, sub: [spot.district, spot.province].filter(Boolean).join(', ') }));
  return <ItemsBlock title={heading} href="/spots" items={items} dot="bg-[#4A7C59]" layout={layout} />;
}

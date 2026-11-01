'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileNav } from '@/components/MobileNav';
import { ChallengePicks } from '@/components/ChallengePicks';
import { FriendsMomentsWall } from '@/components/FriendsMomentsWall';
import { OpenMeetupTiles } from '@/components/OpenMeetupTiles';
import { ScrollRow } from '@/components/ScrollRow';
import { CategoryStickerCards, communityCategoryCards } from '@/components/CategoryStickerCards';
import dynamic from 'next/dynamic';
import { LiveJoinsLine } from '@/components/home/LiveActivity';
import { CampaignStrip } from '@/components/CampaignStrip';
import type { Campaign } from '@/lib/campaigns/types';
import type { MemberHomeData } from '@/lib/homeData';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/LazyCreateEventModal';
// Types only: the bundled sample data (~900 KB) is not shipped to the browser (2026-10-28)
import type { EventItem, ChallengeQuest } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { formatEventDateRange, isClosedToJoin, isEventEnded, nearDayLabel, parseEventDateToTimestamp } from '@/lib/dateUtils';
import { useAuth } from '@/lib/useAuth';
import { fetchAllContentPages } from '@/lib/contentClient';
import { useMyRewards } from '@/lib/useMyRewards';
import { useMyMonth } from '@/lib/useMyMonth';
import { useMyActivity } from '@/lib/useMyActivity';
import { seedMemberSession, useMemberSession, type SessionSeed } from '@/lib/useMemberSession';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { useHomeSpots, getCachedSpotVibeCategory } from '@/lib/usePublishedSpots';
import { getCommunityEventCategory, getFairEventCategory, type SpotVibeId } from '@/data/masterHub';
import { feedInterests, rankByInterest } from '@/lib/homeInterests';
import { FAIR_ROW_SHOWN, fairKind, pickFairRow } from '@/lib/homeFairs';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { TOP_DESTINATIONS } from '@/data/topDestinations';
import { Toast } from '@/components/Toast';
import { defaultEventImage } from '@/lib/eventImageResolver';
import { optimizedImage } from '@/lib/optimizedImage';

// The member home (its band, feed and plans) loads only for members: visitors used to download and parse it too.
// A member's page starts the download as it hydrates (`signedIn` from the server), so it is not left waiting.
const loadMemberHome = () => import('@/components/home/MemberLiveHome').then((m) => m.MemberLiveHome);
const MemberLiveHome = dynamic(loadMemberHome, { ssr: false, loading: () => <MemberHomeSkeleton /> });

/** The landing meetup row: six tiles fill one desktop row; a picked category slides through up to twelve */
const MEETUP_ROW_SIZE = 6;
const MEETUP_ROW_PICKED = 12;
const CONTAINER = 'max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8';

// Order of the vibes in the places row: what the audience looks for on a day off comes first
const VIBE_ORDER: SpotVibeId[] = ['cafe_slowbar', 'nature_camping', 'views_rooftop', 'temple_mu', 'art_creative', 'sea_island', 'food_street', 'mountain_mist', 'market_walking', 'wellness_retreat', 'oldtown_culture', 'museum_learning', 'city_parks', 'fun_activities', 'nightlife_bars', 'shopping_mall'];


// Photos for the hero collage and the join block (local files, shown on /spots too)

const HERO_PHOTOS = ['/event-board-games.png', '/hero-bkk-community-golden.jpg', '/event-city-run.png'];

// Short names for the reason under a suggested meetup ("เพราะคุณชอบสายคาเฟ่")
const CATEGORY_SHORT: Record<string, string> = {
  running_fitness: 'สายวิ่ง',
  wellness_mind: 'สายฮีลใจ',
  cafe_social: 'สายคาเฟ่',
  boardgames_party: 'สายบอร์ดเกม',
  arts_crafts: 'สายศิลปะ',
  travel_outdoor: 'สายเที่ยว',
  tech_skills: 'สายพัฒนาตัวเอง',
  pets_family: 'สายสัตว์เลี้ยง',
  food_hunt: 'สายกิน',
  gaming_anime: 'สายเกม & อนิเมะ',
  movies_music: 'สายดนตรี',
  sports_club: 'สายกีฬา',
  dance_move: 'สายเต้น',
  beauty_selfcare: 'สายบิวตี้',
  volunteer: 'สายจิตอาสา',
  photo_content: 'สายถ่ายรูป',
  cooking_baking: 'สายทำขนม',
  books_language: 'สายหนังสือ',
};

// White label pinned to a hero collage photo; the numbers tell the loop in order
const HERO_LABEL = 'absolute z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white pl-1.5 pr-3 py-1 text-xs lg:text-sm font-semibold text-slate-900 shadow-md';
const HERO_STEPS = ['เลือกกิจกรรมที่ใช่', 'ออกไปใช้ชีวิต', 'แชร์โมเมนต์'];


// Small round photos standing in for the people, beside the live line and in the sign-up band
const photoFaces = (size: string, ring: string) => (
  <span className="flex -space-x-2 shrink-0" aria-hidden="true">
    {HERO_PHOTOS.map((src) => (
      <Image key={src} src={src} alt="" width={48} height={48} className={`${size} rounded-full object-cover border-2 ${ring}`} />
    ))}
  </span>
);

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const FAIR_KIND_LABEL = { fair: 'เอ็กซ์โป', run: 'งานวิ่ง', concert: 'คอนเสิร์ต', other: '' } as const;

// Provinces shown in "สายเที่ยว สายชิล ไปไหนดี?"
const DESTINATION_IDS = ['bkk', 'chiangmai', 'chonburi', 'khaoyai', 'krabi', 'nan'];

// How many of each the member home's feed cards can draw on: the first cards, then more as the feed goes on
const FEED_POOL = 15;

// "12 ต.ค. – 18 ต.ค." for a fair, years left out
// "23 ต.ค. – 25 ต.ค."; with `near` (member home, rendered in the browser only, so server and phone clocks never disagree)
// close days are words: "วันนี้", "พรุ่งนี้ – 25 ต.ค.", "วันนี้วันสุดท้าย"
const fairDates = (e: EventItem, near = false) => {
  const short = (d: string) => d.replace(/\s*\d{4}$/, '');
  const isRange = !!e.endDate && e.endDate !== e.date;
  // "15 - 26 ต.ค.": the shared range, without the year (this list is about the next weeks)
  if (!near) return short(formatEventDateRange(e));
  if (!isRange) return nearDayLabel(e.date) ?? short(e.date);
  if (nearDayLabel(e.endDate!) === 'วันนี้') return 'วันนี้วันสุดท้าย';
  // A fair already running reads "วันนี้ – 25 ต.ค."
  const isOn = parseEventDateToTimestamp(e.date) <= Date.now();
  return `${isOn ? 'วันนี้' : nearDayLabel(e.date) ?? short(e.date)} – ${short(e.endDate!)}`;
};

// Each kind, soonest first; ended events never show on the homepage
const upcomingByDate = (events: EventItem[], type: 'community' | 'public_venue') =>
  events
    .filter((e) => (e.eventType || 'community') === type && !isClosedToJoin(e))
    .sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date));

// Same test the server applies in lib/social/spotTrips.ts (spotAllowsMeetups)
const allowsMeetups = (spot: LifestyleSpotItem) =>
  spot.meetupAllowed === true && spot.category !== 'bar' && spot.publicationStatus !== 'draft';

type InitialContent = {
  initialEvents?: EventItem[];
  initialQuests?: ChallengeQuest[];
  campaign?: Campaign | null;
  /** The server read a member session: the page waits for the member home instead of showing the landing first */
  signedIn?: boolean;
  /** The member home's places, extra อีเวนต์ and onboarding picks, read on the server with the page */
  memberData?: MemberHomeData | null;
  /** How many places /spots has, for the visitor landing's "ดูทั้งหมด … แห่ง" */
  spotTotal?: number | null;
  /** The session the server read, given to the shared session store before the first render */
  session?: SessionSeed;
  /** How many อีเวนต์ are coming up (the page gets only the ones it shows) */
  fairTotal?: number;
};

function JourneyContent({ initialEvents, initialQuests, campaign = null, signedIn = false, memberData = null, spotTotal: serverSpotTotal = null, session, fairTotal }: InitialContent) {
  // Before useAuth below reads the store: no wait for GET /api/auth/member after hydration
  useState(() => session && seedMemberSession(session));
  useState(() => signedIn && typeof window !== 'undefined' && void loadMemberHome());
  // The home page is not one of the menu items (ค้นพบ is /community); the logo leads here
  const [activeNavTab, setActiveNavTab] = useState('home');
  const [eventsList, setEventsList] = useState<EventItem[]>(initialEvents ?? []);
  const [isEventsLoaded, setIsEventsLoaded] = useState(Boolean(initialEvents));
  const [questList, setQuestList] = useState<ChallengeQuest[]>(initialQuests ?? []);
  const [isQuestsLoaded, setIsQuestsLoaded] = useState(Boolean(initialQuests));
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  // Landing page: the filter over the meetup row
  const [meetupCategory, setMeetupCategory] = useState('all');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  // Joined challenges and their progress come from the account, as on /challenges
  const myRewards = useMyRewards(isLoggedIn);
  // Signed in, the page is the member's own home (greeting, what is next, picks for them) instead of the landing page
  const isMember = isAuthReady && isLoggedIn;
  // The server saw a member session: until the browser confirms it, a quiet placeholder instead of the landing,
  // which used to show first and then jump to the member home
  const isMemberPending = !isAuthReady && signedIn;
  // A member's home data came with the page; signing in here (the auth dialog) still loads it in the browser
  const serverMemberData = isMember ? memberData : null;
  // Only the member home picks places from the catalog; the visitor landing needs just the number of places
  const { spots: liveSpots, isLoaded: isLiveSpotsLoaded } = useHomeSpots(isMember && !serverMemberData);
  const spotsList = serverMemberData?.spots ?? liveSpots;
  const isSpotsLoaded = Boolean(serverMemberData) || isLiveSpotsLoaded;
  const [spotTotal, setSpotTotal] = useState<number | null>(serverSpotTotal);
  useEffect(() => {
    if (!isAuthReady || isMember || serverSpotTotal !== null) return;
    fetch('/api/discover/counts')
      .then((res) => res.json())
      .then((json) => typeof json?.counts?.spots === 'number' && setSpotTotal(json.counts.spots))
      .catch(() => undefined);
  }, [isAuthReady, isMember, serverSpotTotal]);
  const sessionMember = useMemberSession().member;
  const activity = useMyActivity();
  const [now] = useState(() => Date.now());
  const [likedCategories, setLikedCategories] = useState<string[]>(memberData?.likedCategories ?? []);
  // Onboarding goals pick the journey band's first tab (a ตี้ or a challenge)
  const [goals, setGoals] = useState<string[]>(memberData?.goals ?? []);
  // The place and อีเวนต์ kinds saved with the onboarding answers (from the สาย picked there)
  const [likedSpotVibes, setLikedSpotVibes] = useState<string[]>(memberData?.spotVibes ?? []);
  const [likedFairCategories, setLikedFairCategories] = useState<string[]>(memberData?.fairCategories ?? []);
  useEffect(() => {
    if (!isMember || serverMemberData) return;
    let alive = true;
    fetch('/api/auth/member/preferences', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!alive) return;
        setLikedCategories(json?.preferences?.interests?.communityCategories ?? []);
        setGoals(json?.preferences?.goals ?? []);
        setLikedSpotVibes(json?.preferences?.interests?.spotVibes ?? []);
        setLikedFairCategories(json?.preferences?.interests?.fairCategories ?? []);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isMember, serverMemberData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync with runtime DB and localStorage
  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem('favorite_events');
      if (storedFavs) setFavorites(JSON.parse(storedFavs));
    } catch {}

    let isActive = true;
    // The server page sends the challenges and the events that are not over, plus a member's own saved and visited
    // อีเวนต์; only a member who signed in on this page (no server data) loads the full list
    if (!initialQuests) fetchAllContentPages<ChallengeQuest>('/api/quests', 'quests')
      .then((quests) => {
        if (isActive) setQuestList(quests);
      })
      .catch((err) => console.warn('Journey challenges:', err))
      .finally(() => {
        if (isActive) setIsQuestsLoaded(true);
      });

    if (!initialEvents || (isMember && !serverMemberData)) fetchAllContentPages<EventItem>('/api/events', 'events')
      .then((events) => {
        if (isActive && events.length > 0) setEventsList(events);
      })
      .catch((err) => {
        console.warn('Journey events:', err);
      })
      .finally(() => {
        if (isActive) setIsEventsLoaded(true);
      });

    return () => {
      isActive = false;
    };
  }, [initialEvents, initialQuests, isMember, serverMemberData]);

  const triggerMembershipPrompt = (actionTitle: string) => {
    setMembershipActionTitle(actionTitle);
    setIsRequireMembershipOpen(true);
  };

  const openCreateMeetup = () => {
    if (!isLoggedIn) triggerMembershipPrompt('เพื่อสร้างกิจกรรมใหม่');
    else setIsCreateEventModalOpen(true);
  };

  const toggleFavoriteEvent = (eventId: string) => {
    if (!isLoggedIn) {
      triggerMembershipPrompt('เพื่อบันทึกกิจกรรมนี้ไว้ในรายการโปรด');
      return;
    }
    setFavorites((prev) => {
      const isFav = prev.includes(eventId);
      const updated = isFav ? prev.filter((id) => id !== eventId) : [...prev, eventId];
      showToast(isFav ? 'ลบออกจากรายการโปรดแล้ว' : 'เพิ่มเข้ารายการโปรดแล้ว');
      try {
        localStorage.setItem('favorite_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const communityEvents = useMemo(() => upcomingByDate(eventsList, 'community'), [eventsList]);
  const fairEvents = useMemo(() => upcomingByDate(eventsList, 'public_venue'), [eventsList]);

  const rankedSpots = useMemo(
    () =>
      [...spotsList].sort((a, b) => {
        const scoreA = (a.popularity || 0) + (a.rating > 0 ? a.rating * 200 : 0);
        const scoreB = (b.popularity || 0) + (b.rating > 0 ? b.rating * 200 : 0);
        return scoreB - scoreA;
      }),
    [spotsList]
  );

  // One place per vibe in turn, places open for meet-ups first
  const featuredSpots = useMemo(() => {
    const byVibe = new Map<SpotVibeId, LifestyleSpotItem[]>(VIBE_ORDER.map((vibe) => [vibe, []]));
    for (const spot of rankedSpots) byVibe.get(getCachedSpotVibeCategory(spot))?.push(spot);
    const queues = VIBE_ORDER.map((vibe) => {
      const list = byVibe.get(vibe) || [];
      return [...list.filter(allowsMeetups), ...list.filter((s) => !allowsMeetups(s))];
    });
    const picked: LifestyleSpotItem[] = [];
    for (let round = 0; picked.length < FEED_POOL && queues.some((q) => q.length > round); round++) {
      for (const queue of queues) {
        if (queue[round] && picked.length < FEED_POOL) picked.push(queue[round]);
      }
    }
    return picked;
  }, [rankedSpots]);

  const fairRow = useMemo(() => pickFairRow(fairEvents), [fairEvents]);

  // Member home: the next three things they go to: meetups and fairs they joined or host, then fairs they saved
  // The member's own ตี้ come from the browser with their original photos (~1 MB sample PNGs); the band and plan
  // cards show `image` as it is, so it is resized here like the server does for the rest (lib/homeData.ts)
  const joined = useMemo(() => activity.joined.map(withCardImage), [activity.joined]);
  const hosted = useMemo(() => activity.hosted.map(withCardImage), [activity.hosted]);
  const plans = useMemo(() => {
    const going = [...joined, ...hosted];
    const goingIds = new Set(going.map((e) => e.id));
    const saved = fairEvents.filter((e) => activity.savedEventIds.includes(e.id) && !goingIds.has(e.id));
    const seen = new Set<string>();
    return [...going, ...saved]
      .filter((e) => !isEventEnded(e) && !seen.has(e.id) && seen.add(e.id))
      .sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date))
      .slice(0, 3);
  }, [joined, hosted, activity.savedEventIds, fairEvents]);
  // Everything the member joined or hosts, ended ones too: the journey band asks for a moment from a ตี้ they went to
  // A host is also among the joined, so their own ตี้ comes once
  const myEvents = useMemo(() => [...new Map([...joined, ...hosted].map((e) => [e.id, e])).values()], [joined, hosted]);
  // This month's Chill (places) and Connect (meetups) behind the greeting
  const myMonth = useMyMonth(isMember);
  const monthCounts = myMonth.month ? { chill: myMonth.month.chill.length, connect: myMonth.month.connect.length } : null;
  const redeemable = REWARD_SHOP_ITEMS.filter((item) => !myRewards.redeemedRewardIds.includes(item.id) && item.costXp <= myRewards.balance).length;

  // Member home feed cards (owner 2026-10-29): what the member picked at onboarding, then what they joined, saved
  // and took part in since, decide which ตี้, challenges, อีเวนต์ and places come first and which kind of card leads
  const interests = useMemo(
    () =>
      feedInterests({
        goals,
        sai: likedCategories,
        spotVibes: likedSpotVibes,
        fairCategories: likedFairCategories,
        joined: activity.joined,
        hosted: activity.hosted,
        savedEvents: eventsList.filter((e) => activity.savedEventIds.includes(e.id)),
        joinedQuests: questList.filter((q) => myRewards.joinedQuestIds.includes(q.id)),
        savedSpots: spotsList.filter((spot) => activity.savedSpotIds.includes(spot.id)),
      }),
    [goals, likedCategories, likedSpotVibes, likedFairCategories, activity.joined, activity.hosted, activity.savedEventIds, activity.savedSpotIds, eventsList, questList, myRewards.joinedQuestIds, spotsList]
  );

  // Open meetups they have not joined, soonest first within each level of interest, each with its reason
  const memberMeetups = useMemo(() => {
    const mine = new Set([...activity.joinedIds, ...activity.hosted.map((e) => e.id)]);
    const open = communityEvents.filter((e) => e.participantsCount < e.maxParticipants && !mine.has(e.id));
    const row = rankByInterest(open, (e) => interests.sai.get(getCommunityEventCategory(e)) ?? 0).slice(0, FEED_POOL);
    const reasons: Record<string, string> = {};
    for (const event of row) {
      const cat = COMMUNITY_LIFESTYLE_CATEGORIES.find((c) => c.id === getCommunityEventCategory(event));
      if (!cat || !interests.sai.get(cat.id)) continue;
      // Picked at onboarding: "ชอบ"; learned from what they joined or saved: "สนใจ"
      reasons[event.id] = `เพราะคุณ${likedCategories.includes(cat.id) ? 'ชอบ' : 'สนใจ'}${CATEGORY_SHORT[cat.id] ?? cat.name}`;
    }
    return { row, reasons };
  }, [communityEvents, activity.joinedIds, activity.hosted, interests, likedCategories]);

  // Running challenges the member has not joined: their สาย first, then the ones most people are doing
  const othersQuests = useMemo(
    () =>
      rankByInterest(
        questList
          .filter((q) => q.status !== 'ended' && (q.daysRemaining === undefined || q.daysRemaining > 0) && !myRewards.joinedQuestIds.includes(q.id))
          .sort((a, b) => (b.participantsCount ?? 0) - (a.participantsCount ?? 0)),
        (q) => interests.sai.get(q.category ?? '') ?? 0
      ),
    [questList, myRewards.joinedQuestIds, interests]
  );
  // อีเวนต์ of the kinds they like first (soonest within each), then the home row's mix; places the same way
  const memberFairs = useMemo(
    () => rankByInterest([...fairRow, ...fairEvents.filter((e) => !fairRow.includes(e))], (e) => interests.fairCategories.get(getFairEventCategory(e)) ?? 0).slice(0, FEED_POOL),
    [fairRow, fairEvents, interests]
  );
  const memberSpots = useMemo(
    () => rankByInterest(featuredSpots, (spot) => interests.spotVibes.get(getCachedSpotVibeCategory(spot)) ?? 0),
    [featuredSpots, interests]
  );

  // Landing page: open meetups (seats left), counted per category card, and the row the cards filter
  const openMeetups = useMemo(() => communityEvents.filter((e) => e.participantsCount < e.maxParticipants), [communityEvents]);
  // สาย with no open ตี้ go to the end (and fade), so a guest's first taps find something
  const categoryCards = useMemo(() => {
    const [all, ...cards] = communityCategoryCards(openMeetups.length, (id) => openMeetups.filter((e) => getCommunityEventCategory(e) === id).length);
    return [all, ...cards.filter((c) => c.count > 0), ...cards.filter((c) => c.count === 0)];
  }, [openMeetups]);
  const landingMatches = useMemo(
    () => openMeetups.filter((e) => meetupCategory === 'all' || getCommunityEventCategory(e) === meetupCategory),
    [openMeetups, meetupCategory]
  );
  const landingMeetups = landingMatches.slice(0, meetupCategory === 'all' ? MEETUP_ROW_SIZE : MEETUP_ROW_PICKED);
  const meetupsHref = (() => {
    // The row shows meetups with seats left, so the full list opens with the same filter
    const params = new URLSearchParams({ seats: 'open' });
    if (meetupCategory !== 'all') params.set('category', meetupCategory);
    return `/community?${params}`;
  })();

  const destinations = DESTINATION_IDS.flatMap((id) => TOP_DESTINATIONS.filter((d) => d.id === id));

  const scrollToId = (id: string) =>
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });

  const heroStep = (i: number) => (
    <>
      <span className="w-5 h-5 shrink-0 rounded-full bg-slate-900 text-white text-[11px] font-semibold flex items-center justify-center">{i + 1}</span>
      {HERO_STEPS[i]}
    </>
  );

  // Every section opens the same way: a heading and an ink "ดูทั้งหมด →"
  const sectionHead = (title: string, href: string, extra?: React.ReactNode, linkLabel: React.ReactNode = 'ดูทั้งหมด') => (
    <div className="flex items-center justify-between gap-3">
      <h2 className="min-w-0 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
      <div className="flex items-center gap-3 shrink-0">
        {extra}
        <Link href={href} className="group inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:underline underline-offset-4 whitespace-nowrap">
          {linkLabel}
          <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => openAuth('login')}
        onOpenSignup={() => openAuth('signup')}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={openCreateMeetup}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} />

      <main className="flex-1 pb-28 xl:pb-16">
        {isMember ? (
          <MemberLiveHome
            campaign={campaign}
            campaignMember={
              campaign && myRewards.isLoaded
                ? {
                    xp: myRewards.balance,
                    started: [...campaign.questIds, ...campaign.extraQuestIds].some((id) => myRewards.joinedQuestIds.includes(id)),
                    enteredAt: campaign.rewardId ? myRewards.redeemedAt[campaign.rewardId] : undefined,
                    now,
                  }
                : null
            }
            name={sessionMember?.displayName ?? 'เพื่อน'}
            avatar={sessionMember?.avatarUrl}
            now={now}
            xp={myRewards.balance}
            badges={myRewards.finished.length}
            redeemable={redeemable}
            plans={plans}
            mine={myEvents}
            hostedIds={activity.hosted.map((e) => e.id)}
            savedIds={activity.savedEventIds}
            month={monthCounts}
            savedCount={activity.savedEventIds.length + activity.savedSpotIds.length}
            likedCategories={likedCategories}
            isLoaded={activity.isLoaded && myRewards.isLoaded && isQuestsLoaded}
            meetups={memberMeetups.row}
            reasons={memberMeetups.reasons}
            isEventsLoaded={isEventsLoaded}
            quests={othersQuests}
            fairs={memberFairs}
            fairWhen={(fair) => fairDates(fair, true)}
            spots={memberSpots}
            cardKinds={interests.kinds}
            isSpotsLoaded={isSpotsLoaded}
            stampCount={myRewards.finished.length}
          />
        ) : isMemberPending ? (
          <MemberHomeSkeleton />
        ) : (
          /* 1. Hero: the collage tells the loop in three numbered steps, the words say what the site is, one orange button */
          <section className="relative overflow-hidden bg-[#FFF8F1]">
            <div className="pointer-events-none absolute -top-20 -left-20 w-56 h-56 rounded-full bg-[#FFE7D6]" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-40 -right-28 w-80 h-80 rounded-full bg-[#E3EDFF]" aria-hidden="true" />
            {/* Same height as the /moments hero (MomentShowcase): same padding and collage sizes (owner 2026-10-24) */}
            <div className={`relative ${CONTAINER} pt-5 pb-8 md:py-10 grid md:grid-cols-[1fr_1.05fr] gap-6 md:gap-10 items-center`}>
              <div className="relative h-[170px] sm:h-[200px] md:h-[240px] lg:h-[270px] w-full max-w-[320px] md:max-w-[440px] mx-auto" aria-hidden="true">
                <figure className="absolute left-[3%] top-[6%] w-[46%] h-[80%]">
                  <Image src={HERO_PHOTOS[0]} alt="" fill priority sizes="(min-width: 768px) 220px, 160px" className="-rotate-3 object-cover rounded-[1.75rem] lg:rounded-[2rem] shadow-lg border-4 border-white" />
                  <span className={`${HERO_LABEL} -bottom-3 left-1/2 -translate-x-1/2`}>{heroStep(0)}</span>
                </figure>
                <figure className="absolute right-[8%] top-0 w-[36%] aspect-square">
                  <Image src={HERO_PHOTOS[1]} alt="" fill priority sizes="(min-width: 768px) 220px, 160px" className="object-cover rounded-full shadow-lg border-4 border-white" />
                  <span className={`${HERO_LABEL} top-[10%] -left-[40%]`}>{heroStep(1)}</span>
                </figure>
                <figure className="absolute right-0 bottom-[2%] w-[44%] h-[44%]">
                  <Image src={HERO_PHOTOS[2]} alt="" fill priority sizes="(min-width: 768px) 220px, 160px" className="rotate-3 object-cover rounded-[1.75rem] lg:rounded-[2rem] shadow-lg border-4 border-white" />
                  <span className={`${HERO_LABEL} -bottom-3 right-3.5`}>{heroStep(2)}</span>
                </figure>
                {/* Phones: the live line rides on the photos as a sticker, so the hero keeps the /moments height */}
                <span className="md:hidden empty:hidden absolute z-10 left-0 top-[-4%] -rotate-3 inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-700 shadow-md">
                  <LiveJoinsLine short />
                </span>
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-[29px] leading-[1.3] sm:text-[36px] lg:text-[44px] lg:leading-[1.22] font-bold text-slate-900 tracking-tight">
                  คอมมูนิตี้ของคน
                  <br />
                  ชอบ<span className="text-[#F26430]">ออกไปใช้ชีวิต</span>
                </h1>
                <p className="mt-3 text-[15px] sm:text-lg lg:text-xl font-semibold text-slate-700">
                  พบเจอมิตรภาพใหม่ <span className="whitespace-nowrap">ส่งต่อความประทับใจ</span>
                </p>
                {/* Two ways in: the open ตี้ photos (main) and friends' moments, each scrolls to its section below */}
                <div className="mt-5 lg:mt-6 flex items-center justify-center md:justify-start gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => scrollToId('journey-meetups')}
                    className="flex-1 sm:flex-none h-13 px-4 sm:px-8 rounded-full bg-[#F26430] hover:bg-[#E2551F] text-white text-[15px] sm:text-base lg:text-[17px] font-semibold shadow-[0_8px_20px_rgba(242,100,48,0.28)] whitespace-nowrap cursor-pointer transition-colors"
                  >
                    หากิจกรรมที่ใช่
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToId('journey-moments')}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-13 px-4 sm:px-7 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-[15px] sm:text-base lg:text-[17px] font-semibold shadow-sm whitespace-nowrap cursor-pointer transition-colors"
                  >
                    <Camera className="w-5 h-5 text-[#F43F5E]" aria-hidden="true" />
                    ดูโมเมนต์
                  </button>
                </div>
                {/* Signs of life without names (the top bar already says สมัครฟรี); on phones it sits on the photos */}
                <div className="hidden mt-5 lg:mt-6 md:flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-[13px] sm:text-sm text-slate-700">
                  <LiveJoinsLine faces={photoFaces('w-6 h-6', 'border-[#FFF8F1]')} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Members get their own home above (MemberLiveHome); the rest is the landing page for visitors.
            A search from the header window opens the ค้นพบ pages. */}
        {!isMember && !isMemberPending && (
          <>
            {/* The running campaign, one slim line under the hero; gone outside its dates (owner 2026-10-25) */}
            <div className={`${CONTAINER} pt-4 sm:pt-6`}>
              <CampaignStrip campaign={campaign} />
            </div>
            <div id="journey-top" className={`${CONTAINER} pt-8 sm:pt-12 space-y-12 sm:space-y-16 scroll-mt-20`}>
              {/* 2. Proof of the community the hero names ("คอมมูนิตี้ของคนชอบออกไปใช้ชีวิต"): people and their moments
                  first, then how to start (owner 2026-10-23) */}
              <section id="journey-moments" className="space-y-4 scroll-mt-24">
                {sectionHead('เพื่อน & โมเมนต์', '/moments')}
                <FriendsMomentsWall />
              </section>

              {/* 3. Meetups, picked by the category cards; company is offered, never required */}
              <section id="journey-meetups" className="space-y-4 scroll-mt-24">
                {/* A picked category with more than the row holds names the full count on its link */}
                {sectionHead(
                  'ดูตี้ตามสายที่ชอบ',
                  meetupsHref,
                  undefined,
                  meetupCategory !== 'all' && landingMatches.length > landingMeetups.length ? `ดูทั้งหมด ${landingMatches.length} ตี้` : undefined
                )}

                {/* The category cards filter the row right below; one row that slides (phones swipe, iPad and up get arrows) */}
                <CategoryStickerCards cards={categoryCards} selectedId={meetupCategory} onSelect={setMeetupCategory} label="เลือกสาย" countUnit="ตี้เปิดรับ" fadeEmpty />

                {isEventsLoaded && landingMeetups.length === 0 && (
                  <p className="text-sm text-slate-500">ยังไม่มีตี้แบบนี้ เปิดตี้แรกเองเลยไหม?</p>
                )}
                {/* The hero's "หากิจกรรมที่ใช่" lands on the section heading, so "ดูตี้ตามสายที่ชอบ" and the สาย cards show too (owner 2026-10-23) */}
                <div id="journey-meetup-tiles" className="scroll-mt-24">
                  <OpenMeetupTiles
                    events={landingMeetups}
                    isLoaded={isEventsLoaded}
                    savedIds={isLoggedIn ? favorites : []}
                    onToggleSave={toggleFavoriteEvent}
                  />
                </div>
              </section>

              {/* 4. A reason to go */}
              <section id="journey-challenges" className="space-y-4 scroll-mt-24">
                {sectionHead('ชาเลนจ์สนุก ลองทำดูไหม?', '/challenges')}
                <ChallengePicks
                  quests={questList}
                  joinedIds={isLoggedIn ? myRewards.joinedQuestIds : []}
                  isLoaded={isQuestsLoaded}
                />
              </section>
            </div>

            {/* No mid-page sign-up band: สมัครฟรี stays in the sticky top bar and the footer (owner 2026-10-31) */}
            <div className={`${CONTAINER} pt-12 sm:pt-16 space-y-12 sm:space-y-16`}>
              {/* 6. Support: provinces to explore */}
              <section className="space-y-4">
                {/* The count sits in the head link, the same way as the fairs below */}
                {sectionHead('สายเที่ยว สายชิล ไปไหนดี?', '/spots', undefined, <>ดูทั้งหมด{spotTotal !== null && <span className="hidden sm:inline"> {spotTotal.toLocaleString()} แห่ง</span>}</>)}
                {/* Same size and row as the challenge picks: square photos, scrolling sideways until all six fit */}
                <ScrollRow className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 sm:scroll-px-0">
                  {destinations.map((d) => (
                    <Link
                      key={d.id}
                      data-row-photo
                      href={`/spots?province=${encodeURIComponent(d.provinceKey)}${d.searchTerm ? `&q=${encodeURIComponent(d.searchTerm)}` : ''}`}
                      className="group relative w-[44%] sm:w-[30%] md:w-[23%] lg:w-[calc((100%-5*24px)/6)] shrink-0 snap-start aspect-square rounded-3xl overflow-hidden bg-slate-200"
                    >
                      <img src={optimizedImage(d.imageUrl, 384)} alt={d.nameTh} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 to-transparent" aria-hidden="true" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="text-white text-sm sm:text-base font-bold leading-tight">{d.nameTh}</p>
                        <p className="text-white/80 text-[11px] sm:text-xs font-medium line-clamp-2 mt-0.5">{d.tagline}</p>
                      </div>
                    </Link>
                  ))}
                </ScrollRow>
              </section>

              {/* 7. Fairs, runs and concerts as a dated list, soonest first (trade shows last) */}
              {isEventsLoaded && fairRow.length > 0 && (
                <section className="space-y-4">
                  {sectionHead('เอ็กซ์โป งานวิ่ง คอนเสิร์ต ช่วงนี้', '/events', undefined, <>ดูทั้งหมด<span className="hidden sm:inline"> {Math.max(fairTotal ?? 0, fairEvents.length).toLocaleString()} งาน</span></>)}
                  <div className="grid lg:grid-cols-2 lg:gap-x-10">
                    {fairRow.slice(0, FAIR_ROW_SHOWN).map((fair) => {
                      const start = new Date(parseEventDateToTimestamp(fair.date));
                      const isOn = start.getTime() <= now;
                      return (
                        <Link key={fair.id} href={`/events/${encodeURIComponent(fair.id)}`} className="group flex items-center gap-3.5 py-3 border-t border-slate-200">
                          <span className="w-12 shrink-0 text-center leading-tight text-[#2B527A]">
                            <span className="block text-[22px] font-bold">{start.getDate()}</span>
                            <span className="text-xs font-semibold">{THAI_MONTHS[start.getMonth()]}</span>
                          </span>
                          {/* A dead image link falls back to the default อีเวนต์ photo, never a broken-image icon */}
                          <img src={optimizedImage(fair.image, 256)} alt="" loading="lazy" onError={(ev) => { const fallback = defaultEventImage(undefined, true); if (!ev.currentTarget.src.endsWith(fallback)) ev.currentTarget.src = fallback; }} className="w-14 h-14 sm:w-32 sm:h-[88px] shrink-0 rounded-xl object-cover bg-slate-200" />
                          <span className="flex-1 min-w-0 grid">
                            <span className="font-semibold text-slate-900 leading-snug line-clamp-2 sm:truncate group-hover:underline">{fair.title}</span>
                            <span className="text-[13px] text-slate-500 truncate">
                              {/* The status leads the second line, so the title keeps the full width */}
                              <span className={`font-semibold ${isOn ? 'text-rose-600' : 'text-[#2B527A]'}`}>{isOn ? 'กำลังจัดอยู่' : 'เร็วๆ นี้'} · </span>
                              {[FAIR_KIND_LABEL[fairKind(fair)], fairDates(fair), fair.location].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </>
        )}

        <div className={CONTAINER}>
          <SiteFooter className="pb-4 mt-12 sm:mt-16 mb-24 xl:mb-0">
            {isAuthReady && !isLoggedIn && (
              <p className="text-[13px] text-slate-500">
                พร้อมออกไปเมื่อไหร่{' '}
                <button type="button" onClick={() => openAuth('signup')} className="font-semibold text-slate-900 underline underline-offset-2 cursor-pointer">
                  สมัครฟรีได้เลย
                </button>
              </p>
            )}
          </SiteFooter>
        </div>
      </main>

      {/* Mobile Sticky Navigation */}
      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} favoritesCount={activity.savedEventIds.length + activity.savedSpotIds.length} />

      {/* Global Modals */}

      <AuthModal
        key={authMode}
        initialMode={authMode}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {
          setIsAuthModalOpen(false);
          handleSetIsLoggedIn(true);
          showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับมา');
        }}
      />

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />

      <RequireMembershipModal
        isOpen={isRequireMembershipOpen}
        onClose={() => setIsRequireMembershipOpen(false)}
        onOpenLogin={() => {
          setIsRequireMembershipOpen(false);
          setIsAuthModalOpen(true);
        }}
        actionTitle={membershipActionTitle}
      />

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          setEventsList((prev) => [newEvent, ...prev]);
          setIsCreateEventModalOpen(false);
          showToast('ตั้งตี้ใหม่สำเร็จ');
        }}
        initialType="community"
      />
    </div>
  );
}

/** A card-sized photo link (640 px, as lib/homeData.ts HOME_CARD_WIDTH); a resized link passes through as it is */
const withCardImage = (event: EventItem): EventItem => (event.image ? { ...event, image: optimizedImage(event.image, 640) } : event);

/** The member home's first blocks in grey, until the browser has confirmed the session and loaded the member home */
function MemberHomeSkeleton() {
  return (
    <div className={`${CONTAINER} pt-6 space-y-6 min-h-[100svh]`} aria-busy="true">
      <div className="h-10 w-2/3 max-w-sm rounded-full bg-slate-100 animate-pulse" />
      <div className="h-40 rounded-3xl bg-slate-100 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`aspect-square rounded-3xl bg-slate-100 animate-pulse ${i > 1 ? 'hidden sm:block' : ''}`} />
        ))}
      </div>
    </div>
  );
}

/** `initialEvents` / `initialQuests` come from the server page, so the landing page is in the HTML search engines read. */
export default function HomePage(props: InitialContent) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
      </div>
    }>
      <JourneyContent {...props} />
    </Suspense>
  );
}

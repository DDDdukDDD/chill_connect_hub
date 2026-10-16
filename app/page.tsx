'use client';

import React, { useState, useMemo, useEffect, useDeferredValue, Suspense } from 'react';
import Link from 'next/link';
import { Search, X, Trophy, Camera, Footprints, MapPin, Gift, Award } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { BrandLogo } from '@/components/BrandLogo';
import { EventGrid } from '@/components/EventGrid';
import { SpotCard, SpotCardSkeleton } from '@/components/SpotCard';
import { ChallengePicks } from '@/components/ChallengePicks';
import { FriendsMomentsWall } from '@/components/FriendsMomentsWall';
import { OpenMeetupTiles } from '@/components/OpenMeetupTiles';
import { MemberLiveHome } from '@/components/home/MemberLiveHome';
import { LiveCountsRow } from '@/components/home/LiveActivity';
import { MomentSearchRow } from '@/components/home/MomentSearchRow';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { MOCK_EVENTS, EventItem, ChallengeQuest } from '@/data/mockData';
import { MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
import { isEventEnded, parseEventDateToTimestamp } from '@/lib/dateUtils';
import { useAuth } from '@/lib/useAuth';
import { fetchAllContentPages } from '@/lib/contentClient';
import { useMyRewards } from '@/lib/useMyRewards';
import { useMyActivity } from '@/lib/useMyActivity';
import { useMemberSession } from '@/lib/useMemberSession';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { usePublishedSpots, getCachedSpotSearchText, getCachedSpotVibeCategory } from '@/lib/usePublishedSpots';
import { getCommunityEventCategory, MASTER_77_PROVINCES, type SpotVibeId } from '@/data/masterHub';
import { matchSearchQuery } from '@/lib/searchUtils';
import { isTradeEvent } from '@/lib/highlights';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { TOP_DESTINATIONS } from '@/components/TopDestinationsRail';

const ROW_SIZE = 5;

// Order of the vibes in the places row: what the audience looks for on a day off comes first
const VIBE_ORDER: SpotVibeId[] = ['cafe_slowbar', 'nature_camping', 'art_creative', 'sea_island', 'mountain_mist', 'wellness_retreat', 'oldtown_culture'];


// Photos for the hero collage and the join block (local files, shown on /spots too)
// Province picker in the hero search box: popular ones first, then all 77 (names as stored on events and places)
const POPULAR_PROVINCES = ['กรุงเทพฯ', 'เชียงใหม่', 'ชลบุรี', 'ภูเก็ต', 'นครราชสีมา', 'กาญจนบุรี'];
const OTHER_PROVINCES = MASTER_77_PROVINCES.filter((p) => !POPULAR_PROVINCES.includes(p));
const isBangkok = (p: string) => p === 'กรุงเทพฯ' || p === 'กรุงเทพมหานคร';
const isSameProvince = (a: string | undefined, b: string) => !!a && (a === b || (isBangkok(a) && isBangkok(b)));

const HERO_PHOTOS = ['/event-board-games.png', '/hero-bkk-community-golden.jpg', '/event-city-run.png'];

// Short names for the reason under a suggested meetup ("เพราะคุณชอบสายคาเฟ่")
const CATEGORY_SHORT: Record<string, string> = {
  running_fitness: 'สายวิ่ง',
  wellness_mind: 'สายฮีลใจ',
  cafe_social: 'สายคาเฟ่',
  boardgames_party: 'สายบอร์ดเกม',
  arts_crafts: 'สายศิลปะ',
  travel_outdoor: 'สายเที่ยว',
  tech_skills: 'สายเรียนรู้',
  pets_family: 'สายสัตว์เลี้ยง',
};

// What signing up gives, in the join band (general on purpose: the reward shop still holds sample partners)
const JOIN_PERKS = [
  { Icon: Gift, bg: 'bg-violet-100', fg: 'text-[#7C3AED]', text: 'เก็บ XP แลกส่วนลดและของรางวัล' },
  { Icon: Trophy, bg: 'bg-amber-100', fg: 'text-amber-600', text: 'ทำชาเลนจ์ครบ รับของจากร้านค้า' },
  { Icon: Award, bg: 'bg-rose-100', fg: 'text-rose-600', text: 'สะสมเหรียญจากทุกชาเลนจ์' },
];

// Quick searches under the hero search box
// White label pinned to a hero collage photo
const HERO_LABEL = 'absolute z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs lg:text-sm font-bold text-slate-900 shadow-md';

const QUICK_SEARCHES = ['คาเฟ่', 'วิ่ง', 'บอร์ดเกม', 'เชียงใหม่'];

// Provinces shown in "สายเที่ยว สายชิล ไปไหนดี?"
const DESTINATION_IDS = ['bkk', 'chiangmai', 'chonburi', 'khaoyai', 'krabi', 'nan'];

// The kinds named in the home page fair heading, and how many fairs that row shows
const FAIR_ROW_KINDS = ['fair', 'run', 'concert'] as const;
const FAIR_ROW_SHOWN = 4;
const fairKind = (e: EventItem): (typeof FAIR_ROW_KINDS)[number] => {
  const text = `${e.title} ${e.tag}`;
  if (/วิ่ง|มาราธอน|เทรล|marathon|run|trail/i.test(text)) return 'run';
  if (/คอนเสิร์ต|ดนตรีสด|concert|live music/i.test(text)) return 'concert';
  return 'fair';
};

const eventSearchText = (e: EventItem) =>
  `${e.title} ${e.description} ${e.tag} ${e.location} ${e.hostName || ''} ${e.province || ''}`.toLowerCase();

// "12 ต.ค. – 18 ต.ค." for a fair, years left out
const fairDates = (e: EventItem) => {
  const short = (d: string) => d.replace(/\s*\d{4}$/, '');
  return e.endDate && e.endDate !== e.date ? `${short(e.date)} – ${short(e.endDate)}` : short(e.date);
};

// Each kind, soonest first; ended events never show on the homepage
const upcomingByDate = (events: EventItem[], type: 'community' | 'public_venue') =>
  events
    .filter((e) => (e.eventType || 'community') === type && !isEventEnded(e))
    .sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date));

// Same test the server applies in lib/social/spotTrips.ts (spotAllowsMeetups)
const allowsMeetups = (spot: LifestyleSpotItem) =>
  spot.meetupAllowed === true && spot.category !== 'bar' && spot.publicationStatus !== 'draft';

function JourneyContent() {
  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [isEventsLoaded, setIsEventsLoaded] = useState(false);
  const [questList, setQuestList] = useState<ChallengeQuest[]>([]);
  const [isQuestsLoaded, setIsQuestsLoaded] = useState(false);
  const { spots: liveSpots, isLoaded: isSpotsLoaded } = usePublishedSpots();
  const spotsList = useMemo(() => (liveSpots.length > 0 ? liveSpots : isSpotsLoaded ? MOCK_SPOTS : []), [liveSpots, isSpotsLoaded]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteSpots, setFavoriteSpots] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const query = useDeferredValue(searchQuery.trim());
  // Province picked at the end of the hero search box; empty means every province
  const [province, setProvince] = useState('');
  const searching = Boolean(query || province);
  const inProvince = (p?: string) => !province || isSameProvince(p, province);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  // Joined challenges and their progress come from the account, as on /challenges
  const myRewards = useMyRewards(isLoggedIn);
  // Signed in, the page is the member's own home (greeting, what is next, picks for them) instead of the landing page
  const isMember = isAuthReady && isLoggedIn;
  const sessionMember = useMemberSession().member;
  const activity = useMyActivity();
  const [now] = useState(() => Date.now());
  const [likedCategories, setLikedCategories] = useState<string[]>([]);
  useEffect(() => {
    if (!isMember) return;
    let alive = true;
    fetch('/api/auth/member/preferences', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (alive) setLikedCategories(json?.preferences?.interests?.communityCategories ?? []);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isMember]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync with runtime DB and localStorage
  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem('favorite_events');
      if (storedFavs) setFavorites(JSON.parse(storedFavs));
      const storedSpotFavs = localStorage.getItem('favorite_spots');
      if (storedSpotFavs) setFavoriteSpots(JSON.parse(storedSpotFavs));
    } catch {}

    let isActive = true;
    fetchAllContentPages<ChallengeQuest>('/api/quests', 'quests')
      .then((quests) => {
        if (isActive) setQuestList(quests);
      })
      .catch((err) => console.warn('Journey challenges:', err))
      .finally(() => {
        if (isActive) setIsQuestsLoaded(true);
      });

    fetchAllContentPages<EventItem>('/api/events', 'events')
      .then((events) => {
        if (isActive) setEventsList(events.length > 0 ? events : MOCK_EVENTS);
      })
      .catch((err) => {
        console.warn('Journey events fallback:', err);
        if (isActive) setEventsList(MOCK_EVENTS);
      })
      .finally(() => {
        if (isActive) setIsEventsLoaded(true);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const triggerMembershipPrompt = (actionTitle: string) => {
    setMembershipActionTitle(actionTitle);
    setIsRequireMembershipOpen(true);
  };

  const openCreateMeetup = () => {
    if (!isLoggedIn) triggerMembershipPrompt('เพื่อตั้งตี้ใหม่');
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

  const toggleFavoriteSpot = (spotId: string) => {
    if (!isLoggedIn) {
      triggerMembershipPrompt('เพื่อบันทึกสถานที่โปรด');
      return;
    }
    setFavoriteSpots((prev) => {
      const isFav = prev.includes(spotId);
      const updated = isFav ? prev.filter((id) => id !== spotId) : [...prev, spotId];
      showToast(isFav ? 'ลบสถานที่ออกจากรายการโปรดแล้ว' : 'บันทึกสถานที่โปรดแล้ว');
      try {
        localStorage.setItem('favorite_spots', JSON.stringify(updated));
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
    for (let round = 0; picked.length < ROW_SIZE && queues.some((q) => q.length > round); round++) {
      for (const queue of queues) {
        if (queue[round] && picked.length < ROW_SIZE) picked.push(queue[round]);
      }
    }
    return picked;
  }, [rankedSpots]);

  // One search box covers meetups, places and fairs; the full pages keep the detailed filters
  const spotRow = useMemo(
    () =>
      searching
        ? rankedSpots.filter((s) => inProvince(s.province) && (!query || matchSearchQuery(getCachedSpotSearchText(s), query))).slice(0, ROW_SIZE)
        : featuredSpots,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rankedSpots, featuredSpots, query, province]
  );
  const communityRow = useMemo(
    () =>
      communityEvents
        .filter((e) => e.participantsCount < e.maxParticipants)
        .filter((e) => inProvince(e.province) && (!query || matchSearchQuery(eventSearchText(e), query)))
        .slice(0, ROW_SIZE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [communityEvents, query, province]
  );
  const fairRow = useMemo(() => {
    const matched = fairEvents
      .filter((e) => inProvince(e.province) && (!query || matchSearchQuery(eventSearchText(e), query)))
      // Trade shows stay listed on /fairs but go last here (the sort keeps the date order within each group)
      .sort((a, b) => Number(isTradeEvent(a)) - Number(isTradeEvent(b)));
    if (searching) return matched.slice(0, ROW_SIZE);
    // The heading promises "งานแฟร์ งานวิ่ง งานคอน", so the row starts with the soonest of each kind, then fills by date
    const firsts = FAIR_ROW_KINDS.map((kind) => matched.find((e) => fairKind(e) === kind)).filter((e): e is EventItem => !!e);
    const picked = [...firsts, ...matched.filter((e) => !firsts.includes(e))].slice(0, FAIR_ROW_SHOWN);
    return matched.filter((e) => picked.includes(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fairEvents, query, province]);

  // Member home: the next meetup or fair they go to or host, and the challenge in progress that closes first
  const nextEvent = useMemo(
    () =>
      [...activity.joined, ...activity.hosted]
        .filter((e) => !isEventEnded(e))
        .sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date))[0] ?? null,
    [activity.joined, activity.hosted]
  );
  const challengeNow = useMemo(() => {
    const doing = myRewards.quests.flatMap((progress) => {
      const quest = questList.find((q) => q.id === progress.questId);
      if (!progress.joined || progress.completed || !quest) return [];
      if (quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0)) return [];
      return [{ quest, progress }];
    });
    return doing.sort((a, b) => (a.quest.daysRemaining ?? 999) - (b.quest.daysRemaining ?? 999))[0] ?? null;
  }, [myRewards.quests, questList]);
  const redeemable = REWARD_SHOP_ITEMS.filter((item) => !myRewards.redeemedRewardIds.includes(item.id) && item.costXp <= myRewards.balance).length;

  // Member home: open meetups they have not joined, the categories they picked at onboarding first, each with its reason
  const memberMeetups = useMemo(() => {
    const mine = new Set([...activity.joinedIds, ...activity.hosted.map((e) => e.id)]);
    const open = communityEvents.filter((e) => e.participantsCount < e.maxParticipants && !mine.has(e.id));
    const liked = open.filter((e) => likedCategories.includes(getCommunityEventCategory(e)));
    const row = [...liked, ...open.filter((e) => !liked.includes(e))].slice(0, ROW_SIZE);
    const reasons: Record<string, string> = {};
    for (const event of row) {
      const cat = COMMUNITY_LIFESTYLE_CATEGORIES.find((c) => c.id === getCommunityEventCategory(event));
      if (cat && likedCategories.includes(cat.id)) reasons[event.id] = `เพราะคุณชอบ${CATEGORY_SHORT[cat.id] ?? cat.name}`;
    }
    return { row, reasons };
  }, [communityEvents, activity.joinedIds, activity.hosted, likedCategories]);

  // Member home: running challenges the member has not joined, the ones most people are doing first
  const othersQuests = useMemo(
    () =>
      questList
        .filter((q) => q.status !== 'ended' && (q.daysRemaining === undefined || q.daysRemaining > 0) && !myRewards.joinedQuestIds.includes(q.id))
        .sort((a, b) => (b.participantsCount ?? 0) - (a.participantsCount ?? 0)),
    [questList, myRewards.joinedQuestIds]
  );

  // Open meetups (seats left) per category, shown on each box
  const categoryBoxes = useMemo(() => {
    const open = communityEvents.filter((e) => e.participantsCount < e.maxParticipants);
    return COMMUNITY_LIFESTYLE_CATEGORIES.map((cat) => ({ cat, count: open.filter((e) => getCommunityEventCategory(e) === cat.id).length }));
  }, [communityEvents]);

  const destinations = DESTINATION_IDS.flatMap((id) => TOP_DESTINATIONS.filter((d) => d.id === id));

  const withQuery = (path: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (province) params.set('province', province);
    return params.size ? `${path}?${params}` : path;
  };

  // Every section opens the same way: a heading, one friendly line, and "ดูทั้งหมด"
  const sectionHead = (title: string, href: string, extra?: React.ReactNode) => (
    <div className="flex items-end justify-between gap-3">
      <h2 className="min-w-0 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
      <div className="flex items-center gap-3 shrink-0">
        {extra}
        <Link href={href} className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">
          ดูทั้งหมด
        </Link>
      </div>
    </div>
  );

  const rowSkeleton = (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {Array.from({ length: ROW_SIZE }).map((_, i) => (
        <div key={i} className="h-64 rounded-2xl bg-slate-100" />
      ))}
    </div>
  );

  const eventRow = (events: EventItem[]) =>
    !isEventsLoaded ? (
      rowSkeleton
    ) : (
      <EventGrid
        events={events}
        responsiveLimit={{ mobile: 4, desktop: ROW_SIZE }}
        columns={5}
        layout="carousel"
        onSelectEvent={() => { }}
        favorites={isLoggedIn ? favorites : []}
        toggleFavorite={toggleFavoriteEvent}
        onResetFilters={() => setSearchQuery('')}
      />
    );

  const spotCards = !isSpotsLoaded ? (
    <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory sm:grid sm:overflow-visible sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {Array.from({ length: ROW_SIZE }).map((_, i) => (
        <SpotCardSkeleton key={i} />
      ))}
    </div>
  ) : spotRow.length === 0 ? (
    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-600">
      ไม่พบที่เที่ยวที่ตรงกับคำค้นหา
    </p>
  ) : (
    <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory sm:grid sm:overflow-visible sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {spotRow.map((spot) => (
        // On phones the row scrolls sideways, like the event rows
        <div key={spot.id} className="h-full w-[62%] shrink-0 snap-start sm:w-auto">
          <SpotCard spot={spot} isFavorite={isLoggedIn && favoriteSpots.includes(spot.id)} onToggleFavorite={toggleFavoriteSpot} />
        </div>
      ))}
    </div>
  );


  // A search shows its matches in three rows; the story of the page comes back when it is cleared
  const searchResults = (
    <div className="space-y-10 sm:space-y-14">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600 min-w-0 truncate">
          ผลการค้นหา <strong className="font-bold text-slate-900">{[query, province].filter(Boolean).join(' · ')}</strong>
        </p>
        <button
          type="button"
          onClick={() => { setSearchQuery(''); setProvince(''); }}
          className="shrink-0 h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
        >
          ล้างคำค้นหา
        </button>
      </div>
      <section className="space-y-4">
        {sectionHead('ตี้ที่เปิดรับอยู่', withQuery('/community'))}
        {eventRow(communityRow)}
      </section>
      <section className="space-y-4">
        {sectionHead('ที่เที่ยว', withQuery('/spots'))}
        {spotCards}
      </section>
      <section className="space-y-4">
        {sectionHead('งานแฟร์ & นิทรรศการ', withQuery('/fairs'))}
        {eventRow(fairRow)}
      </section>
      <section className="space-y-4">
        {sectionHead('โมเมนต์', '/moments')}
        <MomentSearchRow query={query || province} />
      </section>
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
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={openCreateMeetup}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold border border-slate-700 animate-slide-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 pb-28 sm:pb-16">
        {isMember ? (
          <MemberLiveHome
            name={sessionMember?.displayName ?? 'เพื่อน'}
            avatar={sessionMember?.avatarUrl}
            now={now}
            xp={myRewards.balance}
            badges={myRewards.finished.length}
            redeemable={redeemable}
            nextEvent={nextEvent}
            challenge={challengeNow}
            challengesDoing={myRewards.quests.filter((p) => p.joined && !p.completed).length}
            savedCount={favorites.length + favoriteSpots.length}
            likedCategories={likedCategories}
            isLoaded={activity.isLoaded && myRewards.isLoaded && isQuestsLoaded}
            meetups={memberMeetups.row}
            reasons={memberMeetups.reasons}
            isEventsLoaded={isEventsLoaded}
            quests={othersQuests}
            fairs={fairRow}
            fairWhen={fairDates}
            spots={featuredSpots}
            isSpotsLoaded={isSpotsLoaded}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={query ? searchResults : null}
          />
        ) : (
          <>
          {/* 1. Hero: a photo collage whose labels tell the loop, one line of promise, one search box */}
          <section className="relative overflow-hidden bg-[#FFF8F1]">
            <div className="pointer-events-none absolute -top-20 -left-20 w-56 h-56 rounded-full bg-[#FFE7D6]" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-28 -right-16 w-80 h-80 rounded-full bg-[#E3EDFF]" aria-hidden="true" />
            <div className="relative max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6 sm:pt-7 sm:pb-8 lg:pt-6 lg:pb-7 grid md:grid-cols-[1.1fr_1fr] lg:grid-cols-[minmax(0,1fr)_460px] xl:grid-cols-[minmax(0,1fr)_500px] gap-6 lg:gap-12 items-center">
              {/* Collage: right on tablets and desktop; phones show the photos inside the headline instead, so the hero stays short */}
              <div className="hidden md:block relative md:h-[240px] lg:h-[250px] md:order-2 w-full max-w-[500px] mx-auto" aria-hidden="true">
                <figure className="absolute left-[3%] top-[6%] w-[46%] h-[80%]">
                  <img src={HERO_PHOTOS[0]} alt="" className="-rotate-3 w-full h-full object-cover rounded-[2rem] shadow-lg border-4 border-white" />
                  <span className={`${HERO_LABEL} -bottom-3 left-1/2 -translate-x-1/2`}>
                    <Search className="w-4 h-4 text-amber-500" /> หากิจกรรมที่ใช่
                  </span>
                </figure>
                <figure className="absolute right-[8%] top-0 w-[36%] aspect-square">
                  <img src={HERO_PHOTOS[1]} alt="" className="w-full h-full object-cover rounded-full shadow-lg border-4 border-white" />
                  <span className={`${HERO_LABEL} top-[12%] -left-[30%]`}>
                    <Footprints className="w-4 h-4 text-[#2563EB]" /> ออกไปใช้ชีวิต
                  </span>
                </figure>
                <figure className="absolute right-0 bottom-[2%] w-[44%] h-[44%]">
                  <img src={HERO_PHOTOS[2]} alt="" className="rotate-3 w-full h-full object-cover rounded-[2rem] shadow-lg border-4 border-white" />
                  <span className={`${HERO_LABEL} -bottom-3 right-4`}>
                    <Camera className="w-4 h-4 text-rose-500" /> แบ่งปันเรื่องราว
                  </span>
                </figure>
              </div>

              <div className="text-center md:text-left">
                {/* What the site is, as the headline; the promise and the everyday activities under it */}
                <h1 className="text-[30px] leading-snug sm:text-[40px] md:text-[36px] lg:text-[46px] lg:leading-[1.15] font-bold text-slate-900 tracking-tight">
                  คอมมูนิตี้ของคน{' '}
                  <img src={HERO_PHOTOS[0]} alt="" className="md:hidden inline-block align-middle w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-md -rotate-6" aria-hidden="true" />
                  <br />
                  ชอบ<span className="text-[#F26430]">ออกไปใช้ชีวิต</span>{' '}
                  <img src={HERO_PHOTOS[2]} alt="" className="md:hidden inline-block align-middle w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-md rotate-6" aria-hidden="true" />
                  <span className="hidden md:inline-flex align-middle w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#F26430] text-white items-center justify-center -rotate-6" aria-hidden="true">
                    <Footprints className="w-5 h-5 lg:w-6 lg:h-6" />
                  </span>
                </h1>
                <p className="mt-3 text-base sm:text-lg lg:text-xl font-semibold text-slate-800">
                  พบเจอมิตรภาพใหม่ <span className="whitespace-nowrap">ส่งต่อความประทับใจ</span>
                </p>
                <form
                  role="search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    document.getElementById('journey-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="mt-4 max-w-lg mx-auto md:mx-0 flex items-center gap-2 rounded-full bg-white border border-slate-200 shadow-md p-1.5 pl-4"
                >
                  <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาตี้ หรือที่เที่ยว"
                    aria-label="ค้นหา"
                    className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 outline-hidden [&::-webkit-search-cancel-button]:hidden"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="ล้างคำค้นหา"
                      className="w-8 h-8 shrink-0 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {/* Where: the province, last before the button (as in the classic hero) */}
                  <span className="w-px h-6 bg-slate-200 shrink-0" aria-hidden="true" />
                  <label className="relative flex items-center gap-1 shrink-0 cursor-pointer">
                    <MapPin className="w-4 h-4 text-[#F26430] shrink-0" aria-hidden="true" />
                    <span className="sr-only">จังหวัด</span>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="max-w-[92px] sm:max-w-[132px] truncate bg-transparent text-sm font-semibold text-slate-700 outline-hidden cursor-pointer"
                    >
                      <option value="">ทุกจังหวัด</option>
                      <optgroup label="ยอดนิยม">
                        {POPULAR_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </optgroup>
                      <optgroup label="จังหวัดอื่นๆ">
                        {OTHER_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </optgroup>
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="h-10 px-5 shrink-0 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold shadow-sm whitespace-nowrap cursor-pointer transition-colors"
                  >
                    ค้นหา
                  </button>
                </form>
                <div className="mt-2.5 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-center sm:justify-center md:justify-start gap-2 overflow-x-auto sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <span className="shrink-0 text-xs font-bold text-slate-500">ลองค้น:</span>
                  {QUICK_SEARCHES.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => setSearchQuery(word)}
                      className="h-8 px-3 shrink-0 rounded-full bg-white border border-slate-200 hover:border-slate-400 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                    >
                      {word}
                    </button>
                  ))}
                </div>
                {/* Signs of life without names: last week's joins, challenges and moments */}
                <LiveCountsRow className="mt-4 md:justify-start" />
              </div>
            </div>
          </section>
          </>
        )}

        <div id="journey-top" className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 space-y-12 sm:space-y-16 scroll-mt-20">
          {/* Members get their own home above (MemberLiveHome); this part is the landing page for visitors */}
          {isMember ? null : searching ? (
            searchResults
          ) : (
            <>
              {/* 2. What do you feel like doing: the eight community categories, each opening its meetups (landing page only) */}
              {(
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">เป็นสายไหน?</h2>
                <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
                  {categoryBoxes.map(({ cat, count }, i) => {
                    const Icon = cat.icon;
                    return (
                      <Link
                        key={cat.id}
                        href={`/community?category=${cat.id}`}
                        aria-label={count > 0 ? `${cat.name} ${count} ตี้เปิดรับ` : cat.name}
                        className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 border-slate-100 border-b-4 ${cat.colorScheme.borderBottom} bg-white px-1 py-3 sm:py-4 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 transition-all`}
                      >
                        {/* The count sits on the corner like a sticker, so the box keeps its size */}
                        {count > 0 && (
                          <span className={`absolute -top-2 -right-1.5 min-w-6 h-6 px-1.5 rounded-full border-2 border-white text-[11px] font-bold flex items-center justify-center shadow-sm rotate-12 group-hover:rotate-0 transition-transform ${cat.colorScheme.activeBg}`} aria-hidden="true">
                            {count}
                          </span>
                        )}
                        <span className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${cat.colorScheme.iconBg} ${cat.colorScheme.iconColor} ${i % 2 ? 'rotate-6' : '-rotate-6'} group-hover:rotate-0 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-5 h-5 sm:w-7 sm:h-7" aria-hidden="true" />
                        </span>
                        {/* Break only at the ampersand, never inside a Thai word */}
                        <span className="text-[11px] sm:text-xs font-bold text-slate-800 text-center leading-tight" aria-hidden="true">
                          {cat.name.split(' & ').map((part, j, all) => (
                            <span key={part} className="block whitespace-nowrap">
                              {part}
                              {j < all.length - 1 ? ' &' : ''}
                            </span>
                          ))}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
              )}

              {/* 3. Who to go with; company is offered, never required */}
              <section id="journey-meetups" className="space-y-4 scroll-mt-24">
                {sectionHead('ตี้แนะนำ เปิดรับอยู่', '/community')}
                <OpenMeetupTiles
                  events={communityRow}
                  isLoaded={isEventsLoaded}
                  onCreate={openCreateMeetup}
                />
              </section>

              {/* 4. A reason to go */}
              <section id="journey-challenges" className="space-y-4 scroll-mt-24">
                {sectionHead('ชาเลนจ์สนุก แนะนำสำหรับคุณ', '/challenges')}
                <ChallengePicks
                  quests={questList}
                  joinedIds={isLoggedIn ? myRewards.joinedQuestIds : []}
                  isLoaded={isQuestsLoaded}
                />
              </section>

              {/* Signed out only: the invitation to join, high on the page right after the meetups and challenges */}
              {isAuthReady && !isLoggedIn && (
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-50 via-amber-50 to-sky-50 px-5 py-6 sm:px-10 sm:py-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-center sm:text-left">
                  <div className="flex -space-x-3 shrink-0" aria-hidden="true">
                    {HERO_PHOTOS.map((src, i) => (
                      <img key={src} src={src} alt="" className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-[3px] border-white shadow-sm ${i === 1 ? '-translate-y-1.5 rotate-3' : '-rotate-3'}`} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">มาเป็นส่วนหนึ่งของ <span className="whitespace-nowrap">Chill &amp; Connect กัน</span></p>
                    {/* What a member gets, kept general while the reward shop holds sample partners */}
                    <ul className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-2.5 sm:gap-x-6 text-left">
                      {JOIN_PERKS.map(({ Icon, bg, fg, text }) => (
                        <li key={text} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                          <span className={`w-8 h-8 shrink-0 rounded-xl ${bg} ${fg} flex items-center justify-center`} aria-hidden="true">
                            <Icon className="w-4 h-4" />
                          </span>
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="shrink-0 w-full sm:w-auto h-12 px-8 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-base font-bold shadow-sm whitespace-nowrap cursor-pointer transition-colors"
                  >
                    สมัครสมาชิกฟรี
                  </button>
                </section>
              )}

              {/* 5. Proof that people went, which makes the next person go */}
              <section id="journey-moments" className="space-y-4 scroll-mt-24">
                {sectionHead('เพื่อน & โมเมนต์', '/moments')}
                <FriendsMomentsWall />
              </section>

              {/* 6. Support: provinces to explore, then the fairs coming up */}
              <section className="space-y-4">
                {sectionHead('สายเที่ยว สายชิล ไปไหนดี?', '/spots')}
                {/* Same size and row as the challenge picks: square photos, scrolling sideways until all six fit */}
                <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 sm:scroll-px-0">
                  {destinations.map((d) => (
                    <Link
                      key={d.id}
                      href={`/spots?province=${encodeURIComponent(d.provinceKey)}`}
                      className="group relative w-[44%] sm:w-[30%] md:w-[23%] lg:w-[calc((100%-5*24px)/6)] shrink-0 snap-start aspect-square rounded-3xl overflow-hidden bg-slate-200"
                    >
                      <img src={d.imageUrl} alt={d.nameTh} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 to-transparent" aria-hidden="true" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="text-white text-sm sm:text-base font-bold leading-tight">{d.nameTh}</p>
                        <p className="text-white/80 text-[11px] sm:text-xs font-medium line-clamp-2 mt-0.5">{d.tagline}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/spots" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold whitespace-nowrap transition-colors">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                    ที่เที่ยวทั้งหมด{isSpotsLoaded ? ` ${spotsList.length.toLocaleString()} แห่ง` : ''}
                  </Link>
                </div>

                {/* Fairs and exhibitions get their own row, soonest first (trade shows last) */}
                {isEventsLoaded && fairRow.length > 0 && (
                  <div className="pt-4 sm:pt-6 space-y-3">
                    <div className="flex items-end justify-between gap-3">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">งานแฟร์ งานวิ่ง งานคอน ช่วงนี้</h3>
                      <Link href="/fairs" className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">
                        ดูทั้งหมด {fairEvents.length.toLocaleString()} งาน
                      </Link>
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-3 sm:grid sm:overflow-visible sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                      {fairRow.slice(0, FAIR_ROW_SHOWN).map((fair) => {
                        const isOn = parseEventDateToTimestamp(fair.date) <= now;
                        return (
                          <Link key={fair.id} href={`/fairs/${encodeURIComponent(fair.id)}`} className="group w-[72%] shrink-0 snap-start sm:w-auto">
                            <span className="relative block aspect-[16/10] rounded-2xl overflow-hidden bg-slate-200">
                              <img src={fair.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${isOn ? 'bg-[#F26430] text-white' : 'bg-white text-slate-900'}`}>
                                {isOn ? 'กำลังจัดอยู่' : 'เร็วๆ นี้'}
                              </span>
                            </span>
                            <span className="block mt-2 text-sm sm:text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{fair.title}</span>
                            <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500 min-w-0">
                              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span className="truncate">{fairDates(fair)} · {fair.location}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

            </>
          )}

          {/* Footer */}
          <footer className="border-t border-slate-200 pt-8 pb-4 text-center text-xs text-slate-500 space-y-2 mt-12 mb-16 md:mb-0">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-900">
              <BrandLogo size="xs" />
              <span>Chill & Connect Hub</span>
            </div>
            <p className="font-medium text-slate-600">ทำให้ทุกการออกไปใช้ชีวิตมีความหมาย</p>
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 text-xs text-slate-500 pt-1 flex-wrap">
              <Link href="/about" className="hover:text-slate-800 hover:underline">เกี่ยวกับเรา</Link>
              <span className="text-slate-300">•</span>
              <Link href="/safety" className="hover:text-slate-800 hover:underline">คู่มือความปลอดภัย</Link>
              <span className="text-slate-300">•</span>
              <Link href="/legal" className="hover:text-slate-800 hover:underline">ข้อตกลงการใช้งาน</Link>
              <span className="text-slate-300">•</span>
              <Link href="/legal?tab=privacy" className="hover:text-slate-800 hover:underline">นโยบายความเป็นส่วนตัว</Link>
            </div>
            <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
          </footer>
        </div>
      </main>

      {/* Mobile Sticky Navigation */}
      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} favoritesCount={favorites.length} />

      {/* Global Modals */}
      <AuthModal
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

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
      </div>
    }>
      <JourneyContent />
    </Suspense>
  );
}

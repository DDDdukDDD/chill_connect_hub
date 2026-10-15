'use client';

import React, { useState, useMemo, useEffect, useDeferredValue, Suspense } from 'react';
import Link from 'next/link';
import { Search, X, Users, ShieldCheck, Flag, Trophy, Camera, Footprints, ArrowRight, MapPin } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { BrandLogo } from '@/components/BrandLogo';
import { EventGrid } from '@/components/EventGrid';
import { SpotCard, SpotCardSkeleton } from '@/components/SpotCard';
import { ChallengePicks } from '@/components/ChallengePicks';
import { FriendsMomentsWall } from '@/components/FriendsMomentsWall';
import { OpenMeetupTiles } from '@/components/OpenMeetupTiles';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { MOCK_EVENTS, EventItem, ChallengeQuest } from '@/data/mockData';
import { MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
import { isEventEnded, parseEventDateToTimestamp } from '@/lib/dateUtils';
import { useAuth } from '@/lib/useAuth';
import { fetchAllContentPages } from '@/lib/contentClient';
import { useMyRewards } from '@/lib/useMyRewards';
import { usePublishedSpots, getCachedSpotSearchText, getCachedSpotVibeCategory } from '@/lib/usePublishedSpots';
import { getCommunityEventCategory, type SpotVibeId } from '@/data/masterHub';
import { matchSearchQuery } from '@/lib/searchUtils';
import { isTradeEvent } from '@/lib/highlights';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { TOP_DESTINATIONS } from '@/components/TopDestinationsRail';

const ROW_SIZE = 5;

// Order of the vibes in the places row: what the audience looks for on a day off comes first
const VIBE_ORDER: SpotVibeId[] = ['cafe_slowbar', 'nature_camping', 'art_creative', 'sea_island', 'mountain_mist', 'wellness_retreat', 'oldtown_culture'];

// The core loop (docs/PRODUCT_DIRECTION.md), told as "how it works" near the end of the page
const HOW_IT_WORKS = [
  { href: '/challenges', Icon: Trophy, blob: 'bg-amber-100/70', iconBg: 'bg-amber-400 text-white', title: 'เลือกชาเลนจ์ที่ใช่', line: 'เหตุผลดีๆ ให้ออกไป ไปให้ครบแล้วรับแต้ม เหรียญ และของรางวัลจากร้าน', cta: 'ดูชาเลนจ์' },
  { href: '/community', Icon: Users, blob: 'bg-orange-100/70', iconBg: 'bg-[#F26430] text-white', title: 'ร่วมตี้ หรือไปเองก็ได้', line: 'อยากมีเพื่อนไปด้วยก็ร่วมตี้ที่เปิดรับ หรือตั้งตี้เอง ไปคนเดียวก็นับเหมือนกัน', cta: 'ดูตี้' },
  { href: '/moments', Icon: Camera, blob: 'bg-rose-100/70', iconBg: 'bg-rose-500 text-white', title: 'แชร์โมเมนต์', line: 'เก็บรูปและเรื่องเล่าจากที่ที่ไป ให้เพื่อนๆ อยากไปตาม', cta: 'ดูโมเมนต์' },
];

// Photos for the hero collage and the join block (local files, shown on /spots too)
const HERO_PHOTOS = ['/images/destinations/chiangmai.jpg', '/images/destinations/krabi.jpg', '/images/destinations/bkk.jpg'];

// Quick searches under the hero search box
const QUICK_SEARCHES = ['คาเฟ่', 'วิ่ง', 'บอร์ดเกม', 'เชียงใหม่'];

// Provinces shown in "ไปไหนดี?"
const DESTINATION_IDS = ['bkk', 'chiangmai', 'chonburi', 'khaoyai', 'krabi', 'nan'];

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

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  // Joined challenges and their progress come from the account, as on /challenges
  const myRewards = useMyRewards(isLoggedIn);

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
    () => (query ? rankedSpots.filter((s) => matchSearchQuery(getCachedSpotSearchText(s), query)).slice(0, ROW_SIZE) : featuredSpots),
    [rankedSpots, featuredSpots, query]
  );
  const communityRow = useMemo(
    () =>
      communityEvents
        .filter((e) => e.participantsCount < e.maxParticipants)
        .filter((e) => !query || matchSearchQuery(eventSearchText(e), query))
        .slice(0, ROW_SIZE),
    [communityEvents, query]
  );
  const fairRow = useMemo(
    () =>
      fairEvents
        .filter((e) => !query || matchSearchQuery(eventSearchText(e), query))
        // Trade shows stay listed on /fairs but go last here (the sort keeps the date order within each group)
        .sort((a, b) => Number(isTradeEvent(a)) - Number(isTradeEvent(b)))
        .slice(0, ROW_SIZE),
    [fairEvents, query]
  );

  // Open meetups (seats left) per category, shown on each box
  const categoryBoxes = useMemo(() => {
    const open = communityEvents.filter((e) => e.participantsCount < e.maxParticipants);
    return COMMUNITY_LIFESTYLE_CATEGORIES.map((cat) => ({ cat, count: open.filter((e) => getCommunityEventCategory(e) === cat.id).length }));
  }, [communityEvents]);

  const destinations = DESTINATION_IDS.flatMap((id) => TOP_DESTINATIONS.filter((d) => d.id === id));

  const withQuery = (path: string) => (query ? `${path}?q=${encodeURIComponent(query)}` : path);

  // Every section opens the same way: a heading, one friendly line, and "ดูทั้งหมด"
  const sectionHead = (title: string, line: string, href: string, extra?: React.ReactNode) => (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
        {line && <p className="mt-1 text-sm font-medium text-slate-500">{line}</p>}
      </div>
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
          ผลการค้นหา <strong className="font-extrabold text-slate-900">{query}</strong>
        </p>
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          className="shrink-0 h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
        >
          ล้างคำค้นหา
        </button>
      </div>
      <section className="space-y-4">
        {sectionHead('ตี้ที่เปิดรับอยู่', '', withQuery('/community'))}
        {eventRow(communityRow)}
      </section>
      <section className="space-y-4">
        {sectionHead('ที่เที่ยว', '', withQuery('/spots'))}
        {spotCards}
      </section>
      <section className="space-y-4">
        {sectionHead('งานแฟร์ & นิทรรศการ', '', withQuery('/fairs'))}
        {eventRow(fairRow)}
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
        {/* 1. Hero: a photo collage whose labels tell the loop, one line of promise, one search box */}
        <section className="relative overflow-hidden bg-[#FFF8F1]">
          <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#FFE7D6]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-[#E3EDFF]" aria-hidden="true" />
          <div className="relative max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-7 sm:pt-8 sm:pb-10 grid lg:grid-cols-[1.1fr_1fr] gap-5 lg:gap-10 items-center">
            {/* Collage: first on phones, right on desktop */}
            <div className="relative h-[180px] sm:h-[260px] lg:h-[320px] lg:order-2 w-full max-w-[520px] mx-auto" aria-hidden="true">
              <img src={HERO_PHOTOS[0]} alt="" className="absolute left-[4%] top-[8%] w-[48%] h-[78%] object-cover rounded-[2rem] -rotate-3 shadow-lg border-4 border-white" />
              <img src={HERO_PHOTOS[1]} alt="" className="absolute right-[6%] top-0 w-[38%] aspect-square object-cover rounded-full shadow-lg border-4 border-white" />
              <img src={HERO_PHOTOS[2]} alt="" className="absolute right-[2%] bottom-0 w-[44%] h-[46%] object-cover rounded-[2rem] rotate-3 shadow-lg border-4 border-white" />
              <span className="absolute left-0 bottom-[10%] inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs sm:text-sm font-extrabold text-slate-900 shadow-md">
                <Trophy className="w-4 h-4 text-amber-500" /> ทำชาเลนจ์ รับแต้ม
              </span>
              <span className="absolute left-[40%] top-[2%] inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs sm:text-sm font-extrabold text-slate-900 shadow-md">
                <Users className="w-4 h-4 text-[#F26430]" /> ไปกับตี้
              </span>
              <span className="absolute right-[30%] bottom-[38%] inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs sm:text-sm font-extrabold text-slate-900 shadow-md">
                <Camera className="w-4 h-4 text-rose-500" /> แชร์โมเมนต์
              </span>
            </div>

            <div className="text-center lg:text-left">
              <h1 className="text-[26px] leading-tight sm:text-4xl lg:text-[44px] lg:leading-[1.15] font-black text-slate-900 tracking-tight">
                ออกไปใช้ชีวิต{' '}
                <span className="inline-flex align-middle w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#F26430] text-white items-center justify-center -rotate-6" aria-hidden="true">
                  <Footprints className="w-4 h-4 sm:w-6 sm:h-6" />
                </span>
                <br />
                พบเจอ<span className="text-[#F26430]">มิตรภาพ</span>ใหม่{' '}
                <span className="inline-flex align-middle w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#2563EB] text-white items-center justify-center rotate-6" aria-hidden="true">
                  <Users className="w-4 h-4 sm:w-6 sm:h-6" />
                </span>
                <br />
                ส่งต่อ<span className="text-[#2563EB]">ความประทับใจ</span>
              </h1>
              <p className="mt-2.5 sm:mt-3 text-sm sm:text-base font-medium text-slate-600 max-w-lg mx-auto lg:mx-0">
                ชาเลนจ์สนุกๆ ตี้ชิลๆ และกิจกรรมมากมาย<span className="whitespace-nowrap">ทั่วไทย</span> <span className="whitespace-nowrap">รอให้คุณออกไปลอง</span>
              </p>

              <form
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  document.getElementById('journey-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="mt-4 sm:mt-5 max-w-lg mx-auto lg:mx-0 flex items-center gap-2 rounded-full bg-white border border-slate-200 shadow-md p-1.5 pl-4"
              >
                <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาตี้ ที่เที่ยว หรือจังหวัด"
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
                <button
                  type="submit"
                  className="h-10 px-5 shrink-0 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold shadow-sm whitespace-nowrap cursor-pointer transition-colors"
                >
                  ค้นหา
                </button>
              </form>
              <div className="mt-3 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="text-xs font-bold text-slate-500">ลองค้น:</span>
                {QUICK_SEARCHES.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => setSearchQuery(word)}
                    className="h-8 px-3 rounded-full bg-white border border-slate-200 hover:border-slate-400 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div id="journey-top" className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 space-y-12 sm:space-y-16 scroll-mt-20">
          {query ? (
            searchResults
          ) : (
            <>
              {/* 2. What do you feel like doing: the eight community categories, each opening its meetups */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">เป็นสายไหน?</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">เลือกสายที่ใช่ แล้วดูว่ามีตี้ไหนชวนอยู่บ้าง</p>
                </div>
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
                          <span className={`absolute -top-2 -right-1.5 min-w-6 h-6 px-1.5 rounded-full border-2 border-white text-[11px] font-black flex items-center justify-center shadow-sm rotate-12 group-hover:rotate-0 transition-transform ${cat.colorScheme.activeBg}`} aria-hidden="true">
                            {count}
                          </span>
                        )}
                        <span className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${cat.colorScheme.iconBg} ${cat.colorScheme.iconColor} ${i % 2 ? 'rotate-6' : '-rotate-6'} group-hover:rotate-0 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-5 h-5 sm:w-7 sm:h-7" aria-hidden="true" />
                        </span>
                        {/* Break only at the ampersand, never inside a Thai word */}
                        <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 text-center leading-tight" aria-hidden="true">
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

              {/* 3. A reason to go */}
              <section id="journey-challenges" className="space-y-4 scroll-mt-24">
                {sectionHead('ชาเลนจ์สนุก แนะนำสำหรับคุณ', 'ชวนเพื่อนไปก็ได้ ไปคนเดียวก็สนุก ทำครบรับแต้มกับของรางวัลไปเลย', '/challenges')}
                <ChallengePicks quests={questList} joinedIds={isLoggedIn ? myRewards.joinedQuestIds : []} isLoaded={isQuestsLoaded} />
              </section>

              {/* Signed out only: the invitation to join, high on the page right after the first reason to go */}
              {isAuthReady && !isLoggedIn && (
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-50 via-amber-50 to-sky-50 px-5 py-6 sm:px-10 sm:py-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-center sm:text-left">
                  <div className="flex -space-x-3 shrink-0" aria-hidden="true">
                    {HERO_PHOTOS.map((src, i) => (
                      <img key={src} src={src} alt="" className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-[3px] border-white shadow-sm ${i === 1 ? '-translate-y-1.5 rotate-3' : '-rotate-3'}`} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">มาเป็นส่วนหนึ่งของ <span className="whitespace-nowrap">Chill &amp; Connect กัน</span></p>
                    <p className="mt-1 text-sm sm:text-base font-medium text-slate-600">ให้ทุกการออกไปใช้ชีวิตมีความหมาย สมัครฟรี แล้วเก็บแต้ม ร่วมตี้ และแชร์โมเมนต์ได้เลย</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="shrink-0 w-full sm:w-auto h-12 px-8 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-base font-extrabold shadow-sm whitespace-nowrap cursor-pointer transition-colors"
                  >
                    สมัครสมาชิกฟรี
                  </button>
                </section>
              )}

              {/* 4. Who to go with; company is offered, never required */}
              <section id="journey-meetups" className="space-y-4 scroll-mt-24">
                {sectionHead('ตี้แนะนำ เปิดรับอยู่', 'อยากมีเพื่อนไปด้วยก็ร่วมตี้ อยากไปเองก็ได้เหมือนกัน', '/community')}
                <OpenMeetupTiles events={communityRow} isLoaded={isEventsLoaded} onCreate={openCreateMeetup} />
              </section>

              {/* 5. Proof that people went, which makes the next person go */}
              <section id="journey-moments" className="space-y-4 scroll-mt-24">
                {sectionHead('เพื่อน & โมเมนต์', 'เรื่องเล่าจริงจากเพื่อนๆ ที่ออกไปมาแล้ว แตะที่รูปเพื่ออ่านเรื่องของแต่ละคน', '/moments')}
                <FriendsMomentsWall />
              </section>

              {/* 6. Support: provinces to explore, then the fairs coming up */}
              <section className="space-y-4">
                {sectionHead('ไปไหนดี?', 'ที่เที่ยว ที่เดินเล่น และงานแฟร์ทั่วไทย เลือกจังหวัดที่อยากไปได้เลย', '/spots')}
                {/* On phones the provinces scroll sideways, like the other photo rows */}
                <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-3 sm:grid sm:overflow-visible sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
                  {destinations.map((d) => (
                    <Link
                      key={d.id}
                      href={`/spots?province=${encodeURIComponent(d.provinceKey)}`}
                      className="group relative w-[42%] shrink-0 snap-start sm:w-auto aspect-[4/5] rounded-2xl overflow-hidden bg-slate-200"
                    >
                      <img src={d.imageUrl} alt={d.nameTh} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 to-transparent" aria-hidden="true" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="text-white text-sm sm:text-base font-black leading-tight">{d.nameTh}</p>
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
                      <h3 className="text-base sm:text-lg font-black text-slate-900">งานแฟร์ & นิทรรศการช่วงนี้</h3>
                      <Link href="/fairs" className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">
                        ดูทั้งหมด {fairEvents.length.toLocaleString()} งาน
                      </Link>
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-3 sm:grid sm:overflow-visible sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                      {fairRow.slice(0, 4).map((fair) => {
                        const isOn = parseEventDateToTimestamp(fair.date) <= Date.now();
                        return (
                          <Link key={fair.id} href={`/fairs/${encodeURIComponent(fair.id)}`} className="group w-[72%] shrink-0 snap-start sm:w-auto">
                            <span className="relative block aspect-[16/10] rounded-2xl overflow-hidden bg-slate-200">
                              <img src={fair.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-sm ${isOn ? 'bg-[#F26430] text-white' : 'bg-white text-slate-900'}`}>
                                {isOn ? 'กำลังจัดอยู่' : 'เร็วๆ นี้'}
                              </span>
                            </span>
                            <span className="block mt-2 text-sm sm:text-[15px] font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{fair.title}</span>
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

              {/* 7. How it works, the way Meetup tells it: three steps of the loop, then the safety rules in one line */}
              <section className="space-y-6 sm:space-y-8">
                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Chill & Connect Hub ใช้งานยังไง</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">ออกไปทำสิ่งที่ชอบ เจอเพื่อนใหม่ แล้วเก็บเรื่องเล่ากลับมา ใช้ฟรีทั้งหมด</p>
                </div>
                <ol className="grid gap-6 sm:grid-cols-3 sm:gap-8">
                  {HOW_IT_WORKS.map(({ href, Icon, blob, iconBg, title, line, cta }, i) => (
                    <li key={href}>
                      <Link href={href} className="group flex sm:flex-col sm:items-center sm:text-center gap-4">
                        <span className={`relative w-20 h-20 sm:w-28 sm:h-28 shrink-0 rounded-full ${blob} flex items-center justify-center`} aria-hidden="true">
                          <span className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${iconBg} flex items-center justify-center shadow-sm ${i % 2 ? 'rotate-6' : '-rotate-6'} group-hover:rotate-0 group-hover:scale-110 transition-transform`}>
                            <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                          </span>
                          <span className="absolute -top-1 -left-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white text-xs sm:text-sm font-black flex items-center justify-center border-2 border-white">
                            {i + 1}
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-base sm:text-lg font-black text-slate-900 group-hover:underline">{title}</span>
                          <span className="block mt-1 text-sm font-medium text-slate-600 sm:max-w-[17rem] sm:mx-auto">{line}</span>
                          <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#2563EB]">
                            {cta} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
                {/* Safety stays, kept to what is true today */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-x-5 gap-y-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs sm:text-sm font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1.5 font-extrabold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    ออกไปอย่างสบายใจ
                  </span>
                  <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />ทริปชวนเพื่อนอย่างน้อย 3 คน นัดกลางวัน เจอกันที่สถานที่</span>
                  <span className="inline-flex items-center gap-1.5"><Flag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />รายงานหรือบล็อกได้ทุกเมื่อ</span>
                  <Link href="/safety" className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">อ่านกติกาความปลอดภัย</Link>
                </div>
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

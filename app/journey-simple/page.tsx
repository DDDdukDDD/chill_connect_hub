'use client';

import React, { useState, useMemo, useEffect, useDeferredValue, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, X, Dices, Compass, Users, Building2, Star, ShieldCheck, Flag, BadgeCheck, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { MemberPrivilegesSection } from '@/components/MemberPrivilegesSection';
import { JourneySectionCarousel } from '@/components/JourneySectionCarousel';
import { JourneyMomentCard } from '@/components/JourneyMomentCard';
import { CommunityChallengeBar } from '@/components/CommunityChallengeBar';
import { CommunityMomentsStrip } from '@/components/CommunityMomentsStrip';
import { SurpriseModal } from '@/components/SurpriseModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/LazyCreateEventModal';
import { MOCK_EVENTS, EventItem } from '@/data/mockData';
import { MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
import { isEventEnded, parseEventDateToTimestamp, toBuddhistEra } from '@/lib/dateUtils';
import { useAuth } from '@/lib/useAuth';
import { fetchAllContentPages } from '@/lib/contentClient';
import { usePublishedSpots, getCachedSpotSearchText, getCachedSpotVibeCategory } from '@/lib/usePublishedSpots';
import type { SpotVibeId } from '@/data/masterHub';
import { matchSearchQuery } from '@/lib/searchUtils';
import { JourneyHolidayPlans } from '@/components/JourneyHolidayPlans';
import { buildHolidayPlans, type Mood } from '@/lib/holidayPlans';
import { Toast } from '@/components/Toast';

const ROW_SIZE = 10;
const CARD_SLOT = 'w-[46%] sm:w-[calc((100%-2*14px)/3)] md:w-[calc((100%-3*14px)/4)] lg:w-[calc((100%-4*14px)/5)] shrink-0 snap-start';

// Order of the vibes in the first row: what the audience looks for on a day off comes first
const VIBE_ORDER: SpotVibeId[] = ['cafe_slowbar', 'nature_camping', 'views_rooftop', 'temple_mu', 'art_creative', 'sea_island', 'food_street', 'mountain_mist', 'market_walking', 'wellness_retreat', 'oldtown_culture', 'museum_learning', 'city_parks', 'fun_activities', 'nightlife_bars', 'shopping_mall'];

// The two words of the brand, as the one choice a visitor makes on this page
const MOODS: { id: Mood; word: string; line: string }[] = [
  { id: 'chill', word: 'Chill', line: 'เวลาของตัวเอง' },
  { id: 'connect', word: 'Connect', line: 'ออกไปเจอคน' },
];

// Row order for each mood; every row stays on the page in both
const ROW_ORDER: Record<Mood, ('spots' | 'community' | 'fairs')[]> = {
  chill: ['spots', 'fairs', 'community'],
  connect: ['community', 'spots', 'fairs'],
};

const eventSearchText =(e: EventItem) =>
  `${e.title} ${e.description} ${e.tag} ${e.location} ${e.hostName || ''} ${e.province || ''}`.toLowerCase();

// Each pillar, soonest first; ended events never show on the homepage
const upcomingByDate = (events: EventItem[], type: 'community' | 'public_venue') =>
  events
    .filter((e) => (e.eventType || 'community') === type && !isEventEnded(e))
    .sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date));

const isFree =(price?: string) => !!price && (price.includes('ฟรี') || price.toLowerCase().includes('free'));

// Same test the server applies in lib/social/spotTrips.ts (spotAllowsMeetups)
const allowsMeetups = (spot: LifestyleSpotItem) =>
  spot.meetupAllowed === true && spot.category !== 'bar' && spot.publicationStatus !== 'draft';

function RowSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={CARD_SLOT}>
          <div className="aspect-[4/5] rounded-2xl bg-slate-100" />
        </div>
      ))}
    </>
  );
}

function RowEmpty({ text, href }: { text: string; href: string }) {
  return (
    <div className="w-full bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200 flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-600">{text}</p>
      <Link href={href} className="shrink-0 text-xs sm:text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">
        ดูทั้งหมด
      </Link>
    </div>
  );
}

function JourneyContent() {
  const router = useRouter();
  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [isEventsLoaded, setIsEventsLoaded] = useState(false);
  const { spots: liveSpots, isLoaded: isSpotsLoaded } = usePublishedSpots();
  const spotsList = useMemo(() => (liveSpots.length > 0 ? liveSpots : isSpotsLoaded ? MOCK_SPOTS : []), [liveSpots, isSpotsLoaded]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteSpots, setFavoriteSpots] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const query = useDeferredValue(searchQuery.trim());
  const [mood, setMood] = useState<Mood>('chill');
  // Plans count days from the visitor's clock, so they are built after the page loads in the browser
  const [todayStart, setTodayStart] = useState<number | null>(null);
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setTodayStart(today.getTime());
  }, []);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('อีกนิดเดียว ก็ไปต่อได้แล้ว');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isSurpriseModalOpen, setIsSurpriseModalOpen] = useState(false);

  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();

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

  const toggleFavoriteEvent = (eventId: string) => {
    if (!isLoggedIn) {
      triggerMembershipPrompt('เก็บกิจกรรมนี้ไว้ ไม่ให้พลาด');
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
      triggerMembershipPrompt('เก็บที่นี่ไว้ ไว้หาวันไป');
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

  // The first row a new visitor sees: one place per vibe in turn, places open for meet-ups first
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

  // One search box covers the three rows; pillar pages keep the detailed filters
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
    () => fairEvents.filter((e) => !query || matchSearchQuery(eventSearchText(e), query)).slice(0, ROW_SIZE),
    [fairEvents, query]
  );

  // Connect mood: places staff opened for meet-ups, when there are enough to fill a row
  const meetupSpots = useMemo(() => rankedSpots.filter(allowsMeetups).slice(0, ROW_SIZE), [rankedSpots]);
  const showMeetupSpots = mood === 'connect' && !query && meetupSpots.length >= 3;
  const shownSpotRow = showMeetupSpots ? meetupSpots : spotRow;

  const holidayPlans = useMemo(
    () => (todayStart === null ? [] : buildHolidayPlans({ events: eventsList, spots: spotsList, mood, todayStart })),
    [eventsList, spotsList, mood, todayStart]
  );

  const withQuery = (path: string) => (query ? `${path}?q=${encodeURIComponent(query)}` : path);

  const doors = [
    { href: '/spots', label: 'ที่เที่ยว', count: isSpotsLoaded ? `${spotsList.length.toLocaleString()} แห่ง` : '', Icon: Compass, color: 'text-[#4A7C59]', tint: 'bg-[#EBF3ED]' },
    { href: '/community', label: 'กิจกรรม', count: isEventsLoaded ? `${communityEvents.length.toLocaleString()} กิจกรรม` : '', Icon: Users, color: 'text-[#F26430]', tint: 'bg-[#FFF4EE]' },
    { href: '/events', label: 'งานแฟร์', count: isEventsLoaded ? `${fairEvents.length.toLocaleString()} งาน` : '', Icon: Building2, color: 'text-[#2B527A]', tint: 'bg-[#EEF4FA]' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    document.getElementById('journey-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      {/* 1. Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => {
          if (!isLoggedIn) triggerMembershipPrompt('ชวนคนมาออกไปด้วยกัน ตั้งตี้ของคุณเลย');
          else setIsCreateEventModalOpen(true);
        }}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} />

      <main className="flex-1 pb-28 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 space-y-10 sm:space-y-14">

          {/* 2. One question, one search, three doors */}
          <div className="space-y-3 sm:space-y-4">
            <section className="relative rounded-3xl overflow-hidden bg-slate-100">
              <Image
                src="/hero-bkk-community-golden.jpg"
                alt=""
                fill
                preload
                sizes="(min-width: 1280px) 1216px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" aria-hidden="true" />
              <div className="relative px-5 py-7 sm:px-10 sm:py-12 lg:py-14 max-w-2xl space-y-4">
                <div className="space-y-1.5">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
                    วันหยุดนี้ ไปไหนดี
                  </h1>
                  <p className="text-sm font-medium text-white/90">รวมที่เที่ยว กิจกรรม และงานแฟร์ทั่วไทย จะไปเอง หรือหาเพื่อนไปด้วยก็ได้</p>
                </div>

                <form onSubmit={handleSearchSubmit} role="search" className="flex items-center gap-2 bg-white rounded-2xl p-1.5 shadow-sm">
                  <label htmlFor="journey-search" className="sr-only">ค้นหาที่เที่ยว กิจกรรม และงานแฟร์</label>
                  <Search className="w-4 h-4 text-slate-500 ml-2.5 shrink-0" aria-hidden="true" />
                  <input
                    id="journey-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ที่เที่ยว กิจกรรม งานแฟร์"
                    className="flex-1 min-w-0 bg-transparent py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-500 placeholder:font-medium outline-none [&::-webkit-search-cancel-button]:hidden"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="ล้างคำค้นหา"
                      className="w-8 h-8 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="shrink-0 h-10 px-4 sm:px-5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold shadow-sm whitespace-nowrap cursor-pointer transition-colors active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
                  >
                    ค้นหา
                  </button>
                </form>

              </div>
            </section>

            <nav aria-label="หมวดหลัก" className="grid grid-cols-3 gap-2 sm:gap-4">
              {doors.map(({ href, label, count, Icon, color, tint }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                >
                  <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${tint} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm sm:text-base font-bold text-slate-900">{label}</span>
                    <span className="block min-h-[1rem] text-[11px] sm:text-xs font-semibold text-slate-500 tabular-nums truncate">{count}</span>
                  </span>
                  <ArrowRight className="hidden sm:block w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                </Link>
              ))}
            </nav>

            {/* The two words: one choice reorders the page. The surprise button is for visitors with no idea yet */}
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:gap-4">
              <div role="group" aria-label="วันนี้อยากได้แบบไหน" className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
                {MOODS.map(({ id, word, line }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={mood === id}
                    onClick={() => setMood(id)}
                    className={`flex flex-col sm:flex-row sm:items-baseline sm:justify-center gap-x-2.5 rounded-xl px-3 py-2.5 sm:py-3 text-left sm:text-center cursor-pointer transition-colors duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                      mood === id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">{word}</span>
                    <span className="text-xs sm:text-sm font-medium">{line}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsSurpriseModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 h-12 sm:h-auto px-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-sm font-bold whitespace-nowrap cursor-pointer transition-colors duration-200 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <Dices className="w-5 h-5" aria-hidden="true" />
                ยังไม่รู้จะไปไหน สุ่มให้ฉัน
              </button>
            </div>
          </div>

          {/* 3. Ready-made day plans across the three pillars; hidden while searching */}
          {!query && (
            <JourneyHolidayPlans
              plans={holidayPlans}
              isLoading={!isEventsLoaded || !isSpotsLoaded || todayStart === null}
              subtitle={
                mood === 'connect'
                  ? 'กิจกรรมที่ยังมีที่ว่าง กับที่เที่ยวและงานในจังหวัดเดียวกัน วันเดียวกัน'
                  : 'ที่เที่ยวกับงานที่จัดในจังหวัดเดียวกัน วันเดียวกัน ไปคนเดียวก็ได้'
              }
            />
          )}

          {/* 4. One row per pillar; the mood decides the order (flex order keeps the three rows mounted) */}
          <div id="journey-results" className="scroll-mt-24 flex flex-col gap-10 sm:gap-14">
            {query && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600 min-w-0 truncate">
                  ผลการค้นหา <strong className="font-bold text-slate-900">{query}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="shrink-0 h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
                >
                  ล้างคำค้นหา
                </button>
              </div>
            )}

            {(!isSpotsLoaded || shownSpotRow.length > 0 || query) && (
              <div style={{ order: ROW_ORDER[mood].indexOf('spots') + 1 }}>
              <JourneySectionCarousel
                title={showMeetupSpots ? 'ที่ชวนคนไปด้วยได้' : 'ที่น่าไป'}
                subtitle={showMeetupSpots ? 'ที่เที่ยวที่ทีมงานเปิดให้นัดเจอกันได้' : 'คาเฟ่ ธรรมชาติ ศิลปะ และที่พักใจทั่วไทย'}
                moreLink={withQuery('/spots')}
                moreText="ดูทั้งหมด"
              >
                {!isSpotsLoaded ? (
                  <RowSkeleton />
                ) : shownSpotRow.length === 0 ? (
                  <RowEmpty text="ไม่พบที่เที่ยวที่ตรงกับคำค้นหา" href="/spots" />
                ) : (
                  shownSpotRow.map((spot) => (
                    <div key={spot.id} className={CARD_SLOT}>
                      <JourneyMomentCard
                        type="spot"
                        id={spot.id}
                        title={spot.title}
                        image={spot.image}
                        location={spot.province}
                        categoryLabel={spot.categoryLabel}
                        authorOrHost={{ name: allowsMeetups(spot) ? 'ชวนเพื่อนไปได้' : spot.district || spot.province }}
                        metricBadge={
                          spot.rating > 0 ? (
                            <span className="flex items-center gap-0.5 tabular-nums">
                              <Star className="w-3 h-3 fill-amber-300 text-amber-300" aria-hidden="true" />
                              {spot.rating}
                            </span>
                          ) : undefined
                        }
                        isFavorite={favoriteSpots.includes(spot.id)}
                        onToggleFavorite={toggleFavoriteSpot}
                        href={`/spots/${spot.id}`}
                      />
                    </div>
                  ))
                )}
              </JourneySectionCarousel>
              </div>
            )}

            {(!isEventsLoaded || communityRow.length > 0 || query) && (
              <div style={{ order: ROW_ORDER[mood].indexOf('community') + 1 }}>
              <JourneySectionCarousel
                title={mood === 'connect' ? 'กำลังหาเพื่อนไปด้วย' : 'กิจกรรมกลุ่มเล็ก'}
                subtitle={mood === 'connect' ? 'กิจกรรมกลุ่มเล็กที่ยังมีที่ว่าง' : 'ถ้าอยากเจอคนใหม่ กลุ่มเหล่านี้ยังมีที่ว่าง'}
                moreLink={withQuery('/community')}
                moreText="ดูทั้งหมด"
              >
                {!isEventsLoaded ? (
                  <RowSkeleton />
                ) : communityRow.length === 0 ? (
                  <RowEmpty text="ไม่พบกิจกรรมที่ตรงกับคำค้นหา" href="/community" />
                ) : (
                  communityRow.map((event) => (
                    <div key={event.id} className={CARD_SLOT}>
                      <JourneyMomentCard
                        type="community"
                        id={event.id}
                        title={event.title}
                        image={event.image}
                        location={event.province || event.location}
                        categoryLabel={[toBuddhistEra(event.date), event.time?.split('-')[0].trim()].filter(Boolean).join(' • ')}
                        authorOrHost={{ name: event.hostName || 'โฮสต์คอมมูนิตี้', avatar: event.hostAvatar }}
                        metricBadge={
                          <span className="flex items-center gap-1 tabular-nums">
                            <Users className="w-3 h-3" aria-hidden="true" />
                            {event.participantsCount}/{event.maxParticipants} คน
                          </span>
                        }
                        isFavorite={favorites.includes(event.id)}
                        onToggleFavorite={toggleFavoriteEvent}
                        href={`/community/${event.id}`}
                      />
                    </div>
                  ))
                )}
              </JourneySectionCarousel>
              </div>
            )}

            {(!isEventsLoaded || fairRow.length > 0 || query) && (
              <div style={{ order: ROW_ORDER[mood].indexOf('fairs') + 1 }}>
              <JourneySectionCarousel
                title="งานแฟร์ช่วงนี้"
                subtitle="งานมหกรรมและเอ็กซ์โปที่ใกล้ถึง"
                moreLink={withQuery('/events')}
                moreText="ดูทั้งหมด"
              >
                {!isEventsLoaded ? (
                  <RowSkeleton />
                ) : fairRow.length === 0 ? (
                  <RowEmpty text="ไม่พบงานแฟร์ที่ตรงกับคำค้นหา" href="/events" />
                ) : (
                  fairRow.map((event) => (
                    <div key={event.id} className={CARD_SLOT}>
                      <JourneyMomentCard
                        type="fair"
                        id={event.id}
                        title={event.title}
                        image={event.image}
                        location={event.province || event.location}
                        categoryLabel={toBuddhistEra(event.date)}
                        authorOrHost={{ name: event.location || event.hostName || 'ผู้จัดงาน' }}
                        metricBadge={isFree(event.price) ? <span>เข้าฟรี</span> : undefined}
                        isFavorite={favorites.includes(event.id)}
                        onToggleFavorite={toggleFavoriteEvent}
                        href={`/events/${event.id}`}
                      />
                    </div>
                  ))
                )}
              </JourneySectionCarousel>
              </div>
            )}
          </div>

          {/* 5. Member privileges */}
          <div id="journey-privileges" className="scroll-mt-24">
            <MemberPrivilegesSection isLoggedIn={isLoggedIn} />
          </div>

          {/* 6. Challenges */}
          <div id="journey-challenges" className="scroll-mt-24">
            <CommunityChallengeBar
              minimalHeader={true}
            />
          </div>

          {/* 7. Moments */}
          <div id="journey-moments" className="scroll-mt-24">
            <CommunityMomentsStrip minimalHeader={true} />
          </div>

          {/* 8. Why us, kept to what is true today */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">เที่ยวอย่างสบายใจ</h2>
            <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              {[
                { Icon: Users, text: 'ทริปชวนเพื่อนมีกติกา อย่างน้อย 3 คน นัดตอนกลางวัน และเจอกันที่สถานที่' },
                { Icon: Flag, text: 'รายงานหรือบล็อกคนที่ทำให้ไม่สบายใจได้ทุกเมื่อ' },
                { Icon: BadgeCheck, text: 'ข้อมูลงานแฟร์มาจากผู้จัดงานและศูนย์ประชุมโดยตรง' },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <Icon className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm font-medium text-slate-700">{text}</span>
                </li>
              ))}
            </ul>
            <Link href="/safety" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              อ่านกติกาความปลอดภัย
            </Link>
          </section>

        </div>
      </main>

      {/* Mobile Sticky Navigation */}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={favorites.length}
      />

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
          showToast('สร้างกิจกรรมใหม่สำเร็จ');
        }}
        initialType="community"
      />

      <SurpriseModal
        isOpen={isSurpriseModalOpen}
        onClose={() => setIsSurpriseModalOpen(false)}
        events={eventsList}
        spots={spotsList}
        mode={mood === 'connect' ? 'community' : 'all'}
        onSelectEvent={(ev) => {
          setIsSurpriseModalOpen(false);
          router.push(ev.eventType === 'public_venue' ? `/events/${ev.id}` : `/community/${ev.id}`);
        }}
        onSelectTarget={(target) => {
          setIsSurpriseModalOpen(false);
          if (target.type === 'spot') {
            router.push(`/spots/${target.id}`);
          } else if (target.type === 'fair') {
            router.push(`/events/${target.id}`);
          } else {
            router.push(`/community/${target.id}`);
          }
        }}
      />
    </div>
  );
}

export default function JourneyPage() {
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

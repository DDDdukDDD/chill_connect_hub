'use client';

import React, { useState, useMemo, useEffect, useDeferredValue, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, ShieldCheck, Flag, BadgeCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { MemberPrivilegesSection } from '@/components/MemberPrivilegesSection';
import { HeroSection } from '@/components/HeroSection';
import { TrendingCarousel } from '@/components/TrendingCarousel';
import { EventGrid } from '@/components/EventGrid';
import { SpotCard, SpotCardSkeleton } from '@/components/SpotCard';
import { CommunityChallengeBar } from '@/components/CommunityChallengeBar';
import { CommunityMomentsStrip } from '@/components/CommunityMomentsStrip';
import { SurpriseModal } from '@/components/SurpriseModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { MOCK_EVENTS, EventItem } from '@/data/mockData';
import { MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
import { isEventEnded, parseEventDateToTimestamp } from '@/lib/dateUtils';
import { useAuth } from '@/lib/useAuth';
import { fetchAllContentPages } from '@/lib/contentClient';
import { usePublishedSpots, getCachedSpotSearchText, getCachedSpotVibeCategory } from '@/lib/usePublishedSpots';
import type { SpotVibeId } from '@/data/masterHub';
import { matchSearchQuery } from '@/lib/searchUtils';
import { isTradeEvent } from '@/lib/highlights';

const ROW_SIZE = 5;

// Order of the vibes in the first row: what the audience looks for on a day off comes first
const VIBE_ORDER: SpotVibeId[] = ['cafe_slowbar', 'nature_camping', 'art_creative', 'sea_island', 'mountain_mist', 'wellness_retreat', 'oldtown_culture'];

// The page tells one story in three steps: where to go, who has been, what you get for going
const STEPS = [
  { href: '#journey-where', title: 'เลือกที่ไป', line: 'ที่เที่ยว กิจกรรม งานแฟร์' },
  { href: '#journey-moments', title: 'โมเมนต์จากเพื่อนๆ', line: 'รูปและเรื่องเล่าจากคนที่ไปจริง' },
  { href: '#journey-rewards', title: 'ภารกิจและรางวัล', line: 'ออกไปเที่ยว สะสมเหรียญและแต้ม' },
];

const eventSearchText =(e: EventItem) =>
  `${e.title} ${e.description} ${e.tag} ${e.location} ${e.hostName || ''} ${e.province || ''}`.toLowerCase();

// Each pillar, soonest first; ended events never show on the homepage
const upcomingByDate = (events: EventItem[], type: 'community' | 'public_venue') =>
  events
    .filter((e) => (e.eventType || 'community') === type && !isEventEnded(e))
    .sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date));

// Same test the server applies in lib/social/spotTrips.ts (spotAllowsMeetups)
const allowsMeetups = (spot: LifestyleSpotItem) =>
  spot.meetupAllowed === true && spot.category !== 'bar' && spot.publicationStatus !== 'draft';

function JourneyContent() {
  const router = useRouter();
  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [isEventsLoaded, setIsEventsLoaded] = useState(false);
  const { spots: liveSpots, isLoaded: isSpotsLoaded } = usePublishedSpots();
  const spotsList = useMemo(() => (liveSpots.length > 0 ? liveSpots : isSpotsLoaded ? MOCK_SPOTS : []), [liveSpots, isSpotsLoaded]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteSpots, setFavoriteSpots] = useState<string[]>([]);
  const [joinedQuestTitles, setJoinedQuestTitles] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const query = useDeferredValue(searchQuery.trim());
  const [surpriseMode, setSurpriseMode] = useState<'all' | 'spots' | 'community' | 'fairs'>('all');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
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
      const storedQuests = localStorage.getItem('joined_quest_titles');
      if (storedQuests) setJoinedQuestTitles(JSON.parse(storedQuests));
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
    () =>
      fairEvents
        .filter((e) => !query || matchSearchQuery(eventSearchText(e), query))
        // Trade shows stay listed on /fairs but go last here (the sort keeps the date order within each group)
        .sort((a, b) => Number(isTradeEvent(a)) - Number(isTradeEvent(b)))
        .slice(0, ROW_SIZE),
    [fairEvents, query]
  );

  // The highlights row picks these last, so it does not repeat the rows below
  const highlightExcludeIds = useMemo(
    () => [...communityRow, ...fairRow, ...spotRow].map((item) => item.id),
    [communityRow, fairRow, spotRow]
  );

  const withQuery = (path: string) => (query ? `${path}?q=${encodeURIComponent(query)}` : path);

  const sectionHead = (title: string, count: string, href: string) => (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
        {title}
        {count && <span className="ml-2 text-xs sm:text-sm font-medium text-slate-500 tabular-nums">{count}</span>}
      </h2>
      <Link href={href} className="shrink-0 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">
        ดูทั้งหมด
      </Link>
    </div>
  );

  const rowSkeleton = (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {Array.from({ length: ROW_SIZE }).map((_, i) => (
        <div key={i} className="h-64 rounded-2xl bg-slate-100" />
      ))}
    </div>
  );

  // Classic order and Classic cards, one row per pillar; the search box filters all three
  const pillarRows = (
    <div id="journey-results" className="scroll-mt-24 space-y-10 sm:space-y-14">
      {query && (
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
      )}

      <section className="space-y-4">
        {sectionHead('กิจกรรมคอมมูนิตี้', isEventsLoaded ? `${communityEvents.length.toLocaleString()} กิจกรรม` : '', withQuery('/community'))}
        {!isEventsLoaded ? (
          rowSkeleton
        ) : (
          <EventGrid
            events={communityRow}
            responsiveLimit={{ mobile: 4, desktop: ROW_SIZE }}
            columns={5}
            layout="carousel"
            onSelectEvent={() => { }}
            favorites={isLoggedIn ? favorites : []}
            toggleFavorite={toggleFavoriteEvent}
            onResetFilters={() => setSearchQuery('')}
          />
        )}
      </section>

      <section className="space-y-4">
        {sectionHead('งานมหกรรม & เอ็กซ์โป', isEventsLoaded ? `${fairEvents.length.toLocaleString()} งาน` : '', withQuery('/fairs'))}
        {!isEventsLoaded ? (
          rowSkeleton
        ) : (
          <EventGrid
            events={fairRow}
            responsiveLimit={{ mobile: 4, desktop: ROW_SIZE }}
            columns={5}
            layout="carousel"
            onSelectEvent={() => { }}
            favorites={isLoggedIn ? favorites : []}
            toggleFavorite={toggleFavoriteEvent}
            onResetFilters={() => setSearchQuery('')}
          />
        )}
      </section>

      <section className="space-y-4">
        {sectionHead('พิกัดเที่ยว & จุดฮีลใจ', isSpotsLoaded ? `${spotsList.length.toLocaleString()} แห่งทั่วไทย` : '', withQuery('/spots'))}
        {!isSpotsLoaded ? (
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
              // On phones the row scrolls sideways, like the two rows above
              <div key={spot.id} className="h-full w-[78%] shrink-0 snap-start sm:w-auto">
                <SpotCard
                  spot={spot}
                  isFavorite={isLoggedIn && favoriteSpots.includes(spot.id)}
                  onToggleFavorite={toggleFavoriteSpot}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const handleJoinQuestFromHome = (questTitle: string) => {
    if (!isLoggedIn) {
      triggerMembershipPrompt('เพื่อกดรับภารกิจชาเลนจ์นี้');
      return;
    }
    setJoinedQuestTitles((prev) => {
      if (prev.includes(questTitle)) return prev;
      const updated = [...prev, questTitle];
      try {
        localStorage.setItem('joined_quest_titles', JSON.stringify(updated));
      } catch {}
      showToast(`รับภารกิจ "${questTitle}" แล้ว`);
      return updated;
    });
  };

  const handleSearchSubmit = () => {
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
          if (!isLoggedIn) triggerMembershipPrompt('เพื่อสร้างกิจกรรมใหม่');
          else setIsCreateEventModalOpen(true);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold border border-slate-700 animate-slide-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 pb-28 sm:pb-16 space-y-2 sm:space-y-3">
        {/* 2. The Classic hero: slides, pillar tabs and one search box */}
        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onOpenSurpriseModal={(mode) => {
            setSurpriseMode(mode || 'all');
            setIsSurpriseModalOpen(true);
          }}
          onJoinQuest={handleJoinQuestFromHome}
          joinedQuestTitles={joinedQuestTitles}
          activeTab="all"
          onSelectDiscoveryTab={(tab) => {
            if (tab !== 'all') router.push(`/${tab}`);
          }}
        />

        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-6 space-y-10 sm:space-y-14">
          {/* 3. What this place is, in three steps; each step jumps to its part of the page */}
          {!query && (
            <nav aria-label="ที่นี่ทำอะไรได้" className="grid grid-cols-3 gap-2 sm:gap-4">
              {STEPS.map(({ href, title, line }, i) => (
                <a
                  key={href}
                  href={href}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 hover:border-slate-300 transition-colors duration-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                >
                  <span className="w-7 h-7 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-900 tabular-nums" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs sm:text-base font-extrabold text-slate-900">{title}</span>
                    <span className="hidden sm:block text-sm font-medium text-slate-500">{line}</span>
                  </span>
                </a>
              ))}
            </nav>
          )}

          {/* A search shows its results first; the story of the page comes back when it is cleared */}
          {query && pillarRows}

          {!query && (
            <>
              {/* 4. Step 1, where to go: a few picks from the three pillars */}
              <div id="journey-where" className="scroll-mt-24">
                <TrendingCarousel
                  events={eventsList}
                  spots={spotsList}
                  excludeIds={highlightExcludeIds}
                  title="ไฮไลต์สัปดาห์นี้"
                  subtitle="กิจกรรม งานแฟร์ และที่เที่ยวที่ใกล้ถึงวัน ใกล้เต็ม หรือเป็นที่นิยม"
                  mode="all"
                  onSelectEvent={() => { }}
                  favorites={isLoggedIn ? favorites : []}
                  toggleFavorite={toggleFavoriteEvent}
                  favoriteSpots={isLoggedIn ? favoriteSpots : []}
                  toggleFavoriteSpot={toggleFavoriteSpot}
                />
              </div>

              {/* 5. Step 2, who has been: photos and stories from members */}
              <div id="journey-moments" className="scroll-mt-24">
                <CommunityMomentsStrip minimalHeader={true} title="โมเมนต์จากเพื่อนๆ" />
              </div>

              {/* 6. Step 3, what you get for going out: challenges, then member privileges */}
              <div id="journey-rewards" className="scroll-mt-24 space-y-6">
                <CommunityChallengeBar
                  onJoinQuest={handleJoinQuestFromHome}
                  joinedQuestTitles={isLoggedIn ? joinedQuestTitles : []}
                  minimalHeader={true}
                  title="ภารกิจชวนออกไปเที่ยว"
                />
                <MemberPrivilegesSection isLoggedIn={isLoggedIn} />
              </div>

              {/* 7. The three pillars, one row each */}
              {pillarRows}
            </>
          )}

          {/* 8. Why us, kept to what is true today */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">เที่ยวอย่างสบายใจ</h2>
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
        mode={surpriseMode}
        onSelectEvent={(ev) => {
          setIsSurpriseModalOpen(false);
          router.push(ev.eventType === 'public_venue' ? `/fairs/${ev.id}` : `/community/${ev.id}`);
        }}
        onSelectTarget={(target) => {
          setIsSurpriseModalOpen(false);
          if (target.type === 'spot') {
            router.push(`/spots/${target.id}`);
          } else if (target.type === 'fair') {
            router.push(`/fairs/${target.id}`);
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

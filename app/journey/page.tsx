'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { HeroSection } from '@/components/HeroSection';
import { MemberPrivilegesSection } from '@/components/MemberPrivilegesSection';
import { JourneySectionCarousel } from '@/components/JourneySectionCarousel';
import { JourneyMomentCard } from '@/components/JourneyMomentCard';
import { CommunityChallengeBar } from '@/components/CommunityChallengeBar';
import { CommunityMomentsStrip } from '@/components/CommunityMomentsStrip';
import { PlatformTrustAndPerks } from '@/components/PlatformTrustAndPerks';
import { SurpriseModal } from '@/components/SurpriseModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { MOCK_EVENTS, EventItem } from '@/data/mockData';
import { MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
import { isEventEnded } from '@/lib/dateUtils';
import { useAuth } from '@/lib/useAuth';
import { fetchAllContentPages } from '@/lib/contentClient';

function JourneyContent() {
  const router = useRouter();
  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [eventsList, setEventsList] = useState<EventItem[]>(MOCK_EVENTS);
  const [spotsList, setSpotsList] = useState<LifestyleSpotItem[]>(MOCK_SPOTS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteSpots, setFavoriteSpots] = useState<string[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [joinedQuestTitles, setJoinedQuestTitles] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter state for Classic Hero
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [activeHeroTab, setActiveHeroTab] = useState<'all' | 'spots' | 'community' | 'fairs'>('all');

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
      const storedJoined = localStorage.getItem('joined_event_ids');
      if (storedJoined) setJoinedEventIds(JSON.parse(storedJoined));
      const storedQuests = localStorage.getItem('joined_quest_titles');
      if (storedQuests) setJoinedQuestTitles(JSON.parse(storedQuests));
    } catch {}

    let isActive = true;
    fetchAllContentPages<EventItem>('/api/events', 'events')
      .then((events) => {
        if (isActive && events.length > 0) setEventsList(events);
      })
      .catch((err) => console.warn('Journey events fallback:', err));

    fetchAllContentPages<LifestyleSpotItem>('/api/spots', 'spots')
      .then((spots) => {
        if (isActive && spots.length > 0) setSpotsList(spots);
      })
      .catch((err) => console.warn('Journey spots fallback:', err));

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
      if (isFav) showToast('ลบออกจากรายการโปรดแล้ว');
      else showToast('เพิ่มเข้าในรายการโปรดเรียบร้อย! ❤️');
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
      if (isFav) showToast('ลบสถานที่ออกจากรายการโปรดแล้ว');
      else showToast('บันทึกสถานที่โปรดเรียบร้อย! 🌲');
      try {
        localStorage.setItem('favorite_spots', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Filter Hot Activities (Community Meetups, Not ended)
  const hotCommunityActivities = useMemo(() => {
    return eventsList
      .filter((e) => (e.eventType || 'community') === 'community' && !isEventEnded(e))
      .slice(0, 8);
  }, [eventsList]);

  // Filter Popular Public Events (Expos, Fairs, Festivals, Not ended)
  const popularPublicEvents = useMemo(() => {
    return eventsList
      .filter((e) => e.eventType === 'public_venue' && !isEventEnded(e))
      .slice(0, 8);
  }, [eventsList]);

  // Filter Top Traveling Destinations (Nationwide Spots 77 Provinces)
  const topTravelingDestinations = useMemo(() => {
    return spotsList.slice(0, 8);
  }, [spotsList]);

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
      showToast(`รับภารกิจ "${questTitle}" เรียบร้อยแล้ว! 🎯`);
      return updated;
    });
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectDiscoveryTab = (tab: 'all' | 'spots' | 'community' | 'fairs') => {
    setActiveHeroTab(tab);
    if (tab === 'community') router.push('/community');
    else if (tab === 'fairs') router.push('/fairs');
    else if (tab === 'spots') router.push('/spots');
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

      {/* Main Content Area */}
      <main className="flex-1 space-y-3 sm:space-y-4 pb-12">
        
        {/* 2. Hero Section: Classic Hero Section with Photo Carousel & Floating Tab Pills */}
        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedProvince={selectedProvince}
          setSelectedProvince={setSelectedProvince}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          startDate={startDate}
          endDate={endDate}
          onOpenDatePicker={() => setIsDatePickerOpen(true)}
          onClearCustomDate={() => {
            setStartDate('');
            setEndDate('');
            setTimeFilter('all');
          }}
          onSearchSubmit={handleSearchSubmit}
          onOpenSurpriseModal={() => setIsSurpriseModalOpen(true)}
          onJoinQuest={handleJoinQuestFromHome}
          joinedQuestTitles={joinedQuestTitles}
          onCancelQuest={(questTitle) => {
            setJoinedQuestTitles((prev) => prev.filter((t) => t !== questTitle));
            showToast(`ยกเลิกภารกิจ "${questTitle}" เรียบร้อยแล้ว`);
          }}
          onSelectDiscoveryTab={handleSelectDiscoveryTab}
          activeTab={activeHeroTab}
          hideSearchConsoleOnAllTab={true}
        />

        {/* 3. Main Journey Content Stream (Rendered under Tab ทั้งหมด) */}
        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10 pt-2">
          
          {/* ========================================================================= */}
          {/* SECTION 1: 🎁 MEMBER PRIVILEGES (Voucher & Privilege Cards)               */}
          {/* ========================================================================= */}
          <div id="journey-privileges" className="scroll-mt-24">
            <MemberPrivilegesSection isLoggedIn={isLoggedIn} />
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: 👥 HOT ACTIVITIES (Community Meetup Cards + Manual Slide)      */}
          {/* ========================================================================= */}
          <div id="journey-community" className="scroll-mt-24">
            <JourneySectionCarousel
              title="Hot Activities"
              moreLink="/community"
              moreText="ดูทั้งหมด"
            >
              {hotCommunityActivities.map((event) => (
                <div
                  key={event.id}
                  className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-2*14px)/3)] md:w-[calc((100%-3*14px)/4)] lg:w-[calc((100%-4*14px)/5)] shrink-0 snap-start"
                >
                  <JourneyMomentCard
                    type="community"
                    id={event.id}
                    title={event.title}
                    image={event.image}
                    location={event.province || event.location}
                    categoryLabel={
                      event.category === 'move'
                        ? '🏃 วิ่ง & กีฬา'
                        : event.category === 'heal'
                        ? '🌱 ฮีลใจ & ธรรมชาติ'
                        : event.category === 'learn'
                        ? '🎨 เวิร์กช็อป'
                        : '☕ จิบกาแฟ & ชิลล์'
                    }
                    authorOrHost={{
                      name: event.hostName || 'โฮสต์คอมมูนิตี้',
                      avatar: event.hostAvatar,
                    }}
                    metricBadge={
                      <span>
                        👥 {event.participantsCount || 0}/{event.maxParticipants || 10}
                      </span>
                    }
                    isFavorite={favorites.includes(event.id)}
                    onToggleFavorite={toggleFavoriteEvent}
                    href={`/community/${event.id}`}
                  />
                </div>
              ))}
            </JourneySectionCarousel>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: 🏛️ POPULAR PUBLIC EVENTS (Major Fairs & Expos + Slide)          */}
          {/* ========================================================================= */}
          <div id="journey-fairs" className="scroll-mt-24">
            <JourneySectionCarousel
              title="Popular Public Events"
              moreLink="/fairs"
              moreText="ดูทั้งหมด"
            >
              {popularPublicEvents.map((event) => (
                <div
                  key={event.id}
                  className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-2*14px)/3)] md:w-[calc((100%-3*14px)/4)] lg:w-[calc((100%-4*14px)/5)] shrink-0 snap-start"
                >
                  <JourneyMomentCard
                    type="fair"
                    id={event.id}
                    title={event.title}
                    image={event.image}
                    location={event.province || event.location}
                    categoryLabel={event.location || '🏛️ งานมหกรรม & เอ็กซ์โป'}
                    authorOrHost={{
                      name: event.hostName || 'ผู้จัดงาน',
                      avatar: event.hostAvatar,
                    }}
                    metricBadge={
                      <span className="text-emerald-300 font-bold">
                        {!event.price || event.price === '0' || event.price.toLowerCase().includes('free') || event.price.includes('ฟรี')
                          ? 'เข้าชมฟรี'
                          : event.price}
                      </span>
                    }
                    isFavorite={favorites.includes(event.id)}
                    onToggleFavorite={toggleFavoriteEvent}
                    href={`/fairs/${event.id}`}
                  />
                </div>
              ))}
            </JourneySectionCarousel>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: 🌲 TOP TRAVELING DESTINATION (Lifestyle Spots + Slide)         */}
          {/* ========================================================================= */}
          <div id="journey-spots" className="scroll-mt-24">
            <JourneySectionCarousel
              title="Top Traveling Destination"
              moreLink="/spots"
              moreText="ดูทั้งหมด"
            >
              {topTravelingDestinations.map((spot) => (
                <div
                  key={spot.id}
                  className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-2*14px)/3)] md:w-[calc((100%-3*14px)/4)] lg:w-[calc((100%-4*14px)/5)] shrink-0 snap-start"
                >
                  <JourneyMomentCard
                    type="spot"
                    id={spot.id}
                    title={spot.title}
                    image={spot.image}
                    location={spot.province ? `${spot.province} • ${spot.district}` : spot.district}
                    categoryLabel={spot.categoryLabel || '🌲 พิกัดยอดนิยม'}
                    authorOrHost={{
                      name: spot.openHours || 'เปิดบริการทุกวัน',
                    }}
                    metricBadge={
                      <span className="text-amber-300 font-bold flex items-center gap-0.5">
                        ★ {spot.rating || 4.8}
                      </span>
                    }
                    isFavorite={favoriteSpots.includes(spot.id)}
                    onToggleFavorite={toggleFavoriteSpot}
                    href={`/spots/${spot.id}`}
                  />
                </div>
              ))}
            </JourneySectionCarousel>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 5: ⚡ CHALLENGE & LIFESTYLE HUB (Community Quests & Badges)      */}
          {/* ========================================================================= */}
          <div id="journey-challenges" className="scroll-mt-24">
            <CommunityChallengeBar
              onJoinQuest={handleJoinQuestFromHome}
              joinedQuestTitles={isLoggedIn ? joinedQuestTitles : []}
              minimalHeader={true}
            />
          </div>

          {/* ========================================================================= */}
          {/* SECTION 6: 📸 FRIEND MOMENTS (Social Stories & Real Reviews)             */}
          {/* ========================================================================= */}
          <div id="journey-moments" className="scroll-mt-24">
            <CommunityMomentsStrip minimalHeader={true} />
          </div>

          {/* ========================================================================= */}
          {/* SECTION 7: 💎 PLATFORM TRUST & PERKS                                     */}
          {/* ========================================================================= */}
          <PlatformTrustAndPerks onOpenLogin={() => setIsAuthModalOpen(true)} />

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
          showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับมาครับ! ✨');
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
          showToast('สร้างกิจกรรมใหม่สำเร็จเรียบร้อย! 🎉');
        }}
        initialType="community"
      />

      <CustomDatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        startDate={startDate}
        endDate={endDate}
        onApply={(start, end) => {
          setStartDate(start);
          setEndDate(end);
          setTimeFilter('custom');
        }}
      />

      <SurpriseModal
        isOpen={isSurpriseModalOpen}
        onClose={() => setIsSurpriseModalOpen(false)}
        events={eventsList}
        spots={spotsList}
        mode="all"
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

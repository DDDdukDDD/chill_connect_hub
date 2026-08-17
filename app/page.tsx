'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { MoodFilterChips, SUB_CATEGORIES_MAP } from '@/components/MoodFilterChips';
import { EventGrid } from '@/components/EventGrid';
import { EventDetailModal } from '@/components/EventDetailModal';
import { MobileNav } from '@/components/MobileNav';
import { MOCK_EVENTS, MOCK_POSTS, EventItem } from '@/data/mockData';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { FilterDrawer } from '@/components/FilterDrawer';
import { StoryBar } from '@/components/StoryBar';
import { TrendingCarousel } from '@/components/TrendingCarousel';
import { ReviewCarousel } from '@/components/ReviewCarousel';
import {
  Heart,
  Sprout,
  Flame,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  ArrowUpDown,
  RefreshCw,
  Trophy,
  Users,
  Compass,
  Star,
  Tag,
  Calendar,
  MapPin,
  Clock,
  Building2,
  Sun,
  Filter,
  SlidersHorizontal,
  X
} from 'lucide-react';

export default function Home() {
  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [selectedCategory, setSelectedCategory] = useState<'heal' | 'move' | 'chill' | 'learn' | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string | null>(null);
  const [eventTypeTab, setEventTypeTab] = useState<'all' | 'public_venue' | 'community' | 'joined'>('all');
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>(['1', '3']);
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekend' | 'next_week' | 'custom'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'under500'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'favorites'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventsList, setEventsList] = useState<EventItem[]>(MOCK_EVENTS);
  const [favorites, setFavorites] = useState<string[]>(['1', '7']);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isLoggedIn');
      if (saved === 'false') {
        setIsLoggedIn(false);
      } else {
        localStorage.setItem('isLoggedIn', 'true');
      }
    }
  }, []);

  const handleSetIsLoggedIn = (status: boolean) => {
    setIsLoggedIn(status);
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', status ? 'true' : 'false');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (eventId: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(eventId);
      if (isFav) {
        showToast('ลบออกจากรายการโปรดแล้ว');
        return prev.filter((id) => id !== eventId);
      } else {
        showToast('เพิ่มเข้าในรายการโปรดเรียบร้อย! ❤️');
        return [...prev, eventId];
      }
    });
  };

  const handleJoinSuccess = (eventId: string) => {
    setEventsList((prev) =>
      prev.map((item) =>
        item.id === eventId
          ? { ...item, participantsCount: Math.min(item.participantsCount + 1, item.maxParticipants) }
          : item
      )
    );
    setJoinedEventIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]));
    showToast('ยินดีด้วย! คุณลงทะเบียนเข้าร่วมกิจกรรมเรียบร้อย 🎉');
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 6);
      setIsLoadingMore(false);
    }, 400);
  };

  // Trending Events (isTrending = true)
  const trendingEvents = useMemo(() => {
    return eventsList.filter((e) => e.isTrending);
  }, [eventsList]);

  // Newly Added Events (isNew = true)
  const newEvents = useMemo(() => {
    return eventsList.filter((e) => e.isNew);
  }, [eventsList]);

  // Filtered and Sorted Events for Full Catalog
  const filteredEvents = useMemo(() => {
    let result = eventsList.filter((event) => {
      const matchesCategory = selectedCategory ? event.category === selectedCategory : true;
      const matchesVenue = selectedVenueFilter ? event.venueTag === selectedVenueFilter : true;
      
      const currentEvType = event.eventType || 'community';
      let matchesEventType = true;
      if (eventTypeTab === 'public_venue') {
        matchesEventType = currentEvType === 'public_venue';
      } else if (eventTypeTab === 'community') {
        matchesEventType = currentEvType === 'community';
      } else if (eventTypeTab === 'joined') {
        matchesEventType = joinedEventIds.includes(event.id);
      }

      let matchesTime = true;
      if (timeFilter === 'weekend') {
        matchesTime = event.date.includes('เสาร์') || event.date.includes('อาทิตย์') || event.date.includes('ส.ค.') || event.date.includes('มี.ค.');
      } else if (timeFilter === 'next_week') {
        matchesTime = event.date.includes('เม.ย.') || event.date.includes('พ.ค.');
      } else if (timeFilter === 'custom' && (startDate || endDate)) {
        matchesTime = true; // match selected date range
      }

      let matchesSubCategory = true;
      if (selectedCategory && selectedSubCategory) {
        const subList = SUB_CATEGORIES_MAP[selectedCategory];
        const matchedSubItem = subList.find((s) => s.id === selectedSubCategory);
        if (matchedSubItem && matchedSubItem.tagQuery) {
          const q = matchedSubItem.tagQuery.toLowerCase();
          matchesSubCategory =
            event.tag.toLowerCase().includes(q) ||
            event.title.toLowerCase().includes(q) ||
            event.description.toLowerCase().includes(q);
        }
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        event.title.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q) ||
        event.tag.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q);

      let matchesPrice = true;
      const priceStr = event.price || '';
      if (priceFilter === 'free') {
        matchesPrice = priceStr === 'ฟรี!' || priceStr === 'ฟรี';
      } else if (priceFilter === 'under500') {
        matchesPrice = priceStr === 'ฟรี!' || priceStr === 'ฟรี' || priceStr.includes('150') || priceStr.includes('200') || priceStr.includes('350');
      }

      return matchesCategory && matchesVenue && matchesEventType && matchesTime && matchesSubCategory && matchesSearch && matchesPrice;
    });

    if (sortBy === 'favorites') {
      result = result.filter((event) => favorites.includes(event.id));
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      result.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
    }

    return result;
  }, [
    eventsList,
    selectedCategory,
    selectedSubCategory,
    selectedVenueFilter,
    eventTypeTab,
    joinedEventIds,
    timeFilter,
    priceFilter,
    startDate,
    endDate,
    searchQuery,
    sortBy,
    favorites,
  ]);

  const handleResetAllFilters = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSelectedVenueFilter(null);
    setEventTypeTab('all');
    setTimeFilter('all');
    setPriceFilter('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setSortBy('newest');
    showToast('ล้างตัวกรองทั้งหมดแล้ว ✨');
  };



  const displayedEvents = useMemo(() => {
    return filteredEvents.slice(0, visibleCount);
  }, [filteredEvents, visibleCount]);

  const eventListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: eventsList.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: event.title,
        description: event.description,
        location: {
          "@type": "Place",
          name: event.location,
          address: event.location,
        },
        image: event.image,
        organizer: {
          "@type": "Organization",
          name: event.hostName,
        },
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventListSchema) }}
      />
      
      {/* 1. Header / Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={(status) => {
          handleSetIsLoggedIn(status);
        }}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 space-y-6">
        
        {/* 2. Hero Section (with h1 tag for SEO) */}
        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={() => {
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-2 relative z-10">
          
          {/* 4. Auto-Sliding Trending Events Carousel (Idea 2) */}
          <TrendingCarousel
            events={eventsList}
            onSelectEvent={(event) => setSelectedEvent(event)}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />

          {/* 5. 🌿 คลังกิจกรรมยามว่างทั้งหมด (Option 1 - Slim 44px Compact Control Bar) */}
          <section id="catalog-section" className="space-y-4 pt-2">
            
            {/* Section Header: Changes dynamically on search/filter */}
            {searchQuery.trim() !== '' || selectedCategory !== null || selectedVenueFilter !== null || priceFilter !== 'all' || timeFilter !== 'all' || eventTypeTab !== 'all' ? (
              <div className="flex items-center justify-between bg-amber-50 p-2.5 px-4 rounded-xl border border-amber-200/80 text-xs font-semibold text-[#1E293B] animate-fade-in">
                <span className="flex items-center gap-1.5 font-bold">
                  <span>🔍 ผลการค้นหา: พบทั้งหมด {filteredEvents.length} กิจกรรม</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="text-xs text-[#F26430] hover:underline font-bold cursor-pointer"
                >
                  ✕ ล้างตัวกรองทั้งหมด
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-[#4A7C59]" />
                    <span>กิจกรรมน่าสนใจยามว่าง</span>
                  </h2>
                  <p className="text-xs text-[#64748B] font-medium mt-0.5">
                    สำรวจกิจกรรมที่ใช่ในสไตล์คุณ พักผ่อนและพบปะเพื่อนใหม่ชิลล์ๆ
                  </p>
                </div>
              </div>
            )}

            {/* Compact 1-Row Control Bar (Ultra Slim 44px) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2 rounded-2xl border border-[#E8E2D8] shadow-xs">
              
              {/* Left: Slim Mode Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => {
                    setEventTypeTab('all');
                    setVisibleCount(12);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    eventTypeTab === 'all'
                      ? 'bg-[#1E293B] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ✨ ทั้งหมด
                </button>

                <button
                  onClick={() => {
                    setEventTypeTab('public_venue');
                    setVisibleCount(12);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    eventTypeTab === 'public_venue'
                      ? 'bg-[#F26430] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-orange-50'
                  }`}
                >
                  🏛️ งานใหญ่ / Hall
                </button>

                <button
                  onClick={() => {
                    setEventTypeTab('community');
                    setVisibleCount(12);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    eventTypeTab === 'community'
                      ? 'bg-[#4A7C59] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-emerald-50'
                  }`}
                >
                  🌱 กลุ่มย่อย 4-8 คน
                </button>

                <button
                  onClick={() => {
                    setEventTypeTab('joined');
                    setVisibleCount(12);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    eventTypeTab === 'joined'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80'
                  }`}
                >
                  🎟️ งานของฉัน ({joinedEventIds.length})
                </button>
              </div>

              {/* Right: Advanced Filter Drawer & Sorting */}
              <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                
                {/* Advanced Filter Drawer Trigger */}
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="flex items-center gap-1.5 bg-[#F26430] hover:bg-[#D95322] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>🎛️ ตัวกรองละเอียด</span>
                </button>

                {/* Sorting Select */}
                <div className="flex items-center gap-1 bg-slate-50 border border-[#E8E2D8] px-2.5 py-1.5 rounded-xl text-xs shrink-0">
                  <ArrowUpDown className="w-3 h-3 text-[#4A7C59]" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'favorites')}
                    className="bg-transparent font-bold text-[#1E293B] focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="newest">🆕 ล่าสุด</option>
                    <option value="popular">🔥 ความนิยม</option>
                    <option value="favorites">❤️ รายการโปรด ({favorites.length})</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Event Grid / List View */}
            <EventGrid
              events={displayedEvents}
              onSelectEvent={(event) => setSelectedEvent(event)}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              viewMode={viewMode}
              onToggleViewMode={setViewMode}
              showCountText={searchQuery.trim() !== '' || selectedCategory !== null || selectedVenueFilter !== null || priceFilter !== 'all' || timeFilter !== 'all' || eventTypeTab !== 'all'}
              joinedEventIds={joinedEventIds}
            />

            {/* Pagination Load More Button */}
            {filteredEvents.length > visibleCount && (
              <div className="pt-6 pb-2 text-center space-y-3">
                <div className="max-w-xs mx-auto space-y-1">
                  <div className="text-xs text-[#64748B] font-medium">
                    แสดงแล้ว <span className="font-bold text-[#1E293B]">{displayedEvents.length}</span> จาก <span className="font-bold text-[#1E293B]">{filteredEvents.length}</span> กิจกรรม
                  </div>
                  <div className="w-full h-1.5 bg-[#E8E2D8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4A7C59] rounded-full transition-all duration-300"
                      style={{ width: `${(displayedEvents.length / filteredEvents.length) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="bg-white hover:bg-[#EBF3ED] text-[#4A7C59] border-2 border-[#4A7C59] px-8 py-3 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 inline-flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#4A7C59]" />
                      <span>กำลังโหลดกิจกรรม...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-4 h-4" />
                      <span>ดู กิจกรรมเพิ่มเติม (+6)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* SECTION 4: 💬 เสียงตอบรับจากเพื่อนๆ (Auto-Slide Carousel) */}
          <ReviewCarousel />

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E2D8] py-8 text-center text-xs text-[#64748B] space-y-2 mt-12 mb-16 sm:mb-0">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1E293B]">
          <Sprout className="w-5 h-5 text-[#4A7C59]" />
          <span>Chill & Connect Hub</span>
        </div>
        <p>© 2026 Chill & Connect Hub - ฮีลใจ & เชื่อมต่อ ฮับ. All rights reserved.</p>
      </footer>

      {/* Event Detail Popup Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isFavorite={selectedEvent ? favorites.includes(selectedEvent.id) : false}
        onToggleFavorite={toggleFavorite}
        onJoinSuccess={handleJoinSuccess}
        isLoggedIn={isLoggedIn}
        onRequireLogin={() => {
          setIsAuthModalOpen(true);
          showToast('🔒 กรุณาเข้าสู่ระบบก่อนบันทึกหรือเข้าร่วมกิจกรรม');
        }}
      />

      {/* Advanced Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedVenueFilter={selectedVenueFilter}
        setSelectedVenueFilter={setSelectedVenueFilter}
        selectedGroupSize={eventTypeTab}
        setSelectedGroupSize={setEventTypeTab}
        priceFilter={priceFilter}
        setPriceFilter={setPriceFilter}
        onResetAll={handleResetAllFilters}
        totalResultsCount={filteredEvents.length}
      />

      {/* Custom Date Picker Popup Modal */}
      <CustomDatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        startDate={startDate}
        endDate={endDate}
        onApply={(start, end) => {
          setStartDate(start);
          setEndDate(end);
          setTimeFilter('custom');
          showToast(`เลือกช่วงเวลา: ${start} ${start !== end ? `ถึง ${end}` : ''}`);
        }}
        onReset={() => {
          setStartDate('');
          setEndDate('');
          setTimeFilter('all');
          showToast('ล้างการกรองช่วงเวลาเรียบร้อย');
        }}
      />

      {/* Create Custom Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          setEventsList([newEvent, ...eventsList]);
          showToast(`สร้างกิจกรรม "${newEvent.title}" สำเร็จเรียบร้อย! 🎉`);
        }}
      />

      {/* Auth Login / Signup Popup Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(userName) => {
          setIsLoggedIn(true);
          showToast(`ยินดีต้อนรับ ${userName}! เข้าสู่ระบบเรียบร้อย 🎉`);
        }}
      />

      {/* Logout Confirmation Popup Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          setIsLoggedIn(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว (Guest View)');
        }}
      />

      {/* Mobile Nav */}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={favorites.length}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm font-medium flex items-center gap-2.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

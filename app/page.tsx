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
  X
} from 'lucide-react';

export default function Home() {
  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [selectedCategory, setSelectedCategory] = useState<'heal' | 'move' | 'chill' | 'learn' | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string | null>(null);
  const [eventTypeTab, setEventTypeTab] = useState<'all' | 'community' | 'public_venue'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekend' | 'next_week' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'favorites'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventsList, setEventsList] = useState<EventItem[]>(MOCK_EVENTS);
  const [favorites, setFavorites] = useState<string[]>(['1', '7']);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      const matchesEventType = eventTypeTab === 'all' ? true : currentEvType === eventTypeTab;

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

      return matchesCategory && matchesVenue && matchesEventType && matchesTime && matchesSubCategory && matchesSearch;
    });

    if (sortBy === 'favorites') {
      result = result.filter((event) => favorites.includes(event.id));
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      result.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
    }

    return result;
  }, [eventsList, selectedCategory, selectedSubCategory, selectedVenueFilter, eventTypeTab, timeFilter, searchQuery, sortBy, favorites]);

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
          setIsLoggedIn(status);
        }}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* 2. Hero Section (with h1 tag for SEO) */}
        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={() => {
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-4">
          
          {/* SECTION 1: 🌿 คลังกิจกรรมยามว่างทั้งหมด (Full Catalog Explorer - Placed First!) */}
          <section id="catalog-section" className="space-y-3.5">
            
            {/* Section Header */}
            <div className="border-b border-[#E8E2D8] pb-2 space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                🌿 คลังกิจกรรมยามว่างทั้งหมด
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] font-medium">
                เลือกรูปแบบกิจกรรมที่ใช่ หรือกรองค้นหาตามเวลาเสาร์-อาทิตย์นี้ได้ง่ายๆ
              </p>
            </div>

            {/* Mode Switcher Tabs (Order: กิจกรรมทั่วไป/อีเวนต์ | กิจกรรมชุมชน | ทั้งหมด -> Default: ทั้งหมด) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-200/60 p-1 rounded-2xl border border-slate-300/80">
              <div className="grid grid-cols-3 gap-1 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setEventTypeTab('public_venue');
                    setVisibleCount(6);
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    eventTypeTab === 'public_venue'
                      ? 'bg-[#F26430] text-white shadow-md scale-102 font-extrabold'
                      : 'text-slate-700 hover:text-[#F26430] hover:bg-white/50'
                  }`}
                >
                  <span className="truncate">🏛️ กิจกรรมทั่วไป/อีเวนต์</span>
                </button>

                <button
                  onClick={() => {
                    setEventTypeTab('community');
                    setVisibleCount(6);
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    eventTypeTab === 'community'
                      ? 'bg-[#4A7C59] text-white shadow-md scale-102 font-extrabold'
                      : 'text-slate-700 hover:text-[#4A7C59] hover:bg-white/50'
                  }`}
                >
                  <span className="truncate">🌱 กิจกรรมชุมชน</span>
                </button>

                <button
                  onClick={() => {
                    setEventTypeTab('all');
                    setVisibleCount(6);
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    eventTypeTab === 'all'
                      ? 'bg-white text-[#1E293B] shadow-md scale-102 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>✨ ทั้งหมด</span>
                </button>
              </div>

              {/* Time Quick Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 sm:pt-0">
                <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1 px-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>ช่วงเวลา:</span>
                </span>
                <button
                  onClick={() => setTimeFilter('all')}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                    timeFilter === 'all'
                      ? 'bg-[#1E293B] text-white border-[#1E293B]'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                  }`}
                >
                  ทุกวัน
                </button>
                <button
                  onClick={() => setTimeFilter('weekend')}
                  className={`shrink-0 px-3.5 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${
                    timeFilter === 'weekend'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs scale-105'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <span>☀️ เสาร์-อาทิตย์นี้</span>
                </button>
                <button
                  onClick={() => setTimeFilter('next_week')}
                  className={`shrink-0 px-3.5 py-1 rounded-full text-xs font-bold transition-all border ${
                    timeFilter === 'next_week'
                      ? 'bg-[#4A7C59] text-white border-[#4A7C59]'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-[#4A7C59]'
                  }`}
                >
                  📅 เดือนหน้า
                </button>

                {/* Custom Date Selector Trigger Button */}
                <div className="shrink-0 flex items-center gap-1.5 border-l border-slate-300 pl-2 ml-1">
                  <button
                    onClick={() => {
                      setTimeFilter('custom');
                      setIsDatePickerOpen(true);
                    }}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      timeFilter === 'custom' && (startDate || endDate)
                        ? 'bg-[#F26430] text-white border-[#F26430] shadow-xs font-extrabold'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-[#F26430]'
                    }`}
                  >
                    <span>
                      {timeFilter === 'custom' && startDate
                        ? startDate === endDate
                          ? `📅 ${startDate}`
                          : `🗓️ ${startDate} ถึง ${endDate}`
                        : '📅 ระบุวันที่เอง'}
                    </span>
                  </button>

                  {timeFilter === 'custom' && (startDate || endDate) && (
                    <button
                      onClick={() => {
                        setTimeFilter('all');
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="p-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
                      title="ล้างช่วงเวลาที่เลือก"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Context-Aware Mood & Public Venue Filters */}
            <MoodFilterChips
              eventTypeTab={eventTypeTab}
              selectedCategory={selectedCategory}
              setSelectedCategory={(cat) => {
                setSelectedCategory(cat);
                setSelectedSubCategory(null);
                setSelectedVenueFilter(null);
                setVisibleCount(6);
              }}
              selectedSubCategory={selectedSubCategory}
              setSelectedSubCategory={(subCat) => {
                setSelectedSubCategory(subCat);
                setVisibleCount(6);
              }}
              selectedVenueFilter={selectedVenueFilter}
              setSelectedVenueFilter={(venueId) => {
                setSelectedVenueFilter(venueId);
                setVisibleCount(6);
              }}
            />

            {/* Sorting & Filter Header Controls (Matching Top Tab Height) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#FAF7F2] p-2 px-3.5 rounded-xl border border-[#E8E2D8] text-xs font-semibold text-slate-600">
              <span>
                <strong className="text-[#1E293B] font-extrabold">
                  {eventTypeTab === 'public_venue'
                    ? '🏛️ กิจกรรมทั่วไป/อีเวนต์'
                    : eventTypeTab === 'community'
                    ? '🌱 กิจกรรมชุมชน'
                    : '✨ กิจกรรมทั้งหมด'}
                </strong>{' '}
                ({filteredEvents.length} กิจกรรม)
              </span>

              <div className="flex items-center gap-2">
                {/* Sorting Select (with Favorites option) */}
                <div className="flex items-center gap-1 bg-white border border-[#E8E2D8] px-2.5 py-1 rounded-lg text-xs">
                  <ArrowUpDown className="w-3 h-3 text-[#4A7C59]" />
                  <span className="text-[#64748B] font-medium hidden sm:inline">จัดเรียง:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'favorites')}
                    className="bg-transparent font-bold text-[#1E293B] focus:outline-none cursor-pointer"
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

          {/* SECTION 2: 🔥 กิจกรรมยอดฮิตติดเทรนด์ */}
          {trendingEvents.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-[#E8E2D8]">
              <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F26430] bg-[#FDF0EB] px-3 py-0.5 rounded-full border border-[#F26430]/20">
                    <Flame className="w-3.5 h-3.5 fill-[#F26430]" />
                    <span>Popular Right Now</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                    🔥 กิจกรรมยอดฮิตติดเทรนด์
                  </h2>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('catalog-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs sm:text-sm font-bold text-[#4A7C59] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>ดูทั้งหมด ({trendingEvents.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Trending Events Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingEvents.map((event) => {
                  const isFav = favorites.includes(event.id);
                  const fillRatio = event.participantsCount / event.maxParticipants;
                  const isAlmostFull = fillRatio >= 0.8;

                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="group bg-white rounded-3xl border border-[#E8E2D8] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />

                        <div className="absolute top-3 left-3 bg-[#F26430] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-white" />
                          <span>{event.badgeText || '🔥 ฮิตแรง'}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(event.id);
                          }}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#F26430] hover:scale-110 active:scale-95 transition-all"
                        >
                          <Heart className={`w-5 h-5 ${isFav ? 'fill-[#F26430] text-[#F26430]' : 'text-slate-500'}`} />
                        </button>

                        {event.price && (
                          <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md text-emerald-400 font-bold px-3 py-1 rounded-full text-xs shadow-sm">
                            {event.price}
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-1 justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                              alt=""
                              className="w-5 h-5 rounded-full object-cover border border-slate-200"
                            />
                            <span className="text-xs font-medium text-slate-600 truncate">{event.hostName}</span>
                          </div>
                          <h3 className="font-bold text-base text-[#1E293B] group-hover:text-[#4A7C59] transition-colors line-clamp-1">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#4A7C59]" />
                              {event.date}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5 text-[#F26430]" />
                              {event.location}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1 border-t border-slate-100">
                          <div className="flex justify-between text-xs text-slate-600 font-semibold">
                            <span>ที่นั่ง {event.participantsCount}/{event.maxParticipants}</span>
                            {isAlmostFull && <span className="text-amber-600 animate-pulse">ใกล้เต็มแล้ว!</span>}
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isAlmostFull ? 'bg-gradient-to-r from-amber-400 to-[#F26430]' : 'bg-[#4A7C59]'}`}
                              style={{ width: `${(event.participantsCount / event.maxParticipants) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 3: 🆕 กิจกรรมเปิดใหม่ล่าสุด */}
          {newEvents.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A7C59] bg-[#EBF3ED] px-3 py-0.5 rounded-full border border-[#4A7C59]/20">
                    <Sparkles className="w-3.5 h-3.5 text-[#4A7C59]" />
                    <span>Just Added</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                    🆕 กิจกรรมเปิดใหม่ล่าสุด
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {newEvents.map((event) => {
                  const isFav = favorites.includes(event.id);

                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="group bg-white rounded-3xl border border-[#E8E2D8] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-[#4A7C59] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                          🆕 มาใหม่
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(event.id);
                          }}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#F26430] hover:scale-110 active:scale-95 transition-all"
                        >
                          <Heart className={`w-5 h-5 ${isFav ? 'fill-[#F26430] text-[#F26430]' : 'text-slate-500'}`} />
                        </button>
                      </div>

                      <div className="p-5 space-y-3">
                        <span className="text-xs font-bold text-[#4A7C59] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          {event.tag}
                        </span>
                        <h3 className="font-bold text-base text-[#1E293B] group-hover:text-[#4A7C59] transition-colors line-clamp-1">
                          {event.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2">{event.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 4: 📸 โมเมนต์ความสนุกจากเพื่อนๆ */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#1E293B] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#F26430]" />
                  <span>โมเมนต์ภาพความสนุกจากเพื่อนๆ</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
                  แอบดูภาพบรรยากาศหลังจบกิจกรรมจากชาว Chill & Connect Hub
                </p>
              </div>

              <Link
                href="/moments"
                className="bg-[#4A7C59] hover:bg-[#3B6347] text-[#FAF7F2] px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 shrink-0 active:scale-95"
              >
                <span>ดูโมเมนต์โซเชียลทั้งหมด 📸</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MOCK_POSTS.slice(0, 3).map((post) => (
                <Link
                  key={post.id}
                  href="/moments"
                  className="group relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  <img src={post.images[0]} alt="Moment" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 space-y-1 text-white">
                    <div className="flex items-center gap-2">
                      <img src={post.userAvatar} alt="" className="w-6 h-6 rounded-full border border-white" />
                      <span className="text-xs font-bold truncate">{post.userName}</span>
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-1 font-medium">{post.caption}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

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

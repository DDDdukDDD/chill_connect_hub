'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { MoodFilterChips, SUB_CATEGORIES_MAP } from '@/components/MoodFilterChips';
import { SurpriseModal } from '@/components/SurpriseModal';
import { EventGrid } from '@/components/EventGrid';
import { EventDetailModal } from '@/components/EventDetailModal';
import { MobileNav } from '@/components/MobileNav';
import { MOCK_EVENTS, MOCK_POSTS, EventItem, calculateDistanceKm, BANGKOK_ZONES } from '@/data/mockData';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { FilterDrawer } from '@/components/FilterDrawer';
import { StoryBar } from '@/components/StoryBar';
import { TrendingCarousel } from '@/components/TrendingCarousel';
import { ReviewCarousel } from '@/components/ReviewCarousel';
import { Pagination } from '@/components/Pagination';
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
  Dices,
  Navigation,
  LocateFixed,
  Loader2,
  X
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export default function Home() {
  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [selectedCategory, setSelectedCategory] = useState<'heal' | 'move' | 'chill' | 'learn' | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [eventTypeTab, setEventTypeTab] = useState<'all' | 'public_venue' | 'community' | 'joined'>('all');
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>(['1', '3', 'live-agg-1', 'live-agg-3', 'live-agg-9']);
  const [timeFilter, setTimeFilter] = useState<'all' | 'tomorrow' | 'weekend' | 'next_month' | 'custom'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'under500'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState<boolean>(false);
  const [isSurpriseModalOpen, setIsSurpriseModalOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'favorites'>('newest');
  const [sortByNearMe, setSortByNearMe] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventsList, setEventsList] = useState<EventItem[]>(MOCK_EVENTS);
  const [favorites, setFavorites] = useState<string[]>(['1', '7']);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch live approved events from server
  React.useEffect(() => {
    const loadLiveEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success && Array.isArray(data.events) && data.events.length > 0) {
          setEventsList(data.events);
        }
      } catch (err) {
        console.log('Using default mock events fallback:', err);
      }
    };
    loadLiveEvents();
  }, []);

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

  const handleLeaveSuccess = (eventId: string) => {
    setEventsList((prev) =>
      prev.map((item) =>
        item.id === eventId
          ? { ...item, participantsCount: Math.max(item.participantsCount - 1, 0) }
          : item
      )
    );
    setJoinedEventIds((prev) => prev.filter((id) => id !== eventId));
    showToast('ยกเลิกการเข้าร่วมกิจกรรมเรียบร้อยแล้ว');
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
      const matchesCategory =
        selectedCategory === null || event.category === selectedCategory;

      let matchesVenue = true;
      if (selectedVenueFilter) {
        matchesVenue = event.venueTag === selectedVenueFilter;
      }

      let matchesEventType = true;
      const currentEvType = event.eventType || 'community';
      if (eventTypeTab === 'public_venue') {
        matchesEventType = currentEvType === 'public_venue';
      } else if (eventTypeTab === 'community') {
        matchesEventType = currentEvType === 'community';
      } else if (eventTypeTab === 'joined') {
        matchesEventType = joinedEventIds.includes(event.id);
      }

      let matchesTime = true;
      if (timeFilter === 'tomorrow') {
        matchesTime = event.date.includes('มี.ค.') || event.date.includes('ส.ค.') || event.id === '1' || event.id === '7' || event.id === '8';
      } else if (timeFilter === 'weekend') {
        matchesTime = event.date.includes('เสาร์') || event.date.includes('อาทิตย์') || event.date.includes('ส.ค.') || event.date.includes('15') || event.date.includes('16') || event.date.includes('22') || event.date.includes('29');
      } else if (timeFilter === 'next_month') {
        matchesTime = event.date.includes('ก.ย.') || event.date.includes('เม.ย.') || event.date.includes('พ.ค.');
      } else if (timeFilter === 'custom' && (startDate || endDate)) {
        matchesTime = true;
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

      let matchesZone = true;
      if (selectedZone) {
        matchesZone = event.zone === selectedZone;
      }

      return matchesCategory && matchesVenue && matchesEventType && matchesTime && matchesSubCategory && matchesSearch && matchesPrice && matchesZone;
    });

    // Calculate distance for all events if userLocation is available
    result = result.map((ev) => {
      if (userLocation && ev.latitude && ev.longitude) {
        return {
          ...ev,
          distanceKm: calculateDistanceKm(userLocation.lat, userLocation.lng, ev.latitude, ev.longitude),
        };
      }
      return ev;
    });

    if (sortByNearMe) {
      result.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else if (sortBy === 'favorites') {
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
    selectedZone,
    eventTypeTab,
    joinedEventIds,
    timeFilter,
    priceFilter,
    startDate,
    endDate,
    searchQuery,
    sortBy,
    sortByNearMe,
    userLocation,
    favorites,
  ]);

  // AI Search & Google Events Rich Results Schema (GEO / Generative Engine Optimization)
  const itemListSchema = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'กิจกรรมยามว่าง ฮีลใจ & ชุมชนน่าสนใจ',
      description: 'รวมกิจกรรมยามว่าง เวิร์กช็อป ออกกำลังกาย HYROX บอร์ดเกม และงานอีเวนต์ใหญ่ในกรุงเทพฯ',
      itemListElement: eventsList.slice(0, 20).map((ev, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Event',
          name: ev.title,
          description: ev.description,
          image: ev.image,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: ev.location,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Bangkok',
              addressCountry: 'TH',
            },
          },
          offers: {
            '@type': 'Offer',
            price: ev.price ? ev.price.replace(/[^0-9]/g, '') || '0' : '0',
            priceCurrency: 'THB',
            availability: 'https://schema.org/InStock',
            url: 'https://chillconnecthub.com',
          },
          organizer: {
            '@type': 'Person',
            name: ev.hostName,
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: ev.rating || 4.9,
            reviewCount: ev.reviewsCount || 24,
          },
        },
      })),
    };
  }, [eventsList]);

  const handleResetAllFilters = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSelectedVenueFilter(null);
    setSelectedZone(null);
    setEventTypeTab('all');
    setTimeFilter('all');
    setPriceFilter('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setSortBy('newest');
    setSortByNearMe(false);
    setCurrentPage(1);
    showToast('ล้างตัวกรองทั้งหมดแล้ว ✨');
  };

  const handleToggleNearMe = () => {
    if (sortByNearMe) {
      setSortByNearMe(false);
      showToast('ปิดการเรียงตามระยะทางใกล้ฉันแล้ว');
      return;
    }

    setIsLocating(true);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setSortByNearMe(true);
          setIsLocating(false);
          setCurrentPage(1);
          showToast('📍 ค้นหากิจกรรมใกล้คุณ เรียงจากใกล้ไปไกลเรียบร้อย ✨');
        },
        (err) => {
          console.warn('Geolocation denied or timeout, fallback to Siam default:', err);
          setUserLocation({ lat: 13.7466, lng: 100.5349 });
          setSortByNearMe(true);
          setIsLocating(false);
          setCurrentPage(1);
          showToast('📍 เรียงกิจกรรมจากใกล้โซนสยาม / ใจกลางเมืองให้เรียบร้อย ✨');
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setUserLocation({ lat: 13.7466, lng: 100.5349 });
      setSortByNearMe(true);
      setIsLocating(false);
      setCurrentPage(1);
      showToast('📍 เรียงกิจกรรมจากใกล้โซนสยาม / ใจกลางเมืองให้เรียบร้อย ✨');
    }
  };

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;

  const displayedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

      {/* Schema.org Structured Data for AI Engine & Google Events Parsing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
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
        
        {/* 2. Hero Section (with h1 tag for SEO & Clean Instant Surprise Me) */}
        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={() => {
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenSurpriseModal={() => setIsSurpriseModalOpen(true)}
        />

        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-2 relative z-10">
          
          {/* 3. Auto-Sliding Trending Events Carousel */}
          <TrendingCarousel
            events={eventsList}
            onSelectEvent={(event) => setSelectedEvent(event)}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />

          {/* 5. 🌿 คลังกิจกรรมยามว่างทั้งหมด (Ultra-Slim 1-Row Unified Header & Control Bar) */}
          <section id="catalog-section" className="space-y-3 pt-1">
            
            {/* Search/Filter Results Notice (Only when explicitly searching or filtering) */}
            {searchQuery.trim() !== '' || selectedCategory !== null || selectedVenueFilter !== null || selectedZone !== null || sortByNearMe || priceFilter !== 'all' || (timeFilter === 'custom' && startDate) ? (
              <div className="flex items-center justify-between bg-amber-50 p-2.5 px-4 rounded-xl border border-amber-200/80 text-xs font-semibold text-[#1E293B] animate-fade-in">
                <span className="flex items-center gap-1.5 font-bold">
                  <span>🔍 ผลการค้นหา: พบทั้งหมด {filteredEvents.length} กิจกรรม {sortByNearMe ? '(📍 เรียงจากใกล้ไปไกล)' : ''} {selectedZone ? `• โซน: ${BANGKOK_ZONES.find(z => z.id === selectedZone)?.label}` : ''}</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="text-xs text-[#F26430] hover:underline font-bold cursor-pointer"
                >
                  ✕ ล้างตัวกรองทั้งหมด
                </button>
              </div>
            ) : null}

            {/* Unified 1-Row Header & Filter Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-white p-2 sm:p-2.5 rounded-2xl border border-[#E8E2D8] shadow-xs">
              
              {/* Left: Title + Time Filter Tabs */}
              <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-0.5">
                <h2 className="text-sm sm:text-base font-extrabold text-[#1E293B] flex items-center gap-1.5 shrink-0 pl-1">
                  <Sprout className="w-4 h-4 sm:w-5 sm:h-5 text-[#4A7C59]" />
                  <span>กิจกรรมน่าสนใจ</span>
                </h2>

                <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

                {/* Time Filter Tabs */}
                <div className="flex items-center gap-1 shrink-0">
                  {[
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'tomorrow', label: 'พรุ่งนี้' },
                    { id: 'weekend', label: 'เสาร์-อาทิตย์นี้' },
                    { id: 'next_month', label: 'เดือนหน้า' },
                  ].map((tab) => {
                    const isActive = timeFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setTimeFilter(tab.id as any);
                          setStartDate('');
                          setEndDate('');
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                          isActive
                            ? 'bg-[#1E293B] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}

                  {/* Custom Date Picker Tab */}
                  {timeFilter === 'custom' && startDate ? (
                    <button
                      onClick={() => {
                        setTimeFilter('all');
                        setStartDate('');
                        setEndDate('');
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold bg-[#F26430] text-white shadow-xs flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer animate-fade-in"
                      title="คลิกเพื่อล้างวันที่เลือก"
                    >
                      <Calendar className="w-3 h-3 text-white" />
                      <span>{startDate}{endDate && endDate !== startDate ? ` - ${endDate}` : ''}</span>
                      <X className="w-3 h-3 ml-0.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsDatePickerOpen(true)}
                      className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer transition-all border border-dashed border-slate-300 hover:border-slate-400"
                      title="เลือกวันที่ต้องการระบุเอง"
                    >
                      <Calendar className="w-3 h-3 text-[#4A7C59]" />
                      <span>ระบุวันที่เอง</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Near Me Button + Minimalist Filter Drawer & Sorting */}
              <div className="flex items-center justify-end gap-2 pt-1 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                
                {/* 🎯 Near Me Button with Single Modern Radar/GPS Icon */}
                <button
                  type="button"
                  onClick={handleToggleNearMe}
                  disabled={isLocating}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 border ${
                    sortByNearMe
                      ? 'bg-gradient-to-r from-orange-500 to-[#F26430] text-white border-[#F26430] shadow-sm ring-2 ring-orange-500/20'
                      : 'bg-white hover:bg-orange-50/80 text-[#1E293B] hover:text-[#F26430] border-[#E8E2D8] hover:border-orange-300'
                  }`}
                  title="ค้นหากิจกรรมใกล้ตำแหน่งของคุณ เรียงจากใกล้ที่สุด"
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F26430]" />
                  ) : (
                    <LocateFixed className={`w-3.5 h-3.5 ${sortByNearMe ? 'text-white animate-pulse' : 'text-[#F26430]'}`} />
                  )}
                  <span>{isLocating ? 'กำลังหาพิกัด...' : sortByNearMe ? 'ใกล้ฉัน (เปิดอยู่)' : 'ใกล้ฉัน'}</span>
                </button>

                {/* Minimalist Filter Drawer Trigger */}
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className={`flex items-center gap-1.5 bg-white hover:bg-slate-50 text-[#334155] border px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 ${
                    selectedZone || selectedVenueFilter || priceFilter !== 'all' || selectedCategory ? 'border-[#4A7C59] ring-2 ring-[#4A7C59]/10 text-[#4A7C59]' : 'border-[#E8E2D8]'
                  }`}
                  title="เปิดตัวกรองสถานที่ ย่าน และราคา"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#4A7C59]" />
                  <span>ตัวกรอง {selectedZone ? '(1)' : ''}</span>
                </button>

                {/* Sorting Select */}
                <div className="flex items-center gap-1 bg-white border border-[#E8E2D8] px-2.5 py-1.5 rounded-xl text-xs shrink-0 shadow-2xs">
                  <ArrowUpDown className="w-3 h-3 text-[#4A7C59]" />
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as 'newest' | 'popular' | 'favorites');
                      setSortByNearMe(false);
                    }}
                    className="bg-transparent font-bold text-[#1E293B] focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="newest">ล่าสุด</option>
                    <option value="popular">ยอดนิยม</option>
                    <option value="favorites">รายการโปรด ({favorites.length})</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Event Grid */}
            <EventGrid
              events={displayedEvents}
              onSelectEvent={(event) => setSelectedEvent(event)}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              joinedEventIds={joinedEventIds}
              onResetFilters={handleResetAllFilters}
            />

            {/* Google-Style Pagination Bar */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={filteredEvents.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
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
        onLeaveSuccess={handleLeaveSuccess}
        isJoined={selectedEvent ? joinedEventIds.includes(selectedEvent.id) : false}
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
        selectedZone={selectedZone}
        setSelectedZone={setSelectedZone}
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

      {/* Surprise Me! Interactive Random Event Modal */}
      <SurpriseModal
        isOpen={isSurpriseModalOpen}
        onClose={() => setIsSurpriseModalOpen(false)}
        events={eventsList}
        onSelectEvent={(event) => setSelectedEvent(event)}
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

'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Heart,
  ChevronDown,
  ArrowLeft,
  Search,
  X,
  Calendar,
  LocateFixed,
  Loader2,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { EventGrid } from '@/components/EventGrid';
import { Pagination } from '@/components/Pagination';
import { CommunityCategoryRail, COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { useAuth } from '@/lib/useAuth';
import { useResponsiveItemsPerPage } from '@/lib/useResponsiveItemsPerPage';
import { MOCK_EVENTS, EventItem } from '@/data/mockData';
import { ALL_THAI_PROVINCES } from '@/data/spotsData';

type SortOption = 'newest' | 'popular' | 'soonest' | 'favorites';
type VibeFilter = 'all' | 'solo' | 'free' | 'pets' | 'beginners' | 'soon';

function CommunityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const itemsPerPage = useResponsiveItemsPerPage();

  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedProvince, setSelectedProvince] = useState<string>(searchParams.get('province') || 'all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'tomorrow' | 'weekend' | 'custom'>('all');
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'ended' | 'all'>('upcoming');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free'>((searchParams.get('price') as any) || 'all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [activeVibeFilter, setActiveVibeFilter] = useState<VibeFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>(MOCK_EVENTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Date Filter State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Sync favorites & joined events from localStorage (Only active when user is logged in)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isLoggedIn) {
      setFavorites([]);
      setJoinedEventIds([]);
      return;
    }

    try {
      const savedFavs = localStorage.getItem('favorite_events');
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
      const savedJoined = localStorage.getItem('joined_event_ids');
      if (savedJoined) {
        setJoinedEventIds(JSON.parse(savedJoined));
      }
    } catch {}
  }, [isLoggedIn]);

  // Fetch live approved events from server and merge user-created buddy gatherings
  React.useEffect(() => {
    const loadLiveEvents = async () => {
      let baseList = MOCK_EVENTS;
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success && Array.isArray(data.events) && data.events.length > 0) {
          baseList = data.events;
        }
      } catch (err) {
        console.log('Using default mock events fallback:', err);
      }

      // Merge client-created events from localStorage so new gatherings appear immediately
      let userCreated: EventItem[] = [];
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('user_created_events');
          if (saved) {
            userCreated = JSON.parse(saved);
          }
        } catch (e) {
          console.error('Error loading user_created_events in community:', e);
        }
      }

      const seen = new Set<string>();
      const combined = [...userCreated, ...baseList].filter((item) => {
        if (!item || !item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      setEventsList(combined);
    };
    loadLiveEvents();
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (eventId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อบันทึกกิจกรรมโปรด');
      setPendingAction(`favorite:${eventId}`);
      setIsRequireMembershipOpen(true);
      return;
    }
    setFavorites((prev) => {
      const isFav = prev.includes(eventId);
      let updated: string[];
      if (isFav) {
        updated = prev.filter((id) => id !== eventId);
        showToast('ลบออกจากรายการโปรดแล้ว');
      } else {
        updated = [...prev, eventId];
        showToast('เพิ่มเข้าในรายการโปรดเรียบร้อย! ❤️');
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('favorite_events', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const filteredEvents = useMemo(() => {
    const list = eventsList.filter((ev) => {
      if ((ev.eventType || 'community') !== 'community') return false;

      // Status Filter (Upcoming / Ended / All)
      const ended = isEventEnded(ev);
      if (statusFilter === 'upcoming' && ended) return false;
      if (statusFilter === 'ended' && !ended) return false;

      const eventText = `${ev.title} ${ev.description || ''} ${ev.tag || ''} ${ev.location || ''} ${ev.hostName || ''} ${ev.province || ''}`.toLowerCase();

      if (selectedCategory !== 'all') {
        const cat = selectedCategory;
        if (cat === 'heal' || cat === 'move' || cat === 'chill' || cat === 'learn') {
          if (ev.category !== cat) return false;
        } else if (cat === 'running_fitness') {
          if (!['วิ่ง', 'running', 'marathon', 'hyrox', 'fitness', 'กีฬา', 'sport', 'climbing', 'ปีน', 'badminton'].some(k => eventText.includes(k))) return false;
        } else if (cat === 'wellness_mind') {
          if (!['sound bath', 'soundbath', 'yoga', 'โยคะ', 'สมาธิ', 'mindfulness', 'heal', 'ฮีลใจ', 'บำบัด', 'introvert'].some(k => eventText.includes(k))) return false;
        } else if (cat === 'cafe_social') {
          if (!['cafe', 'คาเฟ่', 'coffee', 'กาแฟ', 'slow bar', 'hangout', 'จิบกาแฟ', 'พูดคุย', 'อาหาร', 'tea', 'ชา', 'มัทฉะ'].some(k => eventText.includes(k))) return false;
        } else if (cat === 'boardgames_party') {
          if (!['board game', 'boardgame', 'บอร์ดเกม', 'เกม', 'catan', 'quiz', 'party', 'เกมกลุ่ม', 'เพื่อนใหม่'].some(k => eventText.includes(k))) return false;
        } else if (cat === 'arts_crafts') {
          if (!['workshop', 'เวิร์กช็อป', 'art', 'ศิลปะ', 'craft', 'คราฟต์', 'เซรามิก', 'pottery', 'ปั้นดิน', 'painting', 'สีน้ำ', 'เทียน', 'candle', 'ภาพวาด'].some(k => eventText.includes(k))) return false;
        } else if (cat === 'travel_outdoor') {
          if (!['outdoor', 'เอาต์ดอร์', 'camping', 'กางเต็นท์', 'เดินป่า', 'คายัค', 'sup board', 'ซับบอร์ด', 'ธรรมชาติ', 'photowalk', 'ถ่ายรูป'].some(k => eventText.includes(k))) return false;
        } else if (cat === 'tech_skills') {
          if (!['tech', 'ai', 'coding', 'developer', 'startup', 'business', 'networking', 'หนังสือ', 'book', 'talk', 'เสวนา'].some(k => eventText.includes(k))) return false;
        } else if (cat === 'pets_family') {
          if (!['pet', 'สัตว์เลี้ยง', 'หมา', 'แมว', 'dog', 'cat', 'family', 'ครอบครัว', 'เด็ก', 'kids'].some(k => eventText.includes(k))) return false;
        }
      }

      if (selectedProvince !== 'all') {
        const isBangkokFilter = selectedProvince === 'กรุงเทพฯ' || selectedProvince === 'กรุงเทพมหานคร';
        const isOnlineFilter = selectedProvince === 'ออนไลน์' || selectedProvince.toLowerCase().includes('online');
        const evProv = (ev.province || '').trim();
        const evLoc = (ev.location || '').toLowerCase();

        if (isOnlineFilter) {
          const isOnlineEv = evProv === 'ออนไลน์' || evLoc.includes('zoom') || evLoc.includes('discord') || evLoc.includes('online');
          if (!isOnlineEv) return false;
        } else if (isBangkokFilter) {
          const isBkkEv = evProv === 'กรุงเทพฯ' || evProv === 'กรุงเทพมหานคร' || (!evProv && (evLoc.includes('กทม') || evLoc.includes('กรุงเทพ')));
          if (!isBkkEv) return false;
        } else {
          if (evProv !== selectedProvince && !evLoc.includes(selectedProvince.toLowerCase())) return false;
        }
      }

      const isOnlineEv = ev.province === 'ออนไลน์' || ev.locationType === 'online' || ev.location?.includes('ออนไลน์') || ev.location?.toLowerCase().includes('online');

      // Quick Vibe Filter Chips (Agoda / Airbnb style curation)
      if (activeVibeFilter === 'solo') {
        if (isOnlineEv) return false;
        const isExplicit = ev.isSoloFriendly;
        const isSolo = isExplicit !== undefined
          ? isExplicit
          : (eventText.includes('คนเดียว') ||
             eventText.includes('เพื่อนใหม่') ||
             eventText.includes('จิบกาแฟ') ||
             eventText.includes('บอร์ดเกม') ||
             eventText.includes('cafe') ||
             eventText.includes('คาเฟ่') ||
             eventText.includes('introvert') ||
             eventText.includes('หนังสือ') ||
             ev.category === 'chill' ||
             ev.category === 'learn');
        if (!isSolo) return false;
      } else if (activeVibeFilter === 'free') {
        if (!ev.price || !ev.price.includes('ฟรี')) return false;
      } else if (activeVibeFilter === 'pets') {
        if (isOnlineEv) return false;
        const isExplicit = ev.isPetFriendly;
        const isPet = isExplicit !== undefined
          ? isExplicit
          : ['pet', 'หมา', 'แมว', 'dog', 'cat', 'สัตว์เลี้ยง'].some((k) => eventText.includes(k));
        if (!isPet) return false;
      } else if (activeVibeFilter === 'beginners') {
        const isExplicit = ev.isBeginnerFriendly;
        const isBeginner = isExplicit !== undefined
          ? isExplicit
          : (['มือใหม่', 'beginner', 'เวิร์กช็อป', 'workshop', 'ปั้นดิน', 'บอร์ดเกม', 'ชิลล์', 'วิ่งเบาๆ', 'jogging', 'โยคะ', 'yoga'].some((k) => eventText.includes(k)) || ev.category === 'learn' || ev.category === 'chill');
        if (!isBeginner) return false;
      } else if (activeVibeFilter === 'soon') {
        const now = Date.now();
        const evTs = parseEventDateToTimestamp(ev.date);
        const diffDays = (evTs - now) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      }

      if (sortBy === 'favorites' && !favorites.includes(ev.id)) return false;
      if (priceFilter === 'free' && (!ev.price || !ev.price.includes('ฟรี'))) return false;

      // Custom Date Filter
      if (customStartDate) {
        const [sd, sm, sy] = customStartDate.split('/').map(Number);
        const filterStartTs = new Date(sy, sm - 1, sd, 0, 0, 0).getTime();
        const [ed, em, ey] = (customEndDate || customStartDate).split('/').map(Number);
        const filterEndTs = new Date(ey, em - 1, ed, 23, 59, 59).getTime();

        const evStart = parseEventDateToTimestamp(ev.date);
        const evEnd = parseEventEndDateToTimestamp(ev.date);
        if (evEnd < filterStartTs || evStart > filterEndTs) return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        if (!eventText.includes(q)) return false;
      }
      return true;
    });

    // Dynamic Multi-Tier Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'popular') {
        const ratingA = a.hostRating || a.rating || 4.5;
        const ratingB = b.hostRating || b.rating || 4.5;
        if (ratingB !== ratingA) return ratingB - ratingA;
        const fillA = a.participantsCount / (a.maxParticipants || 10);
        const fillB = b.participantsCount / (b.maxParticipants || 10);
        return fillB - fillA;
      }
      if (sortBy === 'soonest') {
        const tsA = parseEventDateToTimestamp(a.date);
        const tsB = parseEventDateToTimestamp(b.date);
        return tsA - tsB;
      }
      // Default: newest
      return (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0);
    });
  }, [eventsList, statusFilter, selectedCategory, selectedProvince, activeVibeFilter, priceFilter, sortBy, favorites, searchQuery, customStartDate, customEndDate]);

  // Calculate event counts per lifestyle category for Luma-style badge display
  const categoryEventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const communityEvents = eventsList.filter((e) => (e.eventType || 'community') === 'community');

    COMMUNITY_LIFESTYLE_CATEGORIES.forEach((cat) => {
      const matchCount = communityEvents.filter((ev) => {
        const text = `${ev.title} ${ev.description} ${ev.tag} ${ev.location} ${ev.hostName}`.toLowerCase();
        return cat.keywords.some((k) => text.includes(k));
      }).length;
      counts[cat.id] = matchCount;
    });

    return counts;
  }, [eventsList]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;

  // Pagination clamp: reset to page 1 if filter changes reduce totalPages below currentPage
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage, itemsPerPage]);

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedProvince('all');
    setActiveVibeFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setTimeFilter('all');
    setStatusFilter('upcoming');
    setPriceFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
    showToast('ล้างตัวกรองทั้งหมดแล้ว');
  };

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans">
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => {
          if (!isLoggedIn) {
            setMembershipActionTitle('เพื่อเปิดตี้หรือสร้างกิจกรรมใหม่');
            setPendingAction('create');
            setIsRequireMembershipOpen(true);
          } else {
            setIsCreateEventModalOpen(true);
          }
        }}
      />

      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header Bar with Breadcrumb */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>หน้าแรก</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">กิจกรรมคอมมูนิตี้</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-gradient-to-r from-orange-50/70 via-slate-50/40 to-transparent p-4 sm:p-6 rounded-3xl border border-orange-100/80 shadow-2xs">
            <div className="space-y-1.5 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                กิจกรรมคอมมูนิตี้
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                เชื่อมต่อมิตรภาพผ่านกิจกรรมสร้างสรรค์ ตี้วิ่ง บอร์ดเกม คาเฟ่ฮอปปิ้ง และเวิร์กช็อป ในบรรยากาศอบอุ่น เป็นกันเอง และปลอดภัย
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  setMembershipActionTitle('เพื่อเปิดตี้หรือสร้างกิจกรรมใหม่');
                  setPendingAction('create');
                  setIsRequireMembershipOpen(true);
                } else {
                  setIsCreateEventModalOpen(true);
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>เปิดตี้ / สร้างกิจกรรมใหม่</span>
            </button>
          </div>
        </div>

        {/* Harmonious Horizontal Category Rail (Same as Homepage) */}
        <div className="bg-slate-50/60 p-2.5 sm:p-3 rounded-2xl border border-slate-200/70 shadow-2xs">
          <CommunityCategoryRail
            selectedCategoryId={selectedCategory === 'all' ? null : selectedCategory}
            onSelectCategory={(catId) => {
              setSelectedCategory(catId || 'all');
              setCurrentPage(1);
            }}
            eventCounts={categoryEventCounts}
            variant="rail"
          />
        </div>

        {/* Quick Vibe & Budget Filter Chips (Agoda / Airbnb style curation) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar text-xs">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'solo', label: 'มาคนเดียวได้' },
            { id: 'free', label: 'เข้าร่วมฟรี' },
            { id: 'pets', label: 'สัตว์เลี้ยงร่วมได้' },
            { id: 'beginners', label: 'เหมาะกับมือใหม่' },
            { id: 'soon', label: 'จัดขึ้นเร็วๆ นี้' },
          ].map((chip) => {
            const isActive = activeVibeFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setActiveVibeFilter(chip.id as VibeFilter);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80 shadow-3xs'
                }`}
              >
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* The Floating Editorial Search & Filter Canvas */}
        <div className="bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 flex items-center bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-200/90 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ค้นหาชื่อกิจกรรม เวิร์กช็อป หรือสถานที่..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Province Select */}
            <div className="relative w-full md:w-44 shrink-0">
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="เลือกจังหวัดหรือออนไลน์"
                className="w-full px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white cursor-pointer appearance-none pr-8 transition-all"
              >
                <option value="all">ทุกจังหวัด / ออนไลน์</option>
                <option value="ออนไลน์">ออนไลน์ (Zoom / Discord)</option>
                <optgroup label="จังหวัดยอดนิยม">
                  <option value="กรุงเทพฯ">กรุงเทพฯ</option>
                  <option value="นนทบุรี">นนทบุรี</option>
                  <option value="เชียงใหม่">เชียงใหม่</option>
                  <option value="ชลบุรี">ชลบุรี</option>
                  <option value="ภูเก็ต">ภูเก็ต</option>
                </optgroup>
                <optgroup label="77 จังหวัดทั่วไทย">
                  {ALL_THAI_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Date Filter Button */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  customStartDate
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                    : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200/90'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${customStartDate ? 'text-white' : 'text-slate-400'}`} />
                <span>
                  {customStartDate
                    ? customStartDate === customEndDate
                      ? customStartDate
                      : `${customStartDate} - ${customEndDate}`
                    : 'เลือกวัน / ช่วงเวลา'}
                </span>
                {customStartDate && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomStartDate('');
                      setCustomEndDate('');
                      setCurrentPage(1);
                    }}
                    className="p-0.5 hover:bg-slate-800 rounded-full cursor-pointer ml-0.5"
                    title="ล้างวันที่เลือก"
                  >
                    <X className="w-3 h-3 text-white" />
                  </span>
                )}
              </button>
            </div>

            {/* Status Filter Tabs (Upcoming vs Ended) */}
            <div className="flex items-center bg-slate-50/80 p-1 rounded-xl border border-slate-200/90 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('upcoming');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'upcoming'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                กำลังจะมาถึง
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ended');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ended'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                กิจกรรมที่ผ่านมา
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด
              </button>
            </div>

            {/* Free Button */}
            <button
              type="button"
              onClick={() => {
                setPriceFilter(priceFilter === 'free' ? 'all' : 'free');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                priceFilter === 'free'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200/90'
              }`}
            >
              เข้าร่วมฟรี
            </button>

            {/* Favorites Button with Auth Check */}
            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  setMembershipActionTitle('เพื่อดูรายการกิจกรรมที่บันทึกไว้');
                  setPendingAction('favorites');
                  setIsRequireMembershipOpen(true);
                  return;
                }
                setSortBy(sortBy === 'favorites' ? 'newest' : 'favorites');
                setCurrentPage(1);
              }}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                sortBy === 'favorites'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200/90'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${sortBy === 'favorites' ? 'fill-white text-white' : 'text-slate-400'}`} />
              <span>ที่บันทึกไว้ ({favorites.length})</span>
            </button>

          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-500 pt-1 border-t border-slate-200/60">
            <div className="flex items-center gap-2">
              <span>พบทั้งหมด <strong className="text-slate-900 font-bold">{filteredEvents.length}</strong> รายการ</span>
              {(searchQuery || selectedCategory !== 'all' || selectedProvince !== 'all' || customStartDate || priceFilter !== 'all' || sortBy !== 'newest' || activeVibeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="text-xs text-slate-500 hover:text-[#F26430] hover:underline cursor-pointer ml-1"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>

            {/* Sort Dropdown (Agoda / Airbnb style sorting) */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs shrink-0">เรียงตาม:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const val = e.target.value as SortOption;
                    if (val === 'favorites' && !isLoggedIn) {
                      setMembershipActionTitle('เพื่อดูรายการกิจกรรมที่บันทึกไว้');
                      setPendingAction('favorites');
                      setIsRequireMembershipOpen(true);
                      return;
                    }
                    setSortBy(val);
                    setCurrentPage(1);
                  }}
                  aria-label="เลือกการเรียงลำดับกิจกรรม"
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer appearance-none pr-7 transition-all"
                >
                  <option value="newest">กิจกรรมมาใหม่ล่าสุด</option>
                  <option value="popular">ยอดนิยม / เรตติ้งสูงสุด</option>
                  <option value="soonest">จัดขึ้นเร็วๆ นี้</option>
                  <option value="favorites">ที่บันทึกไว้ ({favorites.length})</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* High-Density Community Events Grid */}
        <EventGrid
          events={paginatedEvents}
          onSelectEvent={() => {}}
          favorites={isLoggedIn ? favorites : []}
          toggleFavorite={toggleFavorite}
          joinedEventIds={isLoggedIn ? joinedEventIds : []}
          onResetFilters={handleResetAll}
          isFavoritesOnly={sortBy === 'favorites'}
        />

        {filteredEvents.length > itemsPerPage && (
          <div className="pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              totalItems={filteredEvents.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}

      </main>

      <CustomDatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        startDate={customStartDate}
        endDate={customEndDate}
        onApply={(start, end) => {
          setCustomStartDate(start);
          setCustomEndDate(end);
          setCurrentPage(1);
        }}
        onReset={() => {
          setCustomStartDate('');
          setCustomEndDate('');
          setCurrentPage(1);
        }}
      />

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        initialType="community"
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          setEventsList([newEvent, ...eventsList]);
          showToast(`เปิดตี้กิจกรรม "${newEvent.title}" สำเร็จ! 🎉`);
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onLoginSuccess={(name) => {
          handleSetIsLoggedIn(true);
          setIsAuthModalOpen(false);
          showToast(`ยินดีต้อนรับ ${name}! เข้าสู่ระบบเรียบร้อย`);

          // Execute pending action after login
          if (pendingAction === 'create') {
            setTimeout(() => setIsCreateEventModalOpen(true), 300);
          } else if (pendingAction === 'favorites') {
            setTimeout(() => {
              setSortBy('favorites');
              setCurrentPage(1);
            }, 300);
          } else if (pendingAction?.startsWith('favorite:')) {
            const evId = pendingAction.replace('favorite:', '');
            setTimeout(() => {
              // Read updated favorites from localStorage and toggle
              try {
                const saved = JSON.parse(localStorage.getItem('favorite_events') || '[]');
                if (!saved.includes(evId)) {
                  const updated = [...saved, evId];
                  setFavorites(updated);
                  localStorage.setItem('favorite_events', JSON.stringify(updated));
                  showToast('เพิ่มเข้าในรายการโปรดเรียบร้อย! ❤️');
                }
              } catch {}
            }, 300);
          }
          setPendingAction(null);
        }}
      />

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          setSortBy('newest'); // Reset to newest so not stuck on empty favorites view
          setFavorites([]);
          setJoinedEventIds([]);
          setIsCreateEventModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />

      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={favorites.length}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm font-medium flex items-center gap-2.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400 text-sm">กำลังโหลดกิจกรรมชุมชน...</div>}>
      <CommunityPageContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Heart,
  ChevronDown,
  ArrowLeft,
  Search,
  X,
  Calendar,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { EventGrid } from '@/components/EventGrid';
import { Pagination } from '@/components/Pagination';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { useAuth } from '@/lib/useAuth';
import { MOCK_EVENTS, EventItem } from '@/data/mockData';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { FairCategoryRail, NATIONWIDE_FAIR_CATEGORIES } from '@/components/FairCategoryRail';
import { TopVenuesRail } from '@/components/TopVenuesRail';
import { ALL_THAI_PROVINCES } from '@/data/spotsData';

import { useResponsiveItemsPerPage } from '@/lib/useResponsiveItemsPerPage';

const VENUE_FILTERS = [
  { id: 'all', label: 'ทุกศูนย์ประชุม & ฮอลล์' },
  { id: 'QSNCC', label: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)' },
  { id: 'BITEC', label: 'ไบเทค บางนา (BITEC)' },
  { id: 'IMPACT', label: 'อิมแพ็ค เมืองทองธานี (IMPACT)' },
  { id: 'SIAM_PARAGON', label: 'พารากอน ฮอลล์ (Paragon Hall)' },
  { id: 'ICONSIAM', label: 'ทรู ไอคอน ฮอลล์ (ICONSIAM)' },
];

function FairsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const itemsPerPage = useResponsiveItemsPerPage();

  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>(searchParams.get('province') || 'all');
  const [selectedVenue, setSelectedVenue] = useState<string>(searchParams.get('venue') || 'all');
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'ended' | 'all'>('upcoming');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free'>((searchParams.get('price') as any) || 'all');
  const [sortBy, setSortBy] = useState<'newest' | 'favorites'>('newest');
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
      setSortBy((prev) => (prev === 'favorites' ? 'newest' : prev));
      return;
    }

    try {
      const savedFavs = localStorage.getItem('favorite_events');
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
      const savedJoined = localStorage.getItem('joined_fair_sub_ids') || localStorage.getItem('joined_event_ids');
      if (savedJoined) {
        setJoinedEventIds(JSON.parse(savedJoined));
      }
    } catch {}
  }, [isLoggedIn]);

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

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (eventId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อบันทึกงานแฟร์และนิทรรศการโปรด');
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
        showToast('บันทึกเข้าในรายการโปรดเรียบร้อย');
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('favorite_events', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const filteredEvents = useMemo(() => {
    return eventsList.filter((ev) => {
      if (ev.eventType !== 'public_venue') return false;

      // Status Filter (Upcoming / Ended / All)
      const ended = isEventEnded(ev);
      if (statusFilter === 'upcoming' && ended) return false;
      if (statusFilter === 'ended' && !ended) return false;

      // Category Rail Filter
      if (selectedCategory && selectedCategory !== 'all') {
        const catDef = NATIONWIDE_FAIR_CATEGORIES.find((c) => c.id === selectedCategory);
        if (catDef) {
          const text = `${ev.title} ${ev.description || ''} ${ev.tag || ''} ${ev.location || ''} ${ev.venueTag || ''}`.toLowerCase();
          const matches = catDef.keywords.some((kw) => text.includes(kw.toLowerCase()));
          if (!matches) return false;
        }
      }

      if (selectedProvince !== 'all') {
        const isBangkokFilter = selectedProvince === 'กรุงเทพฯ' || selectedProvince === 'กรุงเทพมหานคร';
        const evProv = (ev.province || '').trim();
        const evLoc = (ev.location || '').toLowerCase();

        if (isBangkokFilter) {
          const isBkkEv = evProv === 'กรุงเทพฯ' || evProv === 'กรุงเทพมหานคร' || (!evProv && (evLoc.includes('กทม') || evLoc.includes('กรุงเทพ')));
          if (!isBkkEv) return false;
        } else {
          if (evProv !== selectedProvince && !evLoc.includes(selectedProvince.toLowerCase())) return false;
        }
      }

      if (selectedVenue !== 'all') {
        const vLower = selectedVenue.toLowerCase();
        const loc = (ev.location || '').toLowerCase();
        const vTag = (ev.venueTag || '').toLowerCase();
        const title = (ev.title || '').toLowerCase();
        const text = `${vTag} ${loc} ${title}`;

        if (vLower === 'qsncc' && !text.includes('สิริกิติ์') && !text.includes('qsncc')) return false;
        else if (vLower === 'bitec' && !text.includes('ไบเทค') && !text.includes('bitec')) return false;
        else if (vLower === 'impact' && !text.includes('อิมแพ็ค') && !text.includes('impact') && !text.includes('เมืองทอง')) return false;
        else if (vLower === 'paragon' && !text.includes('paragon') && !text.includes('พารากอน') && !text.includes('iconsiam') && !text.includes('ไอคอนสยาม') && !text.includes('สยาม')) return false;
        else if (vLower === 'bacc' && !text.includes('bacc') && !text.includes('หอศิลป') && !text.includes('เจริญกรุง') && !text.includes('ปทุมวัน')) return false;
        else if (vLower === 'park' && !text.includes('สวน') && !text.includes('park') && !text.includes('สนามหลวง')) return false;
        else if (vLower === 'regional' && !text.includes('kice') && !text.includes('ขอนแก่น') && !text.includes('cmecc') && !text.includes('เชียงใหม่') && !text.includes('สงขลา') && !text.includes('ภูเก็ต')) return false;
        else if (!['qsncc', 'bitec', 'impact', 'paragon', 'bacc', 'park', 'regional'].includes(vLower) && !loc.includes(vLower) && !vTag.includes(vLower)) return false;
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
        const text = `${ev.title} ${ev.description || ''} ${ev.tag || ''} ${ev.location || ''} ${ev.hostName || ''} ${ev.venueTag || ''} ${ev.province || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [eventsList, statusFilter, selectedCategory, selectedProvince, selectedVenue, priceFilter, sortBy, favorites, searchQuery, customStartDate, customEndDate]);

  const fairCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const baseFairs = eventsList.filter((ev) => ev.eventType === 'public_venue' && (statusFilter === 'all' || (statusFilter === 'upcoming' ? !isEventEnded(ev) : isEventEnded(ev))));
    for (const cat of NATIONWIDE_FAIR_CATEGORIES) {
      counts[cat.id] = baseFairs.filter((ev) => {
        const text = `${ev.title} ${ev.description || ''} ${ev.tag || ''} ${ev.location || ''} ${ev.venueTag || ''}`.toLowerCase();
        return cat.keywords.some((kw) => text.includes(kw.toLowerCase()));
      }).length;
    }
    return counts;
  }, [eventsList, statusFilter]);

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
    setSelectedCategory(null);
    setSelectedProvince('all');
    setSelectedVenue('all');
    setCustomStartDate('');
    setCustomEndDate('');
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
            setIsAuthModalOpen(true);
          } else {
            setIsCreateEventModalOpen(true);
          }
        }}
      />

      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:pb-12 space-y-6">
        
        {/* Header Bar with Breadcrumb */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>หน้าแรก</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">งานมหกรรม & เอ็กซ์โป</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-gradient-to-r from-blue-50/70 via-slate-50/40 to-transparent p-4 sm:p-6 rounded-3xl border border-blue-100/80 shadow-2xs">
            <div className="space-y-1.5 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                งานมหกรรม & เอ็กซ์โป
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                อัปเดตนิทรรศการ คอนเวนชัน และเทศกาลระดับประเทศ ณ ศูนย์การประชุมและแลนด์มาร์กชั้นนำ (QSNCC, BITEC, IMPACT)
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  setMembershipActionTitle('เพื่อสร้างงานมหกรรมหรือเอ็กซ์โป');
                  setPendingAction('create_fair');
                  setIsRequireMembershipOpen(true);
                } else {
                  setIsCreateEventModalOpen(true);
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>สร้างงานมหกรรม / เอ็กซ์โป</span>
            </button>
          </div>
        </div>

        {/* Top Venues Rail (Major Convention Centres & Hubs) */}
        <TopVenuesRail
          selectedVenue={selectedVenue === 'all' ? null : selectedVenue}
          onSelectVenue={(v) => {
            setSelectedVenue(v || 'all');
            setCurrentPage(1);
          }}
          eventsList={eventsList}
        />

        {/* Dynamic Category Rail (Nationwide Fairs) */}
        <FairCategoryRail
          selectedCategoryId={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            setCurrentPage(1);
          }}
          fairCounts={fairCounts}
        />

        {/* Global Luxury Filter & Search Canvas */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          
          {/* Main Search Row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ค้นหาชื่องาน, คอนเวนชัน, ฮอลล์, เมือง หรือผู้จัดงาน..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2B527A] focus:bg-white transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="ล้างคำค้นหา"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Province Select */}
            <div className="relative w-full md:w-52 shrink-0">
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="เลือกจังหวัดที่จัดงาน"
                className="w-full px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2B527A] focus:bg-white cursor-pointer appearance-none pr-8 truncate transition-all"
              >
                <option value="all">ทุกจังหวัดทั่วไทย</option>
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

            {/* Venue Select */}
            <div className="relative w-full md:w-56 shrink-0">
              <select
                value={selectedVenue}
                onChange={(e) => {
                  setSelectedVenue(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="เลือกศูนย์ประชุม"
                className="w-full px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2B527A] focus:bg-white cursor-pointer appearance-none pr-8 truncate transition-all"
              >
                {VENUE_FILTERS.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
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
                งานที่ผ่านมา
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
              เข้าชมฟรี
            </button>

            {/* Favorites Button with Auth Check */}
            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  setMembershipActionTitle('เพื่อดูรายการงานแฟร์ที่บันทึกไว้');
                  setPendingAction('favorites_filter');
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

          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1 border-t border-slate-200/60">
            <span>พบทั้งหมด <strong className="text-slate-900 font-bold">{filteredEvents.length}</strong> งาน</span>
            {(searchQuery || selectedCategory || selectedProvince !== 'all' || selectedVenue !== 'all' || customStartDate || priceFilter !== 'all' || sortBy === 'favorites') && (
              <button
                type="button"
                onClick={handleResetAll}
                className="text-xs text-slate-500 hover:text-[#2B527A] hover:underline cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* High-Density Exhibitions Grid */}
        {filteredEvents.length > 0 ? (
          <>
            <EventGrid
              events={paginatedEvents}
              onSelectEvent={() => {}}
              favorites={isLoggedIn ? favorites : []}
              toggleFavorite={toggleFavorite}
              joinedEventIds={isLoggedIn ? joinedEventIds : []}
              onResetFilters={handleResetAll}
            />

            {/* Standard Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 pb-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  ก่อนหน้า
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isCurrent = p === currentPage;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  ถัดไป
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200 flex items-center justify-between gap-4 text-left">
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                ไม่พบงานมหกรรมหรือเอ็กซ์โปตามเงื่อนไขที่เลือก
              </h3>
              <p className="text-[11px] text-slate-500">
                ลองปรับเปลี่ยนคำค้นหา หรือเลือกศูนย์การประชุมและช่วงเวลาอื่น
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetAll}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shrink-0 transition-colors shadow-2xs"
            >
              ดูทั้งหมด
            </button>
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
        initialType="fair"
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          setEventsList([newEvent, ...eventsList]);
          showToast(`สร้างงานมหกรรม "${newEvent.title}" สำเร็จ`);
        }}
      />

      <RequireMembershipModal
        isOpen={isRequireMembershipOpen}
        onClose={() => {
          setIsRequireMembershipOpen(false);
          setPendingAction(null);
        }}
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
          showToast(`ยินดีต้อนรับ ${name}! เข้าสู่ระบบเรียบร้อย`);
          if (pendingAction === 'create_fair') {
            setIsCreateEventModalOpen(true);
          } else if (pendingAction === 'favorites_filter') {
            setSortBy('favorites');
            setCurrentPage(1);
          } else if (pendingAction && pendingAction.startsWith('favorite:')) {
            const targetId = pendingAction.split(':')[1];
            if (targetId) toggleFavorite(targetId);
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
          setIsCreateEventModalOpen(false);
          setSortBy('newest');
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

export default function FairsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400 text-sm">กำลังโหลดงานแฟร์ & นิทรรศการ...</div>}>
      <FairsPageContent />
    </Suspense>
  );
}

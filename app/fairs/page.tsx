'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Heart,
  SlidersHorizontal,
  ChevronDown,
  ArrowLeft,
  Search,
  X,
  Calendar,
  CheckCircle2,
  PlusCircle,
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
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (eventId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อบันทึกงานแฟร์โปรด');
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
        showToast('เพิ่มเข้าในรายการโปรดเรียบร้อย! 📌');
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
        if (!loc.includes(vLower) && !vTag.includes(vLower)) return false;
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
        const text = `${ev.title} ${ev.description} ${ev.tag} ${ev.location} ${ev.hostName}`.toLowerCase();
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
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage, itemsPerPage]);

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

      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header Bar with Breadcrumb */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>หน้าแรก</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">งานมหกรรม & เอ็กซ์โป (Grand Exhibitions)</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-gradient-to-r from-blue-50/70 via-slate-50/40 to-transparent p-4 sm:p-6 rounded-3xl border border-blue-100/80 shadow-2xs">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black text-[#2B527A] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
                  Grand Exhibitions
                </span>
                <span className="text-xs font-bold text-slate-400">•</span>
                <span className="text-xs font-bold text-slate-600">
                  {selectedProvince === 'all' ? 'ทั่วประเทศ' : `จังหวัด${selectedProvince}`} ({filteredEvents.length} งาน)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                งานมหกรรม & เอ็กซ์โป
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                อัปเดตนิทรรศการ คอนเวนชัน และเทศกาลระดับประเทศ ณ ศูนย์การประชุมและแลนด์มาร์กชั้นนำ (QSNCC, BITEC, IMPACT)
              </p>

              {/* Frosted Trust Pills */}
              <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-blue-200/80 shadow-2xs">
                  <Building2 className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                  <span>ศูนย์ประชุมและฮอลล์ชั้นนำระดับชาติ</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-blue-200/80 shadow-2xs">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>ตารางจัดงานทางการ & พิกัดชัดเจน</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  setMembershipActionTitle('เพื่อสร้างงานมหกรรมหรือเอ็กซ์โป');
                  setIsRequireMembershipOpen(true);
                } else {
                  setIsCreateEventModalOpen(true);
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>สร้างงานมหกรรม / เอ็กซ์โป</span>
            </button>
          </div>
        </div>

        {/* Nationwide Fair Category Rail */}
        <FairCategoryRail
          selectedCategoryId={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            setCurrentPage(1);
          }}
          fairCounts={fairCounts}
        />

        {/* Filter & Search Bar */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 flex items-center bg-white rounded-xl border border-slate-200 px-3 py-2 focus-within:border-[#4A7C59]">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ค้นหาชื่องาน นิทรรศการ หรือฮอลล์จัดงาน..."
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
                aria-label="เลือกจังหวัด"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4A7C59] cursor-pointer appearance-none pr-8"
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4A7C59] cursor-pointer appearance-none pr-8 truncate"
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
                    ? 'bg-blue-50 text-[#2563EB] border-blue-300 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${customStartDate ? 'text-[#2563EB]' : 'text-slate-400'}`} />
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
                    className="p-0.5 hover:bg-blue-100 rounded-full cursor-pointer ml-0.5"
                    title="ล้างวันที่เลือก"
                  >
                    <X className="w-3 h-3 text-blue-600" />
                  </span>
                )}
              </button>
            </div>

            {/* Status Filter Tabs (Upcoming vs Ended) */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('upcoming');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'upcoming'
                    ? 'bg-[#EBF3ED] text-[#2D5A3C] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
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
                    ? 'bg-[#EBF3ED] text-[#2D5A3C] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
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
                    ? 'bg-[#EBF3ED] text-[#2D5A3C] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
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
                  ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              เข้าชมฟรี
            </button>

            {/* Favorites Button */}
            <button
              type="button"
              onClick={() => {
                setSortBy(sortBy === 'favorites' ? 'newest' : 'favorites');
                setCurrentPage(1);
              }}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                sortBy === 'favorites'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${sortBy === 'favorites' ? 'fill-white' : 'text-slate-400'}`} />
              <span>ที่บันทึกไว้ ({favorites.length})</span>
            </button>

          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1 border-t border-slate-200/60">
            <span>พบทั้งหมด <strong className="text-slate-900 font-bold">{filteredEvents.length}</strong> งาน</span>
            {(searchQuery || selectedCategory || selectedProvince !== 'all' || selectedVenue !== 'all' || customStartDate || priceFilter !== 'all' || sortBy === 'favorites') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedProvince('all');
                  setSelectedVenue('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setPriceFilter('all');
                  setSortBy('newest');
                  setCurrentPage(1);
                  showToast('ล้างตัวกรองทั้งหมดแล้ว');
                }}
                className="text-xs text-slate-500 hover:text-[#4A7C59] hover:underline cursor-pointer"
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
              onResetFilters={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedProvince('all');
                setSelectedVenue('all');
                setCustomStartDate('');
                setCustomEndDate('');
                setPriceFilter('all');
              }}
              isFavoritesOnly={sortBy === 'favorites'}
            />

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
          </>
        ) : (
          <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-8 text-center space-y-2 border border-dashed border-slate-200 shadow-2xs my-6">
            <h3 className="text-sm font-bold text-slate-800">ไม่พบงานมหกรรมหรือเอ็กซ์โปตามเงื่อนไขที่เลือก</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">ลองปรับคำค้นหา หรือเลือกศูนย์แสดงสินค้าและช่วงเวลาอื่นดูนะครับ</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedProvince('all');
                setSelectedVenue('all');
                setCustomStartDate('');
                setCustomEndDate('');
                setPriceFilter('all');
                setSortBy('newest');
                setCurrentPage(1);
              }}
              className="mt-2 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>ดูงานมหกรรมทั้งหมด</span>
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
          showToast(`สร้างงานมหกรรม "${newEvent.title}" สำเร็จ! 🎉`);
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
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(name) => {
          handleSetIsLoggedIn(true);
          showToast(`ยินดีต้อนรับ ${name}! เข้าสู่ระบบเรียบร้อย`);
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

'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Heart,
  SlidersHorizontal,
  ChevronDown,
  ArrowLeft,
  Search,
  X,
  Calendar,
  LocateFixed,
  Loader2,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import { isEventEnded } from '@/lib/dateUtils';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { EventGrid } from '@/components/EventGrid';
import { Pagination } from '@/components/Pagination';
import { CommunityCategoryRail, COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { useAuth } from '@/lib/useAuth';
import { MOCK_EVENTS, EventItem } from '@/data/mockData';

const ITEMS_PER_PAGE = 24;

function CommunityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'tomorrow' | 'weekend' | 'custom'>('all');
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'ended' | 'all'>('upcoming');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free'>((searchParams.get('price') as any) || 'all');
  const [sortBy, setSortBy] = useState<'newest' | 'favorites'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>(['1', '3']);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>(['1']);
  const [eventsList, setEventsList] = useState<EventItem[]>(MOCK_EVENTS);
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

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (eventId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อบันทึกกิจกรรมโปรด');
      setIsRequireMembershipOpen(true);
      return;
    }
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

  const filteredEvents = useMemo(() => {
    return eventsList.filter((ev) => {
      if ((ev.eventType || 'community') !== 'community') return false;

      // Status Filter (Upcoming / Ended / All)
      const ended = isEventEnded(ev);
      if (statusFilter === 'upcoming' && ended) return false;
      if (statusFilter === 'ended' && !ended) return false;

      const eventText = `${ev.title} ${ev.description} ${ev.tag} ${ev.location} ${ev.hostName}`.toLowerCase();

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

      if (sortBy === 'favorites' && !favorites.includes(ev.id)) return false;
      if (priceFilter === 'free' && (!ev.price || !ev.price.includes('ฟรี'))) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        if (!eventText.includes(q)) return false;
      }
      return true;
    });
  }, [eventsList, statusFilter, selectedCategory, priceFilter, sortBy, favorites, searchQuery]);

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

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

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
            <span className="text-slate-900">กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                รวมตี้วิ่ง บอร์ดเกม คาเฟ่ฮอปปิ้ง เวิร์กช็อปศิลปะ และคอมมูนิตี้พบปะเพื่อนคอเดียวกัน
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  setIsAuthModalOpen(true);
                } else {
                  setIsCreateEventModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A7C59] hover:bg-[#386144] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
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

            {/* Category Select */}
            <div className="relative w-full md:w-56 shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="เลือกหมวดหมู่กิจกรรม"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4A7C59] cursor-pointer appearance-none pr-8"
              >
                <option value="all">ทุกหมวดกิจกรรมชุมชน</option>
                {COMMUNITY_LIFESTYLE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.nameEn})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              เข้าร่วมฟรี
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
            <span>พบทั้งหมด <strong className="text-slate-900 font-bold">{filteredEvents.length}</strong> รายการ</span>
            {(searchQuery || selectedCategory !== 'all' || priceFilter !== 'all' || sortBy === 'favorites') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
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

        {/* High-Density Community Events Grid */}
        {filteredEvents.length > 0 ? (
          <>
            <EventGrid
              events={paginatedEvents}
              onSelectEvent={() => {}}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              joinedEventIds={joinedEventIds}
              onResetFilters={() => {
                setSearchQuery('');
                setSelectedCategory('all');
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
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </div>
          </>
        ) : (
          <div className="bg-slate-50 rounded-3xl p-12 text-center space-y-3 border border-slate-200 shadow-xs my-8">
            <div className="text-4xl">👥</div>
            <h3 className="text-base font-bold text-slate-800">ไม่พบกิจกรรมตามเงื่อนไขที่เลือก</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">ลองเปลี่ยนหมวดหมู่ หรือกดเปิดตี้สร้างกิจกรรมใหม่ได้เลยครับ</p>
          </div>
        )}

      </main>

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          setEventsList([newEvent, ...eventsList]);
          showToast(`สร้างกิจกรรม "${newEvent.title}" สำเร็จ!`);
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

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400 text-sm">กำลังโหลดกิจกรรมชุมชน...</div>}>
      <CommunityPageContent />
    </Suspense>
  );
}

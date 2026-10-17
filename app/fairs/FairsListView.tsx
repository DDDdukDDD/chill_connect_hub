'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Heart,
  X,
  Calendar,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { EventGrid } from '@/components/EventGrid';
import { ViewModeToggle, ViewMode } from '@/components/ViewModeToggle';
import { Pagination } from '@/components/Pagination';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { useAuth } from '@/lib/useAuth';
import { useMyActivity } from '@/lib/useMyActivity';
import { MOCK_EVENTS, EventItem } from '@/data/mockData';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { NATIONWIDE_FAIR_CATEGORIES } from '@/components/FairCategoryRail';
import { DiscoverCategoryTabs } from '@/components/discover/DiscoverCategoryTabs';
import { getFairEventCategory } from '@/data/masterHub';
import { TopVenuesRail } from '@/components/TopVenuesRail';
import {  } from '@/data/spotsData';

import { useResponsiveItemsPerPage } from '@/lib/useResponsiveItemsPerPage';
import { eventInProvince, fairSearchText, matchesQuery, type DiscoverCounts } from '@/lib/discoverMatch';
import { DiscoverHeader, FilterSelect, filterPillClass } from '@/components/discover/DiscoverHeader';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';

const VENUE_FILTERS = [
  { id: 'all', label: 'ทุกศูนย์ประชุม & ฮอลล์' },
  { id: 'QSNCC', label: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)' },
  { id: 'BITEC', label: 'ไบเทค บางนา (BITEC)' },
  { id: 'IMPACT', label: 'อิมแพ็ค เมืองทองธานี (IMPACT)' },
  { id: 'SIAM_PARAGON', label: 'พารากอน ฮอลล์ (Paragon Hall)' },
  { id: 'ICONSIAM', label: 'ทรู ไอคอน ฮอลล์ (ICONSIAM)' },
];

type ServerProps = { initialEvents?: EventItem[]; initialCounts?: { query: string; province: string; counts: DiscoverCounts } };

function FairsPageContent({ initialEvents, initialCounts }: ServerProps) {
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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  // What the member joined comes from the account; this keeps the page in step with it
  const myActivity = useMyActivity();
  React.useEffect(() => {
    if (myActivity.isLoaded) setJoinedEventIds(myActivity.joinedIds);
  }, [myActivity.isLoaded, myActivity.joinedIds]);
  const [eventsList, setEventsList] = useState<EventItem[]>(initialEvents ?? MOCK_EVENTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync viewMode from localStorage
  React.useEffect(() => {
    try {
      const savedMode = localStorage.getItem('chill_view_mode') as ViewMode;
      if (savedMode === 'grid' || savedMode === 'list') {
        setViewMode(savedMode);
      }
    } catch {}
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('chill_view_mode', mode);
    } catch {}
  };

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

  // Fetch live approved events from server (unless the server page already sent them)
  React.useEffect(() => {
    if (initialEvents) return;
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
  }, [initialEvents]);

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

      // Category Rail Filter (1 Card = 1 Category)
      if (selectedCategory && selectedCategory !== 'all') {
        if (getFairEventCategory(ev) !== selectedCategory) return false;
      }

      if (!eventInProvince(ev, selectedProvince)) return false;

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

      if (!matchesQuery(fairSearchText(ev), searchQuery)) return false;
      return true;
    });
  }, [eventsList, statusFilter, selectedCategory, selectedProvince, selectedVenue, priceFilter, sortBy, favorites, searchQuery, customStartDate, customEndDate]);

  // Dynamic fair counts (supports selectedVenue filter context)
  const fairCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const baseFairs = eventsList.filter((ev) => {
      if (ev.eventType !== 'public_venue') return false;
      if (statusFilter === 'upcoming' && isEventEnded(ev)) return false;
      if (statusFilter === 'ended' && !isEventEnded(ev)) return false;
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
      return true;
    });

    counts['all'] = baseFairs.length;
    for (const cat of NATIONWIDE_FAIR_CATEGORIES) {
      counts[cat.id] = baseFairs.filter((ev) => getFairEventCategory(ev) === cat.id).length;
    }
    return counts;
  }, [eventsList, statusFilter, selectedVenue]);

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
        searchSlot={
          <DiscoverSearch
            idPrefix="discover-top"
            kind="fairs"
            query={searchQuery}
            onQueryChange={(q) => {
              setSearchQuery(q);
              setCurrentPage(1);
            }}
            province={selectedProvince}
            onProvinceChange={(p) => {
              setSelectedProvince(p);
              setCurrentPage(1);
            }}
          />
        }
      />

      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:pb-12 space-y-6">
        
        <DiscoverHeader
          kind="fairs"
          query={searchQuery}
          onQueryChange={(q) => {
            setSearchQuery(q);
            setCurrentPage(1);
          }}
          province={selectedProvince}
          onProvinceChange={(p) => {
            setSelectedProvince(p);
            setCurrentPage(1);
          }}
          initialCounts={initialCounts}
          action={
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
              aria-label="เพิ่มงานแฟร์"
              title="เพิ่มงานแฟร์"
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:w-auto sm:px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold whitespace-nowrap cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
              <span className="hidden sm:inline">เพิ่มงานแฟร์</span>
            </button>
          }
          summary={
            <>
              พบ <span className="font-semibold text-slate-900 tabular-nums">{filteredEvents.length}</span> งาน
              {(searchQuery || selectedCategory || selectedProvince !== 'all' || selectedVenue !== 'all' || customStartDate || priceFilter !== 'all' || sortBy === 'favorites' || statusFilter !== 'upcoming') && (
                <button type="button" onClick={handleResetAll} className="ml-3 font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer">
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </>
          }
          tools={
            <>
              <ViewModeToggle viewMode={viewMode} onChange={handleViewModeChange} />
            </>
          }
        >
          {/* Filters as pills: one row that scrolls on phones */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <button type="button" onClick={() => setIsDatePickerOpen(true)} className={filterPillClass('fairs', Boolean(customStartDate))}>
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>{customStartDate ? (customStartDate === customEndDate ? customStartDate : `${customStartDate} - ${customEndDate}`) : 'ช่วงไหนก็ได้'}</span>
            </button>
            {customStartDate && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setCurrentPage(1);
                }}
                aria-label="ล้างวันที่เลือก"
                className="-ml-1 w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <FilterSelect
              kind="fairs"
              label="สถานที่จัด"
              value={selectedVenue}
              emptyValue="all"
              onChange={(v) => {
                setSelectedVenue(v);
                setCurrentPage(1);
              }}
            >
              {VENUE_FILTERS.map((v) => (
                <option key={v.id} value={v.id}>{v.id === 'all' ? 'ทุกสถานที่' : v.label}</option>
              ))}
            </FilterSelect>
            <button
              type="button"
              onClick={() => {
                setPriceFilter(priceFilter === 'free' ? 'all' : 'free');
                setCurrentPage(1);
              }}
              aria-pressed={priceFilter === 'free'}
              className={filterPillClass('fairs', priceFilter === 'free')}
            >
              เข้าชมฟรี
            </button>
            <FilterSelect
              kind="fairs"
              label="สถานะ"
              value={statusFilter}
              emptyValue="upcoming"
              onChange={(v) => {
                setStatusFilter(v as typeof statusFilter);
                setCurrentPage(1);
              }}
            >
              <option value="upcoming">กำลังจะมาถึง</option>
              <option value="ended">งานที่ผ่านมา</option>
              <option value="all">ทุกสถานะ</option>
            </FilterSelect>
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
              aria-pressed={sortBy === 'favorites'}
              className={filterPillClass('fairs', sortBy === 'favorites')}
            >
              <Heart className={`w-4 h-4 ${sortBy === 'favorites' ? 'fill-current' : ''}`} aria-hidden="true" />
              <span>ที่บันทึกไว้ ({favorites.length})</span>
            </button>
          </div>
        </DiscoverHeader>

        {/* Categories as icon tabs, right above the list */}
        <DiscoverCategoryTabs
          kind="fairs"
          categories={NATIONWIDE_FAIR_CATEGORIES}
          counts={fairCounts}
          selectedId={selectedCategory}
          onSelect={(id) => {
            setSelectedCategory(id);
            setCurrentPage(1);
          }}
        />

        {/* High-Density Exhibitions Grid / List */}
        {filteredEvents.length > 0 ? (
          <>
            <EventGrid
              events={paginatedEvents}
              onSelectEvent={() => {}}
              favorites={isLoggedIn ? favorites : []}
              toggleFavorite={toggleFavorite}
              joinedEventIds={isLoggedIn ? joinedEventIds : []}
              onResetFilters={handleResetAll}
              viewMode={viewMode}
            />

            {/* Standard Pagination */}
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
                  itemUnit="งานมหกรรม"
                />
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


        {/* Venues: below the list so the fairs come first; picking one goes back up to the results */}
        <TopVenuesRail
          selectedVenue={selectedVenue === 'all' ? null : selectedVenue}
          onSelectVenue={(v) => {
            setSelectedVenue(v || 'all');
            setSelectedCategory(null);
            setCurrentPage(1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          eventsList={eventsList}
        />
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
          if (newEvent.approvalStatus === 'pending') {
            showToast(`ส่งข้อมูลงาน "${newEvent.title}" เรียบร้อยแล้ว (รอตรวจสอบและอนุมัติโดยทีมงาน)`);
          } else {
            showToast(`สร้างงานมหกรรม "${newEvent.title}" สำเร็จ`);
          }
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

/** `initialEvents` comes from the server page, so the list is in the HTML search engines read; the browser refreshes it. */
export default function FairsPage(props: ServerProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400 text-sm">กำลังโหลดงานแฟร์ & นิทรรศการ...</div>}>
      <FairsPageContent {...props} />
    </Suspense>
  );
}

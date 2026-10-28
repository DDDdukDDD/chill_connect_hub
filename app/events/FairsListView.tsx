'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Heart, X, Calendar, Plus } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { FairTile } from '@/components/FairTile';
import { ViewModeToggle, ViewMode } from '@/components/ViewModeToggle';
import { ShowMoreButton } from '@/components/discover/ShowMoreButton';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/LazyCreateEventModal';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { useAuth } from '@/lib/useAuth';
import { activityActions, useMyActivity } from '@/lib/useMyActivity';
import { fetchAllContentPages } from '@/lib/contentClient';
import type { EventItem } from '@/data/mockData';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { NATIONWIDE_FAIR_CATEGORIES } from '@/components/FairCategoryRail';
import { DiscoverCategoryTabs } from '@/components/discover/DiscoverCategoryTabs';
import { EventDateList } from '@/components/discover/EventDateList';
import { getFairEventCategory } from '@/data/masterHub';
import { VenueCircles } from '@/components/discover/VenueCircles';
import { useResponsiveItemsPerPage } from '@/lib/useResponsiveItemsPerPage';
import { eventInProvince, fairSearchText, matchesQuery, type DiscoverCounts } from '@/lib/discoverMatch';
import { DiscoverHeader, FilterSelect, filterPillClass } from '@/components/discover/DiscoverHeader';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';
import { useMyInterests } from '@/lib/useMyInterests';
import { Toast } from '@/components/Toast';

// Whole rows of tiles per "แสดงเพิ่มเติม" (2 / 3 / 4 / 6 columns), as on /community
const TILE_BATCH = { mobile: 12, sm: 12, md: 16, lg: 24, xl2: 24, defaultItems: 24 };

// The list runs by date, soonest first: people pick an อีเวนต์ by when they are free; "favorites" narrows it to the saved ones
type SortOption = 'soonest' | 'favorites';

type ServerProps = { initialEvents?: EventItem[]; initialCounts?: { query: string; province: string; counts: DiscoverCounts } };

function FairsPageContent({ initialEvents, initialCounts }: ServerProps) {
  const searchParams = useSearchParams();
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn, isOrganizer, isVenueOwner } = useAuth();
  // The member's own categories from onboarding come first on the tabs, marked (owner 2026-10-23)
  const myInterests = useMyInterests(isLoggedIn);
  const itemsPerPage = useResponsiveItemsPerPage(TILE_BATCH);

  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [selectedProvince, setSelectedProvince] = useState<string>(searchParams.get('province') || 'all');
  const [selectedVenue, setSelectedVenue] = useState<string>(searchParams.get('venue') || 'all');
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'ended' | 'all'>('upcoming');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free'>((searchParams.get('price') as any) || 'all');
  const [sortBy, setSortBy] = useState<SortOption>('soonest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  // Saved อีเวนต์ come from the account, so a heart here shows on the detail page, in My Hub and on every device
  const myActivity = useMyActivity();
  const favorites = isLoggedIn ? myActivity.savedEventIds : [];
  const [eventsList, setEventsList] = useState<EventItem[]>(initialEvents ?? []);
  // Set after mount, so the server HTML and the first browser render show the same tiles
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
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

  // Signing out leaves the saved list for the plain list
  useEffect(() => {
    if (!isLoggedIn) setSortBy((prev) => (prev === 'favorites' ? 'soonest' : prev));
  }, [isLoggedIn]);

  // The page sends only the อีเวนต์ still to come; the ones that are over load once someone asks for them
  const endedLoaded = React.useRef(false);
  React.useEffect(() => {
    if (statusFilter === 'upcoming' || endedLoaded.current) return;
    endedLoaded.current = true;
    fetchAllContentPages<EventItem>('/api/events?type=public_venue&includeEnded=true', 'events')
      .then((all) => all.length > 0 && setEventsList(all))
      .catch(() => {
        endedLoaded.current = false;
      });
  }, [statusFilter]);

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
      setMembershipActionTitle('เพื่อบันทึกอีเวนต์โปรด');
      setPendingAction(`favorite:${eventId}`);
      setIsRequireMembershipOpen(true);
      return;
    }
    const save = !favorites.includes(eventId);
    void activityActions.setSaved('event', eventId, save).then((ok) => {
      if (!ok) showToast('บันทึกไม่สำเร็จ ลองอีกครั้งนะ');
      else showToast(save ? 'บันทึกไว้แล้ว ดูได้ที่ "ที่บันทึกไว้"' : 'เอาออกจากที่บันทึกไว้แล้ว');
    });
  };

  const filteredEvents = useMemo(() => {
    const list = eventsList.filter((ev) => {
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
        else if (
          vLower === 'paragon' &&
          !text.includes('paragon') &&
          !text.includes('พารากอน') &&
          !text.includes('iconsiam') &&
          !text.includes('ไอคอนสยาม') &&
          !text.includes('สยาม')
        )
          return false;
        else if (vLower === 'bacc' && !text.includes('bacc') && !text.includes('หอศิลป') && !text.includes('เจริญกรุง') && !text.includes('ปทุมวัน'))
          return false;
        else if (vLower === 'park' && !text.includes('สวน') && !text.includes('park') && !text.includes('สนามหลวง')) return false;
        else if (
          vLower === 'regional' &&
          !text.includes('kice') &&
          !text.includes('ขอนแก่น') &&
          !text.includes('cmecc') &&
          !text.includes('เชียงใหม่') &&
          !text.includes('สงขลา') &&
          !text.includes('ภูเก็ต')
        )
          return false;
        else if (!['qsncc', 'bitec', 'impact', 'paragon', 'bacc', 'park', 'regional'].includes(vLower) && !loc.includes(vLower) && !vTag.includes(vLower))
          return false;
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
        const evEnd = parseEventEndDateToTimestamp(ev.endDate || ev.date);
        if (evEnd < filterStartTs || evStart > filterEndTs) return false;
      }

      if (!matchesQuery(fairSearchText(ev), searchQuery)) return false;
      return true;
    });

    // By date: what is on now and soonest first; for ended อีเวนต์ the latest first
    if (statusFilter === 'ended') return [...list].sort((a, b) => parseEventEndDateToTimestamp(b.endDate || b.date) - parseEventEndDateToTimestamp(a.endDate || a.date));
    return [...list].sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date));
  }, [
    eventsList,
    statusFilter,
    selectedCategory,
    selectedProvince,
    selectedVenue,
    priceFilter,
    sortBy,
    favorites,
    searchQuery,
    customStartDate,
    customEndDate,
  ]);

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
        else if (
          vLower === 'paragon' &&
          !text.includes('paragon') &&
          !text.includes('พารากอน') &&
          !text.includes('iconsiam') &&
          !text.includes('ไอคอนสยาม') &&
          !text.includes('สยาม')
        )
          return false;
        else if (vLower === 'bacc' && !text.includes('bacc') && !text.includes('หอศิลป') && !text.includes('เจริญกรุง') && !text.includes('ปทุมวัน'))
          return false;
        else if (vLower === 'park' && !text.includes('สวน') && !text.includes('park') && !text.includes('สนามหลวง')) return false;
        else if (
          vLower === 'regional' &&
          !text.includes('kice') &&
          !text.includes('ขอนแก่น') &&
          !text.includes('cmecc') &&
          !text.includes('เชียงใหม่') &&
          !text.includes('สงขลา') &&
          !text.includes('ภูเก็ต')
        )
          return false;
        else if (!['qsncc', 'bitec', 'impact', 'paragon', 'bacc', 'park', 'regional'].includes(vLower) && !loc.includes(vLower) && !vTag.includes(vLower))
          return false;
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
    // "Show more" grows the list: currentPage = how many batches are on screen
    return filteredEvents.slice(0, currentPage * itemsPerPage);
  }, [filteredEvents, currentPage, itemsPerPage]);

  // One อีเวนต์ tile for the card grid and the list view's "กำลังจัดอยู่ตอนนี้" strip, so both views look the same
  const tileFor = (event: EventItem) => (
    <FairTile event={event} now={now} isSaved={isLoggedIn && favorites.includes(event.id)} onToggleSave={toggleFavorite} />
  );

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedProvince('all');
    setSelectedVenue('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setStatusFilter('upcoming');
    setPriceFilter('all');
    setSortBy('soonest');
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
          lead={
            <VenueCircles
              selected={selectedVenue}
              onSelect={(v) => {
                setSelectedVenue(v ?? 'all');
                setSelectedCategory(null);
                setCurrentPage(1);
              }}
            />
          }
          // Only approved organizers and venue owners may add an อีเวนต์ (the server checks the same), so only they see it
          action={
            isLoggedIn && (isOrganizer || isVenueOwner) && <button
              type="button"
              onClick={() => setIsCreateEventModalOpen(true)}
              aria-label="เพิ่มอีเวนต์"
              title="เพิ่มอีเวนต์"
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:w-auto sm:px-4 rounded-full bg-[#2B527A] hover:bg-[#1F3D5C] text-white text-[13px] font-semibold whitespace-nowrap cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
              <span className="hidden sm:inline">เพิ่มอีเวนต์</span>
            </button>
          }
          summary={
            (searchQuery ||
              selectedCategory ||
              selectedProvince !== 'all' ||
              selectedVenue !== 'all' ||
              customStartDate ||
              priceFilter !== 'all' ||
              sortBy === 'favorites' ||
              statusFilter !== 'upcoming') && (
              <button type="button" onClick={handleResetAll} className="font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer">
                ล้างตัวกรองทั้งหมด
              </button>
            )
          }
          tools={
            <>
              {/* Saved list sits with the view tools; on phones only the heart and count */}
              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    setMembershipActionTitle('เพื่อดูรายการอีเวนต์ที่บันทึกไว้');
                    setPendingAction('favorites_filter');
                    setIsRequireMembershipOpen(true);
                    return;
                  }
                  setSortBy(sortBy === 'favorites' ? 'soonest' : 'favorites');
                  setCurrentPage(1);
                }}
                aria-pressed={sortBy === 'favorites'}
                aria-label={`ที่บันทึกไว้ (${favorites.length})`}
                className={filterPillClass('fairs', sortBy === 'favorites')}
              >
                <Heart className={`w-4 h-4 ${sortBy === 'favorites' ? 'fill-current' : ''}`} aria-hidden="true" />
                <span className="hidden sm:inline">ที่บันทึกไว้ ({favorites.length})</span>
                <span className="sm:hidden tabular-nums">{favorites.length}</span>
              </button>
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
          </div>
        </DiscoverHeader>

        {/* Categories as icon tabs, right above the list */}
        <DiscoverCategoryTabs
          kind="fairs"
          categories={NATIONWIDE_FAIR_CATEGORIES}
          counts={fairCounts}
          mineIds={myInterests.fairCategories}
          selectedId={selectedCategory}
          onSelect={(id) => {
            setSelectedCategory(id);
            setCurrentPage(1);
          }}
        />

        {/* High-Density Exhibitions Grid / List */}
        {filteredEvents.length > 0 ? (
          <>
            {/* The list view is dated, like /challenges: on now on top, then by month */}
            {viewMode === 'list' ? (
              <EventDateList kind="fairs" events={filteredEvents} renderTile={tileFor} />
            ) : (
              // The ตี้ grid and tile shape, so switching tabs feels like one page; posters show whole (owner 2026-10-27)
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-8 pt-1">
                {paginatedEvents.map((event) => (
                  <li key={event.id}>{tileFor(event)}</li>
                ))}
              </ul>
            )}

            {/* Show more, Meetup-style */}
            {viewMode === 'grid' && filteredEvents.length > itemsPerPage && (
              <ShowMoreButton shown={paginatedEvents.length} total={filteredEvents.length} onClick={() => setCurrentPage(currentPage + 1)} />
            )}
          </>
        ) : (
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200 flex items-center justify-between gap-4 text-left">
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">ไม่พบอีเวนต์ตามเงื่อนไขที่เลือก</h3>
              <p className="text-[11px] text-slate-500">ลองปรับเปลี่ยนคำค้นหา หรือเลือกศูนย์การประชุมและช่วงเวลาอื่น</p>
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
          if (newEvent.approvalStatus === 'pending') {
            showToast(`ส่งข้อมูลงาน "${newEvent.title}" เรียบร้อยแล้ว (รอตรวจสอบและอนุมัติโดยทีมงาน)`);
          } else {
            showToast(`สร้างอีเวนต์ "${newEvent.title}" สำเร็จ`);
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
          setSortBy('soonest');
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />

      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} favoritesCount={favorites.length} />

      <Toast message={toastMessage} />
    </div>
  );
}

/** `initialEvents` comes from the server page, so the list is in the HTML search engines read; the browser refreshes it. */
export default function FairsPage(props: ServerProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400 text-sm">กำลังโหลดอีเวนต์...</div>}>
      <FairsPageContent {...props} />
    </Suspense>
  );
}

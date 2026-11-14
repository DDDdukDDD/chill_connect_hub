'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOwnProvinceDefault } from '@/lib/useOwnProvince';
import { Heart, Plus } from 'lucide-react';
import { isClosedToJoin, isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { EmptyResults } from '@/components/discover/EmptyResults';
import { MeetupTile } from '@/components/MeetupTile';
import { SponsoredBadge } from '@/components/SponsoredBadge';
import { withSponsored } from '@/lib/sponsored/types';
import { ViewModeToggle, ViewMode } from '@/components/ViewModeToggle';
import { ShowMoreButton } from '@/components/discover/ShowMoreButton';
import { useShownBatches } from '@/lib/useShownBatches';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { DiscoverCategoryTabs } from '@/components/discover/DiscoverCategoryTabs';
import { EventDateList } from '@/components/discover/EventDateList';
import { getCommunityEventCategory } from '@/data/masterHub';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/LazyCreateEventModal';
import { useAuth } from '@/lib/useAuth';
import { activityActions, useMyActivity } from '@/lib/useMyActivity';
import { fetchAllContentPages } from '@/lib/contentClient';
import { useResponsiveItemsPerPage } from '@/lib/useResponsiveItemsPerPage';
import type { EventItem } from '@/data/mockData';
import { ONLINE, eventInProvince, matchesQuery, meetupSearchText, type DiscoverCounts } from '@/lib/discoverMatch';
import { DiscoverHeader, filterPillClass } from '@/components/discover/DiscoverHeader';
import { ActiveChip, ChoiceGroup, DATE_CHOICES, FilterButton, FilterSheet, QuickChip, datePresetOf, datePresetRange, dateRangeLabel, type DatePreset } from '@/components/discover/FilterControls';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';
import { useMyInterests } from '@/lib/useMyInterests';
import { Toast } from '@/components/Toast';

// Whole rows of the landing's tiles per "แสดงเพิ่มเติม" (2 / 3 / 4 / 6 columns), as on /challenges
const TILE_BATCH = { mobile: 12, sm: 12, md: 16, lg: 24, xl2: 24, defaultItems: 24 };

// The list runs by date, soonest first: people pick a ตี้ by when they are free; "favorites" narrows it to the saved ones
type SortOption = 'soonest' | 'favorites';

type ServerProps = { initialEvents?: EventItem[]; initialCounts?: { query: string; province: string; counts: DiscoverCounts }; sponsoredId?: string | null };

function CommunityPageContent({ initialEvents, initialCounts, sponsoredId = null }: ServerProps) {
  const searchParams = useSearchParams();
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  // The member's own categories from onboarding come first on the tabs, marked (owner 2026-10-23)
  const myInterests = useMyInterests(isLoggedIn);
  const itemsPerPage = useResponsiveItemsPerPage(TILE_BATCH);

  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedProvince, setSelectedProvince] = useState<string>(searchParams.get('province') || 'all');
  useOwnProvinceDefault(searchParams.get('province'), selectedProvince, setSelectedProvince);
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'ended' | 'all'>('upcoming');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free'>((searchParams.get('price') as any) || 'all');
  // "มีที่ว่าง": only meetups with seats left (the home page links here with seats=open)
  const [openOnly, setOpenOnly] = useState(searchParams.get('seats') === 'open');
  const [sortBy, setSortBy] = useState<SortOption>('soonest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useShownBatches();
  // Saved and joined ตี้ come from the account, so a heart here shows in My Hub and on every device
  const myActivity = useMyActivity();
  const favorites = isLoggedIn ? myActivity.savedEventIds : [];
  const joinedEventIds = isLoggedIn ? myActivity.joinedIds : [];
  const [eventsList, setEventsList] = useState<EventItem[]>(initialEvents ?? []);
  // Set after mount, so the server HTML and the first browser render show the same day labels
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

  // The page sends only the ตี้ still to come (fresh per request); the ones that are over load once someone asks for them
  const endedLoaded = React.useRef(false);
  React.useEffect(() => {
    if (statusFilter === 'upcoming' || endedLoaded.current) return;
    endedLoaded.current = true;
    fetchAllContentPages<EventItem>('/api/events?type=community&includeEnded=true', 'events')
      .then((all) => all.length > 0 && setEventsList(all))
      .catch(() => {
        endedLoaded.current = false;
      });
  }, [statusFilter]);

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
      setMembershipActionTitle('เพื่อบันทึกตี้ที่ชอบ');
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

  // Every filter except the category tab: the tab counts and the cards both start here, so the numbers match the cards
  const matchingTees = useMemo(() => {
    return eventsList.filter((ev) => {
      if ((ev.eventType || 'community') !== 'community') return false;

      // Status Filter (Upcoming / Ended / All)
      const ended = isEventEnded(ev);
      if (statusFilter === 'upcoming' && isClosedToJoin(ev)) return false;
      if (statusFilter === 'ended' && !ended) return false;
      if (openOnly && ev.participantsCount >= ev.maxParticipants) return false;

      if (!eventInProvince(ev, selectedProvince)) return false;

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

      if (!matchesQuery(meetupSearchText(ev), searchQuery)) return false;
      return true;
    });
  }, [eventsList, statusFilter, openOnly, selectedProvince, priceFilter, sortBy, favorites, searchQuery, customStartDate, customEndDate]);

  const filteredEvents = useMemo(() => {
    const cat = selectedCategory;
    const list =
      cat === 'all'
        ? matchingTees
        : matchingTees.filter((ev) => (cat === 'heal' || cat === 'move' || cat === 'chill' || cat === 'learn' ? ev.category === cat : getCommunityEventCategory(ev) === cat));

    // By date: soonest first, and for ended ตี้ the latest first
    const byDate = statusFilter === 'ended' ? -1 : 1;
    return [...list].sort((a, b) => {
      // Full ตี้ come after the ones people can still join, whatever the order (owner 2026-10-24)
      const fullA = a.status === 'full' || a.participantsCount >= a.maxParticipants;
      const fullB = b.status === 'full' || b.participantsCount >= b.maxParticipants;
      if (fullA !== fullB) return fullA ? 1 : -1;
      return byDate * (parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date));
    });
  }, [matchingTees, selectedCategory, statusFilter]);

  // How many ตี้ each category tab would show with the other filters as they are (owner 2026-11-08)
  const categoryEventCounts = useMemo(() => {
    const counts: Record<string, number> = { all: matchingTees.length };
    COMMUNITY_LIFESTYLE_CATEGORIES.forEach((cat) => {
      counts[cat.id] = matchingTees.filter((ev) => getCommunityEventCategory(ev) === cat.id).length;
    });
    return counts;
  }, [matchingTees]);

  const paginatedEvents = useMemo(() => {
    // "Show more" grows the list: currentPage = how many batches are on screen
    // A sponsored ตี้ that fits the filters takes the third card (lib/sponsored)
    return withSponsored(filteredEvents, filteredEvents.find((event) => event.id === sponsoredId)).slice(0, currentPage * itemsPerPage);
  }, [filteredEvents, sponsoredId, currentPage, itemsPerPage]);

  const openCreate = () => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อตั้งตี้ใหม่');
      setPendingAction('create');
      setIsRequireMembershipOpen(true);
    } else {
      setIsCreateEventModalOpen(true);
    }
  };

  // /community?create=1 (from the host challenge) opens the create dialog once sign-in is known
  const createFromLink = useRef(searchParams.get('create') === '1');
  useEffect(() => {
    if (!createFromLink.current || !isAuthReady) return;
    createFromLink.current = false;
    openCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady]);

  // One ตี้ tile for the card grid and the list view's "สัปดาห์นี้" strip, so both views look the same
  const tileFor = (event: EventItem, sponsored = false) => (
    <MeetupTile
      event={event}
      sponsored={sponsored}
      now={now}
      showHost
      isSaved={isLoggedIn && favorites.includes(event.id)}
      onToggleSave={toggleFavorite}
      isJoined={isLoggedIn && joinedEventIds.includes(event.id)}
    />
  );

  // The sheet's filters (owner 2026-11-07): the date, seats, price, online and past ตี้; categories and the search stay outside
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const datePreset = datePresetOf(customStartDate, customEndDate);
  const sheetCount = [Boolean(customStartDate), openOnly, priceFilter !== 'all', selectedProvince === ONLINE, statusFilter !== 'upcoming'].filter(Boolean).length;
  const setDates = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setCurrentPage(1);
  };
  const chooseDate = (preset: DatePreset) => {
    if (preset === 'any') return setDates('', '');
    if (preset === 'custom') {
      setIsFilterOpen(false);
      return setIsDatePickerOpen(true);
    }
    setDates(...datePresetRange(preset));
  };
  const resetSheet = () => {
    setDates('', '');
    setOpenOnly(false);
    setPriceFilter('all');
    if (selectedProvince === ONLINE) setSelectedProvince('all');
    setStatusFilter('upcoming');
  };

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedProvince('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setStatusFilter('upcoming');
    setPriceFilter('all');
    setOpenOnly(false);
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
        onOpenCreateEvent={openCreate}
        searchSlot={
          <DiscoverSearch
            idPrefix="discover-top"
            kind="meetups"
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

      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 xl:pb-12 space-y-6">
        <DiscoverHeader
          kind="meetups"
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
          // Shown to members only: a visitor's job here is to find something to join (owner 2026-10-25)
          action={
            isLoggedIn && <button
              type="button"
              onClick={openCreate}
              aria-label="ตั้งตี้เอง"
              title="ตั้งตี้เอง"
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:w-auto sm:px-4 rounded-full bg-[#F26430] hover:bg-[#E2551F] text-white text-[13px] font-semibold whitespace-nowrap cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
              <span className="hidden sm:inline">ตั้งตี้เอง</span>
            </button>
          }
          summary={
            (searchQuery ||
              selectedCategory !== 'all' ||
              customStartDate ||
              priceFilter !== 'all' ||
              openOnly ||
              sortBy !== 'soonest' ||
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
                    setMembershipActionTitle('เพื่อดูตี้ที่บันทึกไว้');
                    setPendingAction('favorites');
                    setIsRequireMembershipOpen(true);
                    return;
                  }
                  setSortBy(sortBy === 'favorites' ? 'soonest' : 'favorites');
                  setCurrentPage(1);
                }}
                aria-pressed={sortBy === 'favorites'}
                aria-label={`ที่บันทึกไว้ (${favorites.length})`}
                className={filterPillClass('meetups', sortBy === 'favorites')}
              >
                <Heart className={`w-4 h-4 ${sortBy === 'favorites' ? 'fill-current' : ''}`} aria-hidden="true" />
                <span className="hidden sm:inline">ที่บันทึกไว้ ({favorites.length})</span>
                <span className="sm:hidden tabular-nums">{favorites.length}</span>
              </button>
              <ViewModeToggle viewMode={viewMode} onChange={handleViewModeChange} />
            </>
          }
        >
          {/* ตัวกรอง, the two filters people use most, then a chip for each filter set in the sheet; one row that scrolls on phones */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <FilterButton kind="meetups" count={sheetCount} onClick={() => setIsFilterOpen(true)} />
            <QuickChip kind="meetups" on={datePreset === 'weekend'} onToggle={() => chooseDate(datePreset === 'weekend' ? 'any' : 'weekend')}>สุดสัปดาห์นี้</QuickChip>
            <QuickChip kind="meetups" on={openOnly} onToggle={() => { setOpenOnly(!openOnly); setCurrentPage(1); }}>ยังมีที่ว่าง</QuickChip>
            {customStartDate && datePreset !== 'weekend' && <ActiveChip kind="meetups" label={dateRangeLabel(customStartDate, customEndDate)} onClear={() => setDates('', '')} />}
            {priceFilter === 'free' && <ActiveChip kind="meetups" label="เข้าร่วมฟรี" onClear={() => { setPriceFilter('all'); setCurrentPage(1); }} />}
            {selectedProvince === ONLINE && <ActiveChip kind="meetups" label="ออนไลน์" onClear={() => { setSelectedProvince('all'); setCurrentPage(1); }} />}
            {statusFilter !== 'upcoming' && <ActiveChip kind="meetups" label={statusFilter === 'ended' ? 'ที่ผ่านมาแล้ว' : 'ทุกสถานะ'} onClear={() => { setStatusFilter('upcoming'); setCurrentPage(1); }} />}
          </div>
        </DiscoverHeader>

        {/* Categories as icon tabs, right above the list */}
        <DiscoverCategoryTabs
          kind="meetups"
          categories={COMMUNITY_LIFESTYLE_CATEGORIES}
          counts={categoryEventCounts}
          mineIds={myInterests.communityCategories}
          selectedId={selectedCategory === 'all' ? null : selectedCategory}
          onSelect={(id) => {
            setSelectedCategory(id || 'all');
            setCurrentPage(1);
          }}
        />

        {/* High-Density Community Events Grid / List */}
        {/* The list view is dated, like /challenges: this week on top, then by month */}
        {viewMode === 'list' && filteredEvents.length > 0 ? (
          <EventDateList kind="meetups" events={filteredEvents} />
        ) : paginatedEvents.length > 0 ? (
          // The landing's tiles at the landing's widths, plus a line for host, rating and price (owner 2026-10-27)
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-8 pt-1">
            {paginatedEvents.map((event) => (
              <li key={event.id}>{tileFor(event, event.id === sponsoredId)}</li>
            ))}
          </ul>
        ) : (
          <EmptyResults isFavoritesOnly={sortBy === 'favorites'} onReset={handleResetAll} />
        )}

        {viewMode === 'grid' && filteredEvents.length > itemsPerPage && (
          <ShowMoreButton shown={paginatedEvents.length} total={filteredEvents.length} onClick={() => setCurrentPage(currentPage + 1)} />
        )}
        {/* A visitor learns they can start one too, once they have looked through the list, not on top of it */}
        {isAuthReady && !isLoggedIn && filteredEvents.length > 0 && (
          <p className="pt-2 text-center text-sm text-slate-600">
            ไม่เจอที่ชอบ?{' '}
            <button type="button" onClick={openCreate} className="font-semibold text-[#C2410C] hover:underline underline-offset-4 cursor-pointer">
              ตั้งตี้เองเลย
            </button>
          </p>
        )}
      </main>

      {isFilterOpen && (
        <FilterSheet onClose={() => setIsFilterOpen(false)} onReset={resetSheet} canReset={sheetCount > 0} resultLabel={`ดู ${filteredEvents.length.toLocaleString()} ตี้`}>
          <ChoiceGroup kind="meetups" title="วันไหน" options={DATE_CHOICES} value={datePreset} onChange={chooseDate} />
          <ChoiceGroup kind="meetups" title="ที่ว่าง" options={[['ทั้งหมด', 'all'], ['ยังมีที่ว่าง', 'open']]} value={openOnly ? 'open' : 'all'} onChange={(v) => { setOpenOnly(v === 'open'); setCurrentPage(1); }} />
          <ChoiceGroup kind="meetups" title="ค่าเข้าร่วม" options={[['ทั้งหมด', 'all'], ['ฟรี', 'free']]} value={priceFilter} onChange={(v) => { setPriceFilter(v); setCurrentPage(1); }} />
          <ChoiceGroup
            kind="meetups"
            title="แบบไหน"
            options={[['เจอกันตัวจริง', 'place'], ['ออนไลน์', 'online']]}
            value={selectedProvince === ONLINE ? 'online' : 'place'}
            onChange={(v) => { setSelectedProvince(v === 'online' ? ONLINE : selectedProvince === ONLINE ? 'all' : selectedProvince); setCurrentPage(1); }}
          />
          <ChoiceGroup kind="meetups" title="สถานะ" options={[['กำลังจะมาถึง', 'upcoming'], ['ที่ผ่านมาแล้ว', 'ended'], ['ทุกสถานะ', 'all']]} value={statusFilter} onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }} />
        </FilterSheet>
      )}

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
          if (newEvent.approvalStatus === 'pending') {
            showToast(`ส่งข้อมูล "${newEvent.title}" เรียบร้อยแล้ว (รอตรวจสอบและอนุมัติโดยทีมงาน)`);
          } else {
            showToast(`ตั้งตี้ "${newEvent.title}" แล้ว รอเพื่อนๆ มาจอยได้เลย`);
          }
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
            // The account is known a moment after sign-in; then the heart goes to it
            setTimeout(() => {
              void activityActions.setSaved('event', evId, true).then((ok) => ok && showToast('บันทึกไว้แล้ว ดูได้ที่ "ที่บันทึกไว้"'));
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
          setSortBy('soonest'); // Not stuck on an empty saved list
          setIsCreateEventModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />

      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} />

      <Toast message={toastMessage} />
    </div>
  );
}

/** `initialEvents` comes from the server page, so the list is in the HTML search engines read; the browser refreshes it. */
export default function CommunityPage(props: ServerProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-500 text-sm">กำลังโหลดตี้...</div>}>
      <CommunityPageContent {...props} />
    </Suspense>
  );
}

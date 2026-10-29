'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Heart, X, Calendar, Plus } from 'lucide-react';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { EmptyResults } from '@/components/discover/EmptyResults';
import { MeetupTile } from '@/components/MeetupTile';
import { ViewModeToggle, ViewMode } from '@/components/ViewModeToggle';
import { ShowMoreButton } from '@/components/discover/ShowMoreButton';
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
import { DiscoverHeader, FilterSelect, filterPillClass } from '@/components/discover/DiscoverHeader';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';
import { useMyInterests } from '@/lib/useMyInterests';
import { Toast } from '@/components/Toast';

// Whole rows of the landing's tiles per "แสดงเพิ่มเติม" (2 / 3 / 4 / 6 columns), as on /challenges
const TILE_BATCH = { mobile: 12, sm: 12, md: 16, lg: 24, xl2: 24, defaultItems: 24 };

// The list runs by date, soonest first: people pick a ตี้ by when they are free; "favorites" narrows it to the saved ones
type SortOption = 'soonest' | 'favorites';

type ServerProps = { initialEvents?: EventItem[]; initialCounts?: { query: string; province: string; counts: DiscoverCounts } };

function CommunityPageContent({ initialEvents, initialCounts }: ServerProps) {
  const searchParams = useSearchParams();
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  // The member's own categories from onboarding come first on the tabs, marked (owner 2026-10-23)
  const myInterests = useMyInterests(isLoggedIn);
  const itemsPerPage = useResponsiveItemsPerPage(TILE_BATCH);

  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedProvince, setSelectedProvince] = useState<string>(searchParams.get('province') || 'all');
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'ended' | 'all'>('upcoming');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free'>((searchParams.get('price') as any) || 'all');
  // "มีที่ว่าง": only meetups with seats left (the home page links here with seats=open)
  const [openOnly, setOpenOnly] = useState(searchParams.get('seats') === 'open');
  const [sortBy, setSortBy] = useState<SortOption>('soonest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
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
  const [membershipActionTitle, setMembershipActionTitle] = useState('อีกนิดเดียว ก็ไปต่อได้แล้ว');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (eventId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เก็บตี้นี้ไว้ ไม่ให้พลาด');
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
      if ((ev.eventType || 'community') !== 'community') return false;

      // Status Filter (Upcoming / Ended / All)
      const ended = isEventEnded(ev);
      if (statusFilter === 'upcoming' && ended) return false;
      if (statusFilter === 'ended' && !ended) return false;
      if (openOnly && ev.participantsCount >= ev.maxParticipants) return false;

      if (selectedCategory !== 'all') {
        const cat = selectedCategory;
        if (cat === 'heal' || cat === 'move' || cat === 'chill' || cat === 'learn') {
          if (ev.category !== cat) return false;
        } else {
          if (getCommunityEventCategory(ev) !== cat) return false;
        }
      }

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

    // By date: soonest first, and for ended ตี้ the latest first
    const byDate = statusFilter === 'ended' ? -1 : 1;
    return [...list].sort((a, b) => {
      // Full ตี้ come after the ones people can still join, whatever the order (owner 2026-10-24)
      const fullA = a.status === 'full' || a.participantsCount >= a.maxParticipants;
      const fullB = b.status === 'full' || b.participantsCount >= b.maxParticipants;
      if (fullA !== fullB) return fullA ? 1 : -1;
      return byDate * (parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date));
    });
  }, [
    eventsList,
    statusFilter,
    openOnly,
    selectedCategory,
    selectedProvince,
    priceFilter,
    sortBy,
    favorites,
    searchQuery,
    customStartDate,
    customEndDate,
  ]);

  // How many ตี้ each category tab holds, under the status and seat filters
  const categoryEventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const communityEvents = eventsList.filter((event) => {
      if ((event.eventType || 'community') !== 'community') return false;
      if (statusFilter === 'upcoming' && isEventEnded(event)) return false;
      if (statusFilter === 'ended' && !isEventEnded(event)) return false;
      if (openOnly && event.participantsCount >= event.maxParticipants) return false;

      return true;
    });

    counts['all'] = communityEvents.length;
    COMMUNITY_LIFESTYLE_CATEGORIES.forEach((cat) => {
      counts[cat.id] = communityEvents.filter((ev) => getCommunityEventCategory(ev) === cat.id).length;
    });

    return counts;
  }, [eventsList, statusFilter, openOnly]);

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

  const openCreate = () => {
    if (!isLoggedIn) {
      setMembershipActionTitle('ชวนคนมาออกไปด้วยกัน ตั้งตี้ของคุณเลย');
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
  const tileFor = (event: EventItem) => (
    <MeetupTile
      event={event}
      now={now}
      showHost
      isSaved={isLoggedIn && favorites.includes(event.id)}
      onToggleSave={toggleFavorite}
      isJoined={isLoggedIn && joinedEventIds.includes(event.id)}
    />
  );

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

      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:pb-12 space-y-6">
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
              selectedProvince !== 'all' ||
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
                    setMembershipActionTitle('ทุกตี้ที่คุณเก็บไว้ รออยู่ตรงนี้');
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
          {/* Filters as pills: one row that scrolls on phones */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <button type="button" onClick={() => setIsDatePickerOpen(true)} className={filterPillClass('meetups', Boolean(customStartDate))}>
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>{customStartDate ? (customStartDate === customEndDate ? customStartDate : `${customStartDate} - ${customEndDate}`) : 'วันไหนก็ได้'}</span>
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
                setOpenOnly(!openOnly);
                setCurrentPage(1);
              }}
              aria-pressed={openOnly}
              className={filterPillClass('meetups', openOnly)}
            >
              ยังมีที่ว่าง
            </button>
            <button
              type="button"
              onClick={() => {
                setPriceFilter(priceFilter === 'free' ? 'all' : 'free');
                setCurrentPage(1);
              }}
              aria-pressed={priceFilter === 'free'}
              className={filterPillClass('meetups', priceFilter === 'free')}
            >
              เข้าร่วมฟรี
            </button>
            {/* The same choice as "ออนไลน์" in the province menu, one tap away */}
            <button
              type="button"
              onClick={() => {
                setSelectedProvince(selectedProvince === ONLINE ? 'all' : ONLINE);
                setCurrentPage(1);
              }}
              aria-pressed={selectedProvince === ONLINE}
              className={filterPillClass('meetups', selectedProvince === ONLINE)}
            >
              ออนไลน์
            </button>
            <FilterSelect
              kind="meetups"
              label="สถานะ"
              value={statusFilter}
              emptyValue="upcoming"
              onChange={(v) => {
                setStatusFilter(v as typeof statusFilter);
                setCurrentPage(1);
              }}
            >
              <option value="upcoming">กำลังจะมาถึง</option>
              <option value="ended">ที่ผ่านมาแล้ว</option>
              <option value="all">ทุกสถานะ</option>
            </FilterSelect>
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
          <EventDateList kind="meetups" events={filteredEvents} renderTile={tileFor} />
        ) : paginatedEvents.length > 0 ? (
          // The landing's tiles at the landing's widths, plus a line for host, rating and price (owner 2026-10-27)
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-8 pt-1">
            {paginatedEvents.map((event) => (
              <li key={event.id}>{tileFor(event)}</li>
            ))}
          </ul>
        ) : (
          <EmptyResults isFavoritesOnly={sortBy === 'favorites'} onReset={handleResetAll} />
        )}

        {viewMode === 'grid' && filteredEvents.length > itemsPerPage && (
          <ShowMoreButton shown={paginatedEvents.length} total={filteredEvents.length} onClick={() => setCurrentPage(currentPage + 1)} />
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

      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} favoritesCount={favorites.length} />

      <Toast message={toastMessage} />
    </div>
  );
}

/** `initialEvents` comes from the server page, so the list is in the HTML search engines read; the browser refreshes it. */
export default function CommunityPage(props: ServerProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400 text-sm">กำลังโหลดตี้...</div>}>
      <CommunityPageContent {...props} />
    </Suspense>
  );
}

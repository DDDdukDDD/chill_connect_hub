'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, Heart, X, Calendar, LocateFixed, Loader2, CheckCircle2, Plus } from 'lucide-react';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { EventGrid } from '@/components/EventGrid';
import { ViewModeToggle, ViewMode } from '@/components/ViewModeToggle';
import { Pagination } from '@/components/Pagination';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { DiscoverCategoryTabs } from '@/components/discover/DiscoverCategoryTabs';
import { EventDateList } from '@/components/discover/EventDateList';
import { TopCommunityRail, TOP_COMMUNITY_CLUBS } from '@/components/TopCommunityRail';
import { getCommunityEventCategory } from '@/data/masterHub';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { useAuth } from '@/lib/useAuth';
import { useMyActivity } from '@/lib/useMyActivity';
import { fetchAllContentPages } from '@/lib/contentClient';
import { useResponsiveItemsPerPage } from '@/lib/useResponsiveItemsPerPage';
import { MOCK_EVENTS, EventItem } from '@/data/mockData';
import {} from '@/data/spotsData';
import { eventInProvince, matchesQuery, meetupSearchText, type DiscoverCounts } from '@/lib/discoverMatch';
import { DiscoverHeader, FilterSelect, filterPillClass } from '@/components/discover/DiscoverHeader';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';

type SortOption = 'newest' | 'popular' | 'soonest' | 'favorites';
type VibeFilter = 'all' | 'solo' | 'free' | 'pets' | 'beginners' | 'soon';

type ServerProps = { initialEvents?: EventItem[]; initialCounts?: { query: string; province: string; counts: DiscoverCounts } };

function CommunityPageContent({ initialEvents, initialCounts }: ServerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const itemsPerPage = useResponsiveItemsPerPage();

  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedClub, setSelectedClub] = useState<string | null>(searchParams.get('club') || null);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedProvince, setSelectedProvince] = useState<string>(searchParams.get('province') || 'all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'tomorrow' | 'weekend' | 'custom'>('all');
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'ended' | 'all'>('upcoming');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free'>((searchParams.get('price') as any) || 'all');
  // "มีที่ว่าง": only meetups with seats left (the home page links here with seats=open)
  const [openOnly, setOpenOnly] = useState(searchParams.get('seats') === 'open');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [activeVibeFilter, setActiveVibeFilter] = useState<VibeFilter>('all');
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
        const communityEvents = await fetchAllContentPages<EventItem>('/api/events?type=community', 'events');
        if (communityEvents.length > 0) baseList = communityEvents;
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
      if (openOnly && ev.participantsCount >= ev.maxParticipants) return false;

      const eventText = `${ev.title} ${ev.description || ''} ${ev.tag || ''} ${ev.location || ''} ${ev.hostName || ''} ${ev.province || ''}`.toLowerCase();

      // Filter by selected community club if active
      if (selectedClub && selectedClub !== 'all') {
        const clubDef = TOP_COMMUNITY_CLUBS.find((c) => c.clubKey === selectedClub);
        if (clubDef) {
          const eventText =
            `${ev.title} ${ev.description || ''} ${ev.tag || ''} ${ev.badgeText || ''} ${ev.location} ${ev.hostName || ''} ${ev.category || ''} ${ev.zone || ''}`.toLowerCase();
          const matches = clubDef.keywords.some((kw) => eventText.includes(kw.toLowerCase()));
          if (!matches) return false;
        }
      }

      if (selectedCategory !== 'all') {
        const cat = selectedCategory;
        if (cat === 'heal' || cat === 'move' || cat === 'chill' || cat === 'learn') {
          if (ev.category !== cat) return false;
        } else {
          if (getCommunityEventCategory(ev) !== cat) return false;
        }
      }

      if (!eventInProvince(ev, selectedProvince)) return false;

      const isOnlineEv =
        ev.province === 'ออนไลน์' || ev.locationType === 'online' || ev.location?.includes('ออนไลน์') || ev.location?.toLowerCase().includes('online');

      // Quick Vibe Filter Chips (Agoda / Airbnb style curation)
      if (activeVibeFilter === 'solo') {
        if (isOnlineEv) return false;
        const isExplicit = ev.isSoloFriendly;
        const isSolo =
          isExplicit !== undefined
            ? isExplicit
            : eventText.includes('คนเดียว') ||
              eventText.includes('เพื่อนใหม่') ||
              eventText.includes('จิบกาแฟ') ||
              eventText.includes('บอร์ดเกม') ||
              eventText.includes('cafe') ||
              eventText.includes('คาเฟ่') ||
              eventText.includes('introvert') ||
              eventText.includes('หนังสือ') ||
              ev.category === 'chill' ||
              ev.category === 'learn';
        if (!isSolo) return false;
      } else if (activeVibeFilter === 'free') {
        if (!ev.price || !ev.price.includes('ฟรี')) return false;
      } else if (activeVibeFilter === 'pets') {
        if (isOnlineEv) return false;
        const isExplicit = ev.isPetFriendly;
        const isPet = isExplicit !== undefined ? isExplicit : ['pet', 'หมา', 'แมว', 'dog', 'cat', 'สัตว์เลี้ยง'].some((k) => eventText.includes(k));
        if (!isPet) return false;
      } else if (activeVibeFilter === 'beginners') {
        const isExplicit = ev.isBeginnerFriendly;
        const isBeginner =
          isExplicit !== undefined
            ? isExplicit
            : ['มือใหม่', 'beginner', 'เวิร์กช็อป', 'workshop', 'ปั้นดิน', 'บอร์ดเกม', 'ชิลล์', 'วิ่งเบาๆ', 'jogging', 'โยคะ', 'yoga'].some((k) =>
                eventText.includes(k),
              ) ||
              ev.category === 'learn' ||
              ev.category === 'chill';
        if (!isBeginner) return false;
      } else if (activeVibeFilter === 'soon') {
        // eslint-disable-next-line react-hooks/purity
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

      if (!matchesQuery(meetupSearchText(ev), searchQuery)) return false;
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
  }, [
    eventsList,
    statusFilter,
    openOnly,
    selectedClub,
    selectedCategory,
    selectedProvince,
    activeVibeFilter,
    priceFilter,
    sortBy,
    favorites,
    searchQuery,
    customStartDate,
    customEndDate,
  ]);

  // Calculate dynamic event counts per lifestyle category (supports selectedClub filter context)
  const categoryEventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const communityEvents = eventsList.filter((event) => {
      if ((event.eventType || 'community') !== 'community') return false;
      if (statusFilter === 'upcoming' && isEventEnded(event)) return false;
      if (statusFilter === 'ended' && !isEventEnded(event)) return false;
      if (openOnly && event.participantsCount >= event.maxParticipants) return false;

      // Filter by selected community club if active
      if (selectedClub && selectedClub !== 'all') {
        const clubDef = TOP_COMMUNITY_CLUBS.find((c) => c.clubKey === selectedClub);
        if (clubDef) {
          const eventText =
            `${event.title} ${event.description || ''} ${event.tag || ''} ${event.badgeText || ''} ${event.location} ${event.hostName || ''} ${event.category || ''} ${event.zone || ''}`.toLowerCase();
          const matches = clubDef.keywords.some((kw) => eventText.includes(kw.toLowerCase()));
          if (!matches) return false;
        }
      }
      return true;
    });

    counts['all'] = communityEvents.length;
    COMMUNITY_LIFESTYLE_CATEGORIES.forEach((cat) => {
      counts[cat.id] = communityEvents.filter((ev) => getCommunityEventCategory(ev) === cat.id).length;
    });

    return counts;
  }, [eventsList, statusFilter, openOnly, selectedClub]);

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

  const openCreate = () => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อเปิดตี้หรือสร้างกิจกรรมใหม่');
      setPendingAction('create');
      setIsRequireMembershipOpen(true);
    } else {
      setIsCreateEventModalOpen(true);
    }
  };

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedClub(null);
    setSelectedCategory('all');
    setSelectedProvince('all');
    setActiveVibeFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setTimeFilter('all');
    setStatusFilter('upcoming');
    setPriceFilter('all');
    setOpenOnly(false);
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
          action={
            <button
              type="button"
              onClick={openCreate}
              aria-label="ตั้งตี้เอง"
              title="ตั้งตี้เอง"
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:w-auto sm:px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold whitespace-nowrap cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
              <span className="hidden sm:inline">ตั้งตี้เอง</span>
            </button>
          }
          summary={
            <>
              พบ <span className="font-semibold text-slate-900 tabular-nums">{filteredEvents.length}</span> ตี้
              {(searchQuery ||
                selectedCategory !== 'all' ||
                selectedProvince !== 'all' ||
                customStartDate ||
                priceFilter !== 'all' ||
                openOnly ||
                sortBy !== 'newest' ||
                activeVibeFilter !== 'all' ||
                statusFilter !== 'upcoming' ||
                selectedClub) && (
                <button type="button" onClick={handleResetAll} className="ml-3 font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer">
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </>
          }
          tools={
            <>
              {/* Sorting is for the cards; the list is in date order */}
              {viewMode === 'grid' && (
                <FilterSelect
                  kind="meetups"
                  label="เรียงตาม"
                  value={sortBy === 'favorites' ? 'newest' : sortBy}
                  emptyValue="newest"
                  onChange={(v) => {
                    setSortBy(v as SortOption);
                    setCurrentPage(1);
                  }}
                >
                  <option value="newest">มาใหม่ล่าสุด</option>
                  <option value="popular">ยอดนิยม</option>
                  <option value="soonest">จัดขึ้นเร็วๆ นี้</option>
                </FilterSelect>
              )}
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
            <FilterSelect
              kind="meetups"
              label="เหมาะกับ"
              value={activeVibeFilter}
              emptyValue="all"
              onChange={(v) => {
                setActiveVibeFilter(v as VibeFilter);
                setCurrentPage(1);
              }}
            >
              <option value="all">เหมาะกับทุกคน</option>
              <option value="solo">มาคนเดียวได้</option>
              <option value="beginners">เหมาะกับมือใหม่</option>
              <option value="pets">สัตว์เลี้ยงร่วมได้</option>
              <option value="soon">จัดขึ้นเร็วๆ นี้</option>
            </FilterSelect>
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
            <button
              type="button"
              onClick={() => {
                setOpenOnly(!openOnly);
                setCurrentPage(1);
              }}
              aria-pressed={openOnly}
              className={filterPillClass('meetups', openOnly)}
            >
              มีที่ว่าง
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
              aria-pressed={sortBy === 'favorites'}
              className={filterPillClass('meetups', sortBy === 'favorites')}
            >
              <Heart className={`w-4 h-4 ${sortBy === 'favorites' ? 'fill-current' : ''}`} aria-hidden="true" />
              <span>ที่บันทึกไว้ ({favorites.length})</span>
            </button>
          </div>
        </DiscoverHeader>

        {/* Categories as icon tabs, right above the list */}
        <DiscoverCategoryTabs
          kind="meetups"
          categories={COMMUNITY_LIFESTYLE_CATEGORIES}
          counts={categoryEventCounts}
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
        ) : (
          <EventGrid
            events={paginatedEvents}
            onSelectEvent={() => {}}
            favorites={isLoggedIn ? favorites : []}
            toggleFavorite={toggleFavorite}
            joinedEventIds={isLoggedIn ? joinedEventIds : []}
            onResetFilters={handleResetAll}
            isFavoritesOnly={sortBy === 'favorites'}
            viewMode={viewMode}
          />
        )}

        {viewMode === 'grid' && filteredEvents.length > itemsPerPage && (
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

        {/* Clubs: below the list so the meetups come first; picking one goes back up to the results */}
        <TopCommunityRail
          selectedClub={selectedClub}
          onSelectClub={(clubKey) => {
            setSelectedClub(clubKey);
            setSelectedCategory('all');
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
        initialType="community"
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          setEventsList([newEvent, ...eventsList]);
          if (newEvent.approvalStatus === 'pending') {
            showToast(`ส่งข้อมูล "${newEvent.title}" เรียบร้อยแล้ว (รอตรวจสอบและอนุมัติโดยทีมงาน)`);
          } else {
            showToast(`เปิดตี้กิจกรรม "${newEvent.title}" สำเร็จ! 🎉`);
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

      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} favoritesCount={favorites.length} />

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
export default function CommunityPage(props: ServerProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400 text-sm">กำลังโหลดกิจกรรมชุมชน...</div>}>
      <CommunityPageContent {...props} />
    </Suspense>
  );
}

'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Heart,
  Search,
  LocateFixed,
  Loader2,
  Plus } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { SpotTile, SpotTileSkeleton } from '@/components/SpotTile';
import { ViewModeToggle, ViewMode } from '@/components/ViewModeToggle';
import { ShowMoreButton } from '@/components/discover/ShowMoreButton';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/LazyCreateEventModal';
import { useAuth } from '@/lib/useAuth';
import { activityActions, useMyActivity } from '@/lib/useMyActivity';
import type { SpotBrowseResult } from '@/lib/spotBrowse';
import { NATIONWIDE_SPOT_CATEGORIES } from '@/components/SpotCategoryRail';
import { DiscoverCategoryTabs } from '@/components/discover/DiscoverCategoryTabs';
import { DestinationCircles } from '@/components/discover/DestinationCircles';
import type { EventItem } from '@/data/mockData';
import { useResponsiveItemsPerPage } from '@/lib/useResponsiveItemsPerPage';
import { type DiscoverCounts } from '@/lib/discoverMatch';
import { DiscoverHeader, filterPillClass } from '@/components/discover/DiscoverHeader';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';
import { useMyInterests } from '@/lib/useMyInterests';
import { useFiltersInUrl } from '@/lib/useFiltersInUrl';
import { Toast } from '@/components/Toast';

// The list view's rows use an animation library (~120 KB); it loads only when someone picks the list view (2026-10-28)
const SpotListItem = dynamic(() => import('@/components/SpotListItem').then((m) => m.SpotListItem));
const SpotListItemSkeleton = dynamic(() => import('@/components/SpotListItem').then((m) => m.SpotListItemSkeleton));

type ServerProps = { initial?: SpotBrowseResult; openedAt?: number; initialCounts?: { query: string; province: string; counts: DiscoverCounts } };

// Whole rows of the 2 / 3 / 4 / 6 tile grid, as on /events and /community
const TILE_BATCH = { mobile: 12, sm: 12, md: 16, lg: 24, xl2: 24, defaultItems: 24 };

function SpotsPageContent({ initial, openedAt: serverOpenedAt, initialCounts }: ServerProps) {
  const searchParams = useSearchParams();
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  // The member's own categories from onboarding come first on the tabs, marked (owner 2026-10-23)
  const myInterests = useMyInterests(isLoggedIn);
  const itemsPerPage = useResponsiveItemsPerPage(TILE_BATCH);

  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedProvince, setSelectedProvince] = useState<string>(searchParams.get('province') || 'all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free'>((searchParams.get('price') as any) || 'all');
  const [sortBy, setSortBy] = useState<'newest' | 'favorites'>('newest');
  useFiltersInUrl({ q: searchQuery.trim(), category: selectedCategory, province: selectedProvince, price: priceFilter });
  const [sortByNearMe, setSortByNearMe] = useState(false);
  const [openedAt] = useState(() => serverOpenedAt ?? Date.now());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  // Saved and joined come from the account, so a heart here shows in My Hub and on every device
  const myActivity = useMyActivity();
  const favoriteSpots = isLoggedIn ? myActivity.savedSpotIds : [];
  const joinedEventIds = isLoggedIn ? myActivity.joinedIds : [];
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync viewMode from localStorage
  useEffect(() => {
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

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavoriteSpot = (spotId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อบันทึกสถานที่โปรด');
      setIsRequireMembershipOpen(true);
      return;
    }
    const save = !favoriteSpots.includes(spotId);
    void activityActions.setSaved('spot', spotId, save).then((ok) => {
      if (!ok) showToast('บันทึกไม่สำเร็จ ลองอีกครั้งนะ');
      else showToast(save ? 'บันทึกไว้แล้ว ดูได้ที่ "ที่บันทึกไว้"' : 'เอาออกจากที่บันทึกไว้แล้ว');
    });
  };

  const handleToggleNearMe = () => {
    if (sortByNearMe) {
      setSortByNearMe(false);
      setUserLocation(null);
      showToast('ปิดการค้นหาตามระยะทางแล้ว');
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
          showToast('เรียงสถานที่จากใกล้คุณไปไกลเรียบร้อย');
        },
        (err) => {
          console.warn('Geolocation failed or denied, using central Bangkok fallback:', err);
          setUserLocation({ lat: 13.7466, lng: 100.5349 });
          setSortByNearMe(true);
          setIsLocating(false);
          setCurrentPage(1);
          showToast('จัดเรียงสถานที่จากโซนใจกลางเมืองให้เรียบร้อย');
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    } else {
      setUserLocation({ lat: 13.7466, lng: 100.5349 });
      setSortByNearMe(true);
      setIsLocating(false);
      setCurrentPage(1);
      showToast('จัดเรียงสถานที่จากโซนใจกลางเมืองให้เรียบร้อย');
    }
  };

  // The list comes from the server (GET /api/spots/browse): the same filters, order and counts, only the places on screen.
  // It used to download all ~2,000 places (7 MB) and filter them here, which made phones slow (2026-10-28).
  const [result, setResult] = useState<SpotBrowseResult>(() => initial ?? { spots: [], total: 0, counts: {}, railIds: NATIONWIDE_SPOT_CATEGORIES.map((c) => c.id), openedAt });
  const [isFetching, setIsFetching] = useState(!initial);
  const wanted = currentPage * itemsPerPage;
  const browseQuery = useMemo(() => {
    const params = new URLSearchParams({ t: String(openedAt) });
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedProvince !== 'all') params.set('province', selectedProvince);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (priceFilter === 'free') params.set('price', 'free');
    if (sortBy === 'favorites') params.set('ids', favoriteSpots.join(','));
    if (sortByNearMe && userLocation) {
      params.set('lat', String(userLocation.lat));
      params.set('lng', String(userLocation.lng));
    }
    return params.toString();
  }, [openedAt, searchQuery, selectedProvince, selectedCategory, priceFilter, sortBy, favoriteSpots, sortByNearMe, userLocation]);

  // The server page already answered the address's own filters for the first batch
  const answered = useRef(initial ? { query: browseQuery, count: initial.spots.length, total: initial.total } : null);
  useEffect(() => {
    const done = answered.current;
    if (done && done.query === browseQuery && (done.count >= wanted || done.count >= done.total)) return;
    const controller = new AbortController();
    // Typing waits a moment so each letter is not its own request
    const timer = setTimeout(() => {
      setIsFetching(true);
      fetch(`/api/spots/browse?${browseQuery}&limit=${wanted}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          if (!json?.success) return;
          answered.current = { query: browseQuery, count: json.spots.length, total: json.total };
          setResult({ spots: json.spots, total: json.total, counts: json.counts, railIds: json.railIds, openedAt });
        })
        .catch(() => {})
        .finally(() => !controller.signal.aborted && setIsFetching(false));
    }, done && done.query === browseQuery ? 0 : 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [browseQuery, wanted]);

  const spotCounts = result.counts;
  const railCategories = useMemo(() => NATIONWIDE_SPOT_CATEGORIES.filter((cat) => result.railIds.includes(cat.id)), [result.railIds]);
  const paginatedSpots = result.spots;
  const totalSpots = result.total;

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedProvince('all');
    setPriceFilter('all');
    setSortBy('newest');
    setSortByNearMe(false);
    setUserLocation(null);
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
            kind="spots"
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
          kind="spots"
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
              onClick={() => setIsCreateEventModalOpen(true)}
              aria-label="แนะนำที่ใหม่"
              title="แนะนำที่ใหม่"
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:w-auto sm:px-4 rounded-full bg-[#4A7C59] hover:bg-[#2D5A3C] text-white text-[13px] font-semibold whitespace-nowrap cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
              <span className="hidden sm:inline">แนะนำที่ใหม่</span>
            </button>
          }
          lead={
            <DestinationCircles
              selected={selectedProvince}
              onSelect={(prov) => {
                setSelectedProvince(prov ?? 'all');
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
            />
          }
          summary={
            (searchQuery || selectedCategory !== 'all' || selectedProvince !== 'all' || priceFilter !== 'all' || sortBy === 'favorites' || sortByNearMe) && (
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
                    setMembershipActionTitle('เพื่อดูสถานที่ที่บันทึกไว้ใน Bucket List');
                    setIsRequireMembershipOpen(true);
                    return;
                  }
                  setSortBy(sortBy === 'favorites' ? 'newest' : 'favorites');
                  setCurrentPage(1);
                }}
                aria-pressed={sortBy === 'favorites'}
                aria-label={`ที่บันทึกไว้ (${favoriteSpots.length})`}
                className={filterPillClass('spots', sortBy === 'favorites')}
              >
                <Heart className={`w-4 h-4 ${sortBy === 'favorites' ? 'fill-current' : ''}`} aria-hidden="true" />
                <span className="hidden sm:inline">ที่บันทึกไว้ ({favoriteSpots.length})</span>
                <span className="sm:hidden tabular-nums">{favoriteSpots.length}</span>
              </button>
              <ViewModeToggle viewMode={viewMode} onChange={handleViewModeChange} />
            </>
          }
        >
          {/* Filters as pills: one row that scrolls on phones */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <button type="button" onClick={handleToggleNearMe} disabled={isLocating} aria-pressed={sortByNearMe} className={filterPillClass('spots', sortByNearMe)}>
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="w-4 h-4" aria-hidden="true" />}
              <span>{isLocating ? 'กำลังหาพิกัด...' : 'ใกล้ฉัน'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPriceFilter(priceFilter === 'free' ? 'all' : 'free');
                setCurrentPage(1);
              }}
              aria-pressed={priceFilter === 'free'}
              className={filterPillClass('spots', priceFilter === 'free')}
            >
              เข้าฟรี
            </button>
          </div>
        </DiscoverHeader>

        {/* Categories as icon tabs, right above the list */}
        <DiscoverCategoryTabs
          kind="spots"
          categories={railCategories}
          counts={spotCounts}
          mineIds={myInterests.spotVibes}
          selectedId={selectedCategory === 'all' ? null : selectedCategory}
          onSelect={(id) => {
            setSelectedCategory(id || 'all');
            setCurrentPage(1);
          }}
        />

        {/* High-Density Spots Grid / List */}
        {/* The server's first places show at once; a filter they do not answer waits for the full catalog */}
        {isFetching && paginatedSpots.length === 0 ? (
          viewMode === 'list' ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <SpotListItemSkeleton key={i} />
              ))}
            </div>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-8 pt-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <li key={i}><SpotTileSkeleton /></li>
              ))}
            </ul>
          )
        ) : paginatedSpots.length > 0 ? (
          <>
            {viewMode === 'list' ? (
              <div className="space-y-3">
                {paginatedSpots.map((spot, idx) => (
                  <SpotListItem
                    key={spot.id}
                    spot={spot}
                    isFavorite={isLoggedIn && favoriteSpots.includes(spot.id)}
                    isJoined={isLoggedIn && joinedEventIds.includes(spot.id)}
                    onToggleFavorite={(id) => toggleFavoriteSpot(id)}
                    index={idx}
                  />
                ))}
              </div>
            ) : (
              // The ตี้ / อีเวนต์ grid and tile, so the three tabs feel like one page
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-8 pt-1">
                {paginatedSpots.map((spot) => (
                  <li key={spot.id}>
                    <SpotTile spot={spot} isSaved={isLoggedIn && favoriteSpots.includes(spot.id)} onToggleSave={(id) => toggleFavoriteSpot(id)} />
                  </li>
                ))}
              </ul>
            )}

            {/* Show more, Meetup-style */}
            {totalSpots > paginatedSpots.length && (
              <ShowMoreButton shown={paginatedSpots.length} total={totalSpots} onClick={() => setCurrentPage(currentPage + 1)} />
            )}
          </>
        ) : (
          <div className="w-full bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-slate-400 flex items-center justify-center shrink-0 shadow-2xs">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight truncate">
                  ยังไม่พบสถานที่ตามเงื่อนไขนี้
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  ลองปรับเปลี่ยนคำค้นหา หรือเลือกจังหวัดอื่นๆ เพื่อสำรวจสถานที่เพิ่มเติม
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 self-end sm:self-center active:scale-95"
            >
              <span>ดูสถานที่ทั้งหมด</span>
            </button>
          </div>
        )}


      </main>

      {/* Modals & Helpers */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        initialType="spot"
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          showToast(`แนะนำพิกัด "${newEvent.title}" สำเร็จ! ข้อมูลจะปรากฏในระบบ`);
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
        favoritesCount={favoriteSpots.length}
      />

      <Toast message={toastMessage} />

    </div>
  );
}

/** `initial` (the first places, from the server page) is in the HTML search engines read; the browser asks for the rest. */
export default function SpotsPage(props: ServerProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400 text-sm">กำลังโหลดข้อมูลสถานที่...</div>}>
      <SpotsPageContent {...props} />
    </Suspense>
  );
}

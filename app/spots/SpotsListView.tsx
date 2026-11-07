'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOwnProvinceDefault } from '@/lib/useOwnProvince';
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
import { SponsoredBadge } from '@/components/SponsoredBadge';
import { withSponsored } from '@/lib/sponsored/types';
import { ViewModeToggle, ViewMode } from '@/components/ViewModeToggle';
import { ShowMoreButton } from '@/components/discover/ShowMoreButton';
import { useShownBatches } from '@/lib/useShownBatches';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/LazyCreateEventModal';
import { useAuth } from '@/lib/useAuth';
import { activityActions, useMyActivity } from '@/lib/useMyActivity';
import type { LifestyleSpotItem } from '@/data/spotsData';
import type { SpotBrowseResult } from '@/lib/spotBrowse';
import { NATIONWIDE_SPOT_CATEGORIES } from '@/components/SpotCategoryRail';
import { DiscoverCategoryTabs } from '@/components/discover/DiscoverCategoryTabs';
import { DestinationCircles } from '@/components/discover/DestinationCircles';
import type { EventItem } from '@/data/mockData';
import { useResponsiveItemsPerPage } from '@/lib/useResponsiveItemsPerPage';
import { ALL_PROVINCES, spotInProvince, type DiscoverCounts } from '@/lib/discoverMatch';
import { DiscoverHeader, filterPillClass } from '@/components/discover/DiscoverHeader';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';
import { useMyInterests } from '@/lib/useMyInterests';
import { useFiltersInUrl } from '@/lib/useFiltersInUrl';
import { Toast } from '@/components/Toast';
import { ActiveChip, ChoiceGroup, FilterButton, FilterSheet, QuickChip, pillClass } from '@/components/discover/FilterControls';
import { MASTER_77_PROVINCES } from '@/data/masterHub';

// The list view's rows use an animation library (~120 KB); it loads only when someone picks the list view (2026-10-28)
/** Districts shown in the sheet before "ดูทั้งหมด" */
const DISTRICTS_FIRST = 12;

const SpotListItem = dynamic(() => import('@/components/SpotListItem').then((m) => m.SpotListItem));
const SpotListItemSkeleton = dynamic(() => import('@/components/SpotListItem').then((m) => m.SpotListItemSkeleton));

type ServerProps = { initial?: SpotBrowseResult; openedAt?: number; initialCounts?: { query: string; province: string; counts: DiscoverCounts }; sponsoredSpot?: LifestyleSpotItem | null };

// Whole rows of the 2 / 3 / 4 / 6 tile grid, as on /events and /community
const TILE_BATCH = { mobile: 12, sm: 12, md: 16, lg: 24, xl2: 24, defaultItems: 24 };

function SpotsPageContent({ initial, openedAt: serverOpenedAt, initialCounts, sponsoredSpot = null }: ServerProps) {
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
  const [priceFilter, setPriceFilter] = useState<'all' | 'free'>((searchParams.get('price') as any) || 'all');
  // A district inside the picked province, and places open right now (owner 2026-11-07: filters like the other list pages)
  // Several districts can be picked: people plan by area (owner 2026-11-07)
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(() => (searchParams.get('district') || '').split(',').filter(Boolean));
  // The sheet shows the districts with most places first; the rest wait behind "ดูทั้งหมด"
  const [allDistrictsShown, setAllDistrictsShown] = useState(false);
  const toggleDistrict = (name: string) => {
    setSelectedDistricts((picked) => (picked.includes(name) ? picked.filter((d) => d !== name) : [...picked, name]));
    setCurrentPage(1);
  };
  const [openNow, setOpenNow] = useState(searchParams.get('open') === 'now');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // Filters only the sheet sets; the quick ones show in the row already
  const sheetCount = (selectedProvince !== 'all' ? 1 : 0) + (selectedDistricts.length > 0 ? 1 : 0);
  const [sortBy, setSortBy] = useState<'newest' | 'favorites'>('newest');
  useFiltersInUrl({ q: searchQuery.trim(), category: selectedCategory, province: selectedProvince, district: selectedDistricts.join(','), price: priceFilter, open: openNow ? 'now' : '' });
  const [sortByNearMe, setSortByNearMe] = useState(false);
  const [openedAt] = useState(() => serverOpenedAt ?? Date.now());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useShownBatches();
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
  const [result, setResult] = useState<SpotBrowseResult>(() => initial ?? { spots: [], total: 0, counts: {}, districts: [], railIds: NATIONWIDE_SPOT_CATEGORIES.map((c) => c.id), openedAt });
  const [isFetching, setIsFetching] = useState(!initial);
  const wanted = currentPage * itemsPerPage;
  const browseQuery = useMemo(() => {
    const params = new URLSearchParams({ t: String(openedAt) });
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedProvince !== 'all') params.set('province', selectedProvince);
    if (selectedProvince !== 'all' && selectedDistricts.length) params.set('district', selectedDistricts.join(','));
    if (openNow) params.set('open', 'now');
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (priceFilter === 'free') params.set('price', 'free');
    if (sortBy === 'favorites') params.set('ids', favoriteSpots.join(','));
    if (sortByNearMe && userLocation) {
      params.set('lat', String(userLocation.lat));
      params.set('lng', String(userLocation.lng));
    }
    return params.toString();
  }, [openedAt, searchQuery, selectedProvince, selectedDistricts, openNow, selectedCategory, priceFilter, sortBy, favoriteSpots, sortByNearMe, userLocation]);

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
          setResult({ spots: json.spots, total: json.total, counts: json.counts, districts: json.districts ?? [], railIds: json.railIds, openedAt });
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
  // The sponsored place takes the third card while the list is not narrowed to something it may not fit (lib/sponsored)
  const showSponsored =
    sponsoredSpot !== null && !searchQuery.trim() && selectedCategory === 'all' && priceFilter === 'all' && selectedDistricts.length === 0 && !openNow && sortBy === 'newest' && !sortByNearMe &&
    (selectedProvince === ALL_PROVINCES || spotInProvince(sponsoredSpot, selectedProvince));
  const gridSpots = useMemo(() => withSponsored(paginatedSpots, showSponsored ? sponsoredSpot : null), [paginatedSpots, showSponsored, sponsoredSpot]);

  // A district belongs to one province, so a new province starts without one
  const chooseProvince = (province: string) => {
    setSelectedProvince(province);
    setSelectedDistricts([]);
    setAllDistrictsShown(false);
    setCurrentPage(1);
  };

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedProvince('all');
    setSelectedDistricts([]);
    setAllDistrictsShown(false);
    setOpenNow(false);
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
            onProvinceChange={chooseProvince}
          />
        }
      />

      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 xl:pb-12 space-y-6">
        
        <DiscoverHeader
          kind="spots"
          query={searchQuery}
          onQueryChange={(q) => {
            setSearchQuery(q);
            setCurrentPage(1);
          }}
          province={selectedProvince}
          onProvinceChange={chooseProvince}
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
                chooseProvince(prov ?? 'all');
                setSelectedCategory('all');
              }}
            />
          }
          summary={
            (searchQuery || selectedCategory !== 'all' || selectedProvince !== 'all' || selectedDistricts.length > 0 || openNow || priceFilter !== 'all' || sortBy === 'favorites' || sortByNearMe) && (
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
          {/* ตัวกรอง (province and district), then the quick ones, then a chip for each place filter set in the sheet; one row that scrolls on phones */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <FilterButton kind="spots" count={sheetCount} onClick={() => setIsFilterOpen(true)} />
            <button type="button" onClick={handleToggleNearMe} disabled={isLocating} aria-pressed={sortByNearMe} className={filterPillClass('spots', sortByNearMe)}>
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="w-4 h-4" aria-hidden="true" />}
              <span>{isLocating ? 'กำลังหาพิกัด...' : 'ใกล้ฉัน'}</span>
            </button>
            <QuickChip kind="spots" on={openNow} onToggle={() => { setOpenNow(!openNow); setCurrentPage(1); }}>เปิดอยู่ตอนนี้</QuickChip>
            <QuickChip kind="spots" on={priceFilter === 'free'} onToggle={() => { setPriceFilter(priceFilter === 'free' ? 'all' : 'free'); setCurrentPage(1); }}>เข้าฟรี</QuickChip>
            {selectedProvince !== 'all' && <ActiveChip kind="spots" label={selectedProvince} onClear={() => chooseProvince('all')} />}
            {selectedDistricts.map((name) => <ActiveChip key={name} kind="spots" label={name} onClear={() => toggleDistrict(name)} />)}
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
                {gridSpots.map((spot) => (
                  <li key={spot.id}>
                    <SpotTile spot={spot} isSaved={isLoggedIn && favoriteSpots.includes(spot.id)} onToggleSave={(id) => toggleFavoriteSpot(id)} sponsored={showSponsored && spot.id === sponsoredSpot?.id} />
                  </li>
                ))}
              </ul>
            )}

            {/* Show more, Meetup-style */}
            {totalSpots > paginatedSpots.length && (
              // Counted from what is on screen: the server page's first answer can hold more than one batch
              <ShowMoreButton shown={paginatedSpots.length} total={totalSpots} onClick={() => setCurrentPage(Math.floor(paginatedSpots.length / itemsPerPage) + 1)} />
            )}
          </>
        ) : (
          <div className="w-full bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-slate-500 flex items-center justify-center shrink-0 shadow-2xs">
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

      {isFilterOpen && (
        <FilterSheet onClose={() => setIsFilterOpen(false)} onReset={() => { chooseProvince('all'); setOpenNow(false); setPriceFilter('all'); }} canReset={sheetCount > 0 || openNow || priceFilter === 'free'} resultLabel={`ดู ${totalSpots.toLocaleString()} ที่`}>
          <div className="space-y-2.5">
            <label htmlFor="spots-province" className="block text-sm font-bold text-slate-900">จังหวัด</label>
            <select id="spots-province" value={selectedProvince} onChange={(e) => chooseProvince(e.target.value)} className="w-full h-11 px-3.5 rounded-2xl border border-slate-300 bg-white text-sm font-medium text-slate-900 cursor-pointer">
              <option value="all">ทั่วประเทศ</option>
              {MASTER_77_PROVINCES.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <fieldset className="space-y-2.5">
            <legend className="text-sm font-bold text-slate-900">เขต / อำเภอ <span className="font-medium text-slate-500">เลือกได้หลายเขต</span></legend>
            {selectedProvince === 'all' ? (
              <p className="text-sm text-slate-500">เลือกจังหวัดก่อน แล้วเขตในจังหวัดนั้นจะขึ้นตรงนี้</p>
            ) : result.districts.length === 0 ? (
              <p className="text-sm text-slate-500">ยังไม่มีเขตให้เลือกในจังหวัดนี้</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setSelectedDistricts([]); setCurrentPage(1); }} aria-pressed={selectedDistricts.length === 0} className={pillClass('spots', selectedDistricts.length === 0)}>ทุกเขต</button>
                {result.districts
                  .filter((d, index) => allDistrictsShown || index < DISTRICTS_FIRST || selectedDistricts.includes(d.name))
                  .map((d) => (
                    <button key={d.name} type="button" onClick={() => toggleDistrict(d.name)} aria-pressed={selectedDistricts.includes(d.name)} className={pillClass('spots', selectedDistricts.includes(d.name))}>
                      {d.name} <span className="text-xs font-medium opacity-70 tabular-nums">{d.count}</span>
                    </button>
                  ))}
                {!allDistrictsShown && result.districts.length > DISTRICTS_FIRST && (
                  <button type="button" onClick={() => setAllDistrictsShown(true)} className="inline-flex items-center h-9 px-2 text-sm font-semibold text-[#2D5A3C] hover:underline cursor-pointer">
                    ดูทั้งหมด ({result.districts.length})
                  </button>
                )}
              </div>
            )}
          </fieldset>
          <ChoiceGroup kind="spots" title="เวลาเปิด" options={[['ทั้งหมด', 'any'], ['เปิดอยู่ตอนนี้', 'now']]} value={openNow ? 'now' : 'any'} onChange={(v) => { setOpenNow(v === 'now'); setCurrentPage(1); }} />
          <ChoiceGroup kind="spots" title="ค่าเข้า" options={[['ทั้งหมด', 'all'], ['เข้าฟรี', 'free']]} value={priceFilter} onChange={(v) => { setPriceFilter(v); setCurrentPage(1); }} />
        </FilterSheet>
      )}


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
      />

      <Toast message={toastMessage} />

    </div>
  );
}

/** `initial` (the first places, from the server page) is in the HTML search engines read; the browser asks for the rest. */
export default function SpotsPage(props: ServerProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-500 text-sm">กำลังโหลดข้อมูลสถานที่...</div>}>
      <SpotsPageContent {...props} />
    </Suspense>
  );
}

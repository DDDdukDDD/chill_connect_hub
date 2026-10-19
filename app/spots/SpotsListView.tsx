'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Heart,
  Search,
  LocateFixed,
  Loader2,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { SpotCard, SpotCardSkeleton } from '@/components/SpotCard';
import { SpotListItem, SpotListItemSkeleton } from '@/components/SpotListItem';
import { ViewModeToggle, ViewMode } from '@/components/ViewModeToggle';
import { ShowMoreButton } from '@/components/discover/ShowMoreButton';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { useAuth } from '@/lib/useAuth';
import { useMyActivity } from '@/lib/useMyActivity';
import { usePublishedSpots, getCachedSpotVibeCategory, getCachedSpotSearchText } from '@/lib/usePublishedSpots';
import { compareSpotsByRank } from '@/lib/spotRanking';
import { MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
import { NATIONWIDE_SPOT_CATEGORIES } from '@/components/SpotCategoryRail';
import { DiscoverCategoryTabs } from '@/components/discover/DiscoverCategoryTabs';
import { DestinationCircles } from '@/components/discover/DestinationCircles';
import { EventItem } from '@/data/mockData';
import { useResponsiveItemsPerPage } from '@/lib/useResponsiveItemsPerPage';
import { matchesQuery, spotInProvince, type DiscoverCounts } from '@/lib/discoverMatch';
import { DiscoverHeader, filterPillClass } from '@/components/discover/DiscoverHeader';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

type ServerProps = { initialSpots?: LifestyleSpotItem[]; initialCounts?: { query: string; province: string; counts: DiscoverCounts } };

function SpotsPageContent({ initialSpots, initialCounts }: ServerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const itemsPerPage = useResponsiveItemsPerPage();

  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedProvince, setSelectedProvince] = useState<string>(searchParams.get('province') || 'all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free'>((searchParams.get('price') as any) || 'all');
  const [sortBy, setSortBy] = useState<'newest' | 'favorites'>('newest');
  const [sortByNearMe, setSortByNearMe] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const { spots: liveSpots, isLoaded } = usePublishedSpots();
  const spotsList = liveSpots.length > 0 ? liveSpots : initialSpots ?? MOCK_SPOTS;
  const [favoriteSpots, setFavoriteSpots] = useState<string[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  // What the member joined comes from the account; this keeps the page in step with it
  const myActivity = useMyActivity();
  useEffect(() => {
    if (myActivity.isLoaded) setJoinedEventIds(myActivity.joinedIds);
  }, [myActivity.isLoaded, myActivity.joinedIds]);
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

  // Load favorite spots and joined events from localStorage (Only active when user is logged in)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isLoggedIn) {
      setFavoriteSpots([]);
      setJoinedEventIds([]);
      return;
    }

    try {
      const saved = localStorage.getItem('favorite_spots');
      if (saved) {
        setFavoriteSpots(JSON.parse(saved));
      }
      const savedJoined = localStorage.getItem('joined_event_ids');
      if (savedJoined) {
        setJoinedEventIds(JSON.parse(savedJoined));
      }
    } catch {
      // ignore
    }
  }, [isLoggedIn]);

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
    setFavoriteSpots((prev) => {
      const isFav = prev.includes(spotId);
      let updated: string[];
      if (isFav) {
        showToast('ลบออกจากรายการบันทึกแล้ว');
        updated = prev.filter((id) => id !== spotId);
      } else {
        showToast('บันทึกสถานที่เรียบร้อยแล้ว');
        updated = [...prev, spotId];
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('favorite_spots', JSON.stringify(updated));
      }
      return updated;
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

  const filteredSpots = useMemo(() => {
    const isCategoryFiltered = selectedCategory && selectedCategory !== 'all';
    const isCatDef = isCategoryFiltered && NATIONWIDE_SPOT_CATEGORIES.some((c) => c.id === selectedCategory);
    let result = spotsList.filter((spot) => {
      // Unified Category Filter (Synchronized with Category Rail and Dropdown)
      if (isCategoryFiltered) {
        if (isCatDef) {
          if (getCachedSpotVibeCategory(spot) !== selectedCategory) return false;
        } else if (spot.category !== selectedCategory) {
          return false;
        }
      }

      // Province, with the city names people use for it (shared with the ค้นพบ tab counts)
      const fullText = getCachedSpotSearchText(spot);
      if (!spotInProvince(spot, selectedProvince, fullText)) return false;

      if (sortBy === 'favorites' && !favoriteSpots.includes(spot.id)) return false;
      if (priceFilter === 'free' && !spot.price.includes('ฟรี')) return false;

      // Smart Search Query using cached text index with multi-token and synonyms
      if (!matchesQuery(fullText, searchQuery)) return false;
      return true;
    });

    if (sortByNearMe && userLocation) {
      result = result.map((spot) => ({
        ...spot,
        distanceKm: spot.latitude && spot.longitude
          ? calculateDistanceKm(userLocation.lat, userLocation.lng, spot.latitude, spot.longitude)
          : undefined,
      }));
      result.sort((a, b) => ((a as any).distanceKm ?? 999) - ((b as any).distanceKm ?? 999));
    } else {
      // Smart Popularity Ranking (fresh suggestions first, then views and rating)
      result.sort(compareSpotsByRank(openedAt));
    }

    return result;
  }, [spotsList, selectedCategory, selectedProvince, priceFilter, sortBy, sortByNearMe, userLocation, favoriteSpots, searchQuery, openedAt]);

  // Dynamic spot counts per vibe category: Single-Pass O(N) calculation (< 1ms)
  const spotCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    NATIONWIDE_SPOT_CATEGORIES.forEach((cat) => {
      counts[cat.id] = 0;
    });

    for (let i = 0; i < spotsList.length; i++) {
      const spot = spotsList[i];
      if (!spotInProvince(spot, selectedProvince, getCachedSpotSearchText(spot))) continue;

      counts['all'] += 1;
      const vibe = getCachedSpotVibeCategory(spot);
      counts[vibe] = (counts[vibe] || 0) + 1;
    }

    return counts;
  }, [spotsList, selectedProvince]);

  const totalPages = Math.ceil(filteredSpots.length / itemsPerPage) || 1;

  // Pagination clamp: reset to page 1 if filter changes reduce totalPages below currentPage
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedSpots = useMemo(() => {
    // "Show more" grows the list: currentPage = how many batches are on screen
    return filteredSpots.slice(0, currentPage * itemsPerPage);
  }, [filteredSpots, currentPage, itemsPerPage]);

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
          action={
            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  setMembershipActionTitle('เพื่อแนะนำพิกัดสถานที่ใหม่');
                  setIsRequireMembershipOpen(true);
                } else {
                  setIsCreateEventModalOpen(true);
                }
              }}
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
          categories={NATIONWIDE_SPOT_CATEGORIES}
          counts={spotCounts}
          selectedId={selectedCategory === 'all' ? null : selectedCategory}
          onSelect={(id) => {
            setSelectedCategory(id || 'all');
            setCurrentPage(1);
          }}
        />

        {/* High-Density Spots Grid / List */}
        {/* The server's first places show at once; a filter they do not answer waits for the full catalog */}
        {!isLoaded && liveSpots.length === 0 && (!initialSpots?.length || filteredSpots.length === 0) ? (
          viewMode === 'list' ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <SpotListItemSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <SpotCardSkeleton key={i} />
              ))}
            </div>
          )
        ) : filteredSpots.length > 0 ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                {paginatedSpots.map((spot) => (
                  <SpotCard
                    key={spot.id}
                    spot={spot}
                    isFavorite={isLoggedIn && favoriteSpots.includes(spot.id)}
                    isJoined={isLoggedIn && joinedEventIds.includes(spot.id)}
                    onToggleFavorite={(id) => toggleFavoriteSpot(id)}
                  />
                ))}
              </div>
            )}

            {/* Show more, Meetup-style */}
            <ShowMoreButton shown={paginatedSpots.length} total={filteredSpots.length} onClick={() => setCurrentPage(currentPage + 1)} />
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

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm font-medium flex items-center gap-2.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

/** `initialSpots` (the first places, from the server page) is in the HTML search engines read until the full catalog loads. */
export default function SpotsPage(props: ServerProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400 text-sm">กำลังโหลดข้อมูลสถานที่...</div>}>
      <SpotsPageContent {...props} />
    </Suspense>
  );
}

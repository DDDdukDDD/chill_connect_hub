'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Heart,
  ChevronDown,
  ArrowLeft,
  Search,
  X,
  LocateFixed,
  Loader2,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { SpotCard } from '@/components/SpotCard';
import { Pagination } from '@/components/Pagination';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { useAuth } from '@/lib/useAuth';
import { MOCK_SPOTS, ALL_THAI_PROVINCES, LifestyleSpotItem, getSpotVibeCategory } from '@/data/spotsData';
import { SpotCategoryRail, NATIONWIDE_SPOT_CATEGORIES } from '@/components/SpotCategoryRail';
import { EventItem } from '@/data/mockData';
import { useResponsiveItemsPerPage } from '@/lib/useResponsiveItemsPerPage';

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

function SpotsPageContent() {
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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [favoriteSpots, setFavoriteSpots] = useState<string[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    const result = MOCK_SPOTS.filter((spot) => {
      // Unified Category Filter (Synchronized with Category Rail and Dropdown)
      if (selectedCategory && selectedCategory !== 'all') {
        const catDef = NATIONWIDE_SPOT_CATEGORIES.find((c) => c.id === selectedCategory);
        if (catDef) {
          if (getSpotVibeCategory(spot) !== selectedCategory) return false;
        } else if (spot.category !== selectedCategory) {
          return false;
        }
      }

      // Province Filter with smart city matching (Hat Yai <-> Songkhla, Hua Hin <-> Prachuap, Pattaya <-> Chonburi)
      if (selectedProvince !== 'all') {
        const isBangkok = selectedProvince === 'กรุงเทพฯ' || selectedProvince === 'กรุงเทพมหานคร';
        const spotProv = (spot.province || '').trim();
        const spotDistrict = (spot.district || '').trim();
        const spotTitle = spot.title || '';
        const spotVibes = (spot.vibeTags || []).join(' ');
        const fullText = `${spotProv} ${spotDistrict} ${spotTitle} ${spotVibes}`.toLowerCase();

        if (isBangkok) {
          if (!spotProv.includes('กรุงเทพ')) return false;
        } else {
          const pLower = selectedProvince.toLowerCase();
          const sLower = spotProv.toLowerCase();
          const isMatch =
            sLower.includes(pLower) ||
            pLower.includes(sLower) ||
            (pLower.includes('หาดใหญ่') && fullText.includes('หาดใหญ่')) ||
            (pLower.includes('หัวหิน') && fullText.includes('หัวหิน')) ||
            (pLower.includes('พัทยา') && fullText.includes('พัทยา')) ||
            (pLower.includes('ชลบุรี') && fullText.includes('ชลบุรี')) ||
            (pLower.includes('ประจวบ') && (fullText.includes('ประจวบ') || fullText.includes('หัวหิน'))) ||
            (pLower.includes('สงขลา') && (fullText.includes('สงขลา') || fullText.includes('หาดใหญ่')));
          if (!isMatch) return false;
        }
      }

      if (sortBy === 'favorites' && !favoriteSpots.includes(spot.id)) return false;
      if (priceFilter === 'free' && !spot.price.includes('ฟรี')) return false;

      // Smart Search Query (Includes title, description, category label, vibe tags, district, province, highlights)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = spot.title.toLowerCase().includes(q);
        const matchDesc = spot.description.toLowerCase().includes(q);
        const matchCategory = (spot.category || '').toLowerCase().includes(q);
        const matchCategoryLabel = (spot.categoryLabel || '').toLowerCase().includes(q);
        const matchVibeTags = (spot.vibeTags || []).some((t: string) => t.toLowerCase().includes(q));
        const matchDistrict = (spot.district || '').toLowerCase().includes(q);
        const matchProv = spot.province.toLowerCase().includes(q);
        const matchHighlights = (spot.highlights || []).some((h: string) => h.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchCategory && !matchCategoryLabel && !matchVibeTags && !matchDistrict && !matchProv && !matchHighlights) {
          return false;
        }
      }
      return true;
    }).map((spot) => {
      if (sortByNearMe && userLocation && spot.latitude && spot.longitude) {
        return {
          ...spot,
          distanceKm: calculateDistanceKm(userLocation.lat, userLocation.lng, spot.latitude, spot.longitude),
        };
      }
      return spot;
    });

    if (sortByNearMe) {
      result.sort((a, b) => ((a as any).distanceKm ?? 999) - ((b as any).distanceKm ?? 999));
    } else {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [selectedCategory, selectedProvince, priceFilter, sortBy, sortByNearMe, userLocation, favoriteSpots, searchQuery]);

  const spotCounts = useMemo(() => {
    const counts: Record<string, number> = { all: MOCK_SPOTS.length };
    for (const cat of NATIONWIDE_SPOT_CATEGORIES) {
      counts[cat.id] = MOCK_SPOTS.filter((spot) => getSpotVibeCategory(spot) === cat.id).length;
    }
    return counts;
  }, []);

  const totalPages = Math.ceil(filteredSpots.length / itemsPerPage) || 1;

  // Pagination clamp: reset to page 1 if filter changes reduce totalPages below currentPage
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedSpots = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSpots.slice(start, start + itemsPerPage);
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
      />

      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:pb-12 space-y-6">
        
        {/* Header Bar with Breadcrumb */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>หน้าแรก</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">พิกัดเที่ยว & จุดฮีลใจ</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-gradient-to-r from-emerald-50/70 via-slate-50/40 to-transparent p-4 sm:p-6 rounded-3xl border border-emerald-100/80 shadow-2xs">
            <div className="space-y-1.5 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                พิกัดเที่ยว & จุดฮีลใจ
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                ค้นพบสเปซฮีลใจ คาเฟ่รักษ์โลก จุดชมวิวธรรมชาติ และชุมชนท้องถิ่นที่ผ่านการคัดสรรโดยคนพื้นที่ทั่วไทย
              </p>
            </div>

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
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>แนะนำพิกัดเที่ยวใหม่</span>
            </button>
          </div>
        </div>

        {/* Nationwide Spot Category Rail */}
        <SpotCategoryRail
          selectedCategoryId={selectedCategory === 'all' ? null : selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId || 'all');
            setCurrentPage(1);
          }}
          spotCounts={spotCounts}
        />

        {/* The Floating Editorial Search & Filter Canvas */}
        <div className="bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          
          {/* Top: Search Input + Dropdowns + Quick Filter Chips */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 flex items-center bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-200/90 px-3 py-2 focus-within:border-[#4A7C59] focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ค้นหาชื่อสถานที่ ย่าน หรือคีย์เวิร์ด..."
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

            {/* Province Select with Popular & 77 Provinces Optgroups */}
            <div className="relative w-full md:w-48 shrink-0">
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="เลือกจังหวัด"
                className="w-full px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4A7C59] focus:bg-white cursor-pointer appearance-none pr-8 transition-all"
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

            {/* Quick Free Button */}
            <button
              type="button"
              onClick={() => {
                setPriceFilter(priceFilter === 'free' ? 'all' : 'free');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                priceFilter === 'free'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200/90'
              }`}
            >
              เข้าฟรี
            </button>

            {/* Near Me Button */}
            <button
              type="button"
              onClick={handleToggleNearMe}
              disabled={isLocating}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                sortByNearMe
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200/90'
              }`}
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5" />
              )}
              <span>{isLocating ? 'กำลังหาพิกัด...' : sortByNearMe ? 'ใกล้ฉัน (เปิด)' : 'ใกล้ฉัน'}</span>
            </button>

            {/* Favorites Button with Auth Check */}
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
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                sortBy === 'favorites'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200/90'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${sortBy === 'favorites' ? 'fill-white text-white' : 'text-slate-400'}`} />
              <span>ที่บันทึกไว้ ({favoriteSpots.length})</span>
            </button>

          </div>

          {/* Result Count & Reset */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1 border-t border-slate-200/60">
            <span>พบทั้งหมด <strong className="text-slate-900 font-bold">{filteredSpots.length}</strong> แห่ง</span>
            {(searchQuery || selectedCategory !== 'all' || selectedProvince !== 'all' || priceFilter !== 'all' || sortBy === 'favorites' || sortByNearMe) && (
              <button
                type="button"
                onClick={handleResetAll}
                className="text-xs text-slate-500 hover:text-[#4A7C59] hover:underline cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>

        </div>

        {/* High-Density Spots Grid (4 cols on desktop, 5 cols on 2xl) */}
        {filteredSpots.length > 0 ? (
          <>
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

            {/* Pagination Bar */}
            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                totalItems={filteredSpots.length}
                itemsPerPage={itemsPerPage}
                itemUnit="สถานที่"
              />
            </div>
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

export default function SpotsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400 text-sm">กำลังโหลดข้อมูลสถานที่...</div>}>
      <SpotsPageContent />
    </Suspense>
  );
}
